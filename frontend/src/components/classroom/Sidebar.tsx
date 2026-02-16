import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "My Courses", path: "/courses" },
  { icon: Trophy, label: "Achievements", path: "/achievements" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: FileText, label: "Assignments", path: "/assignments" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border" id="sidebar-logo">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg tracking-tight">EduClass</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-sidebar-accent",
              collapsed && "justify-center"
            )}
            activeClassName="bg-sidebar-accent text-sidebar-primary"
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
          collapsed && "justify-center"
        )} id="user-profile-summary">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Guest"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role || "user"}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            className="w-full mt-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
            id="logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-card border border-border shadow-md hover:bg-muted"
        onClick={() => setCollapsed(!collapsed)}
        id="sidebar-collapse-toggle"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-foreground" />
        )}
      </Button>
    </aside>
  );
}