import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSubmissionsForAssignment, gradeSubmission, downloadSubmission } from "@/services/assignmentService";
import { Download } from "lucide-react";

interface GradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any;
}

export const GradingModal = ({ isOpen, onClose, assignment }: GradingModalProps) => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingData, setGradingData] = useState<{ [id: string]: { marks: number, feedback: string } }>({});

    useEffect(() => {
        if (isOpen && assignment) {
            fetchSubmissions();
        }
    }, [isOpen, assignment]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await getSubmissionsForAssignment(assignment._id);

            // Robust extraction of the submissions array
            const submissionsArray = Array.isArray(res) ? res : (res.data || []);
            setSubmissions(submissionsArray);

            // Initialize grading data
            const initialGrading: any = {};
            submissionsArray.forEach((s: any) => {
                initialGrading[s._id] = {
                    marks: s.marks || 0,
                    feedback: s.feedback || ""
                };
            });
            setGradingData(initialGrading);
        } catch (error) {
            toast.error("Failed to fetch submissions");
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = async (submissionId: string) => {
        try {
            await gradeSubmission(submissionId, gradingData[submissionId]);
            toast.success("Grade submitted successfully");
            fetchSubmissions();
        } catch (error) {
            toast.error("Failed to submit grade");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Grading: {assignment?.title}</DialogTitle>
                    <DialogDescription>
                        View and grade student submissions. Max Marks: {assignment?.maxMarks}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                    <div className="text-center p-8 border border-dashed rounded-lg">
                        No submissions yet.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {submissions.map((submission) => (
                            <div key={submission._id} className="p-4 border rounded-lg space-y-4 bg-muted/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{submission.studentId.name}</p>
                                        <p className="text-sm text-muted-foreground">{submission.studentId.email}</p>
                                        <p className="text-xs text-muted-foreground">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                                    </div>
                                    <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                                        {submission.status === 'graded' ? 'Graded' : 'Pending'}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => downloadSubmission(submission._id)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download {submission.fileName}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Marks</Label>
                                        <Input
                                            type="number"
                                            value={gradingData[submission._id]?.marks}
                                            onChange={(e) => setGradingData({
                                                ...gradingData,
                                                [submission._id]: { ...gradingData[submission._id], marks: parseInt(e.target.value) }
                                            })}
                                            max={assignment.maxMarks}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Feedback</Label>
                                        <Textarea
                                            placeholder="Write feedback for the student..."
                                            value={gradingData[submission._id]?.feedback}
                                            onChange={(e) => setGradingData({
                                                ...gradingData,
                                                [submission._id]: { ...gradingData[submission._id], feedback: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button size="sm" onClick={() => handleGrade(submission._id)}>
                                        Submit Grade
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
