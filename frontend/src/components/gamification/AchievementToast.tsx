import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Star, Sparkles, Trophy, Zap, Flame } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: React.ElementType;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const rarityStyles = {
  common: {
    bg: "from-slate-500 to-slate-600",
    glow: "shadow-slate-500/30",
    text: "text-slate-100",
  },
  rare: {
    bg: "from-primary to-primary/80",
    glow: "shadow-primary/30",
    text: "text-primary-foreground",
  },
  epic: {
    bg: "from-focus to-focus/80",
    glow: "shadow-focus/30",
    text: "text-focus-foreground",
  },
  legendary: {
    bg: "from-warning via-accent to-warning",
    glow: "shadow-warning/50",
    text: "text-warning-foreground",
  },
};

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
  autoClose?: number;
}

export function AchievementToast({ achievement, onClose, autoClose = 5000 }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const Icon = achievement.icon;
  const styles = rarityStyles[achievement.rarity];

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto close
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform",
        isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-r p-1",
          styles.bg,
          styles.glow,
          "shadow-xl"
        )}
      >
        {/* Animated background sparkles for legendary */}
        {achievement.rarity === "legendary" && (
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles className="absolute top-2 left-4 w-4 h-4 text-white/40 animate-pulse" />
            <Sparkles className="absolute bottom-2 right-8 w-3 h-3 text-white/30 animate-pulse delay-150" />
            <Star className="absolute top-4 right-4 w-3 h-3 text-white/30 animate-float" />
          </div>
        )}

        <div className="relative bg-card/95 backdrop-blur-sm rounded-xl p-4">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br",
              styles.bg,
              "animate-glow-pulse"
            )}>
              <Icon className="h-7 w-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium text-warning uppercase tracking-wider">
                  Achievement Unlocked!
                </span>
              </div>
              <h4 className="font-bold text-foreground">{achievement.title}</h4>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
              
              {/* XP Reward */}
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10">
                <Zap className="h-3 w-3 text-accent" />
                <span className="text-xs font-bold text-accent">+{achievement.xpReward} XP</span>
              </div>
            </div>
          </div>

          {/* Progress bar animation */}
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-gradient-to-r rounded-full transition-all duration-[5000ms] ease-linear",
                styles.bg
              )}
              style={{ width: isVisible && !isLeaving ? "0%" : "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo component to show achievement notifications
export function AchievementDemo() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const demoAchievements: Achievement[] = [
    {
      id: "1",
      title: "Week Warrior",
      description: "Complete a 7-day learning streak",
      xpReward: 500,
      icon: Flame,
      rarity: "rare",
    },
    {
      id: "2",
      title: "Speed Learner",
      description: "Finish a lesson in under 5 minutes",
      xpReward: 150,
      icon: Zap,
      rarity: "common",
    },
    {
      id: "3",
      title: "Master Scholar",
      description: "Reach Level 20",
      xpReward: 2000,
      icon: Trophy,
      rarity: "legendary",
    },
  ];

  const triggerAchievement = () => {
    const randomAchievement = demoAchievements[Math.floor(Math.random() * demoAchievements.length)];
    setAchievements((prev) => [...prev, { ...randomAchievement, id: Date.now().toString() }]);
  };

  const removeAchievement = (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <>
      <button
        onClick={triggerAchievement}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        Trigger Achievement
      </button>

      {/* Stack of toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {achievements.map((achievement, index) => (
          <div 
            key={achievement.id} 
            style={{ transform: `translateY(${index * 10}px)` }}
          >
            <AchievementToast
              achievement={achievement}
              onClose={() => removeAchievement(achievement.id)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
