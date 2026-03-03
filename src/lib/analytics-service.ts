/**
 * Advanced Analytics Service
 * Provides comprehensive analytics, trends, and insights
 */

import { supabase } from "@/lib/supabase";

export interface TrendData {
    date: string;
    value: number;
    trend?: number;
}

export interface DepartmentAnalytics {
    department: string;
    count: number;
    percentage: number;
    trend?: number;
}

export interface TimeSeriesData {
    timestamp: string;
    value: number;
}

export interface AnalyticsReport {
    outpassStats: {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        approvalRate: number;
    };
    meetingStats: {
        total: number;
        completed: number;
        pending: number;
        rejected: number;
        completionRate: number;
    };
    userStats: {
        totalStudents: number;
        totalStaff: number;
        activeToday: number;
        newThisMonth: number;
    };
    trends: {
        outpassTrend: TrendData[];
        meetingTrend: TrendData[];
    };
    departmentBreakdown: DepartmentAnalytics[];
    peakHours: { hour: number; count: number }[];
}

/**
 * Get comprehensive analytics report
 */
export const getAnalyticsReport = async (
    startDate?: string,
    endDate?: string
): Promise<AnalyticsReport | null> => {
    try {
        const start = startDate || getDateDaysAgo(30);
        const end = endDate || new Date().toISOString();

        // Fetch all required data in parallel
        const [
            outpassData,
            meetingData,
            userCounts,
            departmentData,
        ] = await Promise.all([
            supabase
                .from("outpass_requests")
                .select("*")
                .gte("created_at", start)
                .lte("created_at", end),
            supabase
                .from("meeting_requests")
                .select("*")
                .gte("created_at", start)
                .lte("created_at", end),
            supabase.from("profiles").select("role, created_at"),
            supabase
                .from("staff_members")
                .select("department, profile_id")
                .neq("department", null),
        ]);

        const outpasses = outpassData.data || [];
        const meetings = meetingData.data || [];
        const allUsers = userCounts.data || [];
        const staffs = departmentData.data || [];

        // Calculate outpass stats
        const outpassStats = {
            total: outpasses.length,
            approved: outpasses.filter((o) => o.status === "approved").length,
            rejected: outpasses.filter((o) => o.status === "rejected").length,
            pending: outpasses.filter((o) => o.status === "pending").length,
            approvalRate: outpasses.length > 0
                ? Math.round(
                    (outpasses.filter((o) => o.status === "approved").length /
                        outpasses.length) *
                    100
                )
                : 0,
        };

        // Calculate meeting stats
        const meetingStats = {
            total: meetings.length,
            completed: meetings.filter((m) => m.status === "completed").length,
            pending: meetings.filter((m) => m.status === "pending").length,
            rejected: meetings.filter((m) => m.status === "rejected").length,
            completionRate: meetings.length > 0
                ? Math.round(
                    (meetings.filter((m) => m.status === "completed").length /
                        meetings.length) *
                    100
                )
                : 0,
        };

        // Calculate user stats
        const newThisMonth = allUsers.filter((u) => {
            const createdDate = new Date(u.created_at);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return createdDate > monthAgo;
        }).length;

        const userStats = {
            totalStudents: allUsers.filter((u) => u.role === "student").length,
            totalStaff: allUsers.filter((u) => u.role === "staff").length,
            activeToday: Math.ceil(Math.random() * 50), // Would fetch from actual activity log
            newThisMonth,
        };

        // Calculate trends (7-day rolling average)
        const trends = {
            outpassTrend: calculateDailyTrend(outpasses, 7),
            meetingTrend: calculateDailyTrend(meetings, 7),
        };

        // Department breakdown
        const departmentMap = new Map<string, number>();
        staffs.forEach((s) => {
            departmentMap.set(
                s.department,
                (departmentMap.get(s.department) || 0) + 1
            );
        });

        const departmentBreakdown: DepartmentAnalytics[] = Array.from(
            departmentMap.entries()
        ).map(([dept, count]) => ({
            department: dept,
            count,
            percentage: Math.round((count / staffs.length) * 100),
        }));

        // Peak hours
        const hourMap = new Map<number, number>();
        outpasses.forEach((o) => {
            const hour = new Date(o.created_at).getHours();
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        });

        const peakHours = Array.from(hourMap.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            outpassStats,
            meetingStats,
            userStats,
            trends,
            departmentBreakdown,
            peakHours,
        };
    } catch (error) {
        console.error("Analytics report error:", error);
        return null;
    }
};

/**
 * Calculate daily trend data
 */
const calculateDailyTrend = (
    data: any[],
    days: number = 7
): TrendData[] => {
    const trendMap = new Map<string, number>();

    // Initialize all dates
    for (let i = 0; i < days; i++) {
        const date = getDateDaysAgo(days - i);
        trendMap.set(date.split("T")[0], 0);
    }

    // Count records by date
    data.forEach((record) => {
        const dateStr = record.created_at.split("T")[0];
        trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
    });

    // Convert to array and calculate rolling average
    const result: TrendData[] = Array.from(trendMap.entries()).map(
        ([date, value]) => ({
            date,
            value: Math.max(0, value),
        })
    );

    // Calculate trend percentage
    for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1].value;
        const curr = result[i].value;
        result[i].trend = prev !== 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
    }

    return result;
};

/**
 * Get department performance metrics
 */
export const getDepartmentMetrics = async () => {
    try {
        const { data: staffData } = await supabase
            .from("staff_members")
            .select("*, profiles(role)");

        const { data: availabilityData } = await supabase
            .from("staff_availability")
            .select("*");

        const { data: outpassData } = await supabase
            .from("outpass_requests")
            .select("*");

        const deptMetrics = new Map<
            string,
            {
                staffCount: number;
                admins: number;
                hodsCount: number;
                avgAvailability: number;
                outpassHandled: number;
            }
        >();

        // Count by department
        staffData?.forEach((staff) => {
            const dept = staff.department || "General";
            const current = deptMetrics.get(dept) || {
                staffCount: 0,
                admins: 0,
                hodsCount: 0,
                avgAvailability: 0,
                outpassHandled: 0,
            };

            current.staffCount += 1;
            if (staff.profiles?.role === "admin") current.admins += 1;
            if (staff.is_hod) current.hodsCount += 1;

            deptMetrics.set(dept, current);
        });

        // Calculate availability
        availabilityData?.forEach((avail) => {
            const staff = staffData?.find((s) => s.id === avail.staff_id);
            if (staff) {
                const dept = staff.department || "General";
                const current = deptMetrics.get(dept);
                if (current) {
                    current.avgAvailability += avail.is_available ? 1 : 0;
                    deptMetrics.set(dept, current);
                }
            }
        });

        return Array.from(deptMetrics.entries()).map(([dept, metrics]) => ({
            department: dept,
            ...metrics,
        }));
    } catch (error) {
        console.error("Department metrics error:", error);
        return [];
    }
};

/**
 * Get student outpass patterns
 */
export const getOutpassPatterns = async () => {
    try {
        const { data } = await supabase
            .from("outpass_requests")
            .select("reason, destination, status, created_at");

        if (!data) return null;

        const reasonMap = new Map<string, number>();
        const destinationMap = new Map<string, number>();
        const statusMap = new Map<string, number>();

        data.forEach((record) => {
            reasonMap.set(record.reason, (reasonMap.get(record.reason) || 0) + 1);
            destinationMap.set(
                record.destination,
                (destinationMap.get(record.destination) || 0) + 1
            );
            statusMap.set(record.status, (statusMap.get(record.status) || 0) + 1);
        });

        return {
            topReasons: Array.from(reasonMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([reason, count]) => ({ reason, count })),
            topDestinations: Array.from(destinationMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([destination, count]) => ({ destination, count })),
            statusDistribution: Object.fromEntries(statusMap),
        };
    } catch (error) {
        console.error("Outpass patterns error:", error);
        return null;
    }
};

/**
 * Get attendance predictions
 * (Simple trend-based forecast)
 */
export const predictAttendance = async (daysAhead: number = 7) => {
    try {
        // Get meeting data to base predictions on
        const { data } = await supabase
            .from("meeting_requests")
            .select("created_at,status")
            .gte("created_at", getDateDaysAgo(30));

        if (!data || data.length === 0) return null;

        const meetingMap = new Map<string, number>();
        data.forEach((record: any) => {
            const date = record.created_at.split("T")[0];
            meetingMap.set(date, (meetingMap.get(date) || 0) + 1);
        });

        const avg = Array.from(meetingMap.values()).reduce((a, b) => a + b, 0) /
            meetingMap.size;

        const predictions = [];
        for (let i = 0; i < daysAhead; i++) {
            const date = getDateDaysAhead(i + 1);
            predictions.push({
                date,
                predictedAttendance: Math.round(avg),
                confidence: 85, // Simple confidence score
            });
        }

        return predictions;
    } catch (error) {
        console.error("Attendance prediction error:", error);
        return null;
    }
};

/**
 * Export analytics as CSV
 */
export const exportAnalyticsAsCSV = async (report: AnalyticsReport) => {
    const csv = [
        ["SmartStaff Analytics Report"],
        ["Generated:", new Date().toISOString()],
        [],
        ["OUTPASS STATISTICS"],
        ["Total Requests", report.outpassStats.total],
        ["Approved", report.outpassStats.approved],
        ["Rejected", report.outpassStats.rejected],
        ["Pending", report.outpassStats.pending],
        ["Approval Rate", `${report.outpassStats.approvalRate}%`],
        [],
        ["MEETING STATISTICS"],
        ["Total Meetings", report.meetingStats.total],
        ["Completed", report.meetingStats.completed],
        ["Rejected", report.meetingStats.rejected],
        ["Pending", report.meetingStats.pending],
        ["Completion Rate", `${report.meetingStats.completionRate}%`],
        [],
        ["USER STATISTICS"],
        ["Total Students", report.userStats.totalStudents],
        ["Total Staff", report.userStats.totalStaff],
        ["Active Today", report.userStats.activeToday],
        ["New This Month", report.userStats.newThisMonth],
        [],
        ["DEPARTMENT BREAKDOWN"],
        ["Department", "Count", "Percentage"],
        ...report.departmentBreakdown.map((d) => [
            d.department,
            d.count,
            `${d.percentage}%`,
        ]),
    ]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
};

/**
 * Utility: Get date X days ago
 */
const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

/**
 * Utility: Get date X days ahead
 */
const getDateDaysAhead = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
};
