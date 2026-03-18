import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createAssignment, updateAssignment } from "@/services/assignmentService";
import api from "@/lib/api";

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assignment?: any;
}

export const AssignmentModal = ({ isOpen, onClose, onSuccess, assignment }: AssignmentModalProps) => {
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "",
        courseId: "", 
        dueDate: "",
        maxMarks: 100
    });

    useEffect(() => {
        if (isOpen) {
            fetchTeacherCourses();
        }
    }, [isOpen]);

    const fetchTeacherCourses = async () => {
        setCoursesLoading(true);
        try {
            const response = await api.get('/courses');
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setCourses(data);
            
            // If creating new and we have courses, pre-select the first one
            if (!assignment && data.length > 0 && !formData.courseId) {
                setFormData(prev => ({
                    ...prev,
                    courseId: data[0]._id,
                    subject: data[0].title
                }));
            }
        } catch (error) {
            console.error("Error fetching courses for assignment:", error);
            toast.error("Failed to load your courses");
        } finally {
            setCoursesLoading(false);
        }
    };

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
                courseId: "",
                dueDate: "",
                maxMarks: 100
            });
        }
    }, [assignment, isOpen]);

    const handleCourseChange = (courseId: string) => {
        const selectedCourse = courses.find(c => c._id === courseId);
        if (selectedCourse) {
            setFormData({
                ...formData,
                courseId: selectedCourse._id,
                subject: selectedCourse.title
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.courseId) {
            toast.error("Please select a subject/course");
            return;
        }

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
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Assignment Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="course">Subject / Course</Label>
                        <Select 
                            value={formData.courseId} 
                            onValueChange={handleCourseChange}
                            disabled={coursesLoading || !!assignment}
                        >
                            <SelectTrigger id="course">
                                <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a subject"} />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map(course => (
                                    <SelectItem key={course._id} value={course._id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                                {courses.length === 0 && !coursesLoading && (
                                    <div className="p-2 text-sm text-muted-foreground">No courses found</div>
                                )}
                            </SelectContent>
                        </Select>
                        {assignment && (
                            <p className="text-[10px] text-muted-foreground">Subject cannot be changed after creation</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide instructions for students..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            className="min-h-[100px]"
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

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading || coursesLoading}>
                            {loading ? "Saving..." : (assignment ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

