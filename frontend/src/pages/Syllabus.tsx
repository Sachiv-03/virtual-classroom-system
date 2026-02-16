
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, Play, FileText, ChevronLeft, CheckCircle, Video, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

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
    enrolledStudents: number;
    lessonsCount: number;
    syllabus: Chapter[];
    progress?: number;
}

const Syllabus = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${courseId}`);
                setCourse(response.data);
            } catch (error) {
                toast.error("Failed to load course details");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourse();
        }
    }, [courseId]);

    const handleTopicClick = (topic: Topic) => {
        setSelectedTopic(topic);
        setIsDialogOpen(true);
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
        <div className="min-h-screen bg-background bg-gradient-mesh">
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

                            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{course.title}</h1>
                            <p className="text-lg text-muted-foreground max-w-2xl line-clamp-2 mb-6">
                                {course.description}
                            </p>

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
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Syllabus */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary" />
                                Course Syllabus
                            </h2>

                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-0">
                                    <Accordion type="single" collapsible className="w-full">
                                        {course.syllabus.map((chapter, index) => (
                                            <AccordionItem key={chapter._id || index} value={`item-${index}`} className="border-b border-border/50 last:border-0">
                                                <AccordionTrigger className="px-6 py-4 hover:bg-accent/50 transition-colors">
                                                    <div className="flex flex-col items-start text-left gap-1">
                                                        <span className="text-sm font-medium text-muted-foreground">Chapter {index + 1}</span>
                                                        <span className="text-lg font-semibold">{chapter.title}</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="bg-background/50">
                                                        {chapter.topics.map((topic, tIndex) => (
                                                            <div
                                                                key={topic._id || tIndex}
                                                                onClick={() => handleTopicClick(topic)}
                                                                className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/50 last:border-0 group"
                                                            >
                                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${topic.isCompleted ? "bg-green-500/20 text-green-500" : "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                                                    }`}>
                                                                    {topic.type === 'video' ? <Play className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{topic.title}</h4>
                                                                    <span className="text-xs text-muted-foreground">{topic.duration} • {topic.type}</span>
                                                                </div>
                                                                {topic.isCompleted ? (
                                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                                ) : (
                                                                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        Start
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
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
                        <Button onClick={() => {
                            toast.success("Topic marked as completed.");
                            setIsDialogOpen(false);
                        }}>Mark as Complete</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Syllabus;
