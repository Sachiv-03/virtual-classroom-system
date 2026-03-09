import { useState, useEffect, useRef, useMemo } from "react";
import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
    getChatUsers, getConversation, sendMessage, deleteMessage,
    reactToMessage, editMessage, toggleStarMessage, togglePinUser
} from "@/services/messageService";
import { getGroups, getGroupMessages, createGroup, addGroupMembers, removeGroupMember, leaveGroup, Group } from "@/services/groupService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Send, User as UserIcon, Clock, Paperclip, MoreVertical, Trash2, Check, CheckCheck,
    Smile, X, File as FileIcon, Image as ImageIcon, Reply, Edit2, Star, Forward, Search,
    Pin, PinOff, MessageSquare, Mic, Square, Plus, Trash, LogOut, Settings, Users,
    MapPin, Gift, Search as SearchIcon, Phone, Video
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CallModal } from "@/components/messaging/CallModal";

interface UserInfo {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface Reaction {
    emoji: string;
    userId: string;
}

interface Message {
    _id: string;
    senderId: any; // Can be string or populated UserInfo
    receiverId?: string;
    groupId?: string;
    messageText: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    status: 'sent' | 'delivered' | 'seen';
    isDeletedForEveryone: boolean;
    isEdited?: boolean;
    isForwarded?: boolean;
    reactions: Reaction[];
    replyTo?: Message | null;
    starredBy?: string[];
    createdAt: string;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const ROOT_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const MessagesPage = () => {
    const { user: currentUser, updateUser } = useAuth();
    const { socket, onlineUsers } = useSocket();

    const [chatUsers, setChatUsers] = useState<UserInfo[]>([]);
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessageText, setNewMessageText] = useState("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMemberSelection, setNewMemberSelection] = useState<string[]>([]);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [gifSearchTerm, setGifSearchTerm] = useState("");
    const [isSharingLocation, setIsSharingLocation] = useState(false);
    const [callConfig, setCallConfig] = useState<{
        isOpen: boolean;
        type: 'voice' | 'video';
        isIncoming: boolean;
        remoteUser: UserInfo | null;
        signalData?: any;
    }>({
        isOpen: false,
        type: 'voice',
        isIncoming: false,
        remoteUser: null
    });

    // Search states
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [messageSearchTerm, setMessageSearchTerm] = useState("");
    const [showMsgSearch, setShowMsgSearch] = useState(false);

    // Advanced features states
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

    // File/Voice state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch available users and groups on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, groupsData] = await Promise.all([
                    getChatUsers(),
                    getGroups()
                ]);
                setChatUsers(usersData || []);
                setUserGroups(groupsData || []);
            } catch (error) {
                toast.error("Failed to load contacts and groups");
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchData();
    }, []);

    // Filtered users for Sidebar search + Pinned Sorting
    const filteredUsers = useMemo(() => {
        const filtered = chatUsers.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()));
        return [...filtered].sort((a, b) => {
            // 1. Pinned first
            const aPinned = currentUser?.pinnedChatUsers?.includes(a._id) ? 1 : 0;
            const bPinned = currentUser?.pinnedChatUsers?.includes(b._id) ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;

            // 2. Online second
            const aOnline = onlineUsers.includes(a._id) ? 1 : 0;
            const bOnline = onlineUsers.includes(b._id) ? 1 : 0;
            if (aOnline !== bOnline) return bOnline - aOnline;

            return 0;
        });
    }, [chatUsers, userSearchTerm, currentUser?.pinnedChatUsers, onlineUsers]);

    // Filtered messages for internal chat search
    const filteredMessages = useMemo(() => {
        if (!messageSearchTerm) return messages;
        return messages.filter(m => m.messageText.toLowerCase().includes(messageSearchTerm.toLowerCase()));
    }, [messages, messageSearchTerm]);

    // Fetch conversation when user or group is selected
    useEffect(() => {
        if (!selectedUser && !selectedGroup) return;

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const data = selectedGroup
                    ? await getGroupMessages(selectedGroup._id)
                    : await getConversation(selectedUser!._id);

                setMessages(data);

                if (socket && data.length > 0) {
                    if (selectedUser) {
                        const haveUnseen = data.some((m: Message) => m.senderId === selectedUser._id && m.status !== 'seen');
                        if (haveUnseen) {
                            socket.emit("mark_seen", { senderId: selectedUser._id, receiverId: currentUser?.id });
                        }
                    }
                    // For groups, we could potentially highlight unread but detailed "seen" per member is Phase 3
                }
            } catch (error) {
                toast.error("Failed to load conversation");
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
        setReplyingTo(null);
        setEditingMessage(null);
        setMessageSearchTerm("");
    }, [selectedUser, selectedGroup, socket, currentUser?.id]);

    // Setup Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (incomingMsg: any) => {
            if (incomingMsg.groupId) {
                // If the message belongs to the current open group
                setSelectedGroup(prev => {
                    if (prev?._id === incomingMsg.groupId) {
                        setMessages(prevMsgs => [...prevMsgs, incomingMsg]);
                    } else {
                        toast(`New group message in ${incomingMsg.groupName || 'a group'}`);
                    }
                    return prev;
                });
            } else {
                setSelectedUser((prevSelected) => {
                    if (prevSelected?._id === incomingMsg.senderId) {
                        setMessages((prev) => [...prev, incomingMsg]);
                        socket.emit("mark_seen", { senderId: incomingMsg.senderId, receiverId: currentUser?.id });
                    } else {
                        toast(`New message from ${incomingMsg.senderName || 'someone'}`);
                        socket.emit("message_delivered", { messageId: incomingMsg._id, senderId: incomingMsg.senderId });
                    }
                    return prevSelected;
                });
            }
        };

        const handleStatusUpdate = ({ messageId, status }: { messageId: string; status: 'delivered' | 'seen' }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));
        };

        const handleSeenUpdate = ({ viewerId }: { viewerId: string }) => {
            setMessages(prev => prev.map(m =>
                (m.receiverId === viewerId && m.senderId === currentUser?.id) ? { ...m, status: 'seen' } : m
            ));
        };

        const handleDeletedSync = ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, isDeletedForEveryone: true, messageText: "This message was deleted.", fileUrl: undefined, fileType: 'none' } : m
            ));
        };

        const handleEditedSync = ({ messageId, messageText }: { messageId: string; messageText: string }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, messageText, isEdited: true } : m
            ));
        };

        const handleReactionSync = ({ messageId, reactions }: { messageId: string; reactions: Reaction[] }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("message_status_update", handleStatusUpdate);
        socket.on("messages_seen_update", handleSeenUpdate);
        socket.on("message_deleted_sync", handleDeletedSync);
        socket.on("message_edited_sync", handleEditedSync);
        socket.on("message_reaction_sync", handleReactionSync);

        socket.on("incoming_call", (data: any) => {
            // data: { from, name, signalData, type }
            setCallConfig({
                isOpen: true,
                type: data.type,
                isIncoming: true,
                remoteUser: { _id: data.from, name: data.name, email: '', role: '' },
                signalData: data.signalData
            });
        });

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("message_status_update", handleStatusUpdate);
            socket.off("messages_seen_update", handleSeenUpdate);
            socket.off("message_deleted_sync", handleDeletedSync);
            socket.off("message_edited_sync", handleEditedSync);
            socket.off("message_reaction_sync", handleReactionSync);
        };
    }, [socket, currentUser?.id]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Voice Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
                setSelectedFile(file);
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            toast.error("Microphone access denied. Please allow microphone permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessageText.trim() && !selectedFile) || (!selectedUser && !selectedGroup)) return;

        const currentText = newMessageText.trim();
        const currentFile = selectedFile;
        const currentReplyTo = replyingTo?._id;
        const currentForwarding = !!forwardingMessage;

        let fileType = 'none';
        if (currentFile) {
            if (currentFile.type.startsWith('image/')) fileType = 'image';
            else if (currentFile.type.startsWith('video/')) fileType = 'video';
            else if (currentFile.type.startsWith('audio/')) fileType = 'audio';
            else fileType = 'document';
        }

        if (editingMessage) {
            try {
                const updated = await editMessage(editingMessage._id, currentText);
                setMessages(prev => prev.map(m => m._id === editingMessage._id ? updated : m));
                socket?.emit("edit_message_event", {
                    messageId: editingMessage._id,
                    receiverId: selectedUser?._id,
                    groupId: selectedGroup?._id,
                    messageText: currentText
                });
                setEditingMessage(null);
                setNewMessageText("");
                return;
            } catch (e) {
                toast.error("Failed to edit message");
                return;
            }
        }

        setNewMessageText("");
        setSelectedFile(null);
        setReplyingTo(null);
        setForwardingMessage(null);

        try {
            // Using a slightly modified sendMessage or internal logic here
            // For now, let's assume we update the service for group support
            const savedMessage = await sendMessage(
                selectedGroup ? "" : selectedUser!._id,
                currentText,
                currentFile,
                fileType,
                currentReplyTo,
                currentForwarding,
                selectedGroup?._id
            );
            setMessages((prev) => [...prev, savedMessage]);

            if (socket) {
                socket.emit("send_message", savedMessage);
            }
        } catch (error) {
            toast.error("Failed to send message");
            setNewMessageText(currentText);
            setSelectedFile(currentFile);
        }
    };

    const handleDelete = async (messageId: string, type: 'me' | 'everyone') => {
        try {
            await deleteMessage(messageId, type);
            if (type === 'everyone') {
                setMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, isDeletedForEveryone: true, messageText: "This message was deleted.", fileUrl: undefined, fileType: 'none' } : m
                ));
                socket?.emit('delete_message_event', { messageId, receiverId: selectedUser?._id });
            } else {
                setMessages(prev => prev.filter(m => m._id !== messageId));
            }
        } catch (e) {
            toast.error("Failed to delete message");
        }
    };

    const handleReact = async (messageId: string, emoji: string) => {
        try {
            const upToDateMsg = await reactToMessage(messageId, emoji);
            setMessages(prev => prev.map(m => m._id === messageId ? upToDateMsg : m));
            socket?.emit("message_reaction_event", {
                messageId,
                receiverId: selectedUser?._id,
                groupId: selectedGroup?._id,
                reactions: upToDateMsg.reactions
            });
        } catch (e) {
            toast.error("Failed to react to message");
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedGroupMembers.length === 0) {
            toast.error("Provide a name and select members");
            return;
        }
        try {
            const group = await createGroup(newGroupName, "Classroom Group", selectedGroupMembers);
            setUserGroups(prev => [group, ...prev]);
            setIsCreatingGroup(false);
            setNewGroupName("");
            setSelectedGroupMembers([]);
            toast.success("Group created!");

            // Join the new socket room
            socket?.emit("join_group", group._id);
        } catch (e) {
            toast.error("Failed to create group");
        }
    };

    const handleLeaveGroup = async () => {
        if (!selectedGroup) return;
        try {
            await leaveGroup(selectedGroup._id);
            setUserGroups(prev => prev.filter(g => g._id !== selectedGroup._id));
            setSelectedGroup(null);
            setIsGroupInfoOpen(false);
            toast.success("Left group successfully");
            socket?.emit("leave_group", selectedGroup._id);
        } catch (e) {
            toast.error("Failed to leave group");
        }
    };

    const handleAddMembersToGroup = async () => {
        if (!selectedGroup || newMemberSelection.length === 0) return;
        try {
            const updated = await addGroupMembers(selectedGroup._id, newMemberSelection);
            setUserGroups(prev => prev.map(g => g._id === selectedGroup._id ? updated : g));
            setSelectedGroup(updated);
            setIsAddingMember(false);
            setNewMemberSelection([]);
            toast.success("Members added!");

            // Optionally notify them via socket if we had a per-user join notify
        } catch (e) {
            toast.error("Failed to add members");
        }
    };

    const handleShareLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsSharingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                const locationText = `📍 My current location: ${locationUrl}`;

                try {
                    const result = await sendMessage(
                        selectedUser?._id || "",
                        locationText,
                        null,
                        'text',
                        null,
                        false,
                        selectedGroup?._id
                    );
                    setMessages(prev => [...prev, result]);
                    socket?.emit('send_message', result);
                    toast.success("Location shared!");
                } catch (e) {
                    toast.error("Failed to share location");
                } finally {
                    setIsSharingLocation(false);
                }
            },
            (error) => {
                toast.error("Failed to get location: " + error.message);
                setIsSharingLocation(false);
            }
        );
    };

    const handleSendGif = async (url: string) => {
        try {
            const result = await sendMessage(
                selectedUser?._id || "",
                "Sent a GIF",
                null, // file handled differently or just send URL as text/meta
                'text', // or 'gif'
                null,
                false,
                selectedGroup?._id
            );
            // We can append the URL to the message text or use a separate field
            // For now, let's just make the message text the URL
            result.messageText = url;

            setMessages(prev => [...prev, result]);
            socket?.emit('send_message', result);
            setIsGifPickerOpen(false);
        } catch (e) {
            toast.error("Failed to send GIF");
        }
    };

    const handleInitiateCall = (type: 'voice' | 'video') => {
        if (!selectedUser) return;
        setCallConfig({
            isOpen: true,
            type,
            isIncoming: false,
            remoteUser: selectedUser
        });
    };
    const handleRemoveFromGroup = async (userId: string) => {
        if (!selectedGroup) return;
        try {
            const updated = await removeGroupMember(selectedGroup._id, userId);
            setUserGroups(prev => prev.map(g => g._id === selectedGroup._id ? updated : g));
            setSelectedGroup(updated);
            toast.success("Member removed");
        } catch (e) {
            toast.error("Failed to remove member");
        }
    };

    const handleToggleStar = async (messageId: string) => {
        try {
            const updated = await toggleStarMessage(messageId);
            setMessages(prev => prev.map(m => m._id === messageId ? updated : m));
            toast.success(updated.starredBy.includes(currentUser?.id) ? "Message starred" : "Star removed");
        } catch (e) {
            toast.error("Failed to star message");
        }
    };

    const handleTogglePin = async (userId: string) => {
        try {
            const data = await togglePinUser(userId);
            updateUser({ pinnedChatUsers: data.pinnedChatUsers });
            toast.success(data.pinnedChatUsers.includes(userId) ? "Chat pinned" : "Chat unpinned");
        } catch (e) {
            toast.error("Failed to pin chat");
        }
    };

    const startEditing = (msg: Message) => {
        setEditingMessage(msg);
        setNewMessageText(msg.messageText);
        setReplyingTo(null);
    };

    const startForwarding = (msg: Message) => {
        setForwardingMessage(msg);
        setNewMessageText(msg.messageText);
        toast("Forwarding message... Select a user and click Send.");
    };

    const renderFile = (msg: Message) => {
        if (!msg.fileUrl) return null;
        const fullUrl = `${ROOT_URL}${msg.fileUrl}`;

        if (msg.fileType === 'image') {
            return <img src={fullUrl} alt="attachment" className="max-w-xs rounded-lg mt-1 mb-2 max-h-60 object-cover border shadow-sm cursor-zoom-in" onClick={() => window.open(fullUrl, '_blank')} />;
        }

        if (msg.fileType === 'video') {
            return (
                <video controls className="max-w-xs rounded-lg mt-1 mb-2 max-h-60 border bg-black shadow-sm">
                    <source src={fullUrl} />
                    Your browser does not support video.
                </video>
            );
        }

        if (msg.fileType === 'audio') {
            return (
                <audio controls className="max-w-xs mt-1 mb-2 shadow-sm rounded-full bg-accent/30 p-1">
                    <source src={fullUrl} />
                    Your browser does not support audio.
                </audio>
            );
        }

        return (
            <a href={fullUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-background/50 p-3 rounded-xl mt-1 mb-2 hover:bg-background/80 transition text-sm border shadow-sm group/file">
                <div className="p-2 bg-primary/10 rounded-lg group-hover/file:bg-primary/20 transition-colors">
                    <FileIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-[150px] font-medium">{msg.fileName}</span>
                    <span className="text-[10px] opacity-60 uppercase tracking-tighter">Document</span>
                </div>
            </a>
        );
    };

    const renderReplyPreview = (msg: Message | null | undefined) => {
        if (!msg) return null;
        return (
            <div className="border-l-4 border-primary bg-muted/60 p-2.5 rounded-r-xl mb-2 text-xs backdrop-blur-sm">
                <p className="font-bold text-primary mb-0.5">{msg.senderId === currentUser?.id ? "You" : selectedUser?.name}</p>
                <p className="truncate text-muted-foreground italic">
                    {msg.isDeletedForEveryone ? "This message was deleted." : msg.messageText || (msg.fileUrl ? "Media Attachment" : "")}
                </p>
            </div>
        );
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-4 h-[calc(100vh-4rem)] flex flex-col pt-16">
                    <div className="flex flex-1 gap-4 overflow-hidden">

                        {/* LEFT SIDEBAR: User List */}
                        <Card className="w-80 flex flex-col shadow-2xl border-none bg-card/60 backdrop-blur-xl ring-1 ring-white/10">
                            <CardHeader className="py-4 px-4 border-b space-y-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Chats</CardTitle>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn("h-8 w-8 rounded-full hover:bg-primary/10", isCreatingGroup && "bg-primary/10 text-primary")}
                                            onClick={() => {
                                                setIsCreatingGroup(!isCreatingGroup);
                                                setSelectedUser(null);
                                                setSelectedGroup(null);
                                            }}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary" />
                                    <Input
                                        placeholder="Search contacts..."
                                        className="pl-9 bg-muted/40 border-none rounded-lg h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {isCreatingGroup && (
                                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 mb-4 animate-in slide-in-from-top-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Create New Group</p>
                                        <Input
                                            placeholder="Group Name..."
                                            className="h-8 text-xs mb-2 bg-background border-none ring-1 ring-primary/10"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                        />
                                        <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">Select Members:</p>
                                        <div className="max-h-32 overflow-y-auto mb-3 space-y-1 pr-1 custom-scrollbar">
                                            {chatUsers.map(user => (
                                                <div
                                                    key={user._id}
                                                    className={cn(
                                                        "flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all",
                                                        selectedGroupMembers.includes(user._id) ? "bg-primary/20" : "hover:bg-primary/5"
                                                    )}
                                                    onClick={() => {
                                                        setSelectedGroupMembers(prev =>
                                                            prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id]
                                                        );
                                                    }}
                                                >
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                                                        <AvatarFallback><UserIcon className="h-3 w-3" /></AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[11px] font-medium truncate">{user.name}</span>
                                                    {selectedGroupMembers.includes(user._id) && <Check className="h-3 w-3 text-primary ml-auto" />}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="h-7 text-[10px] flex-1 font-bold" onClick={handleCreateGroup}>Create</Button>
                                            <Button size="sm" variant="ghost" className="h-7 text-[10px] flex-1 font-bold" onClick={() => setIsCreatingGroup(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {/* Groups Section */}
                                {userGroups.length > 0 && (
                                    <div className="mb-4">
                                        <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Classroom Communities
                                        </p>
                                        <div className="space-y-1">
                                            {userGroups.map(group => (
                                                <div
                                                    key={group._id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 group",
                                                        selectedGroup?._id === group._id ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" : "hover:bg-primary/5"
                                                    )}
                                                    onClick={() => {
                                                        setSelectedGroup(group);
                                                        setSelectedUser(null);
                                                        setIsCreatingGroup(false);
                                                    }}
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${group.name}`} />
                                                            <AvatarFallback>GP</AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary-foreground rounded-full flex items-center justify-center border-2 border-background">
                                                            <MessageSquare className="w-2 h-2 text-primary" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline">
                                                            <p className="font-bold text-sm truncate">{group.name}</p>
                                                            <span className={cn("text-[9px] font-bold opacity-60", selectedGroup?._id === group._id ? "text-primary-foreground" : "")}>
                                                                {group.members.length} members
                                                            </span>
                                                        </div>
                                                        <p className={cn("text-[11px] truncate opacity-70", selectedGroup?._id === group._id ? "text-primary-foreground" : "text-muted-foreground")}>
                                                            {group.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                    <UserIcon className="w-3 h-3" /> Direct Messages
                                </p>
                                {isLoadingUsers ? (
                                    <div className="p-12 text-center text-muted-foreground font-medium animate-pulse text-sm">Loading contacts...</div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground text-sm italic">No matches found</div>
                                ) : (
                                    <div className="divide-y divide-border/30">
                                        {filteredUsers.map((u) => (
                                            <div
                                                key={u._id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 group",
                                                    selectedUser?._id === u._id ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" : "hover:bg-primary/5"
                                                )}
                                                onClick={() => {
                                                    setSelectedUser(u);
                                                    setSelectedGroup(null);
                                                    setIsCreatingGroup(false);
                                                }}
                                            >        <div className="relative">
                                                    <Avatar className="h-11 w-11 ring-1 ring-background shadow-sm">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name.replace(/\s/g, '')}`} />
                                                        <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                                    </Avatar>
                                                    {onlineUsers.includes(u._id) && (
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full shadow-sm"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                                            <p className="text-[13px] font-bold truncate tracking-tight">{u.name}</p>
                                                            {currentUser?.pinnedChatUsers?.includes(u._id) && (
                                                                <Pin className="h-3 w-3 text-primary fill-primary shrink-0 opacity-80" />
                                                            )}
                                                        </div>
                                                        <span className="text-[8px] text-muted-foreground bg-muted px-1 py-0.5 rounded font-black uppercase tracking-widest">{u.role}</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground truncate opacity-60 font-medium">Click to chat</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* RIGHT SIDEBAR: Chat Window */}
                        <Card className="flex-1 flex flex-col shadow-2xl border-none overflow-hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-md ring-1 ring-white/5">
                            {selectedUser || selectedGroup ? (
                                <>
                                    {/* Chat Header */}
                                    <CardHeader className="py-2 px-5 border-b bg-background/50 flex flex-row items-center gap-3 space-y-0 shadow-sm z-30 backdrop-blur-xl">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Avatar className="h-10 w-10 ring-1 ring-primary/20">
                                                <AvatarImage src={selectedGroup ? `https://api.dicebear.com/7.x/initials/svg?seed=${selectedGroup.name}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser?.name.replace(/\s/g, '')}`} />
                                                <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-lg leading-tight tracking-tight truncate">{selectedGroup ? selectedGroup.name : selectedUser?.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {selectedGroup ? (
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                            {selectedGroup.members.length} participants
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <span className={cn("w-1 h-1 rounded-full", onlineUsers.includes(selectedUser!._id) ? "bg-emerald-500 animate-pulse" : "bg-muted")}></span>
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                                {onlineUsers.includes(selectedUser!._id) ? "Online" : "Offline"}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            {selectedUser && (
                                                <div className="flex gap-1 mr-2 border-r pr-2 border-white/10">
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleInitiateCall('voice')}>
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full text-primary hover:bg-primary/10" onClick={() => handleInitiateCall('video')}>
                                                        <Video className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            {!selectedGroup && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn("h-8 w-8 rounded-full transition-all", currentUser?.pinnedChatUsers?.includes(selectedUser!._id) ? "text-primary bg-primary/10" : "opacity-60")}
                                                    onClick={() => handleTogglePin(selectedUser!._id)}
                                                >
                                                    {currentUser?.pinnedChatUsers?.includes(selectedUser!._id) ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full opacity-60" onClick={() => setShowMsgSearch(!showMsgSearch)}>
                                                <Search className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full opacity-60"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    {selectedGroup ? (
                                                        <>
                                                            <DropdownMenuItem className="font-medium p-3" onClick={() => setIsGroupInfoOpen(true)}>
                                                                <Users className="w-4 h-4 mr-2" /> Group Info
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive font-bold p-3" onClick={handleLeaveGroup}>
                                                                <LogOut className="w-4 h-4 mr-2" /> Leave Group
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DropdownMenuItem className="font-medium p-3">View Contact</DropdownMenuItem>
                                                            <DropdownMenuItem className="font-medium p-3">Mute Notifications</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="font-medium p-3">Clear Chat</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive font-bold p-3">Block User</DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>

                                    {/* Group Info Sheet */}
                                    <Sheet open={isGroupInfoOpen} onOpenChange={setIsGroupInfoOpen}>
                                        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                                            <SheetHeader className="border-b pb-4 mb-4">
                                                <SheetTitle className="text-2xl font-black">{selectedGroup?.name}</SheetTitle>
                                                <SheetDescription>{selectedGroup?.description}</SheetDescription>
                                            </SheetHeader>

                                            <div className="space-y-6">
                                                <div className="flex flex-col items-center py-4 bg-muted/30 rounded-2xl">
                                                    <Avatar className="h-24 w-24 mb-4 ring-4 ring-background shadow-xl">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedGroup?.name}`} />
                                                        <AvatarFallback>GP</AvatarFallback>
                                                    </Avatar>
                                                    <h3 className="text-xl font-bold">{selectedGroup?.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{selectedGroup?.members.length} participants</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Participants</h4>
                                                        {selectedGroup?.admins.includes(currentUser?.id || "") && (
                                                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold" onClick={() => setIsAddingMember(true)}>
                                                                <Plus className="w-3 h-3 mr-1" /> Add
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        {selectedGroup?.members.map(member => (
                                                            <div key={member._id} className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-primary/5 hover:bg-primary/5 transition-all group/member">
                                                                <Avatar className="h-10 w-10 ring-1 ring-primary/10">
                                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name.replace(/\s/g, '')}`} />
                                                                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="font-bold text-sm truncate">{member.name}</p>
                                                                        {selectedGroup.admins.includes(member._id) && (
                                                                            <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Admin</span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-black truncate tracking-widest opacity-60">{member.role}</p>
                                                                </div>
                                                                {selectedGroup.admins.includes(currentUser?.id || "") && member._id !== currentUser?.id && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive opacity-0 group-hover/member:opacity-100 transition-opacity"
                                                                        onClick={() => handleRemoveFromGroup(member._id)}
                                                                    >
                                                                        <Trash className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Button variant="outline" className="w-full text-destructive hover:bg-destructive hover:text-white font-bold h-12 rounded-xl" onClick={handleLeaveGroup}>
                                                    <LogOut className="w-4 h-4 mr-2" /> Leave Community
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    {/* Add Member Dialog */}
                                    <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add to Community</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div className="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                                    {chatUsers
                                                        .filter(u => !selectedGroup?.members.some(m => m._id === u._id))
                                                        .map(user => (
                                                            <div
                                                                key={user._id}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
                                                                    newMemberSelection.includes(user._id) ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/5"
                                                                )}
                                                                onClick={() => {
                                                                    setNewMemberSelection(prev =>
                                                                        prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id]
                                                                    );
                                                                }}
                                                            >
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s/g, '')}`} />
                                                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-bold text-sm">{user.name}</span>
                                                                {newMemberSelection.includes(user._id) && <Check className="h-4 w-4 ml-auto" />}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="ghost" className="font-bold" onClick={() => setIsAddingMember(false)}>Cancel</Button>
                                                <Button className="font-bold" onClick={handleAddMembersToGroup} disabled={newMemberSelection.length === 0}>Add Participants</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    {/* GIF Picker Dialog */}
                                    <Dialog open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Send a GIF</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div className="relative">
                                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search Tenor..."
                                                        className="pl-9"
                                                        value={gifSearchTerm}
                                                        onChange={(e) => setGifSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                                    {/* Mock GIFs for demonstration if no API key */}
                                                    {[
                                                        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueHplJnB0PW0mY3Q9Zw/3o7TKMGpxoW3oM6ZSE/giphy.gif",
                                                        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueHplJnB0PW0mY3Q9Zw/l0HlIDlD1VUCpS9dS/giphy.gif",
                                                        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueHplJnB0PW0mY3Q9Zw/26AHONQ79FdWzhAI0/giphy.gif",
                                                        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueXpueHplJnB0PW0mY3Q9Zw/xT9IgzoKnwFNmISR8I/giphy.gif"
                                                    ].map((url, i) => (
                                                        <img
                                                            key={i}
                                                            src={url}
                                                            alt="gif"
                                                            className="rounded-lg cursor-pointer hover:opacity-80 transition active:scale-95 border"
                                                            onClick={() => handleSendGif(url)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Message Search Bar */}
                                    {showMsgSearch && (
                                        <div className="px-5 py-2.5 bg-muted/40 border-b flex items-center animate-in slide-in-from-top duration-300 backdrop-blur-md">
                                            <SearchIcon className="h-3.5 w-3.5 text-primary mr-3" />
                                            <input
                                                autoFocus
                                                placeholder="Search message..."
                                                className="bg-transparent border-none focus:ring-0 text-xs flex-1 py-0.5 font-medium"
                                                value={messageSearchTerm}
                                                onChange={(e) => setMessageSearchTerm(e.target.value)}
                                            />
                                            <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full" onClick={() => { setMessageSearchTerm(""); setShowMsgSearch(false); }}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Chat Messages */}
                                    <CardContent className="flex-1 p-5 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20 space-y-5 custom-scrollbar">
                                        {isLoadingMessages ? (
                                            <div className="h-full flex items-center justify-center text-muted-foreground font-medium text-sm italic">Loading conversation...</div>
                                        ) : filteredMessages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20">
                                                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 shadow-inner">
                                                    <MessageSquare className="h-12 w-12" />
                                                </div>
                                                <p className="font-bold text-lg text-muted-foreground/50">{messageSearchTerm ? "No matching messages" : "No messages yet"}</p>
                                            </div>
                                        ) : (
                                            filteredMessages.map((msg, index) => {
                                                const isMyMessage = msg.senderId === currentUser?.id;
                                                const hasReactions = msg.reactions && msg.reactions.length > 0;
                                                const isStarred = msg.starredBy?.includes(currentUser?.id || "");

                                                return (
                                                    <div
                                                        key={msg._id || index}
                                                        className={cn(
                                                            "flex w-full group animate-in fade-in slide-in-from-bottom-3 duration-500",
                                                            isMyMessage ? "justify-end" : "justify-start"
                                                        )}
                                                    >
                                                        <div className={cn("flex flex-col max-w-[75%]", isMyMessage ? "items-end" : "items-start")}>
                                                            {/* Bubble Toolbar */}
                                                            <div className={cn(
                                                                "flex gap-1.5 mb-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200",
                                                                isMyMessage ? "flex-row-reverse" : "flex-row"
                                                            )}>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-white/20 backdrop-blur-md opacity-90"><Smile className="h-4 w-4" /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="flex gap-1 p-1.5 min-w-0" side="top">
                                                                        {EMOJI_OPTIONS.map(emoji => (
                                                                            <Button key={emoji} variant="ghost" size="icon" className="h-9 w-9 text-xl hover:scale-125 transition-transform" onClick={() => handleReact(msg._id, emoji)}>{emoji}</Button>
                                                                        ))}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-white/20 backdrop-blur-md opacity-90" onClick={() => setReplyingTo(msg)}><Reply className="h-4 w-4" /></Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className={cn("h-8 w-8 rounded-full shadow-lg border-white/20 backdrop-blur-md opacity-90 transition-colors", isStarred ? "text-yellow-500 fill-yellow-500" : "")}
                                                                    onClick={() => handleToggleStar(msg._id)}
                                                                >
                                                                    <Star className="h-4 w-4" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg border-white/20 backdrop-blur-md opacity-90"><MoreVertical className="h-4 w-4" /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align={isMyMessage ? "end" : "start"} className="w-44">
                                                                        <DropdownMenuItem className="p-3" onClick={() => startForwarding(msg)}><Forward className="w-4 h-4 mr-2" /> Forward</DropdownMenuItem>
                                                                        {isMyMessage && !msg.isDeletedForEveryone && (
                                                                            <DropdownMenuItem className="p-3" onClick={() => startEditing(msg)}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                                                        )}
                                                                        <DropdownMenuItem className="p-3 text-destructive font-medium" onClick={() => handleDelete(msg._id, 'me')}><Trash2 className="w-4 h-4 mr-2" /> Delete for me</DropdownMenuItem>
                                                                        {isMyMessage && !msg.isDeletedForEveryone && (
                                                                            <DropdownMenuItem className="p-3 text-destructive font-bold" onClick={() => handleDelete(msg._id, 'everyone')}><Trash2 className="w-4 h-4 mr-2" /> Delete for everyone</DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            {/* Sender Name for Groups */}
                                                            {selectedGroup && !isMyMessage && (
                                                                <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest ml-1 cursor-default hover:text-primary/70 transition-colors">
                                                                    {typeof msg.senderId === 'object' ? msg.senderId.name : 'Participant'}
                                                                </p>
                                                            )}

                                                            {/* Main Bubble Content */}
                                                            <div
                                                                className={cn(
                                                                    "px-5 py-3 rounded-3xl relative shadow-xl transition-all duration-300 group-hover:shadow-2xl",
                                                                    msg.isDeletedForEveryone ? "bg-muted text-muted-foreground italic border border-dashed opacity-60" :
                                                                        isMyMessage
                                                                            ? "bg-gradient-to-br from-primary to-primary-foreground/10 text-primary-foreground rounded-tr-none ring-1 ring-white/20 font-medium"
                                                                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none ring-1 ring-black/5 dark:ring-white/5 font-medium"
                                                                )}
                                                            >
                                                                {msg.isForwarded && (
                                                                    <div className="flex items-center gap-1.5 text-[9px] opacity-60 mb-2 italic font-black uppercase tracking-widest">
                                                                        <Forward className="h-3 w-3" /> Forwarded
                                                                    </div>
                                                                )}

                                                                {renderReplyPreview(msg.replyTo)}
                                                                {renderFile(msg)}
                                                                <p className="text-[15px] leading-relaxed break-words">{msg.messageText}</p>

                                                                {/* Reactions cluster */}
                                                                {hasReactions && (
                                                                    <div className={cn(
                                                                        "absolute -bottom-4 flex gap-1 bg-background/80 backdrop-blur-md border px-2 py-1 rounded-full shadow-2xl z-20 hover:scale-110 transition-transform cursor-pointer",
                                                                        isMyMessage ? "right-3" : "left-3"
                                                                    )}>
                                                                        {msg.reactions.map((r, i) => (
                                                                            <span key={i} className="text-[12px] leading-none animate-in zoom-in duration-300">{r.emoji}</span>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div
                                                                    className={cn(
                                                                        "text-[10px] mt-2 flex items-center gap-1.5 font-black uppercase tracking-tighter opacity-80",
                                                                        isMyMessage ? "text-primary-foreground/80 justify-end" : "text-muted-foreground justify-start"
                                                                    )}
                                                                >
                                                                    {msg.isEdited && <span className="text-[9px] opacity-60">Edited</span>}
                                                                    {formatTime(msg.createdAt)}
                                                                    {isMyMessage && !msg.isDeletedForEveryone && (
                                                                        msg.status === 'seen'
                                                                            ? <CheckCheck className="w-4 h-4 text-primary-foreground shadow-sm" />
                                                                            : msg.status === 'delivered'
                                                                                ? <CheckCheck className="w-4 h-4 opacity-100" />
                                                                                : <Check className="w-4 h-4 opacity-60" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </CardContent>

                                    {/* Action UI Overlay Above Input */}
                                    {(replyingTo || editingMessage || selectedFile || forwardingMessage || isRecording) && (
                                        <div className="px-6 py-4 bg-muted/40 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-500 backdrop-blur-2xl z-20">
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    {isRecording ? (
                                                        <div className="flex items-center gap-4 animate-pulse">
                                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                            <p className="text-sm font-black text-red-500 tracking-wider">RECORDING {formatDuration(recordingTime)}</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {replyingTo && (
                                                                <div className="flex flex-col border-l-4 border-primary pl-4 py-1">
                                                                    <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest flex items-center gap-2"><Reply className="w-3.5 h-3.5" /> Replying to {replyingTo.senderId === currentUser?.id ? "You" : selectedUser?.name}</p>
                                                                    <p className="text-sm truncate text-muted-foreground font-medium italic opacity-80">{replyingTo.messageText || "Media Attachment"}</p>
                                                                </div>
                                                            )}
                                                            {editingMessage && (
                                                                <div className="flex flex-col border-l-4 border-yellow-500 pl-4 py-1">
                                                                    <p className="text-[10px] font-black text-yellow-500 mb-1 uppercase tracking-widest flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> Editing mode</p>
                                                                    <p className="text-sm truncate text-muted-foreground font-medium italic opacity-80">{editingMessage.messageText}</p>
                                                                </div>
                                                            )}
                                                            {forwardingMessage && (
                                                                <div className="flex flex-col border-l-4 border-blue-500 pl-4 py-1">
                                                                    <p className="text-[10px] font-black text-blue-500 mb-1 uppercase tracking-widest flex items-center gap-2"><Forward className="w-3.5 h-3.5" /> Forwarding active</p>
                                                                    <p className="text-sm truncate text-muted-foreground font-medium italic opacity-80">{forwardingMessage.messageText || "Media Attachment"}</p>
                                                                </div>
                                                            )}
                                                            {selectedFile && (
                                                                <div className="flex items-center gap-4 bg-primary/5 p-2 rounded-xl">
                                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                                        {selectedFile.type.startsWith('image/') ? <ImageIcon className="h-5 w-5 text-primary" /> : <FileIcon className="h-5 w-5 text-primary" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm truncate font-bold text-foreground">{selectedFile.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[1]}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => {
                                                    if (isRecording) stopRecording();
                                                    setReplyingTo(null);
                                                    setEditingMessage(null);
                                                    setSelectedFile(null);
                                                    setForwardingMessage(null);
                                                    setNewMessageText("");
                                                }}>
                                                    <X className="h-6 w-6" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message Input Area */}
                                    <div className="p-4 bg-background border-t shadow-inner flex items-center gap-3 z-30">
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full text-muted-foreground h-10 w-10 hover:bg-primary/10 transition-all"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isRecording}
                                        >
                                            <Paperclip className="h-5 w-5" />
                                        </Button>

                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="rounded-full text-muted-foreground h-10 w-10 hover:bg-primary/10 transition-all"
                                                onClick={() => setIsGifPickerOpen(true)}
                                                disabled={isRecording}
                                            >
                                                <Gift className="h-5 w-5" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "rounded-full h-10 w-10 hover:bg-primary/10 transition-all",
                                                    isSharingLocation ? "text-primary animate-pulse" : "text-muted-foreground"
                                                )}
                                                onClick={handleShareLocation}
                                                disabled={isRecording || isSharingLocation}
                                            >
                                                <MapPin className="h-5 w-5" />
                                            </Button>
                                        </div>

                                        <div className="flex-1 flex gap-2 items-center">
                                            {isRecording ? (
                                                <div className="flex-1 h-11 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center px-4 justify-between border border-red-200 dark:border-red-900/50">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                        <span className="text-red-500 font-bold tracking-widest text-[11px]">RECORDING {formatDuration(recordingTime)}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10 rounded-full h-8 w-8" onClick={stopRecording}>
                                                        <Square className="h-4 w-4 fill-red-500" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <form onSubmit={handleSendMessage} className="flex-1 flex gap-2 items-center">
                                                    <Input
                                                        placeholder={editingMessage ? "Edit message..." : "Type here..."}
                                                        className="flex-1 rounded-xl px-4 h-11 bg-muted/40 border-none font-medium text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                                                        value={newMessageText}
                                                        onChange={(e) => setNewMessageText(e.target.value)}
                                                    />
                                                    <div className="flex gap-1.5">
                                                        {!newMessageText.trim() && !selectedFile ? (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="rounded-full h-11 w-11 hover:bg-primary/10 text-primary border shadow-sm"
                                                                onClick={startRecording}
                                                            >
                                                                <Mic className="h-5 w-5" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                type="submit"
                                                                size="sm"
                                                                className="rounded-xl shadow-xl h-11 w-11 shrink-0 bg-primary hover:shadow-primary/30"
                                                            >
                                                                {editingMessage ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center relative overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
                                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                                        <div className="h-full w-full bg-[radial-gradient(var(--primary)_0.5px,transparent_0.5px)] [background-size:24px_24px]"></div>
                                    </div>
                                    <div className="w-44 h-44 rounded-full bg-primary/10 flex items-center justify-center mb-10 shadow-2xl animate-float relative">
                                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-dashed animate-spin-slow"></div>
                                        <MessageSquare className="h-20 w-20 text-primary opacity-20" />
                                    </div>
                                    <h2 className="text-5xl font-black tracking-tighter text-foreground mb-6 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:to-white/60">Unified Classroom Messenger</h2>
                                    <p className="max-w-md text-slate-500 dark:text-slate-400 leading-relaxed text-xl font-medium opacity-80">
                                        Collaborate with students and teachers in real-time. Share voice, video, and documents securely.
                                    </p>
                                    <div className="mt-20 grid grid-cols-3 gap-12 text-[11px] font-black uppercase tracking-[0.3em] opacity-30">
                                        <div className="flex flex-col items-center gap-4"><Pin className="w-6 h-6" /> Pinned</div>
                                        <div className="flex flex-col items-center gap-4"><Star className="w-6 h-6" /> Starred</div>
                                        <div className="flex flex-col items-center gap-4"><Mic className="w-6 h-6" /> Audio</div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin 15s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary), 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--primary), 0.3);
                }
            `}</style>

            {callConfig.isOpen && (
                <CallModal
                    isOpen={callConfig.isOpen}
                    onClose={() => setCallConfig(prev => ({ ...prev, isOpen: false }))}
                    callerName={callConfig.remoteUser?.name}
                    isIncoming={callConfig.isIncoming}
                    type={callConfig.type}
                    socket={socket}
                    remoteUserId={callConfig.remoteUser?._id || ""}
                    currentUserId={currentUser?.id || ""}
                    currentUserName={currentUser?.name || ""}
                    incomingSignal={callConfig.signalData}
                />
            )}
        </div>
    );
};

export default MessagesPage;
