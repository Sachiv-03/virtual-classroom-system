import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createAssignment, updateAssignment } from "@/services/assignmentService";

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assignment?: any;
}

export const AssignmentModal = ({ isOpen, onClose, onSuccess, assignment }: AssignmentModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "",
        courseId: "COURSE101", // Default for now
        dueDate: "",
        maxMarks: 100
    });

    useEffect(() => {
        if (assignment) {
            setFormData({
                title: assignment.title,
                description: assignment.description,
                subject: assignment.subject,
                courseId: assignment.courseId,
                dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
                maxMarks: assignment.maxMarks
            });
        } else {
            setFormData({
                title: "",
                description: "",
                subject: "",
                courseId: "COURSE101",
                dueDate: "",
                maxMarks: 100
            });
        }
    }, [assignment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (assignment) {
                await updateAssignment(assignment._id, formData);
                toast.success("Assignment updated successfully");
            } else {
                // Form data is enough as files are removed for teacher
                const data = new FormData();
                Object.entries(formData).forEach(([key, value]) => {
                    data.append(key, value.toString());
                });

                await createAssignment(data);
                toast.success("Assignment created successfully");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{assignment ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the assignment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxMarks">Max Marks</Label>
                            <Input
                                id="maxMarks"
                                type="number"
                                value={formData.maxMarks}
                                onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (assignment ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
