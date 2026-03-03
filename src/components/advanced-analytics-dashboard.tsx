import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    getAnalyticsReport,
    getDepartmentMetrics,
    getOutpassPatterns,
    predictAttendance,
    exportAnalyticsAsCSV,
    AnalyticsReport,
} from "@/lib/analytics-service";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

type DepartmentMetric = { department: string; staffCount: number; admins: number; hodsCount: number; avgAvailability: number; outpassHandled: number };
type OutpassPatterns = { topReasons: { reason: string; count: number }[]; topDestinations: { destination: string; count: number }[]; statusDistribution: Record<string, number> } | null;
type AttendancePrediction = { date: string; predictedAttendance: number; confidence: number }[] | null;

export const AdvancedAnalyticsDashboard = () => {
    const [report, setReport] = useState<AnalyticsReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetric[]>([]);
    const [outpassPatterns, setOutpassPatterns] = useState<OutpassPatterns>(null);
    const [predictions, setPredictions] = useState<AttendancePrediction>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [analyticsReport, deptMetrics, patterns, attendancePredictions] =
                await Promise.all([
                    getAnalyticsReport(),
                    getDepartmentMetrics(),
                    getOutpassPatterns(),
                    predictAttendance(7),
                ]);

            setReport(analyticsReport);
            setDepartmentMetrics(deptMetrics);
            setOutpassPatterns(patterns);
            setPredictions(attendancePredictions || []);
        } catch (error) {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (report) {
            exportAnalyticsAsCSV(report);
            toast.success("Analytics exported as CSV");
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-64 bg-muted" />
                    </Card>
                ))}
            </div>
        );
    }

    if (!report) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground">No analytics data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Advanced Analytics</h2>
                <div className="flex gap-2">
                    <Button onClick={fetchAnalytics} variant="outline">
                        Refresh
                    </Button>
                    <Button onClick={handleExport} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{report.userStats.totalStudents}</div>
                        <p className="text-xs text-green-600 mt-1">
                            +{report.userStats.newThisMonth} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Outpass Approval Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{report.outpassStats.approvalRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {report.outpassStats.approved} of {report.outpassStats.total}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Meeting Completion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{report.meetingStats.completionRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {report.meetingStats.completed} completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{report.userStats.activeToday}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Out of {report.userStats.totalStudents} students
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Outpass Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Outpass Requests Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={report.trends.outpassTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    dot={{ fill: "#3b82f6" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Meeting Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Meeting Requests Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={report.trends.meetingTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#10b981"
                                    dot={{ fill: "#10b981" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Department Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Department Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={report.departmentBreakdown}
                                dataKey="count"
                                nameKey="department"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {report.departmentBreakdown.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.departmentBreakdown.map((dept) => (
                            <div key={dept.department} className="text-center">
                                <p className="font-semibold">{dept.department}</p>
                                <p className="text-sm text-muted-foreground">
                                    {dept.count} ({dept.percentage}%)
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Outpass Patterns */}
            {outpassPatterns && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Outpass Reasons</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={outpassPatterns.topReasons}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="reason" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Destinations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={outpassPatterns.topDestinations}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="destination" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Peak Hours */}
            <Card>
                <CardHeader>
                    <CardTitle>Peak Request Hours</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-end gap-4 h-48">
                        {report.peakHours.map((peak, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                                    style={{ height: `${(peak.count / 20) * 100}%` }}
                                />
                                <span className="text-sm font-semibold">{peak.hour}:00</span>
                                <span className="text-xs text-muted-foreground">{peak.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Predictions */}
            {predictions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>7-Day Attendance Forecast</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {predictions.map((pred) => (
                                <div key={pred.date} className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{pred.date}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 bg-muted rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${pred.confidence}%` }}
                                            />
                                        </div>
                                        <Badge variant="outline">
                                            ~{pred.predictedAttendance} students
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department Metrics */}
            {departmentMetrics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Department Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Department</th>
                                        <th className="text-center py-2">Staff</th>
                                        <th className="text-center py-2">HODs</th>
                                        <th className="text-center py-2">Admins</th>
                                        <th className="text-center py-2">Availability %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departmentMetrics.map((dept) => (
                                        <tr key={dept.department} className="border-b hover:bg-muted/50">
                                            <td className="py-2 font-medium">{dept.department}</td>
                                            <td className="text-center">{dept.staffCount}</td>
                                            <td className="text-center">{dept.hodsCount}</td>
                                            <td className="text-center">{dept.admins}</td>
                                            <td className="text-center">
                                                <Badge variant="outline">
                                                    {Math.round(
                                                        (dept.avgAvailability / (dept.staffCount || 1)) * 100
                                                    )}
                                                    %
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
