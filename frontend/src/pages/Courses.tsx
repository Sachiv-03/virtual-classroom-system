 import { Sidebar } from "@/components/classroom/Sidebar";
 import { Header } from "@/components/classroom/Header";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Progress } from "@/components/ui/progress";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { BookOpen, Clock, Users, Star, Play, ArrowRight, Filter, Search } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { cn } from "@/lib/utils";
 
 const courses = [
   {
     id: 1,
     title: "Advanced Mathematics",
     teacher: "Dr. Sarah Wilson",
     category: "Mathematics",
     progress: 75,
     lessons: 24,
     students: 156,
     rating: 4.9,
     image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
     color: "blue" as const,
   },
   {
     id: 2,
     title: "Physics Fundamentals",
     teacher: "Prof. Michael Chen",
     category: "Science",
     progress: 45,
     lessons: 18,
     students: 203,
     rating: 4.8,
     image: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
     color: "orange" as const,
   },
   {
     id: 3,
     title: "English Literature",
     teacher: "Ms. Emily Brown",
     category: "Languages",
     progress: 90,
     lessons: 20,
     students: 178,
     rating: 4.7,
     image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&q=80",
     color: "green" as const,
   },
   {
     id: 4,
     title: "Computer Science",
     teacher: "Mr. David Lee",
     category: "Technology",
     progress: 60,
     lessons: 32,
     students: 245,
     rating: 4.9,
     image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80",
     color: "purple" as const,
   },
   {
     id: 5,
     title: "World History",
     teacher: "Dr. James Miller",
     category: "History",
     progress: 30,
     lessons: 16,
     students: 134,
     rating: 4.6,
     image: "https://images.unsplash.com/photo-1461360370896-922624d12a74?w=400&q=80",
     color: "orange" as const,
   },
   {
     id: 6,
     title: "Biology & Life Sciences",
     teacher: "Dr. Lisa Anderson",
     category: "Science",
     progress: 55,
     lessons: 22,
     students: 189,
     rating: 4.8,
     image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&q=80",
     color: "green" as const,
   },
 ];
 
 const colorVariants = {
   blue: "from-primary/80 to-primary",
   orange: "from-accent/80 to-accent",
   green: "from-success/80 to-success",
   purple: "from-focus/80 to-focus",
 };
 
 const Courses = () => {
   return (
     <div className="min-h-screen bg-background bg-gradient-mesh">
       <Sidebar />
       
       <main className="ml-64 transition-all duration-300">
         <Header />
         
         <div className="p-6 space-y-6 animate-fade-in">
           {/* Page Header */}
           <div className="flex items-center justify-between">
             <div>
               <h2 className="text-3xl font-bold text-foreground">My Courses</h2>
               <p className="text-muted-foreground mt-1">Continue learning and track your progress</p>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Search courses..." className="pl-10 w-64" />
               </div>
               <Button variant="outline" className="gap-2">
                 <Filter className="h-4 w-4" />
                 Filter
               </Button>
             </div>
           </div>
 
           {/* Course Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {courses.map((course, index) => (
               <Card 
                 key={course.id} 
                 className="group overflow-hidden card-hover animate-slide-up"
                 style={{ animationDelay: `${index * 100}ms` }}
               >
                 {/* Course Image */}
                 <div className="relative h-40 overflow-hidden">
                   <img 
                     src={course.image} 
                     alt={course.title}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                   />
                   <div className={cn(
                     "absolute inset-0 bg-gradient-to-t opacity-60",
                     colorVariants[course.color]
                   )} />
                   
                   {/* Play Button Overlay */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button size="icon" className="h-14 w-14 rounded-full bg-white/90 hover:bg-white text-foreground shadow-2xl">
                       <Play className="h-6 w-6 ml-1" />
                     </Button>
                   </div>
                   
                   {/* Category Badge */}
                   <Badge className="absolute top-3 left-3 bg-white/90 text-foreground hover:bg-white">
                     {course.category}
                   </Badge>
                   
                   {/* Rating */}
                   <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-foreground">
                     <Star className="h-3 w-3 fill-warning text-warning" />
                     <span className="text-xs font-medium">{course.rating}</span>
                   </div>
                 </div>
                 
                 <CardContent className="p-5">
                   <h3 className="font-bold text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors">
                     {course.title}
                   </h3>
                   
                   <div className="flex items-center gap-2 mb-4">
                     <Avatar className="h-6 w-6">
                       <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${course.teacher}`} />
                       <AvatarFallback>{course.teacher.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                     </Avatar>
                     <span className="text-sm text-muted-foreground">{course.teacher}</span>
                   </div>
                   
                   {/* Stats */}
                   <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                     <div className="flex items-center gap-1">
                       <BookOpen className="h-4 w-4" />
                       <span>{course.lessons} lessons</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Users className="h-4 w-4" />
                       <span>{course.students}</span>
                     </div>
                   </div>
                   
                   {/* Progress */}
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Progress</span>
                       <span className="font-medium text-foreground">{course.progress}%</span>
                     </div>
                     <Progress value={course.progress} className="h-2" />
                   </div>
                   
                   <Button className="w-full mt-4 group/btn">
                     Continue Learning
                     <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                   </Button>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default Courses;