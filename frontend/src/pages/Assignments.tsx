import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Download, Upload, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const assignmentsData = [
    {
        id: 1,
        title: "Calculus III Problem Set",
        subject: "Mathematics",
        dueDate: "Today",
        priority: "High",
        status: "pending",
        description: "Complete all exercises from Chapter 4.2. Show all your work for full credit.",
        document: "calculus_set_ch4.pdf"
    },
    {
        id: 2,
        title: "Modern Physics Lab Report",
        subject: "Physics",
        dueDate: "Tomorrow",
        priority: "Medium",
        status: "pending",
        description: "Submit the lab results for the Photoelectric Effect experiment. Include graphs.",
        document: "physics_lab_template.docx"
    },
    {
        id: 3,
        title: "World War II Analysis",
        subject: "History",
        dueDate: "Feb 10, 2026",
        priority: "Low",
        status: "submitted",
        description: "Analyze the impact of D-Day on the European theater.",
        document: "history_brief.pdf"
    },
    {
        id: 4,
        title: "React Data Management Project",
        subject: "Computer Science",
        dueDate: "Feb 15, 2026",
        priority: "High",
        status: "pending",
        description: "Build a dashboard using React and custom hooks for state management.",
        document: "project_specs.pdf"
    }
];

const Assignments = () => {
    const [filter, setFilter] = useState("all");

    const filteredAssignments = assignmentsData.filter(a => {
        if (filter === "all") return true;
        return a.status === filter;
    });

    const handleDownload = (docName: string) => {
        toast.success(`Downloading ${docName}...`);
    };

    const handleView = (title: string) => {
        toast.info(`Opening viewer for ${title}`);
    };

    const handleSubmit = (title: string) => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Uploading assignment...',
                success: `Assignment "${title}" submitted successfully!`,
                error: 'Upload failed',
            }
        );
    };

    return (
        <div className="min-h-screen bg-background bg-gradient-mesh">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Assignments</h2>
                            <p className="text-muted-foreground">Submit your work and check feedback</p>
                        </div>
                        <div className="flex gap-2 bg-muted p-1 rounded-lg">
                            <Button
                                variant={filter === "all" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setFilter("all")}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === "pending" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setFilter("pending")}
                            >
                                Pending
                            </Button>
                            <Button
                                variant={filter === "submitted" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setFilter("submitted")}
                            >
                                Done
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredAssignments.map((assignment, index) => (
                            <Card key={assignment.id} className="animate-slide-up overflow-hidden group hover:border-primary/50 transition-all shadow-sm" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="flex flex-col md:flex-row">
                                    <div className="p-5 flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                    {assignment.subject}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    Due {assignment.dueDate}
                                                </div>
                                            </div>
                                            <Badge
                                                className={assignment.status === "submitted" ? "bg-success hover:bg-success/90" : "bg-warning hover:bg-warning/90"}
                                            >
                                                {assignment.status === "submitted" ? "Submitted" : "Pending"}
                                            </Badge>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{assignment.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                                        </div>

                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-2 text-sm font-medium text-foreground p-2 rounded-md bg-muted/50 border border-dashed hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleDownload(assignment.document)}>
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="truncate">{assignment.document}</span>
                                                <Download className="h-3 w-3 ml-2 text-muted-foreground" />
                                            </div>
                                            {assignment.priority === "High" && assignment.status !== "submitted" && (
                                                <div className="flex items-center gap-1 text-xs text-destructive animate-pulse font-semibold">
                                                    <AlertCircle className="h-3 w-3" />
                                                    High Priority
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-5 bg-muted/30 border-t md:border-t-0 md:border-l flex flex-row md:flex-col justify-center gap-3">
                                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleView(assignment.title)}>
                                            <Eye className="h-4 w-4" />
                                            View Details
                                        </Button>
                                        {assignment.status === "pending" ? (
                                            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => handleSubmit(assignment.title)}>
                                                <Upload className="h-4 w-4" />
                                                Submit Now
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="secondary" className="gap-2 bg-success/10 text-success hover:bg-success/20 border-success/20" disabled>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Completed
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Assignments;
