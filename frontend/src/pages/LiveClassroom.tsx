import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClassroomChat } from "@/components/classroom/ClassroomChat";
import { ArrowLeft, Users, GraduationCap, Video, ExternalLink, Mic, MicOff, PhoneOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { markAttendance, leaveAttendance } from "@/services/attendanceService";
import { getCourseById } from "@/services/courseService";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";

const LiveClassroom = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [course, setCourse] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const attendanceMarkedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Join socket room and track participants
  useEffect(() => {
    if (!socket || !courseId) return;

    socket.emit("join_room", { roomId: courseId });

    socket.on("room_participant_count", (count: number) => {
      setParticipantCount(count);
    });

    socket.on("online_users", (users: string[]) => {
      // Use online count as a proxy for participants
      setParticipantCount(Math.max(1, users.length));
    });

    return () => {
      socket.off("room_participant_count");
      socket.off("online_users");
    };
  }, [socket, courseId]);

  // Fetch course & mark attendance
  useEffect(() => {
    if (courseId && courseId !== 'default' && courseId.length > 5) {
      getCourseById(courseId)
        .then(data => setCourse(data))
        .catch(err => console.error("Failed to fetch course details", err));

      if (!attendanceMarkedRef.current) {
        attendanceMarkedRef.current = true;
        markAttendance(courseId)
          .then(() => toast.success("Attendance marked successfully ✅"))
          .catch((err) => {
            if (err?.response?.status !== 429) {
              toast.error("Failed to mark attendance");
            }
          });
      }

      // Start elapsed timer
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (courseId && courseId !== 'default') {
          leaveAttendance(courseId).catch(console.error);
        }
      };
    }
  }, [courseId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const handleJoinMeet = () => {
    const meetLink = course?.meetLink ||
      course?.schedule?.[0]?.meetLink;
    if (meetLink && !meetLink.includes('mock')) {
      window.open(meetLink, '_blank');
    } else {
      toast.info("No live Google Meet link available for this class yet.");
    }
  };

  const handleLeave = async () => {
    if (courseId && courseId !== 'default' && courseId.length > 5) {
      try { await leaveAttendance(courseId); } catch (e) { console.error(e); }
    }
    navigate("/");
  };

  const meetLink = course?.meetLink || course?.schedule?.[0]?.meetLink;
  const hasRealMeetLink = meetLink && !meetLink.includes('mock');

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-foreground">{course?.title || "Live Class"}</h1>
                <Badge className="bg-red-500 text-white animate-pulse text-xs">● LIVE</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {course?.teacher || "Instructor"} • {course?.category || "Class"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Session timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm font-mono">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatTime(elapsed)}</span>
          </div>
          {/* Participant count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{participantCount} online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Class Panel */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-8 gap-6">
          {/* Course Card */}
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            {/* Top gradient */}
            <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-accent" />
            <div className="p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 mx-auto">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{course?.title || "Loading..."}</h2>
                <p className="text-muted-foreground mt-1">{course?.description || "Live interactive class session"}</p>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground py-2 border-y border-border">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{participantCount} participants online</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(elapsed)} elapsed</span>
                </div>
              </div>

              {hasRealMeetLink ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Your class is live on Google Meet. Click below to join.
                  </p>
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    onClick={handleJoinMeet}
                  >
                    <Video className="h-5 w-5" />
                    Join Live Class on Google Meet
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                  <p className="text-xs text-muted-foreground break-all">
                    {meetLink}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">
                      ⏳ No Google Meet link has been set for this class yet.
                      The teacher will add one when the session is scheduled.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => toast.info("Meet link not yet available — check back soon!")}
                  >
                    <Video className="h-5 w-5 text-muted-foreground" />
                    Waiting for Meet Link...
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full px-8 gap-2 font-semibold"
              onClick={handleLeave}
            >
              <PhoneOff className="h-5 w-5" />
              Leave Class
            </Button>
          </div>
        </div>

        {/* Right: Chat Panel */}
        {isChatOpen && user && (
          <div className="w-80 flex-shrink-0 border-l bg-card overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
              <span className="font-semibold text-sm">Class Chat</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsChatOpen(false)}>✕</Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ClassroomChat
                roomId={courseId || 'default'}
                currentUser={{
                  id: (user as any)._id || user.id,
                  name: user.name,
                  role: user.role
                }}
              />
            </div>
          </div>
        )}

        {!isChatOpen && (
          <Button
            variant="outline"
            className="absolute right-4 bottom-4 gap-2"
            onClick={() => setIsChatOpen(true)}
          >
            💬 Open Chat
          </Button>
        )}
      </div>
    </div>
  );
};

export default LiveClassroom;
