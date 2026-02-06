import { cn } from "@/lib/utils";
import { 
  Award, 
  BookOpen, 
  Clock, 
  Flame, 
  Target, 
  Trophy, 
  Zap, 
  Star,
  GraduationCap,
  Brain,
  Rocket,
  Crown
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  earned: boolean;
  earnedDate?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const badges: Badge[] = [
  {
    id: "first-class",
    name: "First Steps",
    description: "Attended your first class",
    icon: BookOpen,
    color: "text-success",
    bgColor: "bg-success/20",
    earned: true,
    earnedDate: "Jan 15",
    rarity: "common",
  },
  {
    id: "week-streak",
    name: "Week Warrior",
    description: "7-day learning streak",
    icon: Flame,
    color: "text-accent",
    bgColor: "bg-accent/20",
    earned: true,
    earnedDate: "Jan 22",
    rarity: "rare",
  },
  {
    id: "quick-learner",
    name: "Quick Learner",
    description: "Complete 5 lessons in one day",
    icon: Zap,
    color: "text-warning",
    bgColor: "bg-warning/20",
    earned: true,
    earnedDate: "Jan 28",
    rarity: "rare",
  },
  {
    id: "perfect-score",
    name: "Perfectionist",
    description: "Score 100% on any quiz",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/20",
    earned: true,
    earnedDate: "Feb 1",
    rarity: "epic",
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Study after midnight",
    icon: Clock,
    color: "text-focus",
    bgColor: "bg-focus/20",
    earned: true,
    earnedDate: "Feb 3",
    rarity: "common",
  },
  {
    id: "top-student",
    name: "Top Student",
    description: "Reach #1 on leaderboard",
    icon: Trophy,
    color: "text-warning",
    bgColor: "bg-warning/20",
    earned: false,
    rarity: "legendary",
  },
  {
    id: "brain-power",
    name: "Big Brain",
    description: "Complete 50 assignments",
    icon: Brain,
    color: "text-focus",
    bgColor: "bg-focus/20",
    earned: false,
    rarity: "epic",
  },
  {
    id: "graduate",
    name: "Graduate",
    description: "Complete all courses",
    icon: GraduationCap,
    color: "text-primary",
    bgColor: "bg-primary/20",
    earned: false,
    rarity: "legendary",
  },
];

const rarityColors = {
  common: "ring-muted-foreground/30",
  rare: "ring-primary/50",
  epic: "ring-focus/50",
  legendary: "ring-warning/50 animate-glow-pulse",
};

const rarityLabels = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export function BadgesDisplay() {
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-warning/10">
            <Award className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Badges</h3>
            <p className="text-xs text-muted-foreground">{earnedCount}/{badges.length} earned</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10">
          <Star className="h-3 w-3 text-warning fill-warning" />
          <span className="text-xs font-medium text-warning">+5 new</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "relative aspect-square rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ring-2",
                    badge.earned 
                      ? `${badge.bgColor} ${rarityColors[badge.rarity]} hover:scale-110` 
                      : "bg-muted ring-transparent opacity-40 grayscale"
                  )}
                >
                  <Icon className={cn(
                    "h-6 w-6 transition-transform",
                    badge.earned ? badge.color : "text-muted-foreground"
                  )} />
                  {badge.rarity === "legendary" && badge.earned && (
                    <Crown className="absolute -top-1 -right-1 h-4 w-4 text-warning fill-warning" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{badge.name}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      badge.rarity === "legendary" && "bg-warning/20 text-warning",
                      badge.rarity === "epic" && "bg-focus/20 text-focus",
                      badge.rarity === "rare" && "bg-primary/20 text-primary",
                      badge.rarity === "common" && "bg-muted text-muted-foreground"
                    )}>
                      {rarityLabels[badge.rarity]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {badge.earned && badge.earnedDate && (
                    <p className="text-xs text-success">Earned {badge.earnedDate}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
