import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Hand, Users, MessageSquare } from "lucide-react";

interface ControlsProps {
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    isHandRaised: boolean;
    toggleAudio: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => void;
    toggleRaiseHand: () => void;
    handleLeave: () => void;
    toggleChat: () => void;
    toggleParticipants: () => void;
    unreadChatCount?: number;
}

export const Controls: React.FC<ControlsProps> = ({ 
    isMuted, isVideoOff, isScreenSharing, isHandRaised,
    toggleAudio, toggleVideo, toggleScreenShare, toggleRaiseHand, 
    handleLeave, toggleChat, toggleParticipants, unreadChatCount 
}) => {
    return (
        <div className="h-24 shrink-0 border-t border-white/10 bg-[#1a1a1a] flex items-center justify-center px-4 md:px-8 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] w-full gap-2 md:gap-4 flex-wrap pb-4 pt-4 md:pb-0 md:pt-0">
            <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl shrink-0 transition-all ${!isMuted && 'bg-[#333] hover:bg-[#444] text-white border border-white/5'}`}
                onClick={toggleAudio}
            >
                {isMuted ? <MicOff className="h-5 w-5 md:h-6 md:w-6" /> : <Mic className="h-5 w-5 md:h-6 md:w-6" />}
            </Button>
            
            <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="icon"
                className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl shrink-0 transition-all ${!isVideoOff && 'bg-[#333] hover:bg-[#444] text-white border border-white/5'}`}
                onClick={toggleVideo}
            >
                {isVideoOff ? <VideoOff className="h-5 w-5 md:h-6 md:w-6" /> : <Video className="h-5 w-5 md:h-6 md:w-6" />}
            </Button>

            <Button
                variant={isHandRaised ? "secondary" : "outline"}
                size="icon"
                className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl shrink-0 transition-all ${isHandRaised ? 'bg-yellow-500 hover:bg-yellow-600 border-none text-white' : 'bg-[#333] border-white/5 text-white hover:bg-[#444]'}`}
                onClick={toggleRaiseHand}
            >
                <Hand className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            
            <Button
                variant={isScreenSharing ? "secondary" : "outline"}
                className={`h-12 md:h-14 shrink-0 px-4 md:px-5 rounded-2xl transition-all ${isScreenSharing ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-[#333] text-white border-white/5 hover:bg-[#444]'}`}
                onClick={toggleScreenShare}
            >
                <MonitorUp className="h-5 w-5 md:h-6 md:w-6 md:mr-2" />
                <span className="hidden md:inline font-medium">{isScreenSharing ? "Stop Sharing" : "Present"}</span>
            </Button>

            <div className="w-px h-8 bg-white/10 mx-2 hidden lg:block"></div>

            <Button
                variant="outline"
                className="h-12 md:h-14 shrink-0 px-4 md:px-5 rounded-2xl bg-[#333] text-white border-white/5 hover:bg-[#444] relative"
                onClick={toggleParticipants}
            >
                <Users className="h-5 w-5 md:h-6 md:w-6 md:mr-2" />
                <span className="hidden md:inline font-medium">People</span>
            </Button>

            <Button
                variant="outline"
                className="h-12 md:h-14 shrink-0 px-4 md:px-5 rounded-2xl bg-[#333] text-white border-white/5 hover:bg-[#444] relative"
                onClick={toggleChat}
            >
                <MessageSquare className="h-5 w-5 md:h-6 md:w-6 md:mr-2" />
                <span className="hidden md:inline font-medium">Chat</span>
                {unreadChatCount ? (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                ): null}
            </Button>

            <div className="flex-1 min-w-[10px] md:min-w-[20px]"></div>

            <Button
                variant="destructive"
                className="h-12 md:h-14 shrink-0 px-6 md:px-8 rounded-2xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all"
                onClick={handleLeave}
            >
                <PhoneOff className="h-5 w-5 md:h-6 md:w-6 md:mr-2" />
                <span className="hidden md:inline">Leave</span>
            </Button>
        </div>
    );
};
