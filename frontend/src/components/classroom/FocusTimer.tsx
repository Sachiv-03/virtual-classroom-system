 import { useState, useEffect } from "react";
 import { Play, Pause, RotateCcw, Target } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 export function FocusTimer() {
   const [time, setTime] = useState(25 * 60);
   const [isRunning, setIsRunning] = useState(false);
   const totalTime = 25 * 60;
   const progress = ((totalTime - time) / totalTime) * 100;
 
   useEffect(() => {
     let interval: NodeJS.Timeout;
     if (isRunning && time > 0) {
       interval = setInterval(() => setTime((t) => t - 1), 1000);
     }
     return () => clearInterval(interval);
   }, [isRunning, time]);
 
   const formatTime = (seconds: number) => {
     const m = Math.floor(seconds / 60);
     const s = seconds % 60;
     return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
   };
 
   return (
     <div className="relative p-6 rounded-2xl bg-gradient-focus text-primary-foreground overflow-hidden">
       {/* Animated background */}
       <div className="absolute inset-0 opacity-20">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-float" />
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }} />
       </div>
       
       <div className="relative z-10">
         <div className="flex items-center gap-2 mb-4">
           <Target className="h-5 w-5" />
           <span className="font-semibold">Focus Mode</span>
         </div>
         
         {/* Circular Progress */}
         <div className="relative w-32 h-32 mx-auto mb-4">
           <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
             <circle
               cx="50" cy="50" r="45"
               fill="none"
               stroke="currentColor"
               strokeWidth="6"
               className="opacity-20"
             />
             <circle
               cx="50" cy="50" r="45"
               fill="none"
               stroke="currentColor"
               strokeWidth="6"
               strokeLinecap="round"
               strokeDasharray={`${progress * 2.83} 283`}
               className="transition-all duration-300"
             />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-3xl font-bold tracking-tight">{formatTime(time)}</span>
           </div>
         </div>
         
         <div className="flex justify-center gap-2">
           <Button
             size="icon"
             variant="secondary"
             className="rounded-full bg-white/20 hover:bg-white/30 border-0"
             onClick={() => setIsRunning(!isRunning)}
           >
             {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
           </Button>
           <Button
             size="icon"
             variant="secondary"
             className="rounded-full bg-white/20 hover:bg-white/30 border-0"
             onClick={() => { setTime(25 * 60); setIsRunning(false); }}
           >
             <RotateCcw className="h-4 w-4" />
           </Button>
         </div>
       </div>
     </div>
   );
 }