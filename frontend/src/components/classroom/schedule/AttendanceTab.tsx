import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle2, Clock, XCircle, BarChart3, Download, RefreshCw } from "lucide-react";
import { getAllUserAttendance, markAttendance } from "@/services/attendanceService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const AttendanceTab = () => {
    const { user } = useAuth();
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const data = await getAllUserAttendance();
            setAttendanceData(data);
            calculateStats(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load attendance records");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: any[]) => {
        const present = data.filter(r => r.status === 'Present').length;
        const absent = data.filter(r => r.status === 'Absent').length;
        const late = data.filter(r => r.status === 'Late').length;
        setStats({ present, absent, late, total: data.length });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return "bg-green-100 text-green-700 border-green-200";
            case 'Absent': return "bg-red-100 text-red-700 border-red-200";
            case 'Late': return "bg-yellow-100 text-yellow-700 border-yellow-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Present': return <CheckCircle2 className="h-4 w-4" />;
            case 'Absent': return <XCircle className="h-4 w-4" />;
            case 'Late': return <Clock className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const handleMarkNow = () => {
        // Logic for "Mark Now" button - simplified for demo since it usually requires a specific active class context
        toast.info("Checking for active classes...");
        // In a real scenario, this would check if a class is actually live right now
        setTimeout(() => {
            toast.error("No active class session found requiring check-in.");
        }, 1500);
    };

    const filteredData = filter === "all"
        ? attendanceData
        : attendanceData.filter(item => item.course?.title === filter);

    const uniqueCourses = Array.from(new Set(attendanceData.map(item => item.course?.title))).filter(Boolean);

    return (
        <div className="space-y-6">
            {/* Real-time Status Card */}
            <Card className="border-l-4 border-l-primary bg-card/50">
                <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Current Session Status</h3>
                            <p className="text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button onClick={fetchAttendance} variant="outline" size="icon" title="Refresh">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        {user?.role === 'teacher' && (
                            <Button
                                onClick={handleMarkNow}
                                className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90"
                            >
                                Mark Attendance
                            </Button>
                        )}
                        {user?.role !== 'teacher' && (
                            <Button disabled variant="secondary" className="w-full md:w-auto gap-2 opacity-70">
                                Check-in Disabled
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                        </div>
                        <Progress value={stats.total > 0 ? (stats.present / stats.total) * 100 : 0} className="h-2 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Classes Attended</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        <p className="text-xs text-muted-foreground">Total sessions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Missed Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        <p className="text-xs text-muted-foreground">Needs attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Late Arrivals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                        <p className="text-xs text-muted-foreground">Try to be punctual</p>
                    </CardContent>
                </Card>
            </div>

            {/* History List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Attendance History</CardTitle>
                        <CardDescription>Detailed log of all your class sessions</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {uniqueCourses.map((course: any, idx) => (
                                    <SelectItem key={idx} value={course}>{course}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="h-4 w-4" /> Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] w-full pr-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No attendance records found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredData.map((record) => (
                                    <div
                                        key={record._id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-card border hover:bg-accent/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${getStatusColor(record.status)} bg-opacity-20`}>
                                                {getStatusIcon(record.status)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{record.course?.title || "Unknown Course"}</h4>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(record.date).toLocaleDateString()}</span>
                                                    <span className="text-border">|</span>
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={getStatusColor(record.status)}>
                                            {record.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceTab;
