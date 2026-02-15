import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Users, Video, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
 
 interface ClassCardProps {
   subject: string;
   teacher: string;
   teacherAvatar?: string;
   time: string;
   duration: string;
   students: number;
   isLive?: boolean;
   color: "blue" | "orange" | "green" | "purple";
 }
 
 const colorVariants = {
  blue: "from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40",
  orange: "from-accent/5 to-accent/10 border-accent/20 hover:border-accent/40",
  green: "from-success/5 to-success/10 border-success/20 hover:border-success/40",
  purple: "from-focus/5 to-focus/10 border-focus/20 hover:border-focus/40",
 };
 
 const accentColors = {
   blue: "bg-primary",
   orange: "bg-accent",
   green: "bg-success",
  purple: "bg-focus",
};

const iconBg = {
  blue: "bg-primary/10 text-primary",
  orange: "bg-accent/10 text-accent",
  green: "bg-success/10 text-success",
  purple: "bg-focus/10 text-focus",
 };
 
export function ClassCard({
  subject,
  teacher,
  teacherAvatar,
  time,
  duration,
  students,
  isLive,
  color,
}: ClassCardProps) {
  const navigate = useNavigate();

  const handleJoinClass = () => {
    if (isLive) {
      navigate("/live");
    }
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500 border bg-gradient-to-br",
      "hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]",
      colorVariants[color],
      isLive && "animate-glow-pulse"
    )}>
      {/* Accent line */}
      <div className={cn("absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-1.5", accentColors[color])} />
      
      {/* Floating decoration */}
      <div className={cn("absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40", accentColors[color])} />
      
       <CardHeader className="pb-2">
         <div className="flex items-start justify-between">
           <div>
            <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors">{subject}</h3>
             <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6 ring-2 ring-background">
                 <AvatarImage src={teacherAvatar} />
                <AvatarFallback className={cn("text-xs", iconBg[color])}>
                   {teacher.split(" ").map(n => n[0]).join("")}
                 </AvatarFallback>
               </Avatar>
               <span className="text-sm text-muted-foreground">{teacher}</span>
             </div>
           </div>
           {isLive && (
            <Badge className="bg-live text-live-foreground animate-pulse-live shadow-lg shadow-live/30">
              <span className="mr-1 animate-pulse">●</span> LIVE
             </Badge>
           )}
         </div>
       </CardHeader>
       <CardContent>
         <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", iconBg[color])}>
             <Clock className="h-4 w-4" />
             <span>{time}</span>
           </div>
           <div className="flex items-center gap-1">
             <span>{duration}</span>
           </div>
           <div className="flex items-center gap-1">
             <Users className="h-4 w-4" />
             <span>{students}</span>
           </div>
         </div>
        <Button 
          className={cn(
            "w-full group/btn transition-all duration-300",
            isLive 
              ? "bg-live hover:bg-live/90 shadow-lg shadow-live/20" 
              : "hover:translate-x-1"
          )} 
          variant={isLive ? "default" : "outline"}
          onClick={handleJoinClass}
        >
          <Video className="h-4 w-4 mr-2" />
          {isLive ? "Join Now" : "View Details"}
          <ArrowRight className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
        </Button>
       </CardContent>
     </Card>
   );
 }