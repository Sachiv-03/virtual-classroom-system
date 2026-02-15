import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { toast } from "sonner";


export function Header() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching for: ${searchQuery}`);
    }
  };

  const handleNotificationClick = () => {
    toast.success("You have 3 new notifications!");
  };

  return (
    <header className="flex items-center justify-between p-6 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
          {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || "Student"}!</span>
          <span className="animate-float inline-block">👋</span>
        </h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, teachers..."
            className="pl-10 w-64 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all focus:w-80 shadow-sm"
          />
        </form>

        <Button
          variant="outline"
          size="icon"
          className="relative hover:bg-primary/5 hover:border-primary/30 transition-all"
          id="notification-button"
          onClick={handleNotificationClick}
        >

          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs animate-pulse">
            3
          </Badge>
        </Button>

        <Avatar className="h-10 w-10 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all" id="user-avatar-button">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`} />
          <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}