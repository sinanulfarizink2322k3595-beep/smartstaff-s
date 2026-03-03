import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  Trash2,
  CheckCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StudentNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

const notificationTypeInfo: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  meeting_approved: {
    icon: CheckCircle,
    color: "bg-success/10 text-success border-success/20",
    label: "Meeting Approved",
  },
  meeting_rejected: {
    icon: XCircle,
    color: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Meeting Rejected",
  },
  staff_available: {
    icon: Users,
    color: "bg-primary/10 text-primary border-primary/20",
    label: "Staff Available",
  },
  reminder: {
    icon: Clock,
    color: "bg-warning/10 text-warning border-warning/20",
    label: "Reminder",
  },
  system: {
    icon: AlertCircle,
    color: "bg-secondary/10 text-secondary border-secondary/20",
    label: "System",
  },
  admin_alert: {
    icon: Bell,
    color: "bg-info/10 text-info border-info/20",
    label: "Admin Alert",
  },
  outpass: {
    icon: Bell,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Outpass Update",
  },
};

const StudentNotifications = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications((data as StudentNotification[]) || []);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to load notifications";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel(`notifications:${profile?.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile?.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as StudentNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to update notification";
      toast.error(errMsg);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.is_read)
        .map((n) => n.id);

      if (unreadIds.length === 0) {
        toast.info("All notifications already read");
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to update notifications";
      toast.error(errMsg);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to delete";
      toast.error(errMsg);
    }
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with important alerts and reminders
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter("all")}
            variant={filter === "all" ? "default" : "outline"}
            className="gap-2"
          >
            <Bell className="w-4 h-4" />
            All ({notifications.length})
          </Button>
          <Button
            onClick={() => setFilter("unread")}
            variant={filter === "unread" ? "default" : "outline"}
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-muted animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="py-12 flex flex-col items-center justify-center">
                <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filter === "unread"
                    ? "Check back later for updates"
                    : "You'll receive notifications here when staff responds to your requests"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const typeInfo =
                notificationTypeInfo[
                  notification.type as keyof typeof notificationTypeInfo
                ] || notificationTypeInfo.other;
              const Icon = typeInfo.icon;

              return (
                <Card
                  key={notification.id}
                  className={`border-0 shadow-card transition-all cursor-pointer ${
                    !notification.is_read
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : ""
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${typeInfo.color} border`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Info Card */}
        {notifications.length > 0 && (
          <Card className="border-0 shadow-card bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-1">Notification Tips</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Click on unread notifications to mark them as read</li>
                    <li>• Delete old notifications to keep your inbox clean</li>
                    <li>
                      • Receive real-time updates when staff responds to your
                      requests
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;
