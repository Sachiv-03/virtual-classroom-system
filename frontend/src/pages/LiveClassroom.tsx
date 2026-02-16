import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { VideoGrid, Participant } from "@/components/classroom/live/VideoGrid";
import { ChatPanel } from "@/components/classroom/live/ChatPanel";
import { ParticipantsList } from "@/components/classroom/live/ParticipantsList";
import { ControlBar } from "@/components/classroom/live/ControlBar";
import { ArrowLeft, Maximize, Grid3X3, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { toast } from "sonner";
import { markAttendance } from "@/services/attendanceService";
import { useAuth } from "@/context/AuthContext";

const mockParticipants: Participant[] = [
  {
    id: "1",
    name: "Dr. Sarah Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    initials: "SW",
    isMuted: false,
    isVideoOn: true,
    isHost: true,
    isSpeaking: true,
    isHandRaised: false,
    isScreenSharing: false,
  },
  {
    id: "2",
    name: "John Smith (You)",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
    initials: "JS",
    isMuted: true,
    isVideoOn: true,
    isHost: false,
    isSpeaking: false,
    isHandRaised: false,
  },
  {
    id: "3",
    name: "Alex Rivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    initials: "AR",
    isMuted: true,
    isVideoOn: true,
    isHost: false,
    isSpeaking: false,
    isHandRaised: true,
  },
  {
    id: "4",
    name: "Emily Wong",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    initials: "EW",
    isMuted: false,
    isVideoOn: false,
    isHost: false,
    isSpeaking: false,
    isHandRaised: false,
  },
  {
    id: "5",
    name: "Mike Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    initials: "MJ",
    isMuted: true,
    isVideoOn: true,
    isHost: false,
    isSpeaking: false,
    isHandRaised: false,
  },
  {
    id: "6",
    name: "Lisa Park",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    initials: "LP",
    isMuted: true,
    isVideoOn: false,
    isHost: false,
    isSpeaking: false,
    isHandRaised: true,
  },
];

const LiveClassroom = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);

  useEffect(() => {
    if (user) {
      setParticipants(prev => prev.map(p =>
        p.id === "2" ? { ...p, name: `${user.name} (You)`, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}` } : p
      ));
    }
  }, [user]);

  useEffect(() => {
    if (courseId) {
      markAttendance(courseId)
        .then(() => toast.success("Attendance marked successfully"))
        .catch(() => toast.error("Failed to mark attendance"));
    }
  }, [courseId]);

  // Control states
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // View states
  const [pinnedParticipant, setPinnedParticipant] = useState<string | undefined>("1");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePinParticipant = (id: string) => {
    setPinnedParticipant(prev => prev === id ? undefined : id);
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    if (!isScreenSharing) {
      // When starting screen share, pin self
      setParticipants(prev => prev.map(p => ({
        ...p,
        isScreenSharing: p.id === "2"
      })));
      setPinnedParticipant("2");
    } else {
      setParticipants(prev => prev.map(p => ({
        ...p,
        isScreenSharing: false
      })));
    }
  };

  const handleToggleHand = () => {
    setIsHandRaised(!isHandRaised);
    setParticipants(prev => prev.map(p =>
      p.id === "2" ? { ...p, isHandRaised: !p.isHandRaised } : p
    ));
  };

  const handleLeave = () => {
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-foreground">Advanced Mathematics</h1>
                <Badge className="bg-live text-live-foreground animate-pulse">
                  LIVE
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Dr. Sarah Wilson • Calculus II</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPinnedParticipant(undefined)}
            className={cn(!pinnedParticipant && "bg-muted")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
                setIsFullscreen(false);
              } else {
                document.documentElement.requestFullscreen();
                setIsFullscreen(true);
              }
            }}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <VideoGrid
          participants={participants}
          pinnedParticipant={pinnedParticipant}
          onPinParticipant={handlePinParticipant}
          screenShareActive={isScreenSharing}
        />

        {/* Side Panels */}
        {isChatOpen && (
          <ChatPanel className="w-80 flex-shrink-0" />
        )}

        {isParticipantsOpen && (
          <ParticipantsList
            participants={participants}
            className="w-72 flex-shrink-0"
          />
        )}

        {/* Control Bar */}
        <ControlBar
          isMuted={isMuted}
          isVideoOn={isVideoOn}
          isScreenSharing={isScreenSharing}
          isHandRaised={isHandRaised}
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          onToggleMute={() => setIsMuted(!isMuted)}
          onToggleVideo={() => setIsVideoOn(!isVideoOn)}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleHand={handleToggleHand}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
          onLeave={handleLeave}
          participantCount={participants.length}
          unreadMessages={3}
        />
      </div>
    </div>
  );
};

export default LiveClassroom;
