import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Send, Megaphone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClassroomChatProps {
    roomId: string;
    currentUser: {
        id: string;
        name: string;
        role: string;
    };
}

interface Message {
    _id: string;
    sender: {
        id: string;
        name: string;
        role: string;
    };
    text: string;
    isAnnouncement: boolean;
    createdAt: string;
}

export const ClassroomChat: React.FC<ClassroomChatProps> = ({ roomId, currentUser }) => {
    const { socket } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        // Join the classroom discussion room
        socket.emit('join_room', { roomId });

        const handleMessageHistory = (history: Message[]) => {
            setMessages(history);
        };

        const handleReceiveMessage = (message: Message) => {
            setMessages((prev) => {
                // Prevent duplicate messages if rendered twice or echoed
                if (prev.find(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
        };

        socket.on('message_history', handleMessageHistory);
        socket.on('receive_classroom_message', handleReceiveMessage);

        return () => {
            socket.off('message_history', handleMessageHistory);
            socket.off('receive_classroom_message', handleReceiveMessage);
        };
    }, [socket, roomId]);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket) return;

        // Emit message to backend
        socket.emit('send_classroom_message', {
            roomId,
            sender: currentUser,
            text: inputText
        });

        setInputText("");
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Card className="flex flex-col h-full mt-4 sm:mt-0 shadow-lg border-2">
            <CardHeader className="bg-muted/50 py-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    Live Class Discussion
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-[400px] w-full p-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                            Welcome to the class chat. Be the first to say hello!
                            {currentUser.role === 'teacher' && (
                                <p className="mt-2 text-primary font-medium">Tip: Start a message with /announce to broadcast an announcement.</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, index) => {
                                const isOwn = msg.sender.id === currentUser.id;
                                return (
                                    <div key={msg._id || index} className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender.name}`} />
                                            <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {msg.sender.name} {msg.sender.role === 'teacher' && '👨‍🏫'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/70">{msg.createdAt ? formatTime(msg.createdAt) : 'Now'}</span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.isAnnouncement
                                                    ? 'bg-amber-100 dark:bg-amber-900 border-amber-300 border-2 font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2'
                                                    : isOwn
                                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                        : 'bg-muted border rounded-tl-none'
                                                }`}>
                                                {msg.isAnnouncement && <Megaphone className="w-4 h-4" />}
                                                <span className="break-words">{msg.text}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 border-t bg-muted/20">
                <form onSubmit={handleSendMessage} className="flex gap-2 w-full items-center">
                    <Input
                        placeholder={currentUser.role === 'teacher' ? "Send a message or /announce..." : "Type your message..."}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 rounded-full border-muted-foreground/20 focus-visible:ring-primary h-10"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!inputText.trim()} className="rounded-full h-10 w-10 shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};
