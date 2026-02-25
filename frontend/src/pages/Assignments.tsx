import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Download, Upload, Plus, Edit, Trash2, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAssignments, deleteAssignment, downloadAssignmentFile } from "@/services/assignmentService";
import { AssignmentModal } from "@/components/assignments/AssignmentModal";
import { SubmissionModal } from "@/components/assignments/SubmissionModal";
import { GradingModal } from "@/components/assignments/GradingModal";
import { cn } from "@/lib/utils";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Assignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    // Modals state
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

    const isTeacher = user?.role === 'teacher';

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const data = await getAssignments();
            // If the interceptor already unwrapped it, data is the array
            // Otherwise, extract from data.data
            const assignmentsArray = Array.isArray(data) ? data : (data.data || []);
            setAssignments(assignmentsArray);
        } catch (error) {
            toast.error("Failed to fetch assignments");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAssignment) return;
        try {
            await deleteAssignment(selectedAssignment._id);
            toast.success("Assignment deleted");
            setIsDeleteDialogOpen(false);
            fetchAssignments();
        } catch (error) {
            toast.error("Failed to delete assignment");
        }
    };

    const confirmDelete = (assignment: any) => {
        setSelectedAssignment(assignment);
        setIsDeleteDialogOpen(true);
    };

    const handleEdit = (assignment: any) => {
        setSelectedAssignment(assignment);
        setIsAssignmentModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedAssignment(null);
        setIsAssignmentModalOpen(true);
    };

    const handleGrade = (assignment: any) => {
        setSelectedAssignment(assignment);
        setIsGradingModalOpen(true);
    };

    const handleSubmit = (assignment: any) => {
        setSelectedAssignment(assignment);
        setIsSubmissionModalOpen(true);
    };

    const filteredAssignments = assignments.filter(a => {
        if (filter === "all") return true;
        if (filter === "pending") return !a.submission;
        if (filter === "submitted") return !!a.submission;
        return true;
    });

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Assignments</h2>
                            <p className="text-muted-foreground">
                                {isTeacher ? "Manage your classroom assignments" : "Submit your work and check feedback"}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex gap-2 bg-muted p-1 rounded-lg">
                                <Button
                                    variant={filter === "all" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setFilter("all")}
                                >
                                    All
                                </Button>
                                {!isTeacher && (
                                    <>
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
                                    </>
                                )}
                            </div>
                            {isTeacher && (
                                <Button onClick={handleCreate} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    New Assignment
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="h-32 animate-pulse bg-muted" />
                            ))}
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-muted/50">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No assignments found</h3>
                            <p className="text-muted-foreground text-sm">Everything is up to date!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredAssignments.map((assignment, index) => {
                                const submission = assignment.submission;
                                const isGraded = submission?.status === 'graded';

                                return (
                                    <Card key={assignment._id} className="animate-slide-up overflow-hidden group hover:border-primary/50 transition-all shadow-sm" style={{ animationDelay: `${index * 100}ms` }}>
                                        <div className="flex flex-col md:flex-row">
                                            <div className="p-5 flex-1 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                            {assignment.subject}
                                                        </Badge>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            Due {new Date(assignment.dueDate).toLocaleDateString()}
                                                        </div>
                                                        {submission && (
                                                            <Badge variant="secondary" className={cn(
                                                                "ml-2",
                                                                isGraded ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
                                                            )}>
                                                                {isGraded ? 'Graded' : 'Submitted'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isGraded ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-sm font-bold text-success">{submission.marks} / {assignment.maxMarks}</span>
                                                                <span className="text-[10px] text-muted-foreground">Marks Obtained</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-semibold text-primary">{assignment.maxMarks} Marks</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{assignment.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{assignment.description}</p>
                                                </div>

                                                {/* Student Feedback Section */}
                                                {isGraded && submission.feedback && (
                                                    <div className="p-3 rounded-lg bg-success/5 border border-success/10 text-sm">
                                                        <p className="font-semibold text-success mb-1">Teacher Feedback:</p>
                                                        <p className="text-muted-foreground italic">"{submission.feedback}"</p>
                                                    </div>
                                                )}

                                                {/* Attachments hidden on homepage */}
                                            </div>

                                            <div className="p-5 bg-muted/30 border-t md:border-t-0 md:border-l flex flex-row md:flex-col justify-center gap-3 w-full md:w-48">
                                                {isTeacher ? (
                                                    <>
                                                        <Button size="sm" variant="outline" className="gap-2 w-full" onClick={() => handleGrade(assignment)}>
                                                            <ClipboardCheck className="h-4 w-4" />
                                                            Submissions
                                                        </Button>
                                                        <div className="flex gap-2 w-full">
                                                            <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleEdit(assignment)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => confirmDelete(assignment)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        {submission ? (
                                                            isGraded ? (
                                                                <Button size="sm" variant="outline" className="gap-2 w-full cursor-default hover:bg-transparent border-success/20 text-success">
                                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                                    Completed
                                                                </Button>
                                                            ) : (
                                                                <Button size="sm" variant="outline" className="gap-2 w-full" onClick={() => handleSubmit(assignment)}>
                                                                    <Clock className="h-4 w-4 text-warning" />
                                                                    Resubmit
                                                                </Button>
                                                            )
                                                        ) : (
                                                            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 w-full" onClick={() => handleSubmit(assignment)}>
                                                                <Upload className="h-4 w-4" />
                                                                Submit Now
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <AssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                onSuccess={fetchAssignments}
                assignment={selectedAssignment}
            />

            {selectedAssignment && (
                <SubmissionModal
                    isOpen={isSubmissionModalOpen}
                    onClose={() => setIsSubmissionModalOpen(false)}
                    onSuccess={fetchAssignments}
                    assignmentId={selectedAssignment._id}
                    assignmentTitle={selectedAssignment.title}
                />
            )}

            <GradingModal
                isOpen={isGradingModalOpen}
                onClose={() => setIsGradingModalOpen(false)}
                assignment={selectedAssignment}
            />

            {/* Delete Confirmation Modal */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the assignment
                            <span className="font-bold text-foreground"> "{selectedAssignment?.title}"</span> and all associated student submissions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Assignment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Assignments;
