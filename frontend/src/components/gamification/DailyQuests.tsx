import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Gift, Clock, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  total: number;
  completed: boolean;
  expiresIn?: string;
}

const dailyQuests: Quest[] = [
  {
    id: "1",
    title: "Attend 2 Live Classes",
    description: "Join live sessions today",
    xpReward: 100,
    progress: 1,
    total: 2,
    completed: false,
  },
  {
    id: "2",
    title: "Complete 3 Assignments",
    description: "Submit your homework",
    xpReward: 150,
    progress: 3,
    total: 3,
    completed: true,
  },
  {
    id: "3",
    title: "Study for 1 Hour",
    description: "Use the focus timer",
    xpReward: 75,
    progress: 45,
    total: 60,
    completed: false,
    expiresIn: "4h left",
  },
  {
    id: "4",
    title: "Score 80%+ on Quiz",
    description: "Take any course quiz",
    xpReward: 200,
    progress: 0,
    total: 1,
    completed: false,
  },
];

export function DailyQuests() {
  const completedCount = dailyQuests.filter(q => q.completed).length;
  const totalXP = dailyQuests.reduce((sum, q) => sum + (q.completed ? q.xpReward : 0), 0);
  const potentialXP = dailyQuests.reduce((sum, q) => sum + q.xpReward, 0);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-focus/20">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Daily Quests</h3>
              <p className="text-xs text-muted-foreground">Reset in 8 hours</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10">
            <Sparkles className="h-3 w-3 text-success" />
            <span className="text-xs font-medium text-success">{totalXP}/{potentialXP} XP</span>
          </div>
        </div>

        {/* Overall progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Daily Progress</span>
            <span className="font-medium">{completedCount}/{dailyQuests.length}</span>
          </div>
          <Progress value={(completedCount / dailyQuests.length) * 100} className="h-2" />
        </div>
      </div>

      {/* Quest List */}
      <div className="divide-y divide-border">
        {dailyQuests.map((quest) => (
          <div
            key={quest.id}
            className={cn(
              "p-4 transition-colors",
              quest.completed ? "bg-success/5" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className="mt-0.5">
                {quest.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    "font-medium text-sm",
                    quest.completed && "line-through text-muted-foreground"
                  )}>
                    {quest.title}
                  </h4>
                  {quest.expiresIn && !quest.completed && (
                    <span className="flex items-center gap-0.5 text-xs text-warning">
                      <Clock className="h-3 w-3" />
                      {quest.expiresIn}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{quest.description}</p>

                {/* Quest Progress */}
                {!quest.completed && (
                  <div className="mt-2 space-y-1">
                    <Progress 
                      value={(quest.progress / quest.total) * 100} 
                      className="h-1.5" 
                    />
                    <p className="text-xs text-muted-foreground">
                      {quest.progress}/{quest.total} {quest.total > 10 ? "minutes" : "completed"}
                    </p>
                  </div>
                )}
              </div>

              {/* XP Reward */}
              <div className={cn(
                "flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold",
                quest.completed 
                  ? "bg-success/10 text-success" 
                  : "bg-accent/10 text-accent"
              )}>
                +{quest.xpReward} XP
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bonus Reward */}
      <div className="p-4 border-t border-border bg-gradient-to-r from-warning/5 to-accent/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-warning/20">
              <Gift className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium">Complete all quests</p>
              <p className="text-xs text-muted-foreground">Bonus reward unlocked!</p>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1.5 rounded-full font-bold text-sm",
            completedCount === dailyQuests.length
              ? "bg-warning text-warning-foreground animate-pulse"
              : "bg-muted text-muted-foreground"
          )}>
            +250 XP 🎁
          </div>
        </div>
      </div>
    </div>
  );
}
