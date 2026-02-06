import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { toast } from "sonner";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "gradient";
}

export function StatsCard({ icon: Icon, label, value, trend, trendUp, variant = "default" }: StatsCardProps) {
  return (
    <Card
      className={cn(
        "group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden cursor-pointer",
        variant === "gradient" && "bg-gradient-primary text-primary-foreground border-0"
      )}
      onClick={() => toast.info(`Viewing details for ${label}`)}
    >
      <CardContent className="p-5 relative">
        {/* Background decoration */}
        <div className={cn(
          "absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 transition-transform group-hover:scale-150",
          variant === "gradient" ? "bg-white" : "bg-primary"
        )} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110",
              variant === "gradient" ? "bg-white/20" : "bg-primary/10"
            )}>
              <Icon className={cn("h-5 w-5", variant === "gradient" ? "text-primary-foreground" : "text-primary")} />
            </div>
            <div>
              <p className={cn("text-sm", variant === "gradient" ? "text-primary-foreground/80" : "text-muted-foreground")}>{label}</p>
              <p className={cn("text-2xl font-bold", variant === "gradient" ? "text-primary-foreground" : "text-card-foreground")}>{value}</p>
            </div>
          </div>
          {trend && (
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              variant === "gradient"
                ? "bg-white/20 text-primary-foreground"
                : trendUp ? "bg-success/10 text-success" : "bg-live/10 text-live"
            )}>
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}