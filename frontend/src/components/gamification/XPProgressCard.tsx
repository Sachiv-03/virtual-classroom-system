import { Star, TrendingUp, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface XPProgressCardProps {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  className?: string;
}

export function XPProgressCard({ 
  currentXP = 2450, 
  level = 12, 
  xpToNextLevel = 3000,
  className 
}: XPProgressCardProps) {
  const progress = (currentXP / xpToNextLevel) * 100;
  const xpNeeded = xpToNextLevel - currentXP;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-focus p-6 text-primary-foreground",
      className
    )}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white/20 animate-pulse" />
      </div>

      <div className="relative z-10">
        {/* Level Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 animate-glow-pulse">
                <span className="text-2xl font-bold">{level}</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
            </div>
            <div>
              <p className="text-sm text-white/70">Current Level</p>
              <p className="text-xl font-bold">Scholar</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-accent">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+350 today</span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{currentXP.toLocaleString()} XP</span>
            <span className="text-white/70">{xpToNextLevel.toLocaleString()} XP</span>
          </div>
          <div className="relative">
            <Progress 
              value={progress} 
              className="h-3 bg-white/20" 
            />
            <div 
              className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-accent to-warning transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-white/60 text-center">
            {xpNeeded.toLocaleString()} XP to Level {level + 1}
          </p>
        </div>
      </div>
    </div>
  );
}
