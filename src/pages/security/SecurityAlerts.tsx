import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle,
  Trash2,
  Bell,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface Alert {
  id: string;
  type: "late_return" | "unauthorized_exit" | "emergency" | "violation";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  staff_name?: string;
  staff_id?: string;
  related_outpass_id?: string;
  created_at: string;
  resolved_at?: string | null;
  notes?: string;
}

const SecurityAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [filterSeverity, setFilterSeverity] = useState<
    "all" | "info" | "warning" | "critical"
  >("all");

  const fetchAlerts = useCallback(async () => {
    try {
      // Get gate logs and generate alerts
      const allLogs = JSON.parse(localStorage.getItem("gate_logs") || "[]");

      // Fetch recent outpasses for context
      const { data: outpassData } = await supabase
        .from("outpass_requests")
        .select("id, student_id, destination, return_time")
        .eq("status", "approved")
        .limit(100);

      if (!outpassData) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      const outpassMap = new Map(outpassData.map((o) => [o.id, o]));

      // Fetch student details
      const studentIds = [...new Set(outpassData.map((o) => o.student_id))];
      const { data: studentData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      const studentMap = new Map(
        (studentData || []).map((s) => [s.id, s])
      );

      // Generate synthetic alerts from gate logs
      const generatedAlerts: Alert[] = [];

      for (const log of allLogs) {
        if (log.gate_action === "entry") {
          const outpass = outpassMap.get(log.outpass_id);
          if (outpass && outpass.return_time) {
            const expectedReturn = new Date(outpass.return_time);
            const actualReturn = new Date(log.verified_at);
            const minutesLate =
              (actualReturn.getTime() - expectedReturn.getTime()) /
              (1000 * 60);

            if (minutesLate > 0) {
              const student = studentMap.get(outpass.student_id);
              generatedAlerts.push({
                id: `alert-${log.id}`,
                type: "late_return",
                severity:
                  minutesLate > 30 ? "critical" : "warning",
                title: `Late Return - ${student?.full_name || "Unknown"}`,
                message: `Returned ${Math.round(minutesLate)} minutes late`,
                staff_name: student?.full_name,
                staff_id: outpass.student_id,
                related_outpass_id: log.outpass_id,
                created_at: log.verified_at,
                resolved_at: null,
              });
            }
          }
        }
      }

      // Filter by status
      let filtered = generatedAlerts;
      if (filterType === "unresolved") {
        filtered = filtered.filter((a) => !a.resolved_at);
      } else if (filterType === "resolved") {
        filtered = filtered.filter((a) => a.resolved_at);
      }

      // Filter by severity
      if (filterSeverity !== "all") {
        filtered = filtered.filter((a) => a.severity === filterSeverity);
      }

      setAlerts(filtered);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to fetch alerts";
      console.error(errMsg, error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Refetch every 10 seconds for real-time alerts
    const interval = setInterval(() => fetchAlerts(), 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      // In real implementation, update the database
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, resolved_at: new Date().toISOString() }
            : a
        )
      );
      toast.success("Alert resolved");
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Failed to resolve alert";
      toast.error(errMsg);
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    toast.success("Alert deleted");
  };

  const unresolvedAlerts = useMemo(
    () => alerts.filter((a) => !a.resolved_at),
    [alerts]
  );

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "late_return":
        return <Clock className="w-5 h-5" />;
      case "unauthorized_exit":
        return <AlertTriangle className="w-5 h-5" />;
      case "emergency":
        return <AlertCircle className="w-5 h-5" />;
      case "violation":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-destructive";
      case "warning":
        return "text-warning";
      case "info":
        return "text-info";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityBgColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10";
      case "warning":
        return "bg-warning/10";
      case "info":
        return "bg-info/10";
      default:
        return "bg-muted";
    }
  };

  const stats = {
    total: alerts.length,
    unresolved: unresolvedAlerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">
              Alerts & Violations
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time security alerts and late return notifications
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    CRITICAL
                  </p>
                  <p className="text-lg font-bold">{stats.critical}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    WARNING
                  </p>
                  <p className="text-lg font-bold">{stats.warning}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    UNRESOLVED
                  </p>
                  <p className="text-lg font-bold">{stats.unresolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    TOTAL
                  </p>
                  <p className="text-lg font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Status</label>
            <Select
              value={filterType}
              onValueChange={(v: string) => setFilterType((v as any) || "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="unresolved">Unresolved Only</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Severity</label>
            <Select
              value={filterSeverity}
              onValueChange={(v: string) => setFilterSeverity((v as any) || "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-muted animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <Card className="border-0 shadow-card">
              <CardContent className="py-12 flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-success/30 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No alerts - All clear!
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-0 shadow-card transition-all ${
                  alert.resolved_at ? "opacity-60 bg-muted/30" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityBgColor(
                        alert.severity
                      )}`}
                    >
                      <div className={getSeverityColor(alert.severity)}>
                        {getAlertIcon(alert.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{alert.title}</h3>
                        <Badge
                          className={`text-xs flex-shrink-0 ${
                            alert.severity === "critical"
                              ? "bg-destructive text-destructive-foreground"
                              : alert.severity === "warning"
                              ? "bg-warning text-warning-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        {alert.staff_name && (
                          <div>
                            <span className="text-muted-foreground">Staff:</span>{" "}
                            <span className="font-medium">{alert.staff_name}</span>
                          </div>
                        )}
                        {alert.staff_id && (
                          <div>
                            <span className="text-muted-foreground">ID:</span>{" "}
                            <span className="font-medium">{alert.staff_id}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                        {alert.resolved_at && (
                          <>
                            {" "}
                            • Resolved:{" "}
                            {new Date(alert.resolved_at).toLocaleString()}
                          </>
                        )}
                      </div>

                      {alert.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Notes: {alert.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {!alert.resolved_at && (
                        <Button
                          onClick={() => handleResolveAlert(alert.id)}
                          size="sm"
                          className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteAlert(alert.id)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SecurityAlerts;
