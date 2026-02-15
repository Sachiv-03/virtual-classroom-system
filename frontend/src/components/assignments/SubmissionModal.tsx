import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitAssignment } from "@/services/assignmentService";

interface SubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assignmentId: string;
    assignmentTitle: string;
}

export const SubmissionModal = ({ isOpen, onClose, onSuccess, assignmentId, assignmentTitle }: SubmissionModalProps) => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [rollNumber, setRollNumber] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }
        if (!rollNumber.trim()) {
            toast.error("Please enter your roll number");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("assignmentId", assignmentId);
            data.append("rollNumber", rollNumber);
            data.append("file", file);

            await submitAssignment(data);
            toast.success("Assignment submitted successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Submit Work: {assignmentTitle}</DialogTitle>
                    <DialogDescription>
                        Enter your details and upload your work.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rollNumber">Roll Number</Label>
                        <Input
                            id="rollNumber"
                            placeholder="Enter your student roll number"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file">File Attachment</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Max size: 50MB. (PDF, DOC, ZIP, images etc.)</p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Uploading..." : "Submit Now"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
