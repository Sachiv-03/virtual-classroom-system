import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { ClassCard } from "@/components/classroom/ClassCard";
import { StatsCard } from "@/components/classroom/StatsCard";
import { UpcomingAssignments } from "@/components/classroom/UpcomingAssignments";
import { FocusTimer } from "@/components/classroom/FocusTimer";
import { StreakCard } from "@/components/classroom/StreakCard";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getTeacherDashboardStats, getStudentDashboardStats } from "@/services/dashboardService";
import {
  BookOpen,
  Clock,
  Trophy,
  Target,
  Users,
  ClipboardList,
  CheckSquare,
  BarChart,
  PlusCircle,
  Megaphone,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const classes = [
  {
    subject: "Advanced Mathematics",
    teacher: "Dr. Sarah Wilson",
    time: "9:00 AM",
    duration: "1h 30m",
    students: 28,
    isLive: true,
    color: "blue" as const,
  },
  {
    subject: "Physics 101",
    teacher: "Prof. Michael Chen",
    time: "11:00 AM",
    duration: "1h",
    students: 32,
    color: "orange" as const,
  },
  {
    subject: "English Literature",
    teacher: "Ms. Emily Brown",
    time: "2:00 PM",
    duration: "1h",
    students: 24,
    color: "green" as const,
  },
  {
    subject: "Computer Science",
    teacher: "Mr. David Lee",
    time: "4:00 PM",
    duration: "1h 30m",
    students: 20,
    color: "purple" as const,
  },
];

import { createAnnouncement, getLatestAnnouncements } from "@/services/announcementService";
import { formatDistanceToNow } from 'date-fns';


import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);


  useEffect(() => {
    fetchDashboardData();
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const data = await getLatestAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Failed to fetch announcements", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = isTeacher
        ? await getTeacherDashboardStats()
        : await getStudentDashboardStats();
      setStats(data.data);
    } catch (error) {
      console.error("Dashboard error:", error);
      // Fallback to zeros if error
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) {
      toast.error("Please enter announcement content");
      return;
    }
    try {
      await createAnnouncement(announcementText);
      toast.success("Announcement sent successfully!");
      setAnnouncementOpen(false);
      setAnnouncementText("");
      fetchAnnouncements();
    } catch (error) {
      toast.error("Failed to send announcement");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 transition-all duration-300">
        <Header />

        <div className="p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground text-sm">
              {isTeacher
                ? "Overview of your current teaching modules and student performance."
                : "Track your academic progress and upcoming deadlines."}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isTeacher ? (
              <>
                <StatsCard
                  icon={Users}
                  label="Total Students"
                  value={stats?.totalStudents || "156"}
                  trend="+12 this month"
                  trendUp
                  variant="gradient"
                />
                <StatsCard
                  icon={ClipboardList}
                  label="All Assignments"
                  value={stats?.totalAssignments || "0"}
                  trend="Assignment Overview"
                />
                <StatsCard
                  icon={CheckSquare}
                  label="Submissions"
                  value={`${stats?.gradedSubmissions || 0}/${stats?.totalSubmissions || 0}`}
                  trend={`${stats?.pendingGrading || 0} pending grading`}
                  trendUp={stats?.pendingGrading > 0}
                />
                <StatsCard
                  icon={BarChart}
                  label="Pending Evaluation"
                  value={stats?.pendingGrading || "0"}
                  trend="Requires attention"
                  trendUp={stats?.pendingGrading > 10}
                />
              </>
            ) : (
              <>
                <StatsCard
                  icon={BookOpen}
                  label="Assigned"
                  value={stats?.totalAssignments || "0"}
                  trend="Total assignments"
                  variant="gradient"
                />
                <StatsCard
                  icon={Trophy}
                  label="Completed"
                  value={stats?.submittedAssignments || "0"}
                  trend="Tasks completed"
                  trendUp
                />
                <StatsCard
                  icon={Target}
                  label="Average Marks"
                  value={stats?.avgMarks || "0%"}
                  trend="Performance metric"
                  trendUp
                />
                <StatsCard
                  icon={Clock}
                  label="Pending Tasks"
                  value={stats?.pendingAssignments || "0"}
                  trend="Action required"
                  trendUp={stats?.pendingAssignments > 2}
                />
              </>
            )}
          </div>

          {/* Announcements Section */}
          {announcements.length > 0 && (
            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-orange-500" />
                School Announcements
              </h3>
              <div className="space-y-4">
                {announcements.map((announcement: any) => (
                  <div key={announcement._id} className="p-4 bg-muted/50 rounded-lg flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{announcement.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="font-semibold">{announcement.author?.name}</span>
                        <span>•</span>
                        {/* Using a safe fallback if date invalid or just simple string if lib issue */}
                        <span>{announcement.createdAt && new Date(announcement.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Classes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Layout className="h-5 w-5 text-primary" />
                {isTeacher ? "Your Teaching Schedule" : "Your Class Schedule"}
              </h2>
              <span className="text-sm text-muted-foreground">4 sessions today</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.map((classItem, index) => (
                <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <ClassCard {...classItem} />
                </div>
              ))}
            </div>
          </div>



          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <UpcomingAssignments />
            </div>

            {/* Focus & Productivity */}
            <div className="space-y-4">
              {!isTeacher && <FocusTimer />}
              <StreakCard />
              {isTeacher && (
                <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Quick Management
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="justify-start h-11 gap-3" onClick={() => navigate('/courses/new')}>
                      <PlusCircle className="h-5 w-5 text-blue-500" />
                      Create New Course
                    </Button>

                    <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="justify-start h-11 gap-3">
                          <Megaphone className="h-5 w-5 text-orange-500" />
                          Send Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Announcement</DialogTitle>
                          <DialogDescription>Notify all your students with an important update.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Textarea
                            placeholder="Type your announcement here..."
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSendAnnouncement}>Send Now</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="justify-start h-11 gap-3">
                          <BarChart className="h-5 w-5 text-purple-500" />
                          View Analytics
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[800px]">
                        <DialogHeader>
                          <DialogTitle>Detailed Analytics</DialogTitle>
                          <DialogDescription>Performance metrics across all your courses.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 h-[300px] flex items-center justify-center border rounded bg-slate-50 dark:bg-slate-900/50">
                          <p className="text-muted-foreground">Advanced analytics chart integration coming soon.</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
