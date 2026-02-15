import { cn } from "@/lib/utils";
import { Mic, MicOff, Pin, MoreVertical, Hand, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHost: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
  isPinned?: boolean;
  isScreenSharing?: boolean;
}

interface VideoGridProps {
  participants: Participant[];
  pinnedParticipant?: string;
  onPinParticipant: (id: string) => void;
  screenShareActive?: boolean;
}

export function VideoGrid({ participants, pinnedParticipant, onPinParticipant, screenShareActive }: VideoGridProps) {
  const pinnedUser = participants.find(p => p.id === pinnedParticipant);
  const otherParticipants = pinnedParticipant 
    ? participants.filter(p => p.id !== pinnedParticipant)
    : participants;

  // Dynamic grid sizing based on participant count
  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div className="flex-1 p-4 overflow-hidden">
      {screenShareActive || pinnedUser ? (
        // Spotlight layout
        <div className="h-full flex flex-col gap-3">
          {/* Main spotlight */}
          <div className="flex-1 min-h-0">
            <VideoTile 
              participant={pinnedUser || participants[0]} 
              isSpotlight 
              onPin={onPinParticipant}
              screenShareActive={screenShareActive && pinnedUser?.isScreenSharing}
            />
          </div>
          
          {/* Thumbnails */}
          {otherParticipants.length > 0 && (
            <div className="h-28 flex gap-2 overflow-x-auto pb-2">
              {otherParticipants.map(participant => (
                <div key={participant.id} className="w-40 flex-shrink-0">
                  <VideoTile 
                    participant={participant} 
                    isSmall 
                    onPin={onPinParticipant}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Grid layout
        <div className={cn(
          "h-full grid gap-3",
          getGridClass(participants.length)
        )}>
          {participants.map(participant => (
            <VideoTile 
              key={participant.id} 
              participant={participant} 
              onPin={onPinParticipant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface VideoTileProps {
  participant: Participant;
  isSpotlight?: boolean;
  isSmall?: boolean;
  onPin: (id: string) => void;
  screenShareActive?: boolean;
}

function VideoTile({ participant, isSpotlight, isSmall, onPin, screenShareActive }: VideoTileProps) {
  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden bg-sidebar group transition-all duration-300",
        isSpotlight ? "h-full" : "aspect-video",
        isSmall ? "h-full" : "",
        participant.isSpeaking && "ring-2 ring-success ring-offset-2 ring-offset-background",
        "hover:ring-2 hover:ring-primary/50"
      )}
    >
      {/* Video / Avatar placeholder */}
      {participant.isVideoOn && !screenShareActive ? (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-focus/20">
          {/* Simulated video feed */}
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}&backgroundColor=b6e3f4`}
            alt={participant.name}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      ) : screenShareActive ? (
        <div className="absolute inset-0 bg-sidebar flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-full max-w-2xl aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center border border-border">
              <div className="text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-2 text-primary animate-pulse" />
                <p className="font-medium">Screen Sharing Active</p>
                <p className="text-sm">Viewing {participant.name}'s screen</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-sidebar">
          <Avatar className={cn(
            "ring-2 ring-sidebar-border",
            isSpotlight ? "h-32 w-32" : isSmall ? "h-12 w-12" : "h-20 w-20"
          )}>
            <AvatarImage src={participant.avatar} />
            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
              {participant.initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Top badges */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <div className="flex gap-1">
          {participant.isHost && (
            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
              Host
            </Badge>
          )}
          {participant.isHandRaised && (
            <Badge className="bg-warning text-warning-foreground text-xs px-1.5 py-0.5 animate-pulse">
              <Hand className="h-3 w-3 mr-1" />
              Hand Raised
            </Badge>
          )}
        </div>
        
        {/* Pin button */}
        <button 
          onClick={() => onPin(participant.id)}
          className="p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        >
          <Pin className={cn("h-3 w-3", participant.isPinned && "fill-white")} />
        </button>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-white font-medium truncate",
            isSmall ? "text-xs" : "text-sm"
          )}>
            {participant.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {participant.isMuted ? (
            <div className="p-1 rounded-full bg-live/80">
              <MicOff className="h-3 w-3 text-white" />
            </div>
          ) : (
            <div className={cn(
              "p-1 rounded-full",
              participant.isSpeaking ? "bg-success" : "bg-black/40"
            )}>
              <Mic className={cn("h-3 w-3 text-white", participant.isSpeaking && "animate-pulse")} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
