 import { Sidebar } from "@/components/classroom/Sidebar";
 import { Header } from "@/components/classroom/Header";
 import { ClassCard } from "@/components/classroom/ClassCard";
 import { StatsCard } from "@/components/classroom/StatsCard";
 import { UpcomingAssignments } from "@/components/classroom/UpcomingAssignments";
import { FocusTimer } from "@/components/classroom/FocusTimer";
import { StreakCard } from "@/components/classroom/StreakCard";
import { BookOpen, Clock, Trophy, Target } from "lucide-react";
 
 const classes = [
   {
     subject: "Advanced Mathematics",
     teacher: "Dr. Sarah Wilson",
     time: "9:00 AM",
     duration: "1h 30m",
     students: 28,
     isLive: true,
     color: "blue" as const,
   },
   {
     subject: "Physics 101",
     teacher: "Prof. Michael Chen",
     time: "11:00 AM",
     duration: "1h",
     students: 32,
     color: "orange" as const,
   },
   {
     subject: "English Literature",
     teacher: "Ms. Emily Brown",
     time: "2:00 PM",
     duration: "1h",
     students: 24,
     color: "green" as const,
   },
   {
     subject: "Computer Science",
     teacher: "Mr. David Lee",
     time: "4:00 PM",
     duration: "1h 30m",
     students: 20,
     color: "purple" as const,
   },
 ];
 
 const Index = () => {
   return (
    <div className="min-h-screen bg-background bg-gradient-mesh">
       <Sidebar />
       
       {/* Main Content */}
       <main className="ml-64 transition-all duration-300">
         <Header />
         
         <div className="p-6 space-y-6 animate-fade-in">
           {/* Stats Row */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <StatsCard
               icon={BookOpen}
               label="Enrolled Courses"
               value={8}
               trend="2 new"
               trendUp
              variant="gradient"
             />
             <StatsCard
               icon={Clock}
               label="Hours Learned"
               value="124"
               trend="+12 this week"
               trendUp
             />
             <StatsCard
               icon={Trophy}
               label="Assignments Done"
               value="45/52"
               trend="86%"
               trendUp
             />
             <StatsCard
              icon={Target}
              label="Focus Score"
              value="92%"
              trend="+5%"
              trendUp
             />
           </div>
 
           {/* Today's Classes */}
           <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Today's Classes</h2>
              <span className="text-sm text-muted-foreground">4 classes scheduled</span>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {classes.map((classItem, index) => (
                 <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                   <ClassCard {...classItem} />
                 </div>
               ))}
             </div>
           </div>
 
           {/* Bottom Section */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
               <UpcomingAssignments />
             </div>
             
            {/* Focus & Productivity */}
             <div className="space-y-4">
              <FocusTimer />
              <StreakCard />
             </div>
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default Index;
