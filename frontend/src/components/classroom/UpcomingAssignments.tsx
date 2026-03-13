import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: string;
}

interface UpcomingAssignmentsProps {
  assignments?: Assignment[];
}

export function UpcomingAssignments({ assignments = [] }: UpcomingAssignmentsProps) {
  const formatDueDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      // Set hours to 0 to compare days properly
      const dateNoTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowNoTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffTime = dateNoTime.getTime() - nowNoTime.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return "Overdue";
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Tomorrow";
      if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Upcoming Assignments
          </div>
          {assignments.length > 0 && (
            <Badge variant="outline" className="font-normal">
              {assignments.length} Total
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Inbox className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No upcoming assignments</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment._id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border/50 group"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {assignment.title}
                </p>
                <p className="text-xs text-muted-foreground">{assignment.subject}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold",
                    formatDueDate(assignment.dueDate) === "Overdue" ? "text-destructive" : "text-muted-foreground"
                  )}>
                    <Clock className="h-3 w-3" />
                    {formatDueDate(assignment.dueDate)}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60">
                    {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <Badge
                  variant={assignment.status === "submitted" ? "default" : "secondary"}
                  className={assignment.status === "submitted" 
                    ? "bg-success/20 text-success hover:bg-success/30 border-transparent text-[10px]" 
                    : "text-[10px]"}
                >
                  {assignment.status === "submitted" ? "Done" : "Pending"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}