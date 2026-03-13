import { Flame, Zap } from "lucide-react";
import { toast } from "sonner";

interface StreakCardProps {
  streak?: number;
  loginHistory?: string[];
}

export function StreakCard({ streak = 0, loginHistory = [] }: StreakCardProps) {
  const today = new Date();
  const weekDays = [];
  
  // Calculate last 7 days including today
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isToday = d.toDateString() === today.toDateString();
    const hasLogged = loginHistory.some(historyDate => 
      new Date(historyDate).toDateString() === d.toDateString()
    );
    weekDays.push({ day: dayName, active: hasLogged, isToday });
  }

  return (
    <div
      className="p-5 rounded-2xl bg-card border border-border cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
      onClick={() => toast.success(`You're on fire! ${streak} day streak!`)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/20">
            <Flame className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{streak} Day Streak!</p>
            <p className="text-xs text-muted-foreground">
              {streak > 0 ? "Keep it going!" : "Start your streak today!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10">
          <Zap className="h-3 w-3 text-accent" />
          <span className="text-xs font-medium text-accent">+{streak * 10} XP</span>
        </div>
      </div>

      <div className="flex justify-between gap-1">
        {weekDays.map((d, i) => (
          <div
            key={i}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${d.active
              ? "bg-accent text-accent-foreground shadow-sm"
              : "bg-muted text-muted-foreground"
              } ${d.isToday ? "ring-2 ring-accent ring-offset-2" : ""}`}
          >
            <span className="text-xs font-medium">{d.day}</span>
            {d.active ? <Flame className="h-3 w-3" /> : <div className="h-3" />}
          </div>
        ))}
      </div>
    </div>
  );
}