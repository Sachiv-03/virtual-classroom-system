import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Hand, Star, X } from "lucide-react";

interface Participant {
    id: string;
    name: string;
    isMuted: boolean;
    isVideoOff: boolean;
    hasRaisedHand: boolean;
    isHost?: boolean;
}

interface ParticipantsPanelProps {
    participants: Participant[];
    localParticipant: Participant;
    isHost: boolean;
    onClose: () => void;
    onMuteUser?: (userId: string) => void;
    onKickUser?: (userId: string) => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ participants, localParticipant, isHost, onClose, onMuteUser, onKickUser }) => {
    
    const allUsers = [localParticipant, ...participants];

    return (
        <div className="w-80 lg:w-[360px] flex-shrink-0 border-l border-white/10 bg-[#1c1c1c] text-white overflow-hidden flex flex-col shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.3)] z-30 transition-all h-full">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#252525]">
                <span className="font-bold text-sm tracking-wide">PEOPLE ({allUsers.length})</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 hover:text-white text-zinc-400" onClick={onClose}><X className="h-4 w-4"/></Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111]">
                {isHost && participants.length > 0 && (
                    <Button variant="outline" className="w-full mb-2 bg-[#222] border-white/10 text-white hover:bg-[#333]" onClick={() => onMuteUser && onMuteUser('all')}>
                        Mute All Users
                    </Button>
                )}

                {allUsers.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center shrink-0">
                                <span className="font-semibold text-teal-400">{p.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="font-medium text-sm truncate">{p.name} {p.id === localParticipant.id ? '(You)' : ''}</span>
                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                    {p.isHost ? <><Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/> Host</> : 'Participant'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {p.hasRaisedHand && <Hand className="w-4 h-4 text-yellow-500" />}
                            {p.isMuted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4 text-green-500" />}
                            
                            {isHost && p.id !== localParticipant.id && (
                                <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
                                   <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-white hover:bg-red-500" onClick={() => onKickUser && onKickUser(p.id)} title="Kick User">
                                     <X className="h-4 w-4" />
                                   </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
