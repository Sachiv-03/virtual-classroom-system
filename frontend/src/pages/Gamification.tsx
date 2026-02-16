import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { XPProgressCard } from "@/components/gamification/XPProgressCard";
import { BadgesDisplay } from "@/components/gamification/BadgesDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { DailyQuests } from "@/components/gamification/DailyQuests";
import { AchievementDemo } from "@/components/gamification/AchievementToast";
import { Sparkles, Trophy, Target, Flame } from "lucide-react";

const quickStats = [
  { icon: Trophy, label: "Total XP", value: "12,450", color: "text-warning" },
  { icon: Target, label: "Quests Done", value: "48", color: "text-primary" },
  { icon: Flame, label: "Best Streak", value: "14 days", color: "text-accent" },
  { icon: Sparkles, label: "Badges", value: "12/24", color: "text-focus" },
];

const Gamification = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        <Header />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span className="gradient-text">Achievements & Rewards</span>
                <Sparkles className="h-6 w-6 text-warning animate-pulse" />
              </h1>
              <p className="text-muted-foreground">Track your progress and earn rewards</p>
            </div>
            <AchievementDemo />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - XP & Quests */}
            <div className="space-y-6">
              <XPProgressCard
                currentXP={2450}
                level={12}
                xpToNextLevel={3000}
              />
              <DailyQuests />
            </div>

            {/* Middle Column - Leaderboard */}
            <div>
              <Leaderboard />
            </div>

            {/* Right Column - Badges */}
            <div className="space-y-6">
              <BadgesDisplay />

              {/* Upcoming Rewards */}
              <div className="rounded-2xl bg-card border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-focus" />
                  Next Milestone
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Level 15</span>
                    <span className="text-sm font-medium text-foreground">550 XP away</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
                    <div className="p-2 rounded-lg bg-focus/20">
                      <Trophy className="h-5 w-5 text-focus" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Unlock "Prodigy" Badge</p>
                      <p className="text-xs text-muted-foreground">Rare achievement</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Gamification;
