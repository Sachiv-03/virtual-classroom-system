import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Plus, Send, X, Paperclip, FileIcon, Check, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getConversations, getMessages, sendMessage, sendFileMessage, searchUsers, getSuggestedUsers } from "@/services/messageService";
import { useSocket } from "@/context/SocketContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";

interface UserInfo {
    _id: string;
    name: string;
    role: string;
}

interface Conversation {
    userId: string;
    name: string;
    role: string;
    latestMessage: string;
    timestamp: string;
    unread: boolean;
}

interface Message {
    _id: string;
    sender: string;
    receiver: string;
    content: string;
    createdAt: string;
    read: boolean;
    status?: 'sent' | 'delivered' | 'seen';
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
}

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [newMessage, setNewMessage] = useState("");

    // Search new users state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<UserInfo[]>([]);

    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { socket, onlineUsers } = useSocket();

    useEffect(() => {
        fetchConversations();
        fetchSuggestions();
    }, [user?.id]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data: any) => {
            // Emitting message_delivered since we received it successfully
            if (data.messageId && data.sender) {
                socket.emit('message_delivered', { messageId: data.messageId, senderId: data.sender });
            }

            // If viewing the current conversation
            setSelectedUser((prevSelected) => {
                if (prevSelected?.userId === data.sender) {

                    // Since we are viewing the chat currently, mark as seen
                    socket.emit('mark_seen', { senderId: data.sender, receiverId: user?.id, conversationId: data.conversationId });

                    setMessages((prev) => [...prev, {
                        _id: data.messageId || Date.now().toString(),
                        sender: data.sender,
                        receiver: data.receiverId,
                        content: data.content,
                        fileUrl: data.fileUrl,
                        fileName: data.fileName,
                        messageType: data.messageType,
                        createdAt: new Date().toISOString(),
                        read: true,
                        status: 'seen'
                    }]);
                    return prevSelected;
                }
                return prevSelected;
            });
            fetchConversations();
        };

        const handleMessageStatusUpdate = (data: any) => {
            setMessages((prev) => prev.map(msg =>
                msg._id === data.messageId ? { ...msg, status: data.status } : msg
            ));
        };

        const handleMessagesSeenUpdate = (data: any) => {
            setSelectedUser((prevSelected) => {
                if (prevSelected?.userId === data.viewerId) {
                    setMessages((prev) => prev.map(msg =>
                        msg.sender === user?.id ? { ...msg, status: 'seen' } : msg
                    ));
                }
                return prevSelected;
            });
            fetchConversations();
        };

        const handleUserTyping = (data: any) => {
            setSelectedUser((prevSelected) => {
                if (prevSelected?.userId === data.senderId) {
                    setIsTyping(true);
                }
                return prevSelected;
            });
        };

        const handleUserStopTyping = (data: any) => {
            setSelectedUser((prevSelected) => {
                if (prevSelected?.userId === data.senderId) {
                    setIsTyping(false);
                }
                return prevSelected;
            });
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("user_typing", handleUserTyping);
        socket.on("user_stop_typing", handleUserStopTyping);
        socket.on("message_status_update", handleMessageStatusUpdate);
        socket.on("messages_seen_update", handleMessagesSeenUpdate);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("user_typing", handleUserTyping);
            socket.off("user_stop_typing", handleUserStopTyping);
            socket.off("message_status_update", handleMessageStatusUpdate);
            socket.off("messages_seen_update", handleMessagesSeenUpdate);
        };
    }, [socket]);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.userId);
            setIsTyping(false);
            setNewMessage("");
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isTyping]);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            try {
                // If it's empty, backend now handles this and returns all valid users
                const results = await searchUsers(userSearchQuery);
                setSearchResults(results || []);
            } catch (e) {
                console.error(e);
                setSearchResults([]);
            }
        }, 150); // making debounce faster for better UX
        return () => clearTimeout(delaySearch);
    }, [userSearchQuery]);

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data || []);
        } catch (error) {
            toast.error("Failed to load conversations");
        }
    };

    const fetchSuggestions = async () => {
        try {
            const data = await getSuggestedUsers();
            setSuggestedUsers(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const data = await getMessages(userId);
            setMessages(data || []);

            // Mark conversation as read locally
            setConversations(prev => (prev || []).map(c =>
                c.userId === userId ? { ...c, unread: false } : c
            ));

            // Mark seen on the server for all unread messages in this conversation
            if (data && data.length > 0) {
                const conversationId = data[0].conversationId; // Get conversationId from the first message
                socket?.emit('mark_seen', { senderId: userId, receiverId: user?.id, conversationId });
            }
        } catch (error) {
            toast.error("Failed to load messages");
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const sentMsg = await sendMessage(selectedUser.userId, newMessage);
            setMessages([...messages, sentMsg]);

            // Clear typing state when message is sent
            socket?.emit("stop_typing", {
                receiverId: selectedUser.userId,
                senderId: user?.id
            });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            // Emit via socket
            socket?.emit("send_message", {
                messageId: sentMsg._id,
                conversationId: sentMsg.conversationId,
                receiverId: selectedUser.userId,
                sender: user?.id,
                content: newMessage,
                messageType: sentMsg.messageType || 'text',
                fileUrl: sentMsg.fileUrl,
                fileName: sentMsg.fileName
            });

            setNewMessage("");
            fetchConversations();
        } catch (error) {
            toast.error("Failed to send message");
        }
    };

    const startConversation = (u: UserInfo) => {
        // Find if exists
        const exists = conversations.find(c => c.userId === u._id);
        if (exists) {
            setSelectedUser(exists);
        } else {
            const newConv: Conversation = {
                userId: u._id,
                name: u.name,
                role: u.role,
                latestMessage: "Select to start sending messages",
                timestamp: new Date().toISOString(),
                unread: false
            };
            setConversations([newConv, ...conversations]);
            setSelectedUser(newConv);
        }
        setIsSearchOpen(false);
        setUserSearchQuery("");
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!socket || !selectedUser) return;

        socket.emit("typing", {
            receiverId: selectedUser.userId,
            senderId: user?.id
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop_typing", {
                receiverId: selectedUser.userId,
                senderId: user?.id
            });
        }, 2000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedUser) return;

        // Basic validation (~5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large (max 5MB)");
            return;
        }

        try {
            const sentMsg = await sendFileMessage(selectedUser.userId, file);
            setMessages([...messages, sentMsg]);

            socket?.emit("send_message", {
                messageId: sentMsg._id,
                conversationId: sentMsg.conversationId,
                receiverId: selectedUser.userId,
                sender: user?.id,
                content: sentMsg.content,
                messageType: sentMsg.messageType,
                fileUrl: sentMsg.fileUrl,
                fileName: sentMsg.fileName
            });

            fetchConversations();
        } catch (error) {
            toast.error("Failed to upload file");
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredConversations = (conversations || []).filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.latestMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Messages</h2>
                            <p className="text-muted-foreground">Communicate with your teachers and classmates</p>
                        </div>

                        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    New Message
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Start a conversation</DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Search for users by name or email to start a conversation with them.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={userSearchQuery}
                                        onChange={e => setUserSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {(searchResults || []).map((u) => (
                                            <div
                                                key={u._id}
                                                className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer"
                                                onClick={() => startConversation(u)}
                                            >
                                                <div className="relative">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{u.name?.[0] || '?'}</AvatarFallback>
                                                    </Avatar>
                                                    {onlineUsers.includes(u._id) && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{u.name || 'Unknown User'}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 capitalize">{u.role || 'User'}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {userSearchQuery && searchResults.length === 0 && (
                                            <div className="text-center text-sm text-muted-foreground p-4">No users found</div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                        {/* Conversation List */}
                        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
                            <CardHeader className="border-b px-4 py-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search conversations..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto">
                                {filteredConversations.length === 0 && !searchQuery ? (
                                    <div className="p-6">
                                        <div className="text-center text-sm text-muted-foreground mb-4">
                                            No conversations yet. Start chatting with:
                                        </div>
                                        <div className="space-y-2">
                                            {suggestedUsers.map(u => (
                                                <div
                                                    key={u._id}
                                                    className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer border"
                                                    onClick={() => startConversation(u)}
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{u.name?.[0] || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        {onlineUsers.includes(u._id) && (
                                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium leading-none">{u.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1 capitalize">{u.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {suggestedUsers.length === 0 && (
                                                <p className="text-center text-xs text-muted-foreground mt-4">No suggested contacts available.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <div
                                            key={conv.userId}
                                            className={`flex items-center gap-4 p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors ${conv.unread ? 'bg-primary/5' : ''} ${selectedUser?.userId === conv.userId ? 'border-l-4 border-l-primary bg-accent/30' : ''}`}
                                            onClick={() => setSelectedUser(conv)}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <Avatar>
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${(conv.name || 'user').replace(/\s/g, '')}`} />
                                                    <AvatarFallback>{conv.name?.[0] || '?'}</AvatarFallback>
                                                </Avatar>
                                                {onlineUsers.includes(conv.userId) && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className={`text-sm font-semibold truncate ${conv.unread ? 'text-foreground' : 'text-muted-foreground'}`}>{conv.name || 'Unknown User'}</h4>
                                                </div>
                                                <p className={`text-xs truncate ${conv.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                                    {conv.latestMessage || ''}
                                                </p>
                                            </div>
                                            {conv.unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Chat Window */}
                        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                            {selectedUser ? (
                                <>
                                    <CardHeader className="border-b px-6 py-4 flex flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar>
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${(selectedUser.name || 'user').replace(/\s/g, '')}`} />
                                                    <AvatarFallback>{selectedUser.name?.[0] || '?'}</AvatarFallback>
                                                </Avatar>
                                                {onlineUsers.includes(selectedUser.userId) && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold">{selectedUser.name || 'Unknown User'} <span className="text-xs font-normal text-muted-foreground ml-2 capitalize">({selectedUser.role || 'user'})</span></h3>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-6 overflow-y-auto space-y-4 bg-muted/20" ref={scrollRef}>
                                        {messages.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                                Say hello to {selectedUser.name || 'this user'}!
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isOwn = msg.sender === user?.id;
                                                return (
                                                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`p-3 rounded-2xl max-w-[70%] text-sm ${isOwn ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border rounded-tl-none shadow-sm'}`}>
                                                            {msg.messageType === 'image' && msg.fileUrl && (
                                                                <img
                                                                    src={(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '') + msg.fileUrl}
                                                                    alt={msg.fileName}
                                                                    className="max-w-full rounded-md mb-2 cursor-pointer object-cover"
                                                                    style={{ maxHeight: '250px' }}
                                                                    onClick={() => window.open((import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '') + msg.fileUrl, '_blank')}
                                                                />
                                                            )}
                                                            {msg.messageType === 'file' && msg.fileUrl && (
                                                                <a
                                                                    href={(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '') + msg.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 p-2 bg-background/20 rounded-md mb-2 underline"
                                                                >
                                                                    <FileIcon className="h-4 w-4" />
                                                                    <span className="truncate">{msg.fileName}</span>
                                                                </a>
                                                            )}
                                                            {msg.content}
                                                            <div className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'} flex justify-end items-center gap-1`}>
                                                                {formatTime(msg.createdAt)}
                                                                {isOwn && (
                                                                    <span>
                                                                        {msg.status === 'seen' ? (
                                                                            <CheckCheck className="h-3 w-3 text-blue-300" />
                                                                        ) : msg.status === 'delivered' ? (
                                                                            <CheckCheck className="h-3 w-3 text-white/70" />
                                                                        ) : (
                                                                            <Check className="h-3 w-3 text-white/70" />
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        {isTyping && (
                                            <div className="flex justify-start">
                                                <div className="p-4 rounded-2xl max-w-[70%] text-sm bg-card border rounded-tl-none shadow-sm flex space-x-1.5 items-center">
                                                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-4 border-t bg-card">
                                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                accept="image/*,.pdf,.doc,.docx"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full flex-shrink-0"
                                                onClick={() => fileInputRef.current?.click()}
                                                title="Attach a file"
                                            >
                                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                                            </Button>
                                            <Input
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-full px-4"
                                                value={newMessage}
                                                onChange={handleTyping}
                                            />
                                            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                                    <div className="p-6 rounded-full bg-muted mb-4">
                                        <Send className="h-12 w-12 opacity-20" />
                                    </div>
                                    <p className="text-lg font-medium">Select a conversation to start messaging</p>
                                    <p className="text-sm">Connect with your teachers and peers easily.</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Messages;
