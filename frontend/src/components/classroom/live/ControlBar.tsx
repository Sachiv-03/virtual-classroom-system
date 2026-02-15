import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Hand,
  MessageSquare,
  Users,
  Settings,
  PhoneOff,
  MoreVertical,
  Maximize,
  Grid3X3,
  Smile,
  Share2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ControlBarProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
  participantCount: number;
  unreadMessages?: number;
}

export function ControlBar({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isHandRaised,
  isChatOpen,
  isParticipantsOpen,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onToggleChat,
  onToggleParticipants,
  onLeave,
  participantCount,
  unreadMessages = 0,
}: ControlBarProps) {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left section - Meeting info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isRecording ? "bg-live animate-pulse" : "bg-success"
            )}>
            </div>
            <span className="text-sm font-medium text-foreground">
              {isRecording ? "Recording" : "Live"}
            </span>
            <span className="text-sm text-muted-foreground">• 45:23</span>
          </div>
        </div>

        {/* Center section - Main controls */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-lg">
          {/* Mic */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full transition-all",
                  isMuted && "bg-live hover:bg-live/90"
                )}
                onClick={onToggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? "Unmute" : "Mute"}
            </TooltipContent>
          </Tooltip>

          {/* Video */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoOn ? "secondary" : "destructive"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full transition-all",
                  !isVideoOn && "bg-live hover:bg-live/90"
                )}
                onClick={onToggleVideo}
              >
                {isVideoOn ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isVideoOn ? "Turn off camera" : "Turn on camera"}
            </TooltipContent>
          </Tooltip>

          {/* Screen Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full transition-all",
                  isScreenSharing && "bg-primary"
                )}
                onClick={onToggleScreenShare}
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenSharing ? "Stop sharing" : "Share screen"}
            </TooltipContent>
          </Tooltip>

          {/* Raise Hand */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHandRaised ? "default" : "secondary"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full transition-all",
                  isHandRaised && "bg-warning hover:bg-warning/90"
                )}
                onClick={onToggleHand}
              >
                <Hand className={cn("h-5 w-5", isHandRaised && "animate-bounce")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isHandRaised ? "Lower hand" : "Raise hand"}
            </TooltipContent>
          </Tooltip>

          {/* Reactions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reactions</TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-8 bg-border mx-1" />

          {/* Record */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Circle className={cn("h-4 w-4", isRecording && "fill-current animate-pulse")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRecording ? "Stop recording" : "Start recording"}
            </TooltipContent>
          </Tooltip>

          {/* Leave */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full bg-live hover:bg-live/90"
                onClick={onLeave}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave class</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section - Panel toggles */}
        <div className="flex items-center gap-2">
          {/* Chat Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isChatOpen ? "default" : "outline"}
                size="icon"
                className="h-10 w-10 rounded-full relative"
                onClick={onToggleChat}
              >
                <MessageSquare className="h-4 w-4" />
                {unreadMessages > 0 && !isChatOpen && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-live text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>

          {/* Participants Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isParticipantsOpen ? "default" : "outline"}
                size="icon"
                className="h-10 w-10 rounded-full relative"
                onClick={onToggleParticipants}
              >
                <Users className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
                  {participantCount}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Participants</TooltipContent>
          </Tooltip>

          {/* More Options */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
