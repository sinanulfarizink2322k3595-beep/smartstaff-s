/**
 * Notification Service - Email & SMS
 * Handles sending notifications via multiple channels
 */

import { supabase } from "@/lib/supabase";

export interface NotificationPayload {
    userId: string;
    email: string;
    type: "outpass_approved" | "outpass_rejected" | "meeting_scheduled" | "meeting_cancelled" | "alert" | "general";
    title: string;
    message: string;
    phone?: string;
    sendEmail?: boolean;
    sendSms?: boolean;
    metadata?: Record<string, unknown>;
}

/**
 * Send notification via in-app system
 */
export const sendInAppNotification = async (payload: NotificationPayload) => {
    try {
        const { error } = await supabase.from("notifications").insert({
            user_id: payload.userId,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            metadata: payload.metadata || {},
            is_read: false,
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("In-app notification failed:", error);
        return { success: false, error };
    }
};

/**
 * Send email notification
 * (Requires email service integration: SendGrid, Resend, or AWS SES)
 */
export const sendEmailNotification = async (payload: NotificationPayload) => {
    try {
        // Call Supabase edge function to send email
        const { data, error } = await supabase.functions.invoke("send-email", {
            body: {
                to: payload.email,
                subject: payload.title,
                html: `
          <h2>${payload.title}</h2>
          <p>${payload.message}</p>
          ${payload.metadata?.actionUrl ? `<a href="${payload.metadata.actionUrl}">View Details</a>` : ""}
        `,
                type: payload.type,
            },
        });

        if (error) {
            console.warn("Email notification failed (service not configured):", error);
            return { success: false, error: "Email service not configured" };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Email notification error:", error);
        return { success: false, error };
    }
};

/**
 * Send SMS notification
 * (Requires SMS service integration: Twilio, AWS SNS, etc.)
 */
export const sendSmsNotification = async (payload: NotificationPayload) => {
    if (!payload.phone) {
        return { success: false, error: "Phone number required for SMS" };
    }

    try {
        // Call Supabase edge function to send SMS
        const { data, error } = await supabase.functions.invoke("send-sms", {
            body: {
                to: payload.phone,
                message: `${payload.title}: ${payload.message}`,
                type: payload.type,
            },
        });

        if (error) {
            console.warn("SMS notification failed (service not configured):", error);
            return { success: false, error: "SMS service not configured" };
        }

        return { success: true, data };
    } catch (error) {
        console.error("SMS notification error:", error);
        return { success: false, error };
    }
};

/**
 * Send multi-channel notification (in-app + email + SMS)
 */
export const sendNotification = async (payload: NotificationPayload) => {
    const results = {
        inApp: { success: false },
        email: { success: false },
        sms: { success: false },
    };

    // Always send in-app notification
    results.inApp = await sendInAppNotification(payload);

    // Send email if enabled
    if (payload.sendEmail !== false) {
        results.email = await sendEmailNotification(payload);
    }

    // Send SMS if enabled and phone provided
    if (payload.sendSms && payload.phone) {
        results.sms = await sendSmsNotification(payload);
    }

    return results;
};

/**
 * Send batch notifications to multiple users
 */
export const sendBatchNotifications = async (
    userIds: string[],
    payload: Omit<NotificationPayload, "userId" | "email" | "phone">
) => {
    try {
        const { data: users } = await supabase
            .from("profiles")
            .select("id, email, phone")
            .in("id", userIds);

        if (!users || users.length === 0) {
            return { success: false, error: "No users found" };
        }

        const results = await Promise.all(
            users.map((user) =>
                sendNotification({
                    ...payload,
                    userId: user.id,
                    email: user.email,
                    phone: user.phone,
                })
            )
        );

        return {
            success: true,
            total: users.length,
            results,
        };
    } catch (error) {
        console.error("Batch notification error:", error);
        return { success: false, error };
    }
};

/**
 * Notify outpass approval
 */
export const notifyOutpassApproval = async (
    studentId: string,
    outpassId: string,
    studentEmail: string,
    studentPhone?: string
) => {
    return sendNotification({
        userId: studentId,
        email: studentEmail,
        phone: studentPhone,
        type: "outpass_approved",
        title: "Outpass Approved ✅",
        message: "Your outpass request has been approved by the HOD.",
        sendEmail: true,
        sendSms: !!studentPhone,
        metadata: {
            outpassId,
            actionUrl: "/student/history",
        },
    });
};

/**
 * Notify outpass rejection
 */
export const notifyOutpassRejection = async (
    studentId: string,
    outpassId: string,
    studentEmail: string,
    reason?: string,
    studentPhone?: string
) => {
    return sendNotification({
        userId: studentId,
        email: studentEmail,
        phone: studentPhone,
        type: "outpass_rejected",
        title: "Outpass Rejected ❌",
        message: `Your outpass request has been rejected. ${reason ? `Reason: ${reason}` : ""}`,
        sendEmail: true,
        sendSms: !!studentPhone,
        metadata: {
            outpassId,
            actionUrl: "/student/outpass",
        },
    });
};

/**
 * Notify meeting scheduled
 */
export const notifyMeetingScheduled = async (
    studentId: string,
    staffId: string,
    meetingId: string,
    studentEmail: string,
    staffEmail: string,
    meetingTime: string,
    staffPhone?: string,
    studentPhone?: string
) => {
    // Notify student
    await sendNotification({
        userId: studentId,
        email: studentEmail,
        phone: studentPhone,
        type: "meeting_scheduled",
        title: "Meeting Scheduled 📅",
        message: `Your meeting has been scheduled for ${new Date(meetingTime).toLocaleString()}`,
        sendEmail: true,
        sendSms: !!studentPhone,
        metadata: {
            meetingId,
            meetingTime,
            actionUrl: "/student/meetings",
        },
    });

    // Notify staff
    return sendNotification({
        userId: staffId,
        email: staffEmail,
        phone: staffPhone,
        type: "meeting_scheduled",
        title: "Meeting Scheduled 📅",
        message: `You have a meeting scheduled for ${new Date(meetingTime).toLocaleString()}`,
        sendEmail: true,
        sendSms: !!staffPhone,
        metadata: {
            meetingId,
            meetingTime,
            actionUrl: "/staff/meetings",
        },
    });
};

/**
 * Send emergency alert
 */
export const sendEmergencyAlert = async (
    studentId: string,
    studentEmail: string,
    message: string,
    studentPhone?: string
) => {
    return sendNotification({
        userId: studentId,
        email: studentEmail,
        phone: studentPhone,
        type: "alert",
        title: "🚨 Emergency Alert",
        message,
        sendEmail: true,
        sendSms: !!studentPhone,
        metadata: {
            priority: "high",
        },
    });
};
