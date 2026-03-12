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
import { getStatuses, viewStatus, createStatus, Status } from "@/services/statusService";
import { encryptPayload, decryptPayload } from "@/services/securityService";
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
import { StatusBar, StatusViewer } from "@/components/messaging/StatusBar";

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
    replyTo?: any; // Can be string ID or populated Message
    starredBy?: string[];
    isEncrypted?: boolean;
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

    // Status states
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [currentStatusUserIndex, setCurrentStatusUserIndex] = useState<number | null>(null);
    const [isStatusViewerOpen, setIsStatusViewerOpen] = useState(false);
    const [isCreatingStatus, setIsCreatingStatus] = useState(false);
    const [statusType, setStatusType] = useState<'text' | 'image' | 'video'>('text');
    const [statusText, setStatusText] = useState("");
    const [statusFile, setStatusFile] = useState<File | null>(null);
    const [isUploadingStatus, setIsUploadingStatus] = useState(false);

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

        // Fetch Statuses
        const fetchStatusesData = async () => {
            try {
                const data = await getStatuses();
                setStatuses(data);
            } catch (err) {
                // error fetching statuses
            }
        };
        fetchStatusesData();
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

                // Decrypt messages if encrypted
                const decryptedMessages = await Promise.all(
                    data.map(async (msg: Message) => {
                        if (msg.isEncrypted && msg.messageText && !msg.isDeletedForEveryone) {
                            const partnerId = msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
                            if (partnerId) {
                                try {
                                    const decrypted = await decryptPayload(msg.messageText, currentUser!.id, partnerId);
                                    return { ...msg, messageText: decrypted };
                                } catch (e) {
                                    return { ...msg, messageText: "[Encrypted Message]" };
                                }
                            }
                        }
                        return msg;
                    })
                );

                setMessages(decryptedMessages);

                if (socket && decryptedMessages.length > 0) {
                    if (selectedUser) {
                        const haveUnseen = decryptedMessages.some((m: Message) => m.senderId === selectedUser._id && m.status !== 'seen');
                        if (haveUnseen) {
                            socket.emit("mark_seen", { senderId: selectedUser._id, receiverId: currentUser?.id });
                        }
                    }
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

        const handleReceiveMessage = async (incomingMsg: any) => {
            let processedMsg = incomingMsg;
            if (incomingMsg.isEncrypted && incomingMsg.messageText) {
                const partnerId = incomingMsg.senderId === currentUser?.id ? incomingMsg.receiverId : incomingMsg.senderId;
                if (partnerId) {
                    try {
                        const decrypted = await decryptPayload(incomingMsg.messageText, currentUser!.id, partnerId);
                        processedMsg = { ...incomingMsg, messageText: decrypted };
                    } catch (e) {
                        processedMsg = { ...incomingMsg, messageText: "[Encrypted Message]" };
                    }
                }
            }

            if (processedMsg.groupId) {
                setSelectedGroup(prev => {
                    if (prev?._id === processedMsg.groupId) {
                        setMessages(prevMsgs => [...prevMsgs, processedMsg]);
                    } else {
                        toast(`New group message in ${processedMsg.groupName || 'a group'}`);
                    }
                    return prev;
                });
            } else {
                setSelectedUser((prevSelected) => {
                    if (prevSelected?._id === processedMsg.senderId) {
                        setMessages((prev) => [...prev, processedMsg]);
                        socket.emit("mark_seen", { senderId: processedMsg.senderId, receiverId: currentUser?.id });
                    } else {
                        toast(`New message from ${processedMsg.senderName || 'someone'}`);
                        socket.emit("message_delivered", { messageId: processedMsg._id, senderId: processedMsg.senderId });
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
            toast.error("Microphone access denied.");
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

        let finalMessageText = currentText;
        let isEncrypted = false;

        if (selectedUser && !selectedGroup && currentText) {
            try {
                finalMessageText = await encryptPayload(currentText, currentUser!.id, selectedUser._id);
                isEncrypted = true;
            } catch (err) {
                console.error("E2EE failed:", err);
            }
        }

        const tempId = Date.now().toString() + Math.random().toString().substring(2, 6);
        const tempFileUrl = currentFile ? URL.createObjectURL(currentFile) : undefined;

        const optimisticMsg: Message = {
            _id: tempId,
            senderId: currentUser!.id,
            receiverId: selectedUser?._id,
            groupId: selectedGroup?._id,
            messageText: currentText,
            fileUrl: tempFileUrl,
            fileName: currentFile?.name,
            fileType: fileType,
            status: 'sent',
            isDeletedForEveryone: false,
            reactions: [],
            replyTo: replyingTo,
            isEncrypted: isEncrypted,
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const savedMessage = await sendMessage(
                selectedGroup ? "" : selectedUser!._id,
                finalMessageText,
                currentFile,
                fileType,
                currentReplyTo,
                currentForwarding,
                selectedGroup?._id,
                isEncrypted
            );

            const localDisplayMessage = { ...savedMessage, messageText: currentText };
            setMessages((prev) => prev.map(m => m._id === tempId ? localDisplayMessage : m));

            if (socket) {
                socket.emit("send_message", savedMessage);
            }
        } catch (error) {
            toast.error("Failed to send message");
            setMessages((prev) => prev.filter(m => m._id !== tempId));
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
        } catch (e) {
            toast.error("Failed to add members");
        }
    };

    const handleShareLocation = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }
        setIsSharingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                const locationText = `📍 Location: ${locationUrl}`;
                try {
                    const result = await sendMessage(selectedUser?._id || "", locationText, null, 'text', null, false, selectedGroup?._id);
                    setMessages(prev => [...prev, result]);
                    socket?.emit('send_message', result);
                    toast.success("Location shared!");
                } catch (e) {
                    toast.error("Failed to share location");
                } finally {
                    setIsSharingLocation(false);
                }
            },
            () => {
                toast.error("Location access denied");
                setIsSharingLocation(false);
            }
        );
    };

    const handleSendGif = async (url: string) => {
        try {
            const result = await sendMessage(selectedUser?._id || "", url, null, 'text', null, false, selectedGroup?._id);
            setMessages(prev => [...prev, result]);
            socket?.emit('send_message', result);
            setIsGifPickerOpen(false);
        } catch (e) {
            toast.error("Failed to send GIF");
        }
    };

    const handleInitiateCall = (type: 'voice' | 'video') => {
        if (!selectedUser) return;
        setCallConfig({ isOpen: true, type, isIncoming: false, remoteUser: selectedUser });
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
        } catch (e) {
            toast.error("Failed to star message");
        }
    };

    const handleTogglePin = async (userId: string) => {
        try {
            const data = await togglePinUser(userId);
            updateUser({ pinnedChatUsers: data.pinnedChatUsers });
        } catch (e) {
            toast.error("Failed to pin chat");
        }
    };

    const handleHandleCreateStatus = async () => {
        if (!statusText.trim() && !statusFile) {
            toast.error("Please provide status content");
            return;
        }
        setIsUploadingStatus(true);
        try {
            const formData = new FormData();
            formData.append('contentType', statusType);
            if (statusText) formData.append('text', statusText);
            if (statusFile) formData.append('statusFile', statusFile);
            const result = await createStatus(formData);
            setStatuses(prev => [result, ...prev]);
            setIsCreatingStatus(false);
            setStatusText("");
            setStatusFile(null);
            toast.success("Status updated!");
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setIsUploadingStatus(false);
        }
    };

    const handleViewStatus = async (statusId: string) => {
        try {
            await viewStatus(statusId);
            setStatuses(prev => prev.map(s => s._id === statusId ? { ...s, viewedBy: [...s.viewedBy, currentUser!.id] } : s));
        } catch (err) { }
    };

    const startEditing = (msg: Message) => {
        setEditingMessage(msg);
        setNewMessageText(msg.messageText);
        setReplyingTo(null);
    };

    const startForwarding = (msg: Message) => {
        setForwardingMessage(msg);
        setNewMessageText(msg.messageText);
        toast("Select a chat to forward.");
    };

    const renderFile = (msg: Message) => {
        if (!msg.fileUrl) return null;
        const fullUrl = msg.fileUrl.startsWith('blob:') ? msg.fileUrl : `${ROOT_URL}${msg.fileUrl}`;
        if (msg.fileType === 'image') return <img src={fullUrl} alt="attachment" className="max-w-xs rounded-lg mt-1 mb-2 max-h-60 object-cover border cursor-zoom-in" onClick={() => window.open(fullUrl, '_blank')} />;
        if (msg.fileType === 'video') return <video controls className="max-w-xs rounded-lg mt-1 mb-2 max-h-60 border bg-black"><source src={fullUrl} /></video>;
        if (msg.fileType === 'audio') return <audio controls className="max-w-xs mt-1 mb-2"><source src={fullUrl} /></audio>;
        return (
            <a href={fullUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-background/50 p-3 rounded-xl mt-1 mb-2 hover:bg-background/80 transition text-sm border">
                <FileIcon className="h-5 w-5 text-primary" />
                <span className="truncate max-w-[150px] font-medium">{msg.fileName}</span>
            </a>
        );
    };

    const renderReplyPreview = (msg: Message | null | undefined) => {
        if (!msg) return null;
        return (
            <div className="border-l-4 border-primary bg-muted/60 p-2 text-xs rounded-r ml-2 mb-2">
                <p className="font-bold text-primary">{msg.senderId === currentUser?.id ? "You" : "User"}</p>
                <p className="truncate text-muted-foreground italic">
                    {msg.isDeletedForEveryone ? "Deleted" : msg.messageText || "Media"}
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
                        <Card className="w-80 flex flex-col shadow-2xl border-none bg-card/60 backdrop-blur-xl ring-1 ring-white/10">
                            <CardHeader className="py-4 px-4 border-b space-y-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Chats</CardTitle>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" onClick={() => setIsCreatingGroup(!isCreatingGroup)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search..." className="pl-9 h-9 border-none bg-muted/40" value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                <StatusBar statuses={statuses} currentUserId={currentUser?.id || ""} onOpenStatus={(idx) => { setCurrentStatusUserIndex(idx); setIsStatusViewerOpen(true); }} onAddStatus={() => setIsCreatingStatus(true)} />

                                {isCreatingGroup && (
                                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 mb-4 scale-in">
                                        <Input placeholder="Group Name..." className="h-8 text-xs mb-2" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                                        <div className="max-h-32 overflow-y-auto mb-3 space-y-1 custom-scrollbar">
                                            {chatUsers.map(user => (
                                                <div key={user._id} className={cn("flex items-center gap-2 p-1.5 rounded-lg cursor-pointer", selectedGroupMembers.includes(user._id) ? "bg-primary/20" : "hover:bg-primary/5")} onClick={() => setSelectedGroupMembers(prev => prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id])}>
                                                    <Avatar className="h-5 w-5"><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} /></Avatar>
                                                    <span className="text-[11px] font-medium truncate">{user.name}</span>
                                                    {selectedGroupMembers.includes(user._id) && <Check className="h-3 w-3 text-primary ml-auto" />}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="h-7 text-[10px] flex-1" onClick={handleCreateGroup}>Create</Button>
                                            <Button size="sm" variant="ghost" className="h-7 text-[10px] flex-1" onClick={() => setIsCreatingGroup(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                )}

                                {userGroups.map(group => (
                                    <div key={group._id} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all", selectedGroup?._id === group._id ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/5")} onClick={() => { setSelectedGroup(group); setSelectedUser(null); setIsCreatingGroup(false); }}>
                                        <Avatar className="h-10 w-10 ring-2 ring-background"><AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${group.name}`} /></Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5"><span className="font-bold text-sm truncate">{group.name}</span></div>
                                            <p className="text-[10px] opacity-70 truncate line-clamp-1 italic">{group.description}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-4 mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Direct Messages</div>
                                {filteredUsers.map(user => (
                                    <div key={user._id} className={cn("flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-1 transition-all", selectedUser?._id === user._id ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/5")} onClick={() => { setSelectedUser(user); setSelectedGroup(null); setIsCreatingGroup(false); }}>
                                        <div className="relative">
                                            <Avatar className="h-10 w-10 ring-2 ring-background"><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.replace(/\s/g, '')}`} /></Avatar>
                                            {onlineUsers.includes(user._id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-sm truncate">{user.name}</span>
                                                {currentUser?.pinnedChatUsers?.includes(user._id) && <Pin className="w-3 h-3 rotate-45" />}
                                            </div>
                                            <p className="text-[10px] opacity-70 truncate uppercase tracking-tighter">{user.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="flex-1 flex flex-col shadow-2xl border-none bg-card/40 backdrop-blur-xl ring-1 ring-white/5 relative overflow-hidden">
                            {(selectedUser || selectedGroup) ? (
                                <>
                                    <CardHeader className="py-3 px-6 border-b bg-background/30 backdrop-blur-md sticky top-0 z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-11 w-11 shadow-md order-1 border-2 border-primary/20">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/${selectedGroup ? 'initials' : 'avataaars'}/svg?seed=${selectedGroup ? selectedGroup.name : selectedUser?.name}`} />
                                                </Avatar>
                                                <div className="order-2">
                                                    <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                                        {selectedGroup ? selectedGroup.name : selectedUser?.name}
                                                        {!selectedGroup && onlineUsers.includes(selectedUser?._id || "") && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                                                    </CardTitle>
                                                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mt-1">
                                                        {selectedGroup ? `${selectedGroup.members.length} participants` : selectedUser?.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedUser && (
                                                    <div className="flex gap-2 mr-2 border-r pr-2">
                                                        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full text-emerald-500" onClick={() => handleInitiateCall('voice')}><Phone className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full text-primary" onClick={() => handleInitiateCall('video')}><Video className="h-4 w-4" /></Button>
                                                    </div>
                                                )}
                                                {!selectedGroup ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="rounded-full h-9 w-9"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleTogglePin(selectedUser!._id)}>{currentUser?.pinnedChatUsers?.includes(selectedUser!._id) ? "Unpin Chat" : "Pin Chat"}</DropdownMenuItem></DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="rounded-full h-9 w-9" onClick={() => setIsGroupInfoOpen(true)}><Settings className="h-4 w-4" /></Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
                                        {isLoadingMessages ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                        ) : (
                                            messages.map((msg, idx) => (
                                                <div key={msg._id || idx} className={cn("flex flex-col max-w-[80%] transition-all", msg.senderId === currentUser?.id ? "ml-auto items-end" : "items-start")}>
                                                    <div className={cn("group relative p-4 rounded-3xl shadow-sm transition-all duration-300", msg.senderId === currentUser?.id ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/80 backdrop-blur-sm rounded-tl-none")}>
                                                        {msg.replyTo && renderReplyPreview(typeof msg.replyTo === 'string' ? messages.find(m => m._id === msg.replyTo) : msg.replyTo)}
                                                        {renderFile(msg)}
                                                        {!msg.isDeletedForEveryone ? (
                                                            <div className="text-sm font-medium leading-relaxed break-words">{msg.messageText}</div>
                                                        ) : (
                                                            <div className="text-sm italic opacity-50 flex items-center gap-2"><Trash2 className="w-3 h-3" /> This message was deleted.</div>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[9px] font-black uppercase tracking-tighter">{formatTime(msg.createdAt)}</span>
                                                            {msg.senderId === currentUser?.id && (msg.status === 'seen' ? <CheckCheck className="w-3 h-3 text-sky-300" /> : <Check className="w-3 h-3" />)}
                                                            {msg.isEncrypted && <Pin className="w-3 h-3 text-emerald-300" />}
                                                        </div>
                                                        <div className={cn("absolute top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-50%] p-1 bg-background shadow-xl rounded-full border", msg.senderId === currentUser?.id ? "right-full mr-2" : "left-full ml-2")}>
                                                            <Button onClick={() => setReplyingTo(msg)} variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full"><Reply className="h-3 w-3" /></Button>
                                                            <Button onClick={() => handleToggleStar(msg._id)} variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full"><Star className={cn("h-3 w-3", msg.starredBy?.includes(currentUser?.id || "") && "fill-yellow-400 text-yellow-400")} /></Button>
                                                            {msg.senderId === currentUser?.id && <Button onClick={() => startEditing(msg)} variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full"><Edit2 className="h-3 w-3" /></Button>}
                                                            <Button onClick={() => handleDelete(msg._id, msg.senderId === currentUser?.id ? 'everyone' : 'me')} variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full text-destructive"><Trash className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </CardContent>

                                    <div className="p-4 bg-background/50 backdrop-blur-md border-t">
                                        {replyingTo && <div className="mb-2 p-2 bg-primary/5 rounded-lg border flex items-center justify-between"><div className="flex-1">{renderReplyPreview(replyingTo)}</div><Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="rounded-full"><X className="h-4 w-4" /></Button></div>}
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="rounded-full h-11 w-11" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="sm" className="rounded-full h-11 w-11" onClick={() => setIsGifPickerOpen(true)}><Gift className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="sm" className="rounded-full h-11 w-11" onClick={handleShareLocation}><MapPin className="h-5 w-5" /></Button>
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                            <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                                                <Input placeholder="Type message..." className="flex-1 h-11 border-none bg-muted/40" value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} />
                                                <Button type="submit" className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20"><Send className="h-5 w-5" /></Button>
                                            </form>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-slate-50/20 dark:bg-slate-950/20 relative">
                                    <div className="w-44 h-44 rounded-full bg-primary/10 flex items-center justify-center mb-10 shadow-2xl animate-float"><MessageSquare className="h-20 w-20 text-primary opacity-20" /></div>
                                    <h2 className="text-4xl font-black mb-6">Unified Messenger</h2>
                                    <p className="max-w-md text-xl opacity-80">Choose a contact or community and start collaborating securely.</p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--primary), 0.2); border-radius: 10px; }
            `}</style>

            {callConfig.isOpen && <CallModal isOpen={callConfig.isOpen} onClose={() => setCallConfig(prev => ({ ...prev, isOpen: false }))} callerName={callConfig.remoteUser?.name} isIncoming={callConfig.isIncoming} type={callConfig.type} socket={socket} remoteUserId={callConfig.remoteUser?._id || ""} currentUserId={currentUser?.id || ""} currentUserName={currentUser?.name || ""} incomingSignal={callConfig.signalData} />}
            {isStatusViewerOpen && currentStatusUserIndex !== null && <StatusViewer isOpen={isStatusViewerOpen} onClose={() => setIsStatusViewerOpen(false)} userStatuses={Object.values(statuses.reduce((acc, s) => { const uid = s.userId._id; if (!acc[uid]) acc[uid] = []; acc[uid].push(s); return acc; }, {} as Record<string, Status[]>))[currentStatusUserIndex]} currentUserId={currentUser?.id || ""} onViewStatus={handleViewStatus} />}

            <Dialog open={isCreatingStatus} onOpenChange={setIsCreatingStatus}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="text-2xl font-black">Post Status</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                            {(['text', 'image', 'video'] as const).map(type => <Button key={type} variant={statusType === type ? 'default' : 'ghost'} className="flex-1 text-xs" onClick={() => setStatusType(type)}>{type}</Button>)}
                        </div>
                        {statusType === 'text' ? <Input placeholder="Type status..." className="h-14 font-medium" value={statusText} onChange={(e) => setStatusText(e.target.value)} /> : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-primary/20 rounded-2xl p-8 text-center cursor-pointer hover:bg-primary/5" onClick={() => document.getElementById('status-file-input')?.click()}>
                                    {statusFile ? <p className="text-sm font-bold truncate">{statusFile.name}</p> : <div className="flex flex-col items-center opacity-40"><Plus className="w-10 h-10 mb-2" /><p className="text-xs uppercase font-black">Select {statusType}</p></div>}
                                    <input type="file" id="status-file-input" className="hidden" accept={statusType === 'image' ? 'image/*' : 'video/*'} onChange={(e) => setStatusFile(e.target.files?.[0] || null)} />
                                </div>
                                <Input placeholder="Caption..." value={statusText} onChange={(e) => setStatusText(e.target.value)} />
                            </div>
                        )}
                    </div>
                    <DialogFooter><Button className="w-full h-12 shadow-lg" onClick={handleHandleCreateStatus} disabled={isUploadingStatus}>{isUploadingStatus ? "Sharing..." : "Post Status"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Sheet open={isGroupInfoOpen} onOpenChange={setIsGroupInfoOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-black tracking-tight">{selectedGroup?.name}</SheetTitle>
                        <SheetDescription className="pt-2 italic text-muted-foreground/80">{selectedGroup?.description}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-8 space-y-6">
                        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 ml-1">Group Members</p>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto px-1 custom-scrollbar">
                                {selectedGroup?.members.map(member => (
                                    <div key={member._id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 group/member">
                                        <Avatar className="h-9 w-9"><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} /></Avatar>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate tracking-tight">{member.name}</p><p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">{member.role}</p></div>
                                        {(selectedGroup.createdBy === currentUser?.id || selectedGroup.admins.includes(currentUser?.id || "")) && member._id !== currentUser.id && <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full text-destructive opacity-0 group-hover/member:opacity-100 transition-opacity" onClick={() => handleRemoveFromGroup(member._id)}><X className="h-4 w-4" /></Button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {(selectedGroup?.createdBy === currentUser?.id || selectedGroup?.admins.includes(currentUser?.id || "")) && (
                            <div className="pt-4 border-t border-dashed">
                                {!isAddingMember ? (
                                    <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest gap-2" onClick={() => setIsAddingMember(true)}><Plus className="w-5 h-5" /> Add Member</Button>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-top-4">
                                        <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-muted/40 rounded-2xl custom-scrollbar">
                                            {chatUsers.filter(u => !selectedGroup.members.some(m => m._id === u._id)).map(user => (
                                                <div key={user._id} className={cn("flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all", newMemberSelection.includes(user._id) ? "bg-primary/20" : "hover:bg-primary/5")} onClick={() => setNewMemberSelection(prev => prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id])}>
                                                    <Avatar className="h-6 w-6"><AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} /></Avatar>
                                                    <span className="text-xs font-bold truncate">{user.name}</span>
                                                    {newMemberSelection.includes(user._id) && <Check className="h-3 w-3 text-primary ml-auto" />}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button className="flex-1 h-11 rounded-xl font-bold" onClick={handleAddMembersToGroup}>Add Selected</Button>
                                            <Button variant="ghost" className="flex-1 h-11 rounded-xl font-bold" onClick={() => { setIsAddingMember(false); setNewMemberSelection([]); }}>Cancel</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <Button variant="ghost" className="w-full h-12 rounded-2xl text-destructive font-black uppercase tracking-widest hover:bg-destructive/10 gap-2" onClick={handleLeaveGroup}><LogOut className="w-5 h-5" /> Exit Community</Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>Express with GIFs</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Search GIFs..." value={gifSearchTerm} onChange={(e) => setGifSearchTerm(e.target.value)} />
                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {["https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3Q0bHBoeWZpNnd4ZW5hZ3RpaXF4bm94eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxx6r7Y0l8Y/giphy.gif",
                                "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3Q0bHBoeWZpNnd4ZW5hZ3RpaXF4bm94eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlU0Nl4vQ7v0yvS/giphy.gif",
                                "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3Q0bHBoeWZpNnd4ZW5hZ3RpaXF4bm94eHh4eHh4eHh4eHh4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7XYMgbzgB2/giphy.gif"
                            ].map((url, i) => (
                                <img key={i} src={url} alt="gif" className="rounded-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => handleSendGif(url)} />
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MessagesPage;
