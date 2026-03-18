import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, Star, Play, ArrowRight, Filter, Search, Plus, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { enrollInCourse, updateCourse } from "@/services/courseService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colorVariants = {
  blue: "from-primary/80 to-primary",
  orange: "from-accent/80 to-accent",
  green: "from-success/80 to-success",
  purple: "from-focus/80 to-focus",
};

interface Course {
  _id: string;
  title: string;
  teacher: string;
  category: string;
  progress?: number;
  lessonsCount: number;
  enrolledStudents: number;
  rating: number;
  price?: number;
  thumbnail: string;
  color?: keyof typeof colorVariants;
  isEnrolled?: boolean;
  teacherId?: string;
}

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [teachers, setTeachers] = useState<any[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    if (isAdmin) {
      fetchTeachers();
    }
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses');
      const rawData = Array.isArray(response.data) ? response.data : (response.data.data || []);

      const data = rawData.map((course: any, index: number) => ({
        ...course,
        color: Object.keys(colorVariants)[index % 4],
        progress: course.progress || 0 // Use real progress if available
      }));
      setCourses(data);
      setFilteredCourses(data);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/dashboard/teachers');
      // Handle both unwrapped and wrapped response formats
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]); // Reset to empty array on error
    }
  };

  useEffect(() => {
    let result = courses;

    if (searchTerm) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacher.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      result = result.filter(course => course.category === categoryFilter);
    }

    setFilteredCourses(result);
  }, [searchTerm, categoryFilter, courses]);

  const handleAction = (course: Course) => {
    if (isTeacher) {
      navigate(`/courses/${course._id}`);
    } else if (course.isEnrolled) {
      navigate(`/courses/${course._id}`);
    } else {
      // Not enrolled yet — navigate to the course detail page
      navigate(`/courses/${course._id}`);
    }
  };

  const handleEnroll = async (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEnrollingId(course._id);
    try {
      const result = await enrollInCourse(course._id);
      if (result.alreadyEnrolled) {
        toast.info('You are already enrolled in this course');
      } else {
        toast.success(`Enrolled in "${course.title}" successfully!`);
      }
      
      // Navigate to the course immediately
      navigate(`/courses/${course._id}`);
      
      // Refresh courses to update internal state (optional but good for consistency if they go back)
      const response = await api.get('/courses');
      const rawData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const data = rawData.map((c: any, index: number) => ({
        ...c,
        color: Object.keys(colorVariants)[index % 4],
        progress: c.progress || 0
      }));
      setCourses(data);
      setFilteredCourses(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleCreateCourse = () => {
    navigate("/courses/new");
  };

  const handleAssignTeacher = async (teacher: any) => {
    if (!selectedCourse) return;
    setAssigningLoading(true);
    try {
      await updateCourse(selectedCourse._id, {
        teacherId: teacher._id,
        teacher: teacher.name
      });
      toast.success(`Assigned ${teacher.name} to "${selectedCourse.title}"`);
      setIsAssignModalOpen(false);
      fetchCourses(); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign teacher");
    } finally {
      setAssigningLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        <Header />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {isAdmin ? "Course Assignment" : isTeacher ? "Courses You Teach" : "Available & Enrolled Courses"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isAdmin ? "Assign teachers to courses" : isTeacher ? "Manage your courses and student content" : "Browse all available courses and manage your enrollments"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Languages">Languages</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                </SelectContent>
              </Select>

              { (isTeacher || isAdmin) && (
                <Button onClick={handleCreateCourse} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Course
                </Button>
              )}
            </div>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No courses match your current search criteria.
              </div>
            ) : (
              filteredCourses.map((course, index) => (
                <Card
                  key={course._id}
                  className="group overflow-hidden card-hover animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Course Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-t opacity-60",
                      colorVariants[course.color || 'blue']
                    )} />

                    {/* Play/Edit Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        className="h-14 w-14 rounded-full bg-white/90 hover:bg-white text-foreground shadow-2xl"
                        onClick={() => handleAction(course)}
                      >
                        {isTeacher ? <MoreVertical className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                      </Button>
                    </div>

                    <Badge className="absolute top-3 left-3 bg-white/90 text-foreground">
                      {course.category}
                    </Badge>

                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-foreground">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="text-xs font-medium">{course.rating}</span>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>

                    {!isTeacher && !isAdmin && (
                      <div className="flex items-center gap-2 mb-4">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${course.teacher}`} />
                          <AvatarFallback>{course.teacher ? course.teacher.split(" ").map(n => n[0]).join("") : "T"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{course.teacher || "Unassigned"}</span>
                      </div>
                    )}

                    {(isAdmin || isTeacher) && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                          Teacher: {course.teacher || "Unassigned"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.lessonsCount} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrolledStudents} students</span>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full gap-2" 
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          <Users className="h-4 w-4" />
                          Assign Teacher
                        </Button>
                      </div>
                    ) : isTeacher ? (
                      <div className="pt-2 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => handleAction(course)}>Manage Content</Button>
                        <Button variant="outline" className="flex-1" onClick={() => toast.info("Viewing analytics...")}>Analytics</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{course.isEnrolled ? (course.progress || 0) : 0}%</span>
                        </div>
                        <Progress value={course.isEnrolled ? (course.progress || 0) : 0} className="h-2" />
                        <Button
                          className="w-full mt-2 group/btn"
                          disabled={enrollingId === course._id}
                          onClick={(e) => {
                            if (!course.isEnrolled) {
                              handleEnroll(course, e);
                            } else {
                              handleAction(course);
                            }
                          }}
                        >
                          {enrollingId === course._id ? (
                            "Starting..."
                          ) : (
                            !course.isEnrolled ? "Start Course" : "Continue Learning"
                          )}
                          <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Assign Teacher Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Teacher to Course</DialogTitle>
            <DialogDescription>
              Select a teacher to assign to "{selectedCourse?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Registered Teachers</Label>
            <div className="grid gap-2">
              {teachers?.map((teacher) => (
                <Button
                  key={teacher._id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleAssignTeacher(teacher)}
                  disabled={assigningLoading}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{teacher.name}</span>
                    <span className="text-xs text-muted-foreground">{teacher.email} • {teacher.department || "General"}</span>
                  </div>
                </Button>
              ))}
              {(!teachers || teachers.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">No teachers available.</p>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;