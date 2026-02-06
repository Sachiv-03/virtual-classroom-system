import { cn } from "@/lib/utils";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Hand, 
  Crown,
  MoreVertical,
  Search,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Participant } from "./VideoGrid";
import { useState } from "react";

interface ParticipantsListProps {
  participants: Participant[];
  className?: string;
}

export function ParticipantsList({ participants, className }: ParticipantsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hosts = filteredParticipants.filter(p => p.isHost);
  const students = filteredParticipants.filter(p => !p.isHost);
  const handsRaised = participants.filter(p => p.isHandRaised).length;

  return (
    <div className={cn("flex flex-col bg-card border-l border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Participants</h3>
            <Badge variant="secondary" className="text-xs">
              {participants.length}
            </Badge>
          </div>
          {handsRaised > 0 && (
            <Badge className="bg-warning text-warning-foreground animate-pulse">
              <Hand className="h-3 w-3 mr-1" />
              {handsRaised}
            </Badge>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Hosts Section */}
          {hosts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase tracking-wider">
                Hosts ({hosts.length})
              </p>
              <div className="space-y-1">
                {hosts.map(participant => (
                  <ParticipantRow key={participant.id} participant={participant} />
                ))}
              </div>
            </div>
          )}

          {/* Students Section */}
          {students.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase tracking-wider">
                Students ({students.length})
              </p>
              <div className="space-y-1">
                {students.map(participant => (
                  <ParticipantRow key={participant.id} participant={participant} />
                ))}
              </div>
            </div>
          )}

          {filteredParticipants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No participants found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-3 border-t border-border space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <MicOff className="h-4 w-4 mr-2" />
          Mute All Students
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Hand className="h-4 w-4 mr-2" />
          Lower All Hands
        </Button>
      </div>
    </div>
  );
}

function ParticipantRow({ participant }: { participant: Participant }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group",
      participant.isSpeaking && "bg-success/10"
    )}>
      <div className="relative">
        <Avatar className={cn(
          "h-9 w-9",
          participant.isSpeaking && "ring-2 ring-success"
        )}>
          <AvatarImage src={participant.avatar} />
          <AvatarFallback className="text-xs">{participant.initials}</AvatarFallback>
        </Avatar>
        {participant.isHost && (
          <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-warning">
            <Crown className="h-2.5 w-2.5 text-warning-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">
            {participant.name}
          </span>
          {participant.isHandRaised && (
            <Hand className="h-3.5 w-3.5 text-warning animate-bounce" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {participant.isHost ? "Host" : "Student"}
          {participant.isSpeaking && " • Speaking"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {participant.isMuted ? (
          <div className="p-1 rounded-full bg-live/10">
            <MicOff className="h-3.5 w-3.5 text-live" />
          </div>
        ) : (
          <div className="p-1 rounded-full bg-success/10">
            <Mic className="h-3.5 w-3.5 text-success" />
          </div>
        )}
        
        {participant.isVideoOn ? (
          <div className="p-1 rounded-full bg-success/10">
            <Video className="h-3.5 w-3.5 text-success" />
          </div>
        ) : (
          <div className="p-1 rounded-full bg-muted">
            <VideoOff className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
