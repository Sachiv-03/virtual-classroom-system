import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Bell, Palette, Shield, LogOut } from "lucide-react";

const Settings = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = () => {
        logout();
        toast.success("Signed out successfully");
        navigate("/login");
    };

    const handleToggle = (setting: string) => {
        toast.success(`${setting} updated`);
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="ml-64 transition-all duration-300">
                <Header />

                <div className="p-6 space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                            <p className="text-muted-foreground">Manage your account and preferences</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    <CardTitle>Profile Information</CardTitle>
                                </div>
                                <CardDescription>Update your personal details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <div className="p-2 rounded-md bg-muted/50 border text-sm">{user?.name}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <div className="p-2 rounded-md bg-muted/50 border text-sm">{user?.email}</div>
                                    </div>
                                </div>
                                <Button onClick={() => toast.info("Profile editing coming soon!")}>Edit Profile</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    <CardTitle>Notifications</CardTitle>
                                </div>
                                <CardDescription>Manage how you receive notifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="email-notifs">Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive emails about new assignments.</p>
                                    </div>
                                    <Switch id="email-notifs" defaultChecked onCheckedChange={() => handleToggle("Email notifications")} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="push-notifs">Push Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Receive push notifications on device.</p>
                                    </div>
                                    <Switch id="push-notifs" defaultChecked onCheckedChange={() => handleToggle("Push notifications")} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary" />
                                    <CardTitle>Appearance</CardTitle>
                                </div>
                                <CardDescription>Customize the look and feel.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="dark-mode">Dark Mode</Label>
                                        <p className="text-sm text-muted-foreground">Toggle dark mode theme.</p>
                                    </div>
                                    <Switch id="dark-mode" onCheckedChange={() => handleToggle("Dark mode")} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 border-destructive/20 bg-destructive/5">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-destructive" />
                                    <CardTitle>Security & Account</CardTitle>
                                </div>
                                <CardDescription>Manage your account security.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-destructive font-semibold">Sign Out</Label>
                                        <p className="text-sm text-muted-foreground">Logout from this device.</p>
                                    </div>
                                    <Button variant="destructive" onClick={handleSignOut} id="settings-sign-out">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Sign Out
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
