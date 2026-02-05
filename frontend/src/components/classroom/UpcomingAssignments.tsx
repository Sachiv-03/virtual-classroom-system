 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { FileText, Clock } from "lucide-react";
 
 const assignments = [
   {
     id: 1,
     title: "Physics Lab Report",
     subject: "Physics",
     dueDate: "Tomorrow",
     status: "pending",
   },
   {
     id: 2,
     title: "Essay on World War II",
     subject: "History",
     dueDate: "Feb 8",
     status: "pending",
   },
   {
     id: 3,
     title: "Calculus Problem Set",
     subject: "Mathematics",
     dueDate: "Feb 10",
     status: "submitted",
   },
 ];
 
 export function UpcomingAssignments() {
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <FileText className="h-5 w-5 text-primary" />
           Upcoming Assignments
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-3">
         {assignments.map((assignment) => (
           <div
             key={assignment.id}
             className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
           >
             <div>
               <p className="font-medium text-card-foreground">{assignment.title}</p>
               <p className="text-sm text-muted-foreground">{assignment.subject}</p>
             </div>
             <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 text-sm text-muted-foreground">
                 <Clock className="h-3 w-3" />
                 {assignment.dueDate}
               </div>
               <Badge
                 variant={assignment.status === "submitted" ? "default" : "secondary"}
                 className={assignment.status === "submitted" ? "bg-success" : ""}
               >
                 {assignment.status === "submitted" ? "Done" : "Pending"}
               </Badge>
             </div>
           </div>
         ))}
       </CardContent>
     </Card>
   );
 }