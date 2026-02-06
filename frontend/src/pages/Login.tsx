import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { email, password });
            if (data.success) {
                login(data.token, data.user);
                toast.success("Login successful!");
                navigate("/");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        try {
            const { data } = await api.post("/auth/google", {
                idToken: credentialResponse.credential
            });
            if (data.success) {
                login(data.token, data.user);
                toast.success("Google login successful!");
                navigate("/");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Google login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        toast.error("Google login failed");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-4">
            <div className="w-full max-w-md space-y-8 bg-card/80 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl animate-fade-in">
                <div className="text-center">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-primary mb-4">
                        <GraduationCap className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Welcome back
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Enter your credentials to access your classroom
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-background/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                id="forgot-password-link"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-background/50"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                        disabled={loading}
                        id="login-button"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
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
                        text="signin_with"
                    />
                </div>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Don't have an account? </span>
                    <Link
                        to="/register"
                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                        id="register-link"
                    >
                        Create an account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
