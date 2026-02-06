import { Flame, Zap } from "lucide-react";
import { toast } from "sonner";

export function StreakCard() {
  const days = [
    { day: "M", active: true },
    { day: "T", active: true },
    { day: "W", active: true },
    { day: "T", active: true },
    { day: "F", active: false },
    { day: "S", active: false },
    { day: "S", active: false },
  ];

  return (
    <div
      className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
      onClick={() => toast.success("You're on fire! 4 day streak!")}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/20">
            <Flame className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground">4 Day Streak!</p>
            <p className="text-xs text-muted-foreground">Keep it going</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10">
          <Zap className="h-3 w-3 text-accent" />
          <span className="text-xs font-medium text-accent">+50 XP</span>
        </div>
      </div>

      <div className="flex justify-between gap-1">
        {days.map((d, i) => (
          <div
            key={i}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${d.active
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
              }`}
          >
            <span className="text-xs font-medium">{d.day}</span>
            {d.active && <Flame className="h-3 w-3" />}
          </div>
        ))}
      </div>
    </div>
  );
}