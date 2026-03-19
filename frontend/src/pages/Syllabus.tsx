
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PlayCircle, Clock, CheckCircle2, FileText, ChevronRight, User as UserIcon, Calendar, Video, Edit2, Play, BookOpen, ChevronLeft, CheckCircle, BarChart2, Users } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { paymentService } from "@/services/paymentService";
import { getCourseById, updateCourse, addClassSchedule, getEnrolledStudents, markTopicCompleted } from '@/services/courseService';
import { CourseBuilder } from "@/components/classroom/CourseBuilder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

interface Topic {
    _id: string;
    title: string;
    type: 'video' | 'reading' | 'assignment' | 'quiz';
    content: string;
    duration: string;
    isCompleted: boolean;
}

interface Chapter {
    _id: string;
    title: string;
    description: string;
    topics: Topic[];
    order: number;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    teacher: string;
    category: string;
    thumbnail: string;
    rating: number;
    price: number;
    enrolledStudents: number;
    lessonsCount: number;
    units?: any[];
    syllabus?: any[];
    progress?: number;
}

const Syllabus = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Edit course info states
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editCourseData, setEditCourseData] = useState({ title: '', description: '' });
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState({ day: 'Monday', startTime: '10:00', endTime: '11:00' });
    const [students, setStudents] = useState<any[]>([]);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [completingTopic, setCompletingTopic] = useState(false);
    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

    const fetchCourseData = async () => {
        try {
            const [courseRes, enrollRes] = await Promise.all([
                api.get(`/courses/${courseId}`),
                user && user.role !== 'teacher' ? api.get(`/courses/${courseId}/enrollment-status`) : Promise.resolve({ data: { isEnrolled: user?.role === 'teacher' || user?.role === 'admin' } })
            ]);
            setCourse(courseRes.data);
            setEditCourseData({ title: courseRes.data.title || '', description: courseRes.data.description || '' });
            
            // Set enrollment status from response
            const enrolled = enrollRes.data?.isEnrolled || false;
            setIsEnrolled(enrolled);
        } catch (error) {
            toast.error("Failed to load course details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        const fetchStudents = async () => {
            if (!isTeacher || !courseId) return;
            setFetchingStudents(true);
            try {
                const res = await getEnrolledStudents(courseId);
                // getEnrolledStudents returns the array directly due to the api.ts interceptor unwrapping response.data.data
                setStudents(Array.isArray(res) ? res : (res.data || []));
            } catch (error) {
                console.error("Failed to fetch students:", error);
            } finally {
                setFetchingStudents(false);
            }
        };

        if (courseId) {
            fetchCourseData();
            if (isTeacher) {
                fetchStudents();
            }
        }
    }, [courseId, user, isTeacher]);

    const handleTopicClick = (topic: Topic) => {
        if (!isEnrolled) {
            // Note: we might not use this dialog anymore with the CourseBuilder, but keeping it just in case
            toast.error("You must enroll in this course to view the syllabus content.");
            return;
        }
        setSelectedTopic(topic);
        setIsDialogOpen(true);
    };

    const handleUpdateCourseInfo = async () => {
        if (!courseId || !course) return;
        try {
            const updated = await updateCourse(courseId, editCourseData);
            setCourse({ ...course, title: updated.title, description: updated.description });
            setIsEditDialogOpen(false);
            toast.success("Course info updated successfully!");
        } catch (error) {
            toast.error("Failed to update course info");
        }
    };

    const handleAddSchedule = async () => {
        if(!courseId || !course) return;
        try {
            await addClassSchedule(courseId, scheduleData);
            setIsScheduleDialogOpen(false);
            toast.success("Live class scheduled successfully! Syncing to dashboard...");
        } catch (error) {
            toast.error("Failed to schedule live class.");
        }
    };

    const handlePurchase = async () => {
        if (!courseId) return;
        setPaymentLoading(true);

        try {
            if (course?.price === 0) {
                await paymentService.enrollFree(courseId);
                toast.success('Successfully enrolled!');
                setIsEnrolled(true);
                setPaymentLoading(false);
                return;
            }

            const res = await loadRazorpayScript();
            if (!res) {
                toast.error("Razorpay SDK failed to load. Are you online?");
                setPaymentLoading(false);
                return;
            }

            const orderData = await paymentService.createOrder(courseId);
            if (!orderData || !orderData.success) {
                toast.error("Could not create order. Please check backend keys.");
                setPaymentLoading(false);
                return;
            }

            if (orderData.keyId === 'mock') {
                const verifyRes = await paymentService.verifyPayment({
                    razorpay_order_id: orderData.order.id, 
                    razorpay_payment_id: "mock_payment_id", 
                    razorpay_signature: "mock_signature",
                    courseId
                });
                
                if (verifyRes && verifyRes.success) {
                    toast.success("Payment simulated locally! You are now enrolled.");
                    setIsEnrolled(true);
                    setCourse(prev => prev ? { ...prev, enrolledStudents: prev.enrolledStudents + 1 } : null);
                } else {
                    toast.error("Mock enrollment verification failed.");
                }
                setPaymentLoading(false);
                return;
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: course?.title,
                description: "Course Enrollment",
                order_id: orderData.order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await paymentService.verifyPayment({
                            ...response,
                            courseId
                        });

                        if (verifyRes.success) {
                            toast.success("Payment successful! You are now enrolled.");
                            setIsEnrolled(true);
                            setCourse(prev => prev ? { ...prev, enrolledStudents: prev.enrolledStudents + 1 } : null);
                        } else {
                            toast.error("Payment verification failed");
                        }
                    } catch (err) {
                        toast.error("Error verifying payment");
                    }
                },
                prefill: {
                    name: user?.name || "Student",
                    email: user?.email || "",
                },
                theme: {
                    color: "#0f172a",
                },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.on("payment.failed", function () {
                toast.error("Payment Failed");
            });
            paymentObject.open();

        } catch (error) {
            console.error(error);
            toast.error("An error occurred during payment processing");
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Course not found</h2>
                <Button onClick={() => navigate('/courses')}>Back to Courses</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in">
                    <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-4 gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Courses
                    </Button>

                    {/* Course Header */}
                    <div className="relative rounded-xl overflow-hidden h-64 md:h-80 bg-black/40">
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover -z-10 opacity-50"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 text-sm py-1">
                                    {course.category}
                                </Badge>
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <span className="font-bold">{course.rating}</span>
                                    <span className="text-xs text-muted-foreground">/ 5.0</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-start gap-4 mb-6">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{course.title}</h1>
                                    <p className="text-lg text-muted-foreground max-w-2xl line-clamp-2">
                                        {course.description}
                                    </p>
                                </div>
                                {(user?.role === 'teacher' || user?.role === 'admin') && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="bg-primary/20 hover:bg-primary/30 text-white border-white/20 shrink-0">
                                                    <Video className="h-4 w-4 mr-2" /> Schedule Live Class
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[400px]">
                                                <DialogHeader>
                                                    <DialogTitle>Schedule Live Class</DialogTitle>
                                                    <DialogDescription>Create a Google Meet link for this course on a specific day.</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Day of the Week</label>
                                                        <select 
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            value={scheduleData.day} 
                                                            onChange={(e) => setScheduleData({...scheduleData, day: e.target.value})}
                                                        >
                                                            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                                                                <option key={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Start Time</label>
                                                            <Input type="time" value={scheduleData.startTime} onChange={(e) => setScheduleData({...scheduleData, startTime: e.target.value})} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">End Time</label>
                                                            <Input type="time" value={scheduleData.endTime} onChange={(e) => setScheduleData({...scheduleData, endTime: e.target.value})} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleAddSchedule}>Generate Google Meet</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="bg-black/50 hover:bg-black text-white border-white/20 shrink-0">
                                                    <Edit2 className="h-4 w-4 mr-2" /> Edit Course Info
                                                </Button>
                                            </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <DialogHeader>
                                                <DialogTitle>Edit Course Info</DialogTitle>
                                                <DialogDescription>Update the title and description of your course.</DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Course Title</label>
                                                    <Input 
                                                        value={editCourseData.title} 
                                                        onChange={(e) => setEditCourseData({...editCourseData, title: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Course Description</label>
                                                    <Textarea 
                                                        value={editCourseData.description} 
                                                        onChange={(e) => setEditCourseData({...editCourseData, description: e.target.value})}
                                                        className="min-h-[100px]" 
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleUpdateCourseInfo}>Save Changes</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                                        {course.teacher.charAt(0)}
                                    </div>
                                    <span>{course.teacher}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{course.lessonsCount} lessons</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>{course.enrolledStudents} enrolled</span>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                {isEnrolled ? (
                                    <>
                                        <Button
                                            className="gap-2 bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                            onClick={() => navigate(`/live/${courseId}`)}
                                        >
                                            <Video className="h-4 w-4" /> Join Live Class
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="gap-2"
                                            onClick={() => navigate(`/attendance/${courseId}`)}
                                        >
                                            <BarChart2 className="h-4 w-4" /> View Attendance
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                        size="lg"
                                        onClick={handlePurchase}
                                        disabled={paymentLoading}
                                    >
                                        {paymentLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        ) : (
                                            <BookOpen className="h-4 w-4" />
                                        )}
                                        {course?.price === 0 ? "Enroll for Free" : `Enroll Now for $${course?.price}`}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Syllabus & Students */}
                        <div className="lg:col-span-2 space-y-6">
                            <Tabs defaultValue="syllabus" className="w-full">
                                <div className="flex items-center justify-between mb-4">
                                    <TabsList>
                                        <TabsTrigger value="syllabus" className="gap-2">
                                            <BookOpen className="h-4 w-4" /> Syllabus
                                        </TabsTrigger>
                                        {isTeacher && (
                                            <TabsTrigger value="students" className="gap-2">
                                                <Users className="h-4 w-4" /> Students
                                            </TabsTrigger>
                                        )}
                                    </TabsList>
                                </div>

                                <TabsContent value="syllabus" className="mt-0 space-y-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                        Course Syllabus
                                    </h2>

                                    <CourseBuilder 
                                        courseId={course._id} 
                                        initialUnits={course.units || course.syllabus || []} 
                                        onUpdate={(newUnits) => setCourse({...course, units: newUnits as any})} 
                                        isTeacher={isTeacher} 
                                    />
                                </TabsContent>

                                {isTeacher && (
                                    <TabsContent value="students" className="mt-0 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                                <Users className="h-6 w-6 text-primary" />
                                                Enrolled Students
                                            </h2>
                                            <Badge variant="outline">{students.length} Students</Badge>
                                        </div>

                                        <Card>
                                            <CardContent className="p-0">
                                                {fetchingStudents ? (
                                                    <div className="p-8 text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                                        <p className="mt-2 text-muted-foreground">Loading student list...</p>
                                                    </div>
                                                ) : students.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Student</TableHead>
                                                                <TableHead>Roll Number</TableHead>
                                                                <TableHead>Department</TableHead>
                                                                <TableHead className="text-right">Level/XP</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {students.map((student) => (
                                                                <TableRow key={student._id}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarImage src={student.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                                                                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{student.name}</span>
                                                                                <span className="text-xs text-muted-foreground">{student.email}</span>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>{student.rollNumber || "N/A"}</TableCell>
                                                                    <TableCell>{student.department || "General"}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-xs font-bold text-primary">Lvl {student.level || 1}</span>
                                                                            <span className="text-[10px] text-muted-foreground">{student.xp || 0} XP</span>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <div className="p-12 text-center text-muted-foreground">
                                                        No students enrolled in this course yet.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                )}
                            </Tabs>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Progress</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Completed Lessons</span>
                                            <span className="font-bold">0 / {course.lessonsCount}</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-0 transition-all duration-500" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Continue your coursework to advance your progress.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Course Materials</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
                                        <div className="h-10 w-10 rounded bg-blue-500/20 flex items-center justify-center text-blue-500">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Course Guide.pdf</p>
                                            <p className="text-xs text-muted-foreground">2.4 MB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
                                        <div className="h-10 w-10 rounded bg-purple-500/20 flex items-center justify-center text-purple-500">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Resources List</p>
                                            <p className="text-xs text-muted-foreground">Link</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Content Viewer Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle>{selectedTopic?.title}</DialogTitle>
                        <DialogDescription className="hidden">Content viewer for {selectedTopic?.title}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden bg-black/5 p-6">
                        {selectedTopic?.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={selectedTopic.content.replace('watch?v=', 'embed/')}
                                    title={selectedTopic.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-white text-black p-8 rounded-lg shadow overflow-auto">
                                <h3 className="text-2xl font-bold mb-4">{selectedTopic?.title}</h3>
                                <div className="prose max-w-none">
                                    <p>{selectedTopic?.content}</p>
                                    <p className="mt-4 text-muted-foreground">
                                        The full content for this topic is currently being updated. Please check back shortly for the complete material.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t flex justify-between items-center bg-background">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                        <Button 
                            disabled={completingTopic || selectedTopic?.isCompleted}
                            onClick={async () => {
                                if (!courseId || !selectedTopic) return;
                                setCompletingTopic(true);
                                try {
                                    await markTopicCompleted(courseId, selectedTopic._id || (selectedTopic as any).id);
                                    toast.success("Topic marked as completed.");
                                    setIsDialogOpen(false);
                                    fetchCourseData(); // Refresh to show checkmark
                                } catch (error) {
                                    toast.error("Failed to mark topic as completed");
                                } finally {
                                    setCompletingTopic(false);
                                }
                            }}
                        >
                            {completingTopic ? "Updating..." : selectedTopic?.isCompleted ? "Already Completed" : "Mark as Complete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Syllabus;
