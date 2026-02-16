import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Plus, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";

const Messages = () => {
    const [selectedMsg, setSelectedMsg] = useState<number | null>(null);
    const messages = [
        { id: 1, sender: "Dr. Sarah Wilson", preview: "Please review the notes for tomorrow's lecture...", time: "10:30 AM", unread: true },
        { id: 2, sender: "Prof. Michael Chen", preview: "The lab results have been posted in the portal.", time: "Yesterday", unread: false },
        { id: 3, sender: "Ms. Emily Brown", preview: "Don't forget to submit your essay by Friday.", time: "2 days ago", unread: false },
        { id: 4, sender: "Mr. David Lee", preview: "Code review feedback for your recent submission.", time: "3 days ago", unread: false },
    ];

    const handleNewMessage = () => {
        toast.info("Opening new message composer...");
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Message sent!");
    };

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
                        <Button className="gap-2" onClick={handleNewMessage}>
                            <Plus className="h-4 w-4" />
                            New Message
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                        {/* Message List */}
                        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
                            <CardHeader className="border-b px-4 py-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search messages..." className="pl-10" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex items-center gap-4 p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors ${msg.unread ? 'bg-primary/5' : ''} ${selectedMsg === msg.id ? 'border-l-4 border-l-primary bg-accent/30' : ''}`}
                                        onClick={() => setSelectedMsg(msg.id)}
                                    >
                                        <Avatar>
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`} />
                                            <AvatarFallback>{msg.sender[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className={`text-sm font-semibold truncate ${msg.unread ? 'text-foreground' : 'text-muted-foreground'}`}>{msg.sender}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{msg.time}</span>
                                            </div>
                                            <p className={`text-xs truncate ${msg.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                                {msg.preview}
                                            </p>
                                        </div>
                                        {msg.unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Chat Window */}
                        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
                            {selectedMsg ? (
                                <>
                                    <CardHeader className="border-b px-6 py-4 flex flex-row items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${messages.find(m => m.id === selectedMsg)?.sender}`} />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-bold">{messages.find(m => m.id === selectedMsg)?.sender}</h3>
                                            <p className="text-xs text-primary">Online</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-6 overflow-y-auto space-y-4 bg-muted/20">
                                        <div className="flex justify-start">
                                            <div className="bg-card border p-3 rounded-2xl rounded-tl-none max-w-[70%] text-sm">
                                                {messages.find(m => m.id === selectedMsg)?.preview}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded-full border">Today</span>
                                        </div>
                                        <div className="flex justify-end">
                                            <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[70%] text-sm">
                                                I'll review it today, thank you teacher.
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="p-4 border-t bg-card">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <Input placeholder="Type your message..." className="flex-1" />
                                            <Button type="submit" size="icon">
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
