import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceTab from "@/components/classroom/schedule/AttendanceTab";
import { getCourses, addClassSchedule } from "@/services/courseService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Clock, MapPin } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";


const Schedule = () => {
    const { user } = useAuth();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddClassOpen, setIsAddClassOpen] = useState(false);

    // Form state
    const [newClass, setNewClass] = useState({
        subject: "",
        day: "Monday",
        startTime: "",
        endTime: "",
        room: ""
    });

    const fetchSchedule = async () => {
        try {
            const courses = await getCourses();
            setAllCourses(courses);
            const allClasses: any[] = [];
            courses.forEach((course: any) => {
                if (course.schedule) {
                    course.schedule.forEach((slot: any) => {
                        allClasses.push({
                            ...slot,
                            subject: course.title,
                            type: "Lecture",
                            teacher: course.teacher
                        });
                    });
                }
            });
            setUpcomingClasses(allClasses);
        } catch (error) {
            console.error("Failed to fetch schedule", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const handleAddClass = async () => {
        try {
            // Validation
            if (!newClass.subject || !newClass.startTime || !newClass.endTime) {
                toast.error("Please fill in all required fields");
                return;
            }

            const selectedCourse = allCourses.find(c => c.title === newClass.subject);

            if (!selectedCourse) {
                toast.error("Course not found");
                return;
            }

            await addClassSchedule(selectedCourse._id, {
                day: newClass.day,
                startTime: newClass.startTime,
                endTime: newClass.endTime,
                room: "Online"
            });

            await fetchSchedule();

            toast.success("Class scheduled successfully");
            setIsAddClassOpen(false);
            setNewClass({
                subject: "",
                day: "Monday",
                startTime: "",
                endTime: "",
                room: ""
            });
        } catch (error) {
            toast.error("Failed to schedule class");
        }
    };

    // Filter classes for selected date (mock logic since schedule is just Days of week)
    const dayName = date?.toLocaleDateString('en-US', { weekday: 'long' });
    const todaysClasses = upcomingClasses.filter(c => c.day === dayName);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Academic Schedule</h2>
                            <p className="text-muted-foreground">Manage your classes and track your attendance</p>
                        </div>
                        {user?.role === 'teacher' && (
                            <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" /> Schedule Class
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Schedule New Class</DialogTitle>
                                        <DialogDescription>
                                            Add a new class session to the weekly schedule.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="subject" className="text-right">Subject</Label>
                                            <Select
                                                value={newClass.subject}
                                                onValueChange={val => setNewClass({ ...newClass, subject: val })}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allCourses.map((course: any) => (
                                                        <SelectItem key={course._id} value={course.title}>{course.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="day" className="text-right">Day</Label>
                                            <Select
                                                value={newClass.day}
                                                onValueChange={val => setNewClass({ ...newClass, day: val })}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select day" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                                        <SelectItem key={day} value={day}>{day}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="start" className="text-right">Start</Label>
                                            <Input
                                                id="start"
                                                type="time"
                                                className="col-span-3"
                                                value={newClass.startTime}
                                                onChange={e => setNewClass({ ...newClass, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="end" className="text-right">End</Label>
                                            <Input
                                                id="end"
                                                type="time"
                                                className="col-span-3"
                                                value={newClass.endTime}
                                                onChange={e => setNewClass({ ...newClass, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" onClick={handleAddClass}>Save Class</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <Tabs defaultValue="calendar" className="w-full space-y-6">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="calendar">Class Calendar</TabsTrigger>
                            <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
                        </TabsList>

                        <TabsContent value="calendar" className="animate-slide-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle>Calendar</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            className="rounded-md border shadow w-full"
                                        />
                                    </CardContent>
                                </Card>

                                <Card className="col-span-1 lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            <span>Classes for {dayName}</span>
                                            <span className="text-sm font-normal text-muted-foreground">{date?.toLocaleDateString()}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {todaysClasses.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No classes scheduled for this day.
                                                </div>
                                            ) : (
                                                todaysClasses.map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-accent/50 transition-colors">
                                                        <div className="flex gap-4">
                                                            <div className="font-mono text-primary font-bold w-20">{item.startTime}</div>
                                                            <div>
                                                                <h4 className="font-bold">{item.subject}</h4>
                                                                <p className="text-sm text-muted-foreground">{item.room} • {item.teacher}</p>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Scheduled" />
                                                    </div>
                                                )))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="attendance" className="animate-slide-up">
                            <AttendanceTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
};

export default Schedule;
