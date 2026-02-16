import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const { login } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        try {
            loginSchema.parse({ email, password });
            setErrors({});
            return true;
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const formattedErrors: { email?: string; password?: string } = {};
                error.errors.forEach((err) => {
                    if (err.path[0] === "email") formattedErrors.email = err.message;
                    if (err.path[0] === "password") formattedErrors.password = err.message;
                });
                setErrors(formattedErrors);
            }
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { email, password });
            if (data.success) {
                login(data.token, data.user);
                toast.success("Welcome back! Login successful.");
                navigate("/");
            }
        } catch (error: any) {
            console.error("Login error:", error);
            if (error.response?.status === 429) {
                toast.error("Too many login attempts. Please try again later.");
            } else {
                toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
            }
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
        toast.error("Google login failed. Please try again.");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 bg-card/80 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-2xl animate-fade-in">
                <div className="text-center">
                    <div className="inline-flex p-3 rounded-xl bg-primary mb-4">
                        <GraduationCap className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Welcome back
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Enter your credentials to access your classroom
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            className={`bg-background/50 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "email-error" : undefined}
                            disabled={loading}
                        />
                        {errors.email && (
                            <p id="email-error" className="text-sm text-destructive font-medium animate-slide-up">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline"
                                id="forgot-password-link"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors({ ...errors, password: undefined });
                                }}
                                className={`bg-background/50 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? "password-error" : undefined}
                                disabled={loading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p id="password-error" className="text-sm text-destructive font-medium animate-slide-up">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
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

                <div className="flex justify-center w-full">
                    <div className="w-full flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_blue"
                            shape="pill"
                            text="signin_with"
                            width="350" // Attempt to make it wider, though Google controls this largely
                        />
                    </div>
                </div>
                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Don't have an account? </span>
                    <Link
                        to="/register"
                        className="font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus:underline"
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
