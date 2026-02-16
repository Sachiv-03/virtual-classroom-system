import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, GraduationCap, Calendar, FileText } from 'lucide-react';
import api from '@/lib/api';

interface Unit {
    unitTitle: string;
    topics: string[];
}

interface SyllabusData {
    _id: string;
    courseTitle: string;
    courseCode: string;
    semester: string;
    academicYear: string;
    description: string;
    units: Unit[];
    learningOutcomes: string[];
    textbooks: string[];
    references: string[];
    pdfPath?: string;
}

const SyllabusViewer = () => {
    const { id } = useParams();
    const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSyllabus = async () => {
            try {
                // If using courseId, you might need a different endpoint like /syllabus/course/:courseId
                // Assuming ID here is the Syllabus document ID
                const response = await api.get(`/syllabus/${id}`);
                setSyllabus(response.data);
            } catch (error) {
                console.error("Failed to fetch syllabus", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchSyllabus();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-screen">Loading Syllabus...</div>;
    if (!syllabus) return <div className="flex justify-center items-center h-screen">Syllabus not found.</div>;

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

                {/* Header Section */}
                <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <GraduationCap className="h-64 w-64 rotate-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="secondary" className="text-primary border-primary/20 text-md px-3 py-1">
                                {syllabus.courseCode}
                            </Badge>
                            <Badge variant="outline" className="text-md px-3 py-1">
                                <Calendar className="mr-2 h-3 w-3" /> {syllabus.academicYear}
                            </Badge>
                            <Badge variant="outline" className="text-md px-3 py-1">
                                Semester {syllabus.semester}
                            </Badge>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                            {syllabus.courseTitle}
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                            {syllabus.description || "Official university syllabus for " + syllabus.courseTitle}
                        </p>

                        {syllabus.pdfPath && (
                            <div className="mt-6">
                                <Button variant="default" className="gap-2">
                                    <Download className="h-4 w-4" /> Download Original PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Units */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary" />
                                Course Units
                            </h2>
                            <span className="text-sm text-muted-foreground">{syllabus.units.length} Units</span>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {syllabus.units.map((unit, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`unit-${index}`}
                                    className="border border-border/50 rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden px-2 shadow-sm hover:shadow-md transition-all"
                                >
                                    <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                        <div className="flex flex-col items-start text-left w-full gap-2">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded">
                                                    Unit {index + 1}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-normal">
                                                    {unit.topics.length} Topics
                                                </span>
                                            </div>
                                            <span className="text-lg font-semibold">{unit.unitTitle}</span>

                                            {/* Progress Bar per Unit (Visual Indicator of "Weightage" or just style) */}
                                            <div className="w-full pr-4 mt-1 flex items-center gap-2">
                                                <Progress value={100} className="h-1 flex-1" />
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-2">
                                        <ul className="grid grid-cols-1 gap-2 mt-2">
                                            {unit.topics.map((topic, tIndex) => (
                                                <li key={tIndex} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                                    <span className="text-sm leading-relaxed text-foreground/90">{topic}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    {/* Sidebar: Outcomes & Resources */}
                    <div className="space-y-6">
                        {syllabus.learningOutcomes && syllabus.learningOutcomes.length > 0 && (
                            <Card className="border-l-4 border-l-green-500 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-green-600" />
                                        Learning Outcomes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {syllabus.learningOutcomes.map((outcome, idx) => (
                                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                                                <span>•</span>
                                                <span>{outcome}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="bg-gradient-to-br from-card to-muted/20 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    References
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {syllabus.textbooks && syllabus.textbooks.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2 uppercase text-muted-foreground tracking-wider">Textbooks</h4>
                                        <ul className="text-sm space-y-2">
                                            {syllabus.textbooks.map((book, i) => (
                                                <li key={i} className="bg-background p-2 rounded border border-border/50">{book}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {syllabus.references && syllabus.references.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2 uppercase text-muted-foreground tracking-wider mt-4">Reference Books</h4>
                                        <ul className="text-sm space-y-2">
                                            {syllabus.references.map((ref, i) => (
                                                <li key={i} className="bg-background p-2 rounded border border-border/50">{ref}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyllabusViewer;
