import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { GoogleLogin } from '@react-oauth/google';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "student",
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        try {
            const { data } = await api.post("/auth/google", {
                idToken: credentialResponse.credential
            });
            if (data.success) {
                login(data.token, data.user);
                toast.success("Google registration successful!");
                navigate("/");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Google registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        toast.error("Google registration failed");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/register", formData);
            if (data.success) {
                login(data.token, data.user);
                toast.success("Account created successfully!");
                navigate("/");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 bg-card/80 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl animate-fade-in">
                <div className="text-center">
                    <div className="inline-flex p-3 rounded-xl bg-primary mb-4">
                        <GraduationCap className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Create account
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Join the modern learning experience
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-background/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="bg-background/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">I am a</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                            <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className="bg-background/50"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-4"
                        disabled={loading}
                        id="register-button"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign up"}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        shape="pill"
                        text="signup_with"
                    />
                </div>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <Link
                        to="/login"
                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                        id="login-link"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
