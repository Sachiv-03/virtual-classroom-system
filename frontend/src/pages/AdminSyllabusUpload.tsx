import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from '@/lib/api'; // Ensure you have an axios instance configured here

const AdminSyllabusUpload = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [parsedData, setParsedData] = useState<any | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [attaching, setAttaching] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/courses');
                // handle pagination wrapper if present
                const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
                setCourses(data);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
            }
        };
        fetchCourses();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: "Error",
                description: "Please select a PDF file first.",
                variant: "destructive",
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            const response = await api.post('/syllabus/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setParsedData(response.data.syllabus);
            toast({
                title: "Success",
                description: "Syllabus uploaded and parsed successfully!",
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Upload Failed",
                description: error.response?.data?.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAttach = async () => {
        if (!selectedCourse || !parsedData) return;
        setAttaching(true);
        try {
            await api.put(`/courses/${selectedCourse}/attach-syllabus`, { syllabusId: parsedData._id });
            toast({
                title: "Success",
                description: "Syllabus successfully attached to the course!",
            });
            setParsedData(null); // Clear after success
            setSelectedCourse('');
            setFile(null);
        } catch (error: any) {
            toast({
                title: "Attachment Failed",
                description: error.response?.data?.message || "Something went wrong.",
                variant: "destructive",
            });
        } finally {
            setAttaching(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">University Syllabus Upload</h1>
                <p className="text-muted-foreground">Upload official PDF documents to automatically extract and structure course data.</p>
            </div>

            <Card className="border-dashed border-2 p-8 flex flex-col items-center justify-center space-y-4 hover:bg-muted/50 transition-colors">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2 text-center">
                    <h3 className="font-semibold text-lg">Click to upload or drag and drop</h3>
                    <p className="text-sm text-muted-foreground">PDF (MAX. 50MB)</p>
                </div>
                <Input
                    type="file"
                    accept=".pdf"
                    className="max-w-xs cursor-pointer"
                    onChange={handleFileChange}
                />
                <Button onClick={handleUpload} disabled={!file || loading} className="w-full max-w-xs">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Upload & Parse"}
                </Button>
            </Card>

            {parsedData && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 p-4 rounded-lg border border-green-200">
                        <CheckCircle className="h-5 w-5" />
                        <span>Successfully extracted data for: {parsedData.courseCode} - {parsedData.courseTitle}</span>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Parsed Structure Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="font-bold">Semester:</span> {parsedData.semester}</div>
                                <div><span className="font-bold">Academic Year:</span> {parsedData.academicYear}</div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold">Units ({parsedData.units.length})</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    {parsedData.units.map((unit: any, idx: number) => (
                                        <li key={idx} className="text-sm">
                                            <span className="font-semibold">{unit.unitTitle}</span>
                                            {unit.topics.length > 0 && <span className="text-muted-foreground"> - {unit.topics.length} topics</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Attach to Course</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Select a course to attach this parsed syllabus data to. This will overwrite the course's current units.</p>
                            <div className="flex gap-4">
                                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                    <SelectTrigger className="w-[300px]">
                                        <SelectValue placeholder="Select a course..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(course => (
                                            <SelectItem key={course._id} value={course._id}>
                                                {course.title} {course.teacher ? `(${course.teacher})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleAttach}
                                    disabled={!selectedCourse || attaching}
                                >
                                    {attaching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Attach Syllabus
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminSyllabusUpload;
