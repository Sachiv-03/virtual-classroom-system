import { Sidebar } from "@/components/classroom/Sidebar";
import { Header } from "@/components/classroom/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Bell, Palette, Shield, LogOut, Users, BookOpen, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTheme } from "next-themes";

const Settings = () => {
    const { logout, user, login, updateUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();
    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

    useEffect(() => {
        setMounted(true);
    }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        department: (user as any)?.department || "",
        rollNumber: (user as any)?.rollNumber || ""
    });
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (isTeacher) {
            fetchStudents();
        }
    }, [isTeacher]);

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const response = await api.get('/dashboard/students');
            setStudents(response.data.data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load student list");
            setStudents([]); // Reset to empty array on error
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await api.put('/auth/updateprofile', profileData);
            if (response.data.success) {
                toast.success("Profile updated successfully");
                setIsEditing(false);
                updateUser(response.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

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
                                        {isEditing ? (
                                            <Input 
                                                value={profileData.name} 
                                                onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                                            />
                                        ) : (
                                            <div className="p-2 rounded-md bg-muted/50 border text-sm">{profileData.name}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <div className="p-2 rounded-md bg-muted/20 border text-sm text-muted-foreground">{user?.email}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        {isEditing ? (
                                            <Input 
                                                value={profileData.department} 
                                                onChange={(e) => setProfileData({...profileData, department: e.target.value})} 
                                                placeholder="e.g. Computer Science"
                                            />
                                        ) : (
                                            <div className="p-2 rounded-md bg-muted/50 border text-sm">{profileData.department || "Not set"}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Roll Number / Employee ID</Label>
                                        {isEditing ? (
                                            <Input 
                                                value={profileData.rollNumber} 
                                                onChange={(e) => setProfileData({...profileData, rollNumber: e.target.value})} 
                                                placeholder="e.g. CS101"
                                            />
                                        ) : (
                                            <div className="p-2 rounded-md bg-muted/50 border text-sm">{profileData.rollNumber || "Not set"}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button onClick={handleUpdateProfile}>Save Changes</Button>
                                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {isTeacher && (
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        <CardTitle>Student List</CardTitle>
                                    </div>
                                    <CardDescription>View all students registered in the system.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingStudents ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b text-left">
                                                        <th className="pb-2 font-semibold">Name</th>
                                                        <th className="pb-2 font-semibold">Enrolled Courses</th>
                                                        <th className="pb-2 font-semibold">Roll Number</th>
                                                        <th className="pb-2 font-semibold text-right">Level/XP</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {students?.length > 0 ? (
                                                        students.map((student) => (
                                                            <tr key={student._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                              <td className="py-3 font-medium">{student.name}</td>
                                                              <td className="py-3">
                                                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                      {student.coursesList?.length > 0 ? (
                                                                          student.coursesList.map((c: string, idx: number) => (
                                                                              <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 bg-primary/10 text-primary border-none">
                                                                                  {c}
                                                                              </Badge>
                                                                          ))
                                                                      ) : (
                                                                          <span className="text-muted-foreground text-xs italic">No courses</span>
                                                                      )}
                                                                  </div>
                                                              </td>
                                                              <td className="py-3">{student.rollNumber || "N/A"}</td>
                                                              <td className="py-3 text-right">
                                                                  <div className="flex items-center gap-1 justify-end">
                                                                      <GraduationCap className="h-3 w-3 text-primary" />
                                                                      <span>Lvl {student.level} ({student.xp} XP)</span>
                                                                  </div>
                                                              </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="py-4 text-center text-muted-foreground">No students found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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
                                    <Switch 
                                        id="dark-mode" 
                                        checked={mounted && theme === "dark"}
                                        onCheckedChange={(checked) => {
                                            setTheme(checked ? "dark" : "light");
                                            handleToggle("Dark mode");
                                        }} 
                                    />
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
