 import { Bell, Search } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 
 export function Header() {
   const today = new Date().toLocaleDateString("en-US", {
     weekday: "long",
     year: "numeric",
     month: "long",
     day: "numeric",
   });
 
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

   return (
    <header className="flex items-center justify-between p-6 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
       <div>
        <h1 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
          {greeting}, <span className="gradient-text">John!</span> 
          <span className="animate-float inline-block">👋</span>
         </h1>
         <p className="text-muted-foreground">{today}</p>
       </div>
 
       <div className="flex items-center gap-4">
        <div className="relative group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search courses, teachers..."
            className="pl-10 w-64 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all"
           />
         </div>
 
        <Button variant="outline" size="icon" className="relative hover:bg-primary/5 hover:border-primary/30 transition-all">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs animate-pulse">
             3
           </Badge>
         </Button>

        <Avatar className="h-10 w-10 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=student" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
       </div>
     </header>
   );
 }