import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/stat-card';
import { EnhancedTable } from '@/components/enhanced-table';
import { AlertCircle, LogIn, TrendingUp, Activity, Lock, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SecurityStats {
  totalOutpasses: number;
  activeAlerts: number;
  lateReturns: number;
  totalVerifications: number;
}

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  studentName: string;
  createdAt: string;
  status: string;
}

interface GateLog {
  id: string;
  studentName: string;
  action: string;
  timestamp: string;
  verifiedBy: string;
}

export default function AdminSecurityManagement() {
  const [stats, setStats] = useState<SecurityStats>({
    totalOutpasses: 0,
    activeAlerts: 0,
    lateReturns: 0,
    totalVerifications: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [gateLogs, setGateLogs] = useState<GateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSecurityData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch outpass requests for stats
      const { data: outpasses, error: outpassError } = await supabase
        .from('outpass_requests')
        .select('*');

      if (outpassError) throw outpassError;

      // Calculate stats
      const totalOutpasses = outpasses?.length || 0;
      const lateReturns = outpasses?.filter((o) => 
        new Date() > new Date(o.return_time) && o.gate_status !== 'RETURNED'
      ).length || 0;

      const activeAlerts = localStorage.getItem('security_alerts')
        ? JSON.parse(localStorage.getItem('security_alerts') || '[]').filter((a) => a.status === 'ACTIVE').length
        : 0;

      const gateLogs = localStorage.getItem('gate_logs')
        ? JSON.parse(localStorage.getItem('gate_logs') || '[]')
        : [];

      setStats({
        totalOutpasses,
        activeAlerts,
        lateReturns,
        totalVerifications: gateLogs.length
      });

      // Load alerts
      const securityAlerts: Alert[] = localStorage.getItem('security_alerts')
        ? JSON.parse(localStorage.getItem('security_alerts') || '[]')
        : [];
      setAlerts(securityAlerts.filter(a => !searchTerm || 
        a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message.toLowerCase().includes(searchTerm.toLowerCase())
      ));

      // Load gate logs
      const logs: GateLog[] = localStorage.getItem('gate_logs')
        ? (JSON.parse(localStorage.getItem('gate_logs') || '[]') as Record<string, unknown>[]).map(log => ({
            id: log.id as string,
            studentName: log.studentName as string,
            action: log.gate_action as string,
            timestamp: (log.verified_at as string) || new Date().toISOString(),
            verifiedBy: (log.verified_by as string) || 'Security Staff'
          }))
        : [];
      setGateLogs(logs.slice(0, 5)); // Show latest 5

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Error loading security data';
      console.error(errMsg, error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
        return 'secondary';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'LATE_RETURN':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNAUTHORIZED_EXIT':
        return 'bg-red-100 text-red-800';
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Security Management
          </h1>
          <p className="text-slate-600">Monitor and manage campus security, gate logs, and alerts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Outpasses"
            value={stats.totalOutpasses}
            icon={LogIn}
            description="This month"
            trend={stats.totalOutpasses}
            trendDirection="up"
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={AlertCircle}
            description="Require attention"
            trend={stats.activeAlerts}
            trendDirection={stats.activeAlerts > 0 ? 'up' : 'down'}
            color={stats.activeAlerts > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="Late Returns"
            value={stats.lateReturns}
            icon={Activity}
            description="Overdue"
            trend={stats.lateReturns}
            trendDirection={stats.lateReturns > 0 ? 'up' : 'down'}
            color={stats.lateReturns > 0 ? 'yellow' : 'green'}
          />
          <StatCard
            title="Verifications"
            value={stats.totalVerifications}
            icon={TrendingUp}
            description="Gate events"
            trend={stats.totalVerifications}
            trendDirection="up"
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="gate-logs">Gate Logs</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ALERTS TAB */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>
                  {alerts.length} active alerts that need attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search alerts by student name or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />

                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge className={getAlertTypeColor(alert.alertType)}>
                              {alert.alertType.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">{alert.status}</Badge>
                          </div>
                          <span className="text-sm text-slate-500">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900 mb-1">{alert.studentName}</p>
                        <p className="text-sm text-slate-600 mb-3">{alert.message}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            alert.status = 'RESOLVED';
                            loadSecurityData();
                          }}>
                            Resolve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setAlerts(alerts.filter(a => a.id !== alert.id));
                          }}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No active alerts
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GATE LOGS TAB */}
          <TabsContent value="gate-logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Gate Logs</CardTitle>
                <CardDescription>
                  Latest {gateLogs.length} gate verifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gateLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-semibold text-slate-700">Student</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-700">Action</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-700">Time</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-700">Verified By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gateLogs.map(log => (
                          <tr key={log.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-3 text-slate-900 font-medium">{log.studentName}</td>
                            <td className="py-3 px-3">
                              <Badge variant={log.action === 'EXIT' ? 'secondary' : 'default'}>
                                {log.action}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-slate-600">{log.verifiedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No gate logs yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Reports</CardTitle>
                <CardDescription>
                  Generate and download security reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Daily Report</h3>
                    <p className="text-sm text-slate-600 mb-3">Summary of today's gate activities</p>
                    <Button className="w-full">
                      Generate Daily Report
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Weekly Report</h3>
                    <p className="text-sm text-slate-600 mb-3">Last 7 days of activity</p>
                    <Button className="w-full">
                      Generate Weekly Report
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Monthly Report</h3>
                    <p className="text-sm text-slate-600 mb-3">Full month analytics</p>
                    <Button className="w-full">
                      Generate Monthly Report
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-2">Alert Report</h3>
                    <p className="text-sm text-slate-600 mb-3">All security alerts</p>
                    <Button className="w-full">
                      Generate Alert Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security features and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Real-time Alerts</h3>
                      <p className="text-sm text-slate-600">Enable notifications for security events</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Late Return Detection</h3>
                      <p className="text-sm text-slate-600">Automatically flag students who return late</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Unauthorized Exit Alerts</h3>
                      <p className="text-sm text-slate-600">Detect unauthorized campus exits</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">Email Notifications</h3>
                      <p className="text-sm text-slate-600">Send email alerts to security staff</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>

                <Button className="w-full">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
