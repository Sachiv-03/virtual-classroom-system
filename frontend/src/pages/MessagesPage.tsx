import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { Send, User as UserIcon, Clock } from "lucide-react";
import { getChatUsers, getConversation, sendMessage } from "@/services/messageService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserInfo {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    messageText: string;
    createdAt: string;
}

const MessagesPage = () => {
    const { user } = useAuth();
    const { socket, onlineUsers } = useSocket();

    const [chatUsers, setChatUsers] = useState<UserInfo[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch available users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getChatUsers();
                setChatUsers(data);
            } catch (error) {
                toast.error("Failed to load chat users");
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, []);

    // Fetch conversation when user is selected
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const data = await getConversation(selectedUser._id);
                setMessages(data);
            } catch (error) {
                toast.error("Failed to load conversation");
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [selectedUser]);

    // Setup Socket listener for new messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (incomingMsg: any) => {
            // Check if the message belongs to the currently active conversation window
            // If the sender of the incoming message is our currently selected user
            setSelectedUser((prevSelected) => {
                if (prevSelected?._id === incomingMsg.senderId) {
                    setMessages((prev) => [...prev, {
                        _id: Date.now().toString(),
                        senderId: incomingMsg.senderId,
                        receiverId: incomingMsg.receiverId,
                        messageText: incomingMsg.messageText,
                        createdAt: new Date().toISOString()
                    }]);
                } else {
                    // Optional: Show a toast or update unread badge for other users
                    toast(`New message from someone else`);
                }
                return prevSelected;
            });
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [socket]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessageText.trim() || !selectedUser) return;

        const currentText = newMessageText.trim();
        setNewMessageText(""); // optimistic clear

        try {
            const savedMessage = await sendMessage(selectedUser._id, currentText);

            // Append to local list instantly
            setMessages((prev) => [...prev, savedMessage]);

            // Emit to socket server so receiver gets it instantly
            if (socket) {
                socket.emit("send_message", {
                    senderId: user?.id,
                    receiverId: selectedUser._id,
                    messageText: currentText,
                    createdAt: savedMessage.createdAt
                });
            }

        } catch (error) {
            toast.error("Failed to send message");
            setNewMessageText(currentText); // revert text if failed
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 h-[calc(100vh-4rem)] flex flex-col pt-20">
                    <div className="mb-4">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Messages</h2>
                        <p className="text-muted-foreground">Chat with other users in real-time</p>
                    </div>

                    <div className="flex flex-1 gap-6 overflow-hidden">

                        {/* LEFT SIDEBAR: User List */}
                        <Card className="w-1/3 flex flex-col shadow-sm">
                            <CardHeader className="py-4 border-b">
                                <CardTitle className="text-lg">Contacts</CardTitle>
                                <CardDescription>Available students & teachers</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto flex-1">
                                {isLoadingUsers ? (
                                    <div className="p-4 text-center text-muted-foreground text-sm">Loading users...</div>
                                ) : chatUsers.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-sm">No users found</div>
                                ) : (
                                    <div className="divide-y">
                                        {chatUsers.map((u) => (
                                            <div
                                                key={u._id}
                                                onClick={() => setSelectedUser(u)}
                                                className={cn(
                                                    "p-4 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors",
                                                    selectedUser?._id === u._id ? "bg-accent border-l-4 border-primary" : ""
                                                )}
                                            >
                                                <div className="relative">
                                                    <Avatar>
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name.replace(/\s/g, '')}`} />
                                                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                                    </Avatar>
                                                    {/* Online indicator dot logic */}
                                                    {onlineUsers.includes(u._id) && (
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium leading-none truncate">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 capitalize">{u.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* RIGHT SIDEBAR: Chat Window */}
                        <Card className="flex-1 flex flex-col shadow-sm border overflow-hidden">
                            {selectedUser ? (
                                <>
                                    {/* Chat Header */}
                                    <CardHeader className="py-3 px-6 border-b bg-card/50 flex flex-row items-center gap-4 space-y-0">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name.replace(/\s/g, '')}`} />
                                            <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-base">{selectedUser.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {onlineUsers.includes(selectedUser._id) ? "Active Now" : "Offline"}
                                            </p>
                                        </div>
                                    </CardHeader>

                                    {/* Chat Messages */}
                                    <CardContent className="flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                                        {isLoadingMessages ? (
                                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                                Loading conversation...
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                                <MessageSquare className="h-8 w-8 opacity-20" />
                                                <p>No messages yet. Say hi!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, index) => {
                                                const isMyMessage = msg.senderId === user?.id;
                                                return (
                                                    <div
                                                        key={msg._id || index}
                                                        className={cn(
                                                            "flex w-full",
                                                            isMyMessage ? "justify-end" : "justify-start"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "max-w-[70%] px-4 py-2.5 rounded-2xl relative shadow-sm",
                                                                isMyMessage
                                                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                                                    : "bg-white dark:bg-slate-800 border rounded-bl-none"
                                                            )}
                                                        >
                                                            <p className="text-sm">{msg.messageText}</p>
                                                            <div
                                                                className={cn(
                                                                    "text-[10px] mt-1 flex items-center gap-1",
                                                                    isMyMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground justify-start"
                                                                )}
                                                            >
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(msg.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        {/* Invisible div to scroll to bottom */}
                                        <div ref={messagesEndRef} />
                                    </CardContent>

                                    {/* Message Input Field */}
                                    <div className="p-4 bg-card border-t">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <Input
                                                placeholder="Type your message..."
                                                className="flex-1 rounded-full px-4 border-slate-300 focus-visible:ring-primary"
                                                value={newMessageText}
                                                onChange={(e) => setNewMessageText(e.target.value)}
                                            />
                                            <Button
                                                type="submit"
                                                size="icon"
                                                disabled={!newMessageText.trim()}
                                                className="rounded-full shadow-sm"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <MessageSquare className="h-8 w-8 opacity-40" />
                                    </div>
                                    <p className="font-medium text-lg text-foreground">Your Messages</p>
                                    <p className="text-sm">Select a user to start a conversation.</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Extracted Lucide icon to avoid undefined error in JSX
import { MessageSquare } from "lucide-react";

export default MessagesPage;
