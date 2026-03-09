import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    callerName?: string;
    isIncoming: boolean;
    type: 'voice' | 'video';
    socket: any;
    remoteUserId: string;
    currentUserId: string;
    currentUserName: string;
    incomingSignal?: any;
}

export const CallModal: React.FC<CallModalProps> = ({
    isOpen, onClose, callerName, isIncoming, type, socket, remoteUserId, currentUserId, currentUserName, incomingSignal
}) => {
    const [isAccepted, setIsAccepted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
    const [isFullContent, setIsFullContent] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAccepted) {
            interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isAccepted]);

    const formatDuration = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (isOpen && !isIncoming) {
            startCall();
        }

        // Signaling handlers
        if (socket) {
            socket.on('call_accepted', async (signal: any) => {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
                    setIsAccepted(true);
                }
            });

            socket.on('ice_candidate', async (candidate: any) => {
                if (peerConnection.current) {
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error("Error adding received ice candidate", e);
                    }
                }
            });

            socket.on('call_ended', () => {
                cleanup();
                onClose();
            });
        }

        return () => {
            if (socket) {
                socket.off('call_accepted');
                socket.off('ice_candidate');
                socket.off('call_ended');
            }
            cleanup();
        };
    }, [isOpen]);

    const setupPeerConnection = async () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice_candidate', { to: remoteUserId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        });
        localStream.current = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnection.current = pc;
        return pc;
    };

    const startCall = async () => {
        const pc = await setupPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call_user', {
            to: remoteUserId,
            from: currentUserId,
            fromName: currentUserName,
            signalData: offer,
            type
        });
    };

    const acceptCall = async (incomingSignal: any) => {
        setIsAccepted(true);
        const pc = await setupPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer_call', {
            to: remoteUserId,
            signalData: answer
        });
    };

    const cleanup = () => {
        localStream.current?.getTracks().forEach(track => track.stop());
        peerConnection.current?.close();
        peerConnection.current = null;
        localStream.current = null;
        setIsAccepted(false);
        setCallDuration(0);
    };

    const handleEndCall = () => {
        socket.emit('end_call', { to: remoteUserId });
        cleanup();
        onClose();
    };

    const toggleMute = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks()[0].enabled = isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream.current && type === 'video') {
            localStream.current.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
            <DialogContent className={cn(
                "p-0 overflow-hidden border-none shadow-2xl transition-all duration-500",
                type === 'video' && isAccepted ? "w-screen h-screen max-w-none rounded-none" : "max-w-md rounded-3xl"
            )}>
                <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center min-h-[400px]">

                    {/* Background Visual for Voice/Pending */}
                    {(!isAccepted || isVideoOff) && (
                        <div className="absolute inset-0 z-0">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-slate-950 opacity-50" />
                            <div className="absolute inset-0 backdrop-blur-3xl" />
                        </div>
                    )}

                    {/* Remote Video */}
                    {isAccepted && type === 'video' && (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className={cn(
                                "w-full h-full object-cover z-10",
                                isVideoOff && "hidden"
                            )}
                        />
                    )}

                    {/* Caller/Recipient Info (Visible when no video) */}
                    {(!isAccepted || isVideoOff || type === 'voice') && (
                        <div className="z-20 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="relative">
                                <Avatar className="h-32 w-32 ring-4 ring-primary/20 shadow-2xl">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${callerName?.replace(/\s/g, '')}`} />
                                    <AvatarFallback>{callerName?.[0]}</AvatarFallback>
                                </Avatar>
                                {isAccepted && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white shadow-lg animate-pulse">
                                        Connected
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-white tracking-tight">{callerName}</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                                    {isAccepted ? formatDuration(callDuration) : (isIncoming ? `Incoming ${type} call...` : `Calling ${callerName}...`)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Local Video Thumbnail */}
                    {isAccepted && type === 'video' && (
                        <div className="absolute top-6 right-6 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-30 transition-all hover:scale-105 group bg-slate-900">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded text-[8px] text-white font-bold uppercase">You</div>
                        </div>
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute bottom-10 left-0 right-0 z-40 flex flex-col items-center gap-6">
                        {isIncoming && !isAccepted ? (
                            <div className="flex gap-12 animate-in slide-in-from-bottom-10 duration-500">
                                <Button
                                    size="lg"
                                    className="h-20 w-20 rounded-full bg-destructive hover:bg-destructive/90 shadow-2xl shadow-destructive/20 active:scale-90 transition-transform"
                                    onClick={handleEndCall}
                                >
                                    <PhoneOff className="h-8 w-8 text-white rotate-[135deg]" />
                                </Button>
                                <Button
                                    size="lg"
                                    className="h-20 w-20 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 active:scale-95 transition-transform"
                                    onClick={() => acceptCall(incomingSignal)}
                                >
                                    <Phone className="h-8 w-8 text-white animate-bounce-short" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 px-8 py-4 bg-slate-900/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all hover:bg-slate-900/80">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-12 w-12 rounded-full transition-all",
                                        isMuted ? "bg-red-500 text-white hover:bg-red-600" : "text-slate-300 hover:bg-white/10"
                                    )}
                                    onClick={toggleMute}
                                >
                                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                </Button>

                                {type === 'video' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-12 w-12 rounded-full transition-all",
                                            isVideoOff ? "bg-red-500 text-white hover:bg-red-600" : "text-slate-300 hover:bg-white/10"
                                        )}
                                        onClick={toggleVideo}
                                    >
                                        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                    </Button>
                                )}

                                <div className="w-[1px] h-6 bg-white/10 mx-2" />

                                <Button
                                    size="icon"
                                    className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 active:scale-90 transition-transform"
                                    onClick={handleEndCall}
                                >
                                    <PhoneOff className="h-6 w-6 text-white" />
                                </Button>

                                <div className="w-[1px] h-6 bg-white/10 mx-2" />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-full text-slate-300 hover:bg-white/10"
                                    onClick={() => setIsFullContent(!isFullContent)}
                                >
                                    {isFullContent ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>

            <style>{`
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-short {
                    animation: bounce-short 1s infinite;
                }
            `}</style>
        </Dialog>
    );
};
