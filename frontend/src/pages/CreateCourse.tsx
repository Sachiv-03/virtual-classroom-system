import { useState } from "react";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Loader2, Upload } from "lucide-react";

const CreateCourse = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        teacher: "Dr. Hoffman (You)", // Hardcoded for now, normally from auth
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80", // Default or uploaded
        price: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate
            if (!formData.title || !formData.category || !formData.description) {
                toast.error("Please fill in all required fields");
                setIsLoading(false);
                return;
            }

            // Construct payload
            const payload = {
                ...formData,
                price: Number(formData.price) || 0,
                rating: 0,
                enrolledStudents: 0,
                lessonsCount: 0,
                syllabus: [] // Start empty
            };

            await api.post('/courses', payload);

            toast.success("Course created successfully!");
            navigate('/courses');
        } catch (error) {
            console.error(error);
            toast.error("Failed to create course");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />
                <div className="p-6 max-w-3xl mx-auto animate-slide-up">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Create New Course</CardTitle>
                            <CardDescription>Share your knowledge with the world. Fill in the details below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Course Title *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        placeholder="e.g. Advanced Machine Learning"
                                        value={formData.title}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select onValueChange={handleCategoryChange} value={formData.category}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Technology">Technology</SelectItem>
                                            <SelectItem value="Science">Science</SelectItem>
                                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                                            <SelectItem value="Languages">Languages</SelectItem>
                                            <SelectItem value="Arts">Arts</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="What will students learn in this course?"
                                        className="h-32"
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price ($)</Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="thumbnail">Thumbnail URL</Label>
                                        <Input
                                            id="thumbnail"
                                            name="thumbnail"
                                            placeholder="https://..."
                                            value={formData.thumbnail}
                                            onChange={handleChange}
                                        />
                                        <p className="text-xs text-muted-foreground">Using default if empty</p>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => navigate('/courses')}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Course
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default CreateCourse;
