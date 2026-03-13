import { useState, useEffect } from "react";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { BookOpen, MapPin, Loader2, Database, AlertCircle, FileText, Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface Resource {
    _id: string;
    type: 'pdf' | 'video' | 'article';
    title: string;
    link: string;
}

interface Chapter {
    _id: string;
    title: string;
    content: string;
    resources: Resource[];
}

interface Subject {
    _id: string;
    name: string;
    description: string;
    chapters: Chapter[];
}

const SyllabusPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [seedLoading, setSeedLoading] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/syllabus');
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || response.data);
            setSubjects(data);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
            toast.error("Failed to load university syllabus. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleSeedSyllabus = async () => {
        try {
            setSeedLoading(true);
            const response = await api.post('/syllabus/seed');
            toast.success(response.data?.message || "Syllabus seeded successfully!");
            await fetchSubjects();
        } catch (error: any) {
            console.error("Failed to seed subjects:", error);
            toast.error(error.response?.data?.message || "Failed to generate syllabus.");
        } finally {
            setSeedLoading(false);
        }
    };

    const renderResourceIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
            case 'video': return <Video className="h-4 w-4 text-blue-500" />;
            case 'article': return <ExternalLink className="h-4 w-4 text-green-500" />;
            default: return <BookOpen className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-primary" />
                                University Syllabus Portal
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Browse complete subject curriculum, study materials, and lecture resources.
                            </p>
                        </div>
                        
                        {isAdmin && (
                            <Button 
                                onClick={handleSeedSyllabus} 
                                disabled={seedLoading}
                                className="gap-2 shrink-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 shadow-sm"
                            >
                                {seedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                                Generate Syllabus (Admin)
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="text-center p-12 bg-card rounded-xl border border-border flex flex-col items-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-bold">No Subjects Found</h3>
                            <p className="text-muted-foreground mb-4">The university syllabus database is currently empty.</p>
                            {isAdmin && (
                                <Button onClick={handleSeedSyllabus} disabled={seedLoading}>
                                    Initialize Database
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {subjects.map((subject) => (
                                <Card key={subject._id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all">
                                    <CardHeader className="bg-muted/30 pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl text-primary flex items-center gap-2">
                                                    {subject.name}
                                                </CardTitle>
                                                <CardDescription className="mt-1 line-clamp-2">
                                                    {subject.description}
                                                </CardDescription>
                                            </div>
                                            <div className="shrink-0 bg-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                                                <span className="text-white font-bold text-lg">{subject.chapters.length}</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Accordion type="multiple" className="w-full">
                                            {subject.chapters.map((chapter, index) => (
                                                <AccordionItem value={chapter._id} key={chapter._id} className="border-b-border/30 px-4">
                                                    <AccordionTrigger className="hover:no-underline py-4">
                                                        <div className="flex items-center gap-3 text-left">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded bg-muted text-muted-foreground text-sm font-semibold">
                                                                {(index + 1).toString().padStart(2, '0')}
                                                            </div>
                                                            <span className="font-semibold text-[15px]">{chapter.title}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pl-14 pr-4 pb-6">
                                                        <p className="text-muted-foreground text-sm mb-4 leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50">
                                                            {chapter.content}
                                                        </p>
                                                        
                                                        {chapter.resources && chapter.resources.length > 0 && (
                                                            <div>
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                                    Study Materials & Lectures
                                                                </h4>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                    {chapter.resources.map(res => (
                                                                        <a
                                                                            key={res._id}
                                                                            href={res.link}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                                                                        >
                                                                            <div className="p-2 rounded-lg bg-background shadow-xs border border-border/20 group-hover:scale-110 transition-transform">
                                                                                {renderResourceIcon(res.type)}
                                                                            </div>
                                                                            <div className="overflow-hidden">
                                                                                <p className="text-sm font-medium truncate">{res.title}</p>
                                                                                <p className="text-xs text-muted-foreground capitalize">{res.type}</p>
                                                                            </div>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SyllabusPage;
