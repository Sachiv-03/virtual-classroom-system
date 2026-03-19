import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClassroomChat } from "@/components/classroom/ClassroomChat";
import { ArrowLeft, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { markAttendance, leaveAttendance } from "@/services/attendanceService";
import { getCourseById } from "@/services/courseService";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import Peer, { Instance as PeerInstance } from "simple-peer";

// Import UI sub-components
import { VideoTile, RemoteVideo, Controls, ParticipantsPanel } from "@/components/classroom/meet";

interface PeerObj {
    peerID: string; 
    peer: PeerInstance;
    userName: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    hasRaisedHand?: boolean;
    isHost?: boolean;
}

const LiveClassroom = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    
    // UI States
    const [course, setCourse] = useState<any>(null);
    const [elapsed, setElapsed] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [joined, setJoined] = useState(false);
    
    // Pinned View State. If null, use Grid view
    const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);

    // WebRTC / Media States
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<PeerObj[]>([]);
    
    // Local User States
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(true); 
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    
    // Auth & Room Context
    const isHost = user?.role === 'teacher' || user?.role === 'admin';

    // Refs
    const attendanceMarkedRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const peersRef = useRef<PeerObj[]>([]);

    useEffect(() => {
        if (courseId && courseId !== 'default' && courseId.length > 5) {
            getCourseById(courseId)
                .then(data => setCourse(data))
                .catch(err => console.error("Failed to fetch course details", err));
        }
    }, [courseId]);

    // Initial Media Request Lobby
    useEffect(() => {
        const initDeviceAccess = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                setLocalStream(stream);
                setIsVideoOff(false);
            } catch (err) {
                console.warn("Camera failed, trying microphone only", err);
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setLocalStream(audioStream);
                    setIsVideoOff(true); 
                } catch (audioErr) {
                    toast.error("Microphone access denied. Participating as view-only.");
                    setIsVideoOff(true);
                    setIsMuted(true);
                }
            }
        };
        initDeviceAccess();
        
        return () => {
            if (localStream) localStream.getTracks().forEach(track => track.stop());
            peersRef.current.forEach(p => p.peer.destroy());
        };
    }, []);

    const updatePeerState = (peerId: string, updates: Partial<PeerObj>) => {
        const index = peersRef.current.findIndex(p => p.peerID === peerId);
        if (index !== -1) {
            peersRef.current[index] = { ...peersRef.current[index], ...updates };
            setPeers([...peersRef.current]);
        }
    };

    // User Session Handlers
    const handleJoinMeeting = async () => {
        if (!attendanceMarkedRef.current && courseId && courseId !== 'default') {
            attendanceMarkedRef.current = true;
            try {
                await markAttendance(courseId);
                toast.success("Joined Class");
            } catch (e: any) { }
        }
        setJoined(true);
    };

    const handleLeave = async (forced = false) => {
        if (courseId && courseId !== 'default' && courseId.length > 5 && !forced) {
            try { await leaveAttendance(courseId); } catch (e) { }
        }
        if (socket) socket.emit("leave_meeting", courseId);
        
        peersRef.current.forEach(pd => pd.peer.destroy());
        if (localStream) localStream.getTracks().forEach(track => track.stop());

        navigate("/");
    };

    // Helpers to Create / Add Peers
    const createPeer = (userToSignal: string, callerID: string, stream: MediaStream | null, callerName: string) => {
        const peer = new Peer({ initiator: true, trickle: false, stream: stream || undefined });
        peer.on("signal", signal => {
            if (socket) socket.emit("sending_signal", { userToSignal, callerID, callerName, signal });
        });
        return peer;
    };

    const addPeer = (incomingSignal: any, callerID: string, stream: MediaStream | null) => {
        const peer = new Peer({ initiator: false, trickle: false, stream: stream || undefined });
        peer.on("signal", signal => {
            if (socket) socket.emit("returning_signal", { signal, callerID, callerName: user?.name || "User" });
        });
        peer.signal(incomingSignal);
        return peer;
    };

    // Advanced Event Listeners (UI State Sync)
    useEffect(() => {
        if (!socket || !courseId) return;

        socket.on('peer_audio_toggled', ({ peerId, isMuted }) => updatePeerState(peerId, { isMuted }));
        socket.on('peer_video_toggled', ({ peerId, isVideoOff }) => updatePeerState(peerId, { isVideoOff }));
        socket.on('peer_hand_toggled', ({ peerId, isRaised }) => updatePeerState(peerId, { hasRaisedHand: isRaised }));
        
        socket.on('host_muted_you', () => {
             toast.error("You have been muted by the host.");
             if (localStream) {
                 localStream.getAudioTracks().forEach(t => t.enabled = false);
                 setIsMuted(true);
                 socket.emit('toggle_audio', { roomId: courseId, isMuted: true });
             }
        });

        socket.on('host_kicked_you', () => {
            toast.error("You have been removed from the session by the host.");
            handleLeave(true); // Forced leave
        });

        return () => {
            socket.off('peer_audio_toggled');
            socket.off('peer_video_toggled');
            socket.off('peer_hand_toggled');
            socket.off('host_muted_you');
            socket.off('host_kicked_you');
        };
    }, [socket, localStream, courseId]);

    // Signaling & Core Mesh Network Loop
    useEffect(() => {
        if (!socket || !joined || !courseId || !user) return;

        socket.emit("join_meeting", courseId, { id: (user as any)._id || user.id, name: user.name });
        timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);

        socket.on("all_users", (usersList: string[]) => {
            const peersArray: PeerObj[] = [];
            usersList.forEach(userID => {
                const peer = createPeer(userID, socket.id, localStream, user.name);
                const peerObj = {
                    peerID: userID,
                    peer,
                    userName: "Waiting..." 
                };
                peersRef.current.push(peerObj);
                peersArray.push(peerObj);
            });
            setPeers([...peersArray]);
        });

        socket.on("user_joined", (payload) => {
            toast.info(`${payload.callerName} joined`);
            const peer = addPeer(payload.signal, payload.callerID, localStream);
            const peerObj = {
                peerID: payload.callerID,
                peer,
                userName: payload.callerName,
                // New peers start implicitly with defaults until they emit toggles
                isMuted: false, 
                isVideoOff: false,
                hasRaisedHand: false
            };
            peersRef.current.push(peerObj);
            setPeers([...peersRef.current]);
            
            // Send our current statuses to the new user so they know our states
            socket.emit('toggle_audio', { roomId: courseId, isMuted });
            socket.emit('toggle_video', { roomId: courseId, isVideoOff });
            socket.emit('toggle_hand', { roomId: courseId, isRaised: isHandRaised });
        });

        socket.on("receiving_returned_signal", (payload) => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            if (item) {
                item.peer.signal(payload.signal);
                // Update their name from Waiting... to the actual name!
                if (payload.returnedName) {
                    item.userName = payload.returnedName;
                    setPeers([...peersRef.current]);
                }
            }
        });

        socket.on("user_left", (id) => {
            const peerObj = peersRef.current.find(p => p.peerID === id);
            if (peerObj) {
                peerObj.peer.destroy();
                toast.info(`${peerObj.userName !== "Waiting..." ? peerObj.userName : "A user"} left`);
            }
            if (pinnedParticipantId === id) setPinnedParticipantId(null);
            
            const newPeers = peersRef.current.filter(p => p.peerID !== id);
            peersRef.current = newPeers;
            setPeers(newPeers);
        });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            socket.off("all_users");
            socket.off("user_joined");
            socket.off("receiving_returned_signal");
            socket.off("user_left");
        };
    }, [socket, joined, courseId, localStream]);

    // Local Media Controls (Broadcasted via Sockets)
    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const muted = !audioTrack.enabled;
                setIsMuted(muted);
                if (joined) socket?.emit('toggle_audio', { roomId: courseId, isMuted: muted });
            }
        }
    };

    const toggleVideo = async () => {
        if (!localStream) return;
        let videoTrack = localStream.getVideoTracks()[0];
        
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            const off = !videoTrack.enabled;
            setIsVideoOff(off);
            if (joined) socket?.emit('toggle_video', { roomId: courseId, isVideoOff: off });
        } else if (isVideoOff) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = stream.getVideoTracks()[0];
                localStream.addTrack(newVideoTrack);
                peersRef.current.forEach(p => p.peer.addTrack(newVideoTrack, localStream));
                setIsVideoOff(false);
                if (joined) socket?.emit('toggle_video', { roomId: courseId, isVideoOff: false });
            } catch (err) {
                toast.error("Could not start camera.");
            }
        }
    };

    const toggleScreenShare = async () => {
         if (!isScreenSharing) {
             try {
                 const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true } as any);
                 const screenTrack = screenStream.getVideoTracks()[0];
                 screenTrack.onended = () => stopScreenShare();

                 if (localStream) {
                     const videoTrack = localStream.getVideoTracks()[0];
                     if (videoTrack) {
                         peersRef.current.forEach(p => p.peer.replaceTrack(videoTrack, screenTrack, localStream));
                     } else {
                         peersRef.current.forEach(p => p.peer.addTrack(screenTrack, localStream));
                     }
                 }
                 const newStream = new MediaStream([screenTrack]);
                 if (localStream) {
                      const audioTrack = localStream.getAudioTracks()[0];
                      if(audioTrack) newStream.addTrack(audioTrack);
                 }
                 setLocalStream(newStream);
                 setIsScreenSharing(true);
             } catch (err) { }
         } else {
             stopScreenShare();
         }
    };

    const stopScreenShare = async () => {
         try {
             if (!isVideoOff) {
                 const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                 const videoTrack = stream.getVideoTracks()[0];
                 
                 if (localStream) {
                     const oldVideoTrack = localStream.getVideoTracks()[0];
                     peersRef.current.forEach(p => {
                         if (oldVideoTrack) p.peer.replaceTrack(oldVideoTrack, videoTrack, localStream);
                     });
                 }
                 setLocalStream(stream);
             } else {
                 const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                 setLocalStream(audioStream);
             }
             setIsScreenSharing(false);
         } catch (err) {
             setIsScreenSharing(false);
         }
    };

    const toggleRaiseHand = () => {
        const raised = !isHandRaised;
        setIsHandRaised(raised);
        if (socket && courseId) socket.emit('toggle_hand', { roomId: courseId, isRaised: raised });
    };

    // Participant Panel Handlers (Host Only features)
    const handleMuteUser = (targetId: string) => {
        if (socket && courseId && isHost) socket.emit('host_mute_user', { roomId: courseId, targetId });
    };

    const handleKickUser = (targetId: string) => {
         if (socket && courseId && isHost) socket.emit('host_kick_user', { roomId: courseId, targetId });
    };

    // Views Formatting
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const totalParticipants = peers.length + 1;
    const getGridCols = () => {
        if (pinnedParticipantId) return 'hidden'; // Hide grid if someone is spotlight pinned
        if (totalParticipants === 1) return 'grid-cols-1 max-w-5xl mx-auto';
        if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto';
        if (totalParticipants <= 4) return 'grid-cols-2';
        if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3';
        return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden relative">
            <header className="flex items-center justify-between px-4 py-3 bg-[#111] text-white shrink-0 z-10 relative shadow-sm border-b border-white/10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10" onClick={() => handleLeave(false)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-600">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-semibold">{course?.title || "Virtual Classroom"}</h1>
                                {joined && <Badge className="bg-red-500 hover:bg-red-600 border-none">LIVE</Badge>}
                            </div>
                        </div>
                    </div>
                </div>

                {joined && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(elapsed)}</span>
                        </div>
                    </div>
                )}
            </header>

            <div className="flex-1 flex overflow-hidden">
                {!joined ? (
                    // LOBBY VIEW
                    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 bg-zinc-950 overflow-y-auto w-full">
                        <div className="text-center mb-4">
                           <h2 className="text-3xl font-light tracking-wide text-white">Join Meeting</h2>
                           <p className="text-zinc-400 mt-2">Adjust your AV settings before joining the class.</p>
                        </div>
                        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-10 items-center justify-center">
                            
                            <div className="w-full lg:w-2/3 flex flex-col items-center">
                                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative border border-white/10">
                                    {localStream && !isVideoOff ? (
                                        <video autoPlay playsInline muted className="w-full h-full object-cover" ref={(v) => { if (v) v.srcObject = localStream; }} style={{ transform: 'scaleX(-1)' }} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full bg-zinc-900"><span className="text-4xl text-zinc-600">{user?.name?.charAt(0)}</span></div>
                                    )}
                                </div>
                                <div className="flex items-center justify-center w-full gap-4 mt-6">
                                    <Button variant={isMuted ? "destructive" : "secondary"} size="icon" className={`rounded-full w-12 h-12 shrink-0 ${!isMuted && 'bg-white/10 text-white'}`} onClick={toggleAudio}>
                                        <ArrowLeft className="hidden" /> 
                                    </Button>
                                    <Button variant={isVideoOff ? "destructive" : "secondary"} size="icon" className={`rounded-full w-12 h-12 shrink-0 ${!isVideoOff && 'bg-white/10 text-white'}`} onClick={toggleVideo}>
                                        <ArrowLeft className="hidden" />
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/3 flex flex-col items-center space-y-4">
                                <Button size="lg" className="w-full h-14 rounded-full text-lg font-semibold" onClick={handleJoinMeeting}>
                                    Join Now
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // ACTIVE MEETING
                    <div className="flex-1 flex flex-col bg-[#111] relative overflow-hidden">
                        
                        {/* PINNED SPOTLIGHT VIEW OVELAY */}
                        {pinnedParticipantId && (
                            <div className="flex-1 p-4 flex gap-4 h-full relative">
                                <div className="flex-[3] relative bg-black rounded-xl overflow-hidden w-full h-full ring-2 ring-primary">
                                    {pinnedParticipantId === socket?.id ? (
                                        <VideoTile stream={isVideoOff ? null : localStream} name={user?.name || "You"} isLocal={true} isPinned onPin={() => setPinnedParticipantId(null)} />
                                    ) : (
                                        <RemoteVideo 
                                            key={`pinned-${pinnedParticipantId}`} 
                                            peer={peers.find(p => p.peerID === pinnedParticipantId)?.peer!} 
                                            name={peers.find(p => p.peerID === pinnedParticipantId)?.userName || ""} 
                                            isPinned onPin={() => setPinnedParticipantId(null)} 
                                        />
                                    )}
                                </div>
                                <div className="flex-[1] flex flex-col gap-4 overflow-y-auto p-2 border-l border-white/5 bg-[#181818]">
                                     {/* Side list view when Spotlight is active */}
                                     {pinnedParticipantId !== socket?.id && (
                                         <div className="h-48 shrink-0"><VideoTile stream={isVideoOff ? null : localStream} name="You" isLocal={true} onPin={() => setPinnedParticipantId(socket?.id!)} /></div>
                                     )}
                                     {peers.map(p => {
                                         if (p.peerID !== pinnedParticipantId) {
                                            return <div key={p.peerID} className="h-48 shrink-0"><RemoteVideo peer={p.peer} name={p.userName} isMuted={p.isMuted} isVideoOff={p.isVideoOff} hasRaisedHand={p.hasRaisedHand} onPin={() => setPinnedParticipantId(p.peerID)} /></div>;
                                         }
                                         return null;
                                     })}
                                </div>
                            </div>
                        )}

                        {/* NORMAL DYNAMIC GRID */}
                        {!pinnedParticipantId && (
                           <div className={`flex-1 p-4 grid gap-4 overflow-y-auto items-center justify-center content-center w-full ${getGridCols()}`}>
                               <VideoTile stream={isVideoOff ? null : localStream} name={user?.name || "You"} isLocal={true} isMuted={isMuted} hasRaisedHand={isHandRaised} onPin={() => setPinnedParticipantId(socket?.id!)} />
                               {peers.map((peerObj) => (
                                   <RemoteVideo key={peerObj.peerID} peer={peerObj.peer} name={peerObj.userName} isMuted={peerObj.isMuted} isVideoOff={peerObj.isVideoOff} hasRaisedHand={peerObj.hasRaisedHand} onPin={() => setPinnedParticipantId(peerObj.peerID)} />
                               ))}
                           </div>
                        )}

                        <Controls
                            isMuted={isMuted}
                            isVideoOff={isVideoOff}
                            isScreenSharing={isScreenSharing}
                            isHandRaised={isHandRaised}
                            toggleAudio={toggleAudio}
                            toggleVideo={toggleVideo}
                            toggleScreenShare={toggleScreenShare}
                            toggleRaiseHand={toggleRaiseHand}
                            handleLeave={() => handleLeave(false)}
                            toggleChat={() => setIsChatOpen(!isChatOpen)}
                            toggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
                        />
                    </div>
                )}

                {/* Drawers: Participants & Chat */}
                {joined && (
                   <div className="flex h-full z-30">
                     {isParticipantsOpen && (
                        <ParticipantsPanel
                            participants={peers.map(p => ({
                                id: p.peerID,
                                name: p.userName,
                                isMuted: p.isMuted || false,
                                isVideoOff: p.isVideoOff || false,
                                hasRaisedHand: p.hasRaisedHand || false,
                                isHost: p.isHost 
                            }))}
                            localParticipant={{ id: socket?.id || "local", name: user?.name || "You", isMuted, isVideoOff, hasRaisedHand: isHandRaised, isHost }}
                            isHost={isHost}
                            onClose={() => setIsParticipantsOpen(false)}
                            onMuteUser={handleMuteUser}
                            onKickUser={handleKickUser}
                        />
                     )}
                     {isChatOpen && user && (
                        <div className="w-80 border-l border-white/10 bg-[#1c1c1c] text-white flex flex-col shadow-2xl h-full transition-all">
                            <div className="px-5 py-4 border-b border-white/10 text-sm font-bold flex justify-between items-center bg-[#252525]">
                                MESSAGES <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-6 w-6 rounded-full hover:bg-white/10 text-white">✕</Button>
                            </div>
                            <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                               <ClassroomChat roomId={courseId || 'default'} currentUser={{ id: (user as any)._id || user.id, name: user.name, role: user.role }} />
                            </div>
                        </div>
                     )}
                   </div>
                )}
            </div>
        </div>
    );
};

export default LiveClassroom;
