import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Plus, Send, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getConversations, getMessages, sendMessage, searchUsers } from "@/services/messageService";
import { io, Socket } from "socket.io-client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        fetchConversations();

        // Initialize socket
        socketRef.current = io(SOCKET_URL, {
            withCredentials: true,
        });

        if (user?.id) {
            socketRef.current.emit("register", user.id);
        }

        socketRef.current.on("receive_message", (data: any) => {
            // If viewing the current conversation
            setSelectedUser((prevSelected) => {
                if (prevSelected?.userId === data.sender) {
                    setMessages((prev) => [...prev, {
                        _id: Date.now().toString(),
                        sender: data.sender,
                        receiver: data.receiverId,
                        content: data.content,
                        createdAt: new Date().toISOString(),
                        read: true
                    }]);
                    return prevSelected;
                }
                return prevSelected;
            });
            fetchConversations();
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user?.id]);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.userId);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (userSearchQuery.trim()) {
                try {
                    const results = await searchUsers(userSearchQuery);
                    setSearchResults(results);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [userSearchQuery]);

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            toast.error("Failed to load conversations");
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const data = await getMessages(userId);
            setMessages(data);

            // Mark conversation as read locally
            setConversations(prev => prev.map(c =>
                c.userId === userId ? { ...c, unread: false } : c
            ));
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

            // Emit via socket
            socketRef.current?.emit("send_message", {
                receiverId: selectedUser.userId,
                sender: user?.id,
                content: newMessage
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

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.latestMessage.toLowerCase().includes(searchQuery.toLowerCase())
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
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={userSearchQuery}
                                        onChange={e => setUserSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {searchResults.map((u) => (
                                            <div
                                                key={u._id}
                                                className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer"
                                                onClick={() => startConversation(u)}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 capitalize">{u.role}</p>
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
                                    <div className="p-6 text-center text-sm text-muted-foreground">
                                        No conversations yet. Click 'New Message' to start chatting.
                                    </div>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <div
                                            key={conv.userId}
                                            className={`flex items-center gap-4 p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors ${conv.unread ? 'bg-primary/5' : ''} ${selectedUser?.userId === conv.userId ? 'border-l-4 border-l-primary bg-accent/30' : ''}`}
                                            onClick={() => setSelectedUser(conv)}
                                        >
                                            <Avatar>
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.name.replace(/\s/g, '')}`} />
                                                <AvatarFallback>{conv.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className={`text-sm font-semibold truncate ${conv.unread ? 'text-foreground' : 'text-muted-foreground'}`}>{conv.name}</h4>
                                                </div>
                                                <p className={`text-xs truncate ${conv.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                                    {conv.latestMessage}
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
                                            <Avatar>
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name.replace(/\s/g, '')}`} />
                                                <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold">{selectedUser.name} <span className="text-xs font-normal text-muted-foreground ml-2 capitalize">({selectedUser.role})</span></h3>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-6 overflow-y-auto space-y-4 bg-muted/20" ref={scrollRef}>
                                        {messages.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                                Say hello to {selectedUser.name}!
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isOwn = msg.sender === user?.id;
                                                return (
                                                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`p-3 rounded-2xl max-w-[70%] text-sm ${isOwn ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card border rounded-tl-none'}`}>
                                                            {msg.content}
                                                            <div className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'} flex justify-end`}>
                                                                {formatTime(msg.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </CardContent>
                                    <div className="p-4 border-t bg-card">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <Input
                                                placeholder="Type your message..."
                                                className="flex-1"
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
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
