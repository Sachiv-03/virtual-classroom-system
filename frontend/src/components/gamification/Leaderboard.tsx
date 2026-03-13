import { cn } from "@/lib/utils";
import { Crown, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  initials: string;
  xp: number;
  level: number;
  trend: "up" | "down" | "same";
  trendValue?: number;
  isCurrentUser?: boolean;
}
interface LeaderboardProps {
  data?: LeaderboardEntry[];
  loading?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-warning fill-warning" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
  }
};

const getTrendIcon = (trend: "up" | "down" | "same", value?: number) => {
  if (trend === "up") {
    return (
      <div className="flex items-center gap-0.5 text-success">
        <TrendingUp className="h-3 w-3" />
        {value && <span className="text-xs">+{value}</span>}
      </div>
    );
  }
  if (trend === "down") {
    return (
      <div className="flex items-center gap-0.5 text-live">
        <TrendingDown className="h-3 w-3" />
        {value && <span className="text-xs">-{value}</span>}
      </div>
    );
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export function Leaderboard({ data = [], loading = false }: LeaderboardProps) {
  const displayData = data.length > 0 ? data : [];

  if (loading && displayData.length === 0) {
    return (
      <div className="p-8 text-center bg-card border rounded-xl animate-pulse">
        <Crown className="h-8 w-8 text-muted mx-auto mb-2" />
        <p className="text-muted-foreground">Loading ranks...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-focus/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Leaderboard</h3>
              <p className="text-xs text-muted-foreground">The community's top students</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Live Updates
          </div>
        </div>
      </div>

      {/* Top 3 Podium (Only show if we have enough data) */}
      {displayData.length >= 3 && (
        <div className="p-4 flex justify-center items-end gap-2 bg-gradient-to-b from-primary/5 to-transparent">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <Avatar className="h-12 w-12 ring-2 ring-slate-400">
              <AvatarImage src={displayData[1].avatar} />
              <AvatarFallback>{displayData[1].initials}</AvatarFallback>
            </Avatar>
            <div className="mt-1 w-16 h-12 bg-slate-200 dark:bg-slate-700 rounded-t-lg flex flex-col items-center justify-center">
              <Medal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold">2nd</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-warning animate-glow-pulse">
                <AvatarImage src={displayData[0].avatar} />
                <AvatarFallback>{displayData[0].initials}</AvatarFallback>
              </Avatar>
              <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 text-warning fill-warning" />
            </div>
            <div className="mt-1 w-16 h-16 bg-gradient-to-b from-warning/30 to-warning/10 rounded-t-lg flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-warning">1st</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <Avatar className={cn(
              "h-12 w-12 ring-2 ring-amber-600",
              displayData[2].isCurrentUser && "ring-primary ring-offset-2"
            )}>
              <AvatarImage src={displayData[2].avatar} />
              <AvatarFallback>{displayData[2].initials}</AvatarFallback>
            </Avatar>
            <div className="mt-1 w-16 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg flex flex-col items-center justify-center">
              <Medal className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-bold">3rd</span>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-border">
        {displayData.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "flex items-center gap-3 p-3 transition-colors hover:bg-muted/50",
              entry.isCurrentUser && "bg-primary/5 border-l-2 border-primary"
            )}
          >
            <div className="w-6 flex justify-center">
              {getRankIcon(entry.rank)}
            </div>

            <Avatar className={cn(
              "h-8 w-8",
              entry.isCurrentUser && "ring-2 ring-primary"
            )}>
              <AvatarImage src={entry.avatar} />
              <AvatarFallback>{entry.initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm truncate",
                entry.isCurrentUser && "text-primary"
              )}>
                {entry.name}
                {entry.isCurrentUser && <span className="text-xs ml-1">(You)</span>}
              </p>
              <p className="text-xs text-muted-foreground">Level {entry.level}</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-sm">{entry.xp.toLocaleString()}</p>
              <div className="flex justify-end">
                {getTrendIcon(entry.trend, entry.trendValue)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30 text-center">
        <button
          className="text-sm text-primary font-medium hover:underline"
          onClick={() => toast.info("Global Leaderboard feature coming soon!")}
        >
          View Full Leaderboard →
        </button>
      </div>
    </div>
  );
}
