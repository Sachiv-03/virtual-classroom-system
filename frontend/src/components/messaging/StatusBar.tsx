import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Status } from "@/services/statusService";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

interface StatusBarProps {
    statuses: Status[];
    onOpenStatus: (index: number) => void;
    onAddStatus: () => void;
    currentUserId: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ statuses, onOpenStatus, onAddStatus, currentUserId }) => {
    // Group statuses by user
    const userStatuses = statuses.reduce((acc, status) => {
        const userId = status.userId._id;
        if (!acc[userId]) {
            acc[userId] = [];
        }
        acc[userId].push(status);
        return acc;
    }, {} as Record<string, Status[]>);

    const users = Object.keys(userStatuses);

    return (
        <div className="flex gap-4 p-4 overflow-x-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 border-b">
            {/* My Status Add Button */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative group cursor-pointer" onClick={onAddStatus}>
                    <Avatar className="h-14 w-14 ring-2 ring-background border-2 border-slate-200 dark:border-slate-800 transition-transform group-hover:scale-105">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=me`} />
                        <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1 border-2 border-background shadow-lg">
                        <Plus className="h-3 w-3" />
                    </div>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">My Status</span>
            </div>

            {/* Other Users' Statuses */}
            {users.map((userId, userIndex) => {
                const userStatusList = userStatuses[userId];
                const latestStatus = userStatusList[0];
                const hasUnviewed = userStatusList.some(s => !s.viewedBy.includes(currentUserId));

                return (
                    <div key={userId} className="flex flex-col items-center gap-1.5 shrink-0">
                        <div
                            className={cn(
                                "p-0.5 rounded-full ring-2 transition-all cursor-pointer hover:scale-105 active:scale-95",
                                hasUnviewed ? "ring-primary" : "ring-slate-300 dark:ring-slate-700"
                            )}
                            onClick={() => onOpenStatus(userIndex)}
                        >
                            <Avatar className="h-14 w-14 border-2 border-background">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${latestStatus.userId.name.replace(/\s/g, '')}`} />
                                <AvatarFallback>{latestStatus.userId.name[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <span className="text-[10px] font-bold truncate max-w-[64px] text-muted-foreground uppercase tracking-widest">{latestStatus.userId.name.split(' ')[0]}</span>
                    </div>
                );
            })}
        </div>
    );
};

interface StatusViewerProps {
    isOpen: boolean;
    onClose: () => void;
    userStatuses: Status[];
    currentUserId: string;
    onViewStatus: (id: string) => void;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({ isOpen, onClose, userStatuses, currentUserId, onViewStatus }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentStatus = userStatuses[currentIndex];

    React.useEffect(() => {
        if (isOpen && currentStatus && !currentStatus.viewedBy.includes(currentUserId)) {
            onViewStatus(currentStatus._id);
        }
    }, [currentIndex, isOpen, currentStatus]);

    if (!currentStatus) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg p-0 overflow-hidden bg-black border-none h-[80vh] flex flex-col">
                <div className="relative flex-1 group">
                    {/* Progress Bars */}
                    <div className="absolute top-0 left-0 right-0 p-3 flex gap-1 z-30">
                        {userStatuses.map((_, i) => (
                            <div key={i} className="h-1 bg-white/20 flex-1 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full bg-white transition-all duration-[5000ms] ease-linear",
                                        i < currentIndex ? "w-full" : i === currentIndex ? "w-full" : "w-0"
                                    )}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="absolute top-6 left-0 right-0 p-4 flex items-center justify-between z-30 bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-white/20">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStatus.userId.name.replace(/\s/g, '')}`} />
                                <AvatarFallback>{currentStatus.userId.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-white font-bold text-sm tracking-tight">{currentStatus.userId.name}</p>
                                <p className="text-white/60 text-[10px] uppercase font-black tracking-widest">
                                    {formatDistanceToNow(new Date(currentStatus.createdAt))} ago
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                        {currentStatus.contentType === 'text' ? (
                            <div className="p-12 text-center text-white text-2xl font-black italic max-w-sm leading-relaxed">
                                "{currentStatus.text}"
                            </div>
                        ) : (
                            <img
                                src={`http://localhost:5000${currentStatus.contentUrl}`}
                                alt="status"
                                className="h-full w-full object-contain"
                            />
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start p-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/20 text-white rounded-full h-12 w-12 hover:bg-black/40"
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                    </div>
                    <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end p-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/20 text-white rounded-full h-12 w-12 hover:bg-black/40"
                            onClick={() => {
                                if (currentIndex < userStatuses.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                } else {
                                    onClose();
                                }
                            }}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    </div>

                    {/* Captions */}
                    {currentStatus.contentType !== 'text' && currentStatus.text && (
                        <div className="absolute bottom-12 left-0 right-0 p-8 text-center bg-gradient-to-t from-black/80 to-transparent z-30">
                            <p className="text-white font-medium text-lg drop-shadow-lg">{currentStatus.text}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
