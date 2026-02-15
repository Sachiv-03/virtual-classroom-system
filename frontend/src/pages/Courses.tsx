import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, Star, Play, ArrowRight, Filter, Search, Plus, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import api from "@/lib/api";

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
  thumbnail: string;
  color?: keyof typeof colorVariants;
}

const Courses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        const data = response.data.map((course: any, index: number) => ({
          ...course,
          color: Object.keys(colorVariants)[index % 4], // Assign cyclic colors
          progress: Math.floor(Math.random() * 100) // Mock progress for now
        }));
        setCourses(data);
        setFilteredCourses(data);
      } catch (error) {
        toast.error("Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
      // toast.success(`Managing ${course.title}...`);
      navigate(`/courses/${course._id}`);
    } else {
      navigate(`/courses/${course._id}`);
    }
  };

  const handleCreateCourse = () => {
    navigate("/courses/new");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh">
      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        <Header />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {isTeacher ? "Courses You Teach" : "My Enrolled Courses"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {isTeacher ? "Manage your curriculum and student engagement" : "Continue learning and track your progress"}
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

              {isTeacher && (
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
                No courses found matching your criteria.
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

                    {!isTeacher && (
                      <div className="flex items-center gap-2 mb-4">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${course.teacher}`} />
                          <AvatarFallback>{course.teacher.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{course.teacher}</span>
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

                    {isTeacher ? (
                      <div className="pt-2 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => handleAction(course)}>Manage Content</Button>
                        <Button variant="outline" className="flex-1" onClick={() => toast.info("Viewing analytics...")}>Analytics</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                        <Button
                          className="w-full mt-4 group/btn"
                          onClick={() => handleAction(course)}
                        >
                          {course.progress === 0 ? "Start Course" : "Continue Learning"}
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
    </div>
  );
};

export default Courses;