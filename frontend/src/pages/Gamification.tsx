import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { XPProgressCard } from "@/components/gamification/XPProgressCard";
import { BadgesDisplay } from "@/components/gamification/BadgesDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { DailyQuests } from "@/components/gamification/DailyQuests";
import { AchievementDemo } from "@/components/gamification/AchievementToast";
import { Sparkles, Trophy, Target, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

import { getLeaderboard } from "@/services/dashboardService";

const Gamification = () => {
  const [profile, setProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, leaderboardRes] = await Promise.all([
          api.get('/auth/me'),
          getLeaderboard()
        ]);
        
        setProfile(profileRes.data?.data || profileRes.data);
        
        // Handle unwrapped vs wrapped leaderboard response
        const lbData = leaderboardRes?.data || leaderboardRes || [];
        setLeaderboard(lbData);
      } catch (err) {
        console.error('Failed to fetch gamification data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const badges = profile?.badges ?? [];
  // XP to next level: each level requires 100 XP
  const xpToNextLevel = level * 100;

  const quickStats = [
    { icon: Trophy, label: "Total XP", value: xp.toLocaleString(), color: "text-warning" },
    { icon: Target, label: "Badges Earned", value: `${badges.length}`, color: "text-primary" },
    { icon: Flame, label: "Current Level", value: `Lv. ${level}`, color: "text-accent" },
    { icon: Sparkles, label: "XP to Next Lv.", value: `${Math.max(0, xpToNextLevel - xp)}`, color: "text-focus" },
  ];

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
                      <p className="text-xl font-bold text-foreground">
                        {loading ? <span className="animate-pulse text-muted-foreground">...</span> : stat.value}
                      </p>
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
                currentXP={xp}
                level={level}
                xpToNextLevel={xpToNextLevel}
              />
              <DailyQuests />
            </div>

            {/* Middle Column - Leaderboard */}
            <div>
              <Leaderboard data={leaderboard} loading={loading} />
            </div>

            {/* Right Column - Badges */}
            <div className="space-y-6">
              {/* Live badges from DB */}
              {badges.length > 0 ? (
                <div className="rounded-2xl bg-card border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    Your Badges
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {badges.map((badge: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm font-medium"
                        title={`Earned: ${new Date(badge.earnedAt).toLocaleDateString()}`}
                      >
                        <span className="text-lg">{badge.icon}</span>
                        <span>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <BadgesDisplay />
              )}

              {/* Next Milestone */}
              <div className="rounded-2xl bg-card border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-focus" />
                  Next Milestone
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Level {level + 1}</span>
                    <span className="text-sm font-medium text-foreground">
                      {Math.max(0, xpToNextLevel - xp)} XP away
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((xp % 100) / 100) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
                    <div className="p-2 rounded-lg bg-focus/20">
                      <Trophy className="h-5 w-5 text-focus" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Mark attendance to earn +10 XP</p>
                      <p className="text-xs text-muted-foreground">Submit assignments to earn +50 XP</p>
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
