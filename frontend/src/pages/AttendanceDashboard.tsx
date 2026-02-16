import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, ChevronLeft } from "lucide-react";
import { getAttendanceAnalytics, downloadAttendanceReport } from "@/services/attendanceService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const AttendanceDashboard = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                if (courseId) {
                    const data = await getAttendanceAnalytics(courseId);
                    setAnalytics(data);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                toast.error("Failed to load attendance analytics");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [courseId]);

    const handleDownloadReport = async () => {
        try {
            if (courseId) {
                toast.info("Generating report...");
                await downloadAttendanceReport(courseId);
                toast.success("Report downloaded successfully");
            }
        } catch (error) {
            toast.error("Failed to download report");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">No data available</h2>
                <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
            </div>
        );
    }

    // Format monthly data for Recharts
    const chartData = analytics.monthlyData.map((item: any) => ({
        month: new Date(0, item._id - 1).toLocaleString('default', { month: 'short' }),
        attendance: item.count
    }));

    return (
        <div className="min-h-screen bg-background bg-gradient-mesh">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />
                <div className="p-6 space-y-6 animate-fade-in">
                    <Button variant="ghost" onClick={() => navigate(`/courses/${courseId}`)} className="mb-4 gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Course
                    </Button>

                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
                        <Button onClick={handleDownloadReport} className="gap-2">
                            <Download className="h-4 w-4" /> Download Report (PDF)
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Lectures</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{analytics.totalLectures}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Attended</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-green-500">{analytics.attendedLectures}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendance %</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-4xl font-bold ${parseFloat(analytics.attendancePercentage) >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                                    {analytics.attendancePercentage}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <CardHeader>
                            <CardTitle>Monthly Attendance Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="attendance" fill="#8884d8" name="Classes Attended" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default AttendanceDashboard;
