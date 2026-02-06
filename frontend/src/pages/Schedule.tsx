import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

const Schedule = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
        <div className="min-h-screen bg-background bg-gradient-mesh">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
                            <p className="text-muted-foreground">Manage your classes and upcoming events</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Calendar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border shadow"
                                />
                            </CardContent>
                        </Card>

                        <Card className="col-span-1 lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Upcoming Classes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { time: "09:00 AM", subject: "Advanced Mathematics", type: "Lecture", room: "Room 101" },
                                        { time: "11:00 AM", subject: "Physics 101", type: "Lab", room: "Lab A" },
                                        { time: "02:00 PM", subject: "English Literature", type: "Seminar", room: "Room 204" },
                                        { time: "04:00 PM", subject: "Computer Science", type: "Lecture", room: "Online" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card/50 hover:bg-accent/50 transition-colors">
                                            <div className="flex gap-4">
                                                <div className="font-mono text-primary font-bold">{item.time}</div>
                                                <div>
                                                    <h4 className="font-bold">{item.subject}</h4>
                                                    <p className="text-sm text-muted-foreground">{item.type} • {item.room}</p>
                                                </div>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-primary/50" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Schedule;
