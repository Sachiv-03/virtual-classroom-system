import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send, Smile, Paperclip, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  initials: string;
  message: string;
  timestamp: Date;
  isOwn?: boolean;
  isSystem?: boolean;
}

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "System",
    avatar: "",
    initials: "S",
    message: "Class started. Welcome everyone!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isSystem: true,
  },
  {
    id: "2",
    sender: "Dr. Sarah Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    initials: "SW",
    message: "Good morning class! Today we'll be covering advanced calculus concepts.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: "3",
    sender: "Alex Rivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    initials: "AR",
    message: "Excited for today's lesson! 📚",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    id: "4",
    sender: "Emily Wong",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    initials: "EW",
    message: "Will we be covering integration by parts?",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "5",
    sender: "Dr. Sarah Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    initials: "SW",
    message: "Yes Emily! That's exactly what we'll focus on today.",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: "6",
    sender: "You",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
    initials: "JS",
    message: "Thanks for the clarification!",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isOwn: true,
  },
];

interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: "You",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
      initials: "JS",
      message: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className={cn("flex flex-col bg-card border-l border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Class Chat</h3>
          <p className="text-xs text-muted-foreground">{messages.length} messages</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.isSystem ? (
                <div className="text-center">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {msg.message}
                  </span>
                </div>
              ) : (
                <div className={cn(
                  "flex gap-2",
                  msg.isOwn && "flex-row-reverse"
                )}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback className="text-xs">{msg.initials}</AvatarFallback>
                  </Avatar>
                  
                  <div className={cn(
                    "max-w-[80%]",
                    msg.isOwn && "text-right"
                  )}>
                    <div className={cn(
                      "flex items-baseline gap-2 mb-1",
                      msg.isOwn && "flex-row-reverse"
                    )}>
                      <span className="text-sm font-medium text-foreground">
                        {msg.sender}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div className={cn(
                      "rounded-2xl px-3 py-2 text-sm",
                      msg.isOwn 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted text-foreground rounded-tl-sm"
                    )}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <Smile className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button 
            size="icon" 
            className="h-8 w-8 flex-shrink-0"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
