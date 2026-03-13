import { useState, useEffect } from "react";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Plus, 
    Trash2, 
    Sparkles, 
    CheckCircle, 
    BookOpen, 
    Video, 
    FileText, 
    ChevronDown, 
    ChevronUp,
    ExternalLink,
    Clock,
    User,
    BadgeCheck,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
    createAISyllabus, 
    getAllSyllabuses, 
    generateResources, 
    approveSyllabus,
    deleteAISyllabus
} from "@/services/aiSyllabusService";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Topic {
    topicTitle: string;
    videos?: Array<{ title: string; url: string; thumbnail?: string }>;
    materials?: Array<{ title: string; pdfUrl: string; source?: string }>;
    notes?: string;
}

interface Unit {
    unitTitle: string;
    topics: Topic[];
}

interface Syllabus {
    _id: string;
    courseName: string;
    department: string;
    semester: string;
    units: Unit[];
    generatedResources: boolean;
    status: 'pending' | 'approved';
    createdAt: string;
}

export default function UniversitySyllabusPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [courseName, setCourseName] = useState("");
    const [department, setDepartment] = useState("");
    const [semester, setSemester] = useState("");
    const [units, setUnits] = useState<Unit[]>([{ unitTitle: "", topics: [{ topicTitle: "" }] }]);

    // UI state
    const [expandedSyllabus, setExpandedSyllabus] = useState<string | null>(null);
    const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

    useEffect(() => {
        fetchSyllabuses();
    }, []);

    const fetchSyllabuses = async () => {
        try {
            setLoading(true);
            const data = await getAllSyllabuses();
            // The data is already unwrapped by the axios interceptor and service
            setSyllabuses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load syllabuses:", error);
            setSyllabuses([]);
            toast.error("Network Error: Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUnit = () => {
        setUnits([...units, { unitTitle: "", topics: [{ topicTitle: "" }] }]);
    };

    const handleRemoveUnit = (index: number) => {
        const newUnits = [...units];
        newUnits.splice(index, 1);
        setUnits(newUnits);
    };

    const handleAddTopic = (unitIndex: number) => {
        const newUnits = [...units];
        newUnits[unitIndex].topics.push({ topicTitle: "" });
        setUnits(newUnits);
    };

    const handleRemoveTopic = (unitIndex: number, topicIndex: number) => {
        const newUnits = [...units];
        newUnits[unitIndex].topics.splice(topicIndex, 1);
        setUnits(newUnits);
    };

    const handleUnitTitleChange = (index: number, value: string) => {
        const newUnits = [...units];
        newUnits[index].unitTitle = value;
        setUnits(newUnits);
    };

    const handleTopicTitleChange = (unitIndex: number, topicIndex: number, value: string) => {
        const newUnits = [...units];
        newUnits[unitIndex].topics[topicIndex].topicTitle = value;
        setUnits(newUnits);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseName || !department || !semester) {
            toast.error("Please fill in all basic details");
            return;
        }

        // Validate units and topics
        const isValid = units.every(u => u.unitTitle && u.topics.every(t => t.topicTitle));
        if (!isValid) {
            toast.error("Please fill in all unit and topic titles");
            return;
        }

        try {
            await createAISyllabus({ courseName, department, semester, units });
            toast.success("Syllabus structure created!");
            setIsCreating(false);
            setCourseName("");
            setDepartment("");
            setSemester("");
            setUnits([{ unitTitle: "", topics: [{ topicTitle: "" }] }]);
            fetchSyllabuses();
        } catch (error) {
            toast.error("Failed to create syllabus");
        }
    };

    const handleGenerate = async (id: string) => {
        try {
            toast.loading("AI is generating resources...", { id: "gen" });
            await generateResources(id);
            toast.success("Learning resources generated successfully!", { id: "gen" });
            fetchSyllabuses();
        } catch (error) {
            toast.error("Resource generation failed", { id: "gen" });
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approveSyllabus(id);
            toast.success("Syllabus approved and published!");
            fetchSyllabuses();
        } catch (error) {
            toast.error("Approval failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this syllabus?")) return;
        try {
            await deleteAISyllabus(id);
            toast.success("Syllabus deleted");
            fetchSyllabuses();
        } catch (error) {
            toast.error("Deletion failed");
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
                <Header />
                <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
                    
                    {/* Header Section */}
                    <div className="flex justify-between items-end border-b pb-6">
                        <div className="space-y-1">
                            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
                                <BookOpen className="h-10 w-10 text-primary" />
                                University Syllabus
                            </h1>
                            <p className="text-muted-foreground text-lg italic">
                                AI-Powered Learning Resource Management System
                            </p>
                        </div>
                        {isAdmin && !isCreating && (
                            <Button onClick={() => setIsCreating(true)} className="gap-2 h-12 px-6 text-lg shadow-lg hover:shadow-xl transition-all">
                                <Plus className="h-5 w-5" />
                                Design New Syllabus
                            </Button>
                        )}
                    </div>

                    {/* Creation Form */}
                    {isCreating && (
                        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden animate-slide-up">
                            <CardHeader className="bg-primary/5 border-b">
                                <CardTitle className="text-2xl">Step 1: Define Syllabus Structure</CardTitle>
                                <CardDescription>Enter course details and manually add units and topics.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Course Name</label>
                                            <Input 
                                                placeholder="e.g. Operating Systems" 
                                                value={courseName} 
                                                onChange={e => setCourseName(e.target.value)}
                                                className="h-12 text-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Department</label>
                                            <Input 
                                                placeholder="e.g. Computer Science" 
                                                value={department} 
                                                onChange={e => setDepartment(e.target.value)}
                                                className="h-12 text-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Semester</label>
                                            <Input 
                                                placeholder="e.g. Semester 4" 
                                                value={semester} 
                                                onChange={e => setSemester(e.target.value)}
                                                className="h-12 text-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-muted/40 p-4 rounded-lg">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Badge variant="outline" className="text-lg">Step 2</Badge>
                                                Add Units & Topics
                                            </h3>
                                            <Button type="button" variant="outline" size="sm" onClick={handleAddUnit} className="h-10 text-md gap-2 border-primary/50 text-primary hover:bg-primary/10">
                                                <Plus className="h-4 w-4" /> Add Unit
                                            </Button>
                                        </div>

                                        {units.map((unit, uIdx) => (
                                            <div key={uIdx} className="p-6 border-2 border-dashed rounded-xl space-y-4 bg-muted/20 hover:border-primary/30 transition-colors">
                                                <div className="flex gap-4 items-center">
                                                    <span className="font-bold text-xl text-primary whitespace-nowrap">Unit {uIdx + 1}:</span>
                                                    <Input 
                                                        placeholder="Unit Title (e.g. Introduction to OS)" 
                                                        value={unit.unitTitle} 
                                                        onChange={e => handleUnitTitleChange(uIdx, e.target.value)}
                                                        className="h-11 text-lg font-medium"
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveUnit(uIdx)} className="text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>

                                                <div className="pl-12 space-y-3">
                                                    {unit.topics.map((topic, tIdx) => (
                                                        <div key={tIdx} className="flex gap-3 items-center">
                                                            <div className="w-2 h-2 rounded-full bg-primary/40" />
                                                            <Input 
                                                                placeholder={`Topic ${tIdx + 1} Name`} 
                                                                value={topic.topicTitle} 
                                                                onChange={e => handleTopicTitleChange(uIdx, tIdx, e.target.value)}
                                                                className="h-10 text-md"
                                                            />
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTopic(uIdx, tIdx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button type="button" variant="link" size="sm" onClick={() => handleAddTopic(uIdx)} className="text-primary font-semibold p-0 h-auto">
                                                        + Add Topic to Unit {uIdx + 1}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t">
                                        <Button type="submit" className="flex-1 h-14 text-xl shadow-lg bg-emerald-600 hover:bg-emerald-700">
                                            Save Syllabus Structure
                                        </Button>
                                        <Button type="button" variant="outline" className="h-14 px-8 text-xl" onClick={() => setIsCreating(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Syllabus List */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground/80">
                            {isAdmin ? "Manage Department Syllabuses" : "Your Available Courses"}
                            {loading && <Badge variant="secondary" className="animate-pulse">Loading...</Badge>}
                        </h2>

                        {!loading && syllabuses.length === 0 && (
                            <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl">
                                <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-xl text-muted-foreground">No syllabuses found. {isAdmin ? "Start by creating one!" : "Check back later."}</p>
                            </div>
                        )}

                        <div className="grid gap-6">
                            {syllabuses.map((s) => (
                                <Card key={s._id} className={`overflow-hidden border-l-8 transition-all hover:shadow-xl ${s.status === 'approved' ? 'border-l-emerald-500' : 'border-l-orange-500'}`}>
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-3xl font-bold text-foreground">{s.courseName}</h3>
                                                    <Badge className={s.status === 'approved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-orange-100 text-orange-700 hover:bg-orange-100'}>
                                                        {s.status === 'approved' ? 'Active & Published' : 'In Review / Restricted'}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-muted-foreground text-md font-medium">
                                                    <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" /> {s.department}</span>
                                                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {s.semester}</span>
                                                    <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> Admin Created</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                                <Button 
                                                    variant="secondary" 
                                                    className="h-11"
                                                    onClick={() => setExpandedSyllabus(expandedSyllabus === s._id ? null : s._id)}
                                                >
                                                    {expandedSyllabus === s._id ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
                                                    {expandedSyllabus === s._id ? "Collapse" : "View Syllabus Content"}
                                                </Button>

                                                {isAdmin && (
                                                    <div className="flex gap-2 w-full md:w-auto">
                                                        {!s.generatedResources ? (
                                                            <Button onClick={() => handleGenerate(s._id)} variant="default" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 h-11 px-6 shadow-md shadow-purple-200">
                                                                <Sparkles className="mr-2 h-4 w-4" /> Generate AI Resources
                                                            </Button>
                                                        ) : s.status === 'pending' ? (
                                                            <Button onClick={() => handleApprove(s._id)} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6">
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
                                                            </Button>
                                                        ) : null}
                                                        
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s._id)} className="h-11 w-11 text-destructive hover:bg-destructive/10">
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded View */}
                                        {expandedSyllabus === s._id && (
                                            <div className="mt-8 pt-8 border-t space-y-8 animate-in slide-in-from-top duration-500">
                                                {!s.generatedResources && (
                                                    <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800 flex items-center gap-4">
                                                        <Sparkles className="h-8 w-8 text-orange-500 animate-pulse" />
                                                        <div>
                                                            <p className="font-bold text-orange-800 dark:text-orange-200">Resources Pending Generation</p>
                                                            <p className="text-orange-600 dark:text-orange-300">Admin needs to click "Generate AI Resources" to fetch videos, PDFs, and notes.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {Array.isArray(s.units) && s.units.map((unit, uIdx) => (
                                                    <div key={uIdx} className="space-y-4">
                                                        <h4 className="text-2xl font-bold text-primary flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">{uIdx + 1}</div>
                                                            {unit.unitTitle}
                                                        </h4>
                                                        
                                                        <div className="grid gap-4 pl-12">
                                                            {unit.topics.map((topic, tIdx) => (
                                                                <div key={tIdx} className="border-2 rounded-2xl overflow-hidden bg-card transition-all hover:border-primary/40">
                                                                    <div 
                                                                        className="p-5 flex justify-between items-center cursor-pointer hover:bg-muted/30"
                                                                        onClick={() => setExpandedUnit(expandedUnit === `${s._id}-${uIdx}-${tIdx}` ? null : `${s._id}-${uIdx}-${tIdx}`)}
                                                                    >
                                                                        <span className="text-lg font-bold flex items-center gap-2">
                                                                            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full text-xs opacity-60">{tIdx + 1}</Badge>
                                                                            {topic.topicTitle}
                                                                        </span>
                                                                        {expandedUnit === `${s._id}-${uIdx}-${tIdx}` ? <ChevronUp className="h-5 w-5 opacity-40" /> : <ChevronDown className="h-5 w-5 opacity-40" />}
                                                                    </div>

                                                                    {expandedUnit === `${s._id}-${uIdx}-${tIdx}` && (
                                                                        <div className="p-6 pt-0 bg-muted/5 space-y-6">
                                                                            <div className="p-5 bg-card border rounded-xl shadow-sm">
                                                                                <h5 className="font-bold mb-3 flex items-center gap-2 text-primary">
                                                                                    <Sparkles className="h-4 w-4" /> AI Study Insight
                                                                                </h5>
                                                                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{topic.notes || "AI has not generated notes for this topic yet."}</p>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {/* Videos */}
                                                                                <div className="space-y-3">
                                                                                    <h5 className="font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                                                                                        <Video className="h-4 w-4" /> Video Tutorials
                                                                                    </h5>
                                                                                    {topic.videos && topic.videos.length > 0 ? (
                                                                                        topic.videos.map((vid, vIdx) => (
                                                                                            <a key={vIdx} href={vid.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted transition-colors group">
                                                                                                <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                                                                                                    <img src={vid.thumbnail} alt="thumb" className="w-full h-full object-cover" />
                                                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                                                                                        <Video className="text-white h-6 w-6" />
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="overflow-hidden">
                                                                                                    <p className="font-semibold text-sm line-clamp-2 leading-snug">{vid.title}</p>
                                                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">YouTube</p>
                                                                                                </div>
                                                                                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                                                                                            </a>
                                                                                        ))
                                                                                    ) : <p className="text-xs italic text-muted-foreground px-4">No video resources available.</p>}
                                                                                </div>

                                                                                {/* Materials */}
                                                                                <div className="space-y-3">
                                                                                    <h5 className="font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                                                                        <FileText className="h-4 w-4" /> Study Materials (PDF)
                                                                                    </h5>
                                                                                    {topic.materials && topic.materials.length > 0 ? (
                                                                                        topic.materials.map((mat, mIdx) => (
                                                                                            <a key={mIdx} href={mat.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted transition-colors">
                                                                                                <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 font-bold text-xs">PDF</div>
                                                                                                <div className="flex-1">
                                                                                                    <p className="font-semibold text-sm line-clamp-1">{mat.title}</p>
                                                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{mat.source || "Google Scholar"}</p>
                                                                                                </div>
                                                                                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                                                            </a>
                                                                                        ))
                                                                                    ) : <p className="text-xs italic text-muted-foreground px-4">No PDF resources available.</p>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
