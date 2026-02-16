import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Mail, KeyRound } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/forgotpassword", { email });
            if (data.success) {
                toast.success("OTP sent to your email!");
                setStep(2);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/resetpassword", { email, otp, newPassword });
            if (data.success) {
                toast.success("Password reset successful!");
                navigate("/login");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Reset failed");
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
                        {step === 1 ? "Forgot Password" : "Reset Password"}
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        {step === 1
                            ? "No worries, we'll send you reset instructions."
                            : "Enter the OTP sent to your email and your new password."}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background/50 pl-10"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            id="send-otp-button"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">One-Time Password (OTP)</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="otp"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="bg-background/50 pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={loading}
                            id="reset-password-button"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
                        </Button>

                        <Button
                            type="button"
                            variant="link"
                            className="w-full text-muted-foreground"
                            onClick={() => setStep(1)}
                            id="back-to-email-button"
                        >
                            Back to email
                        </Button>
                    </form>
                )}

                <div className="text-center text-sm">
                    <Link
                        to="/login"
                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                        id="back-to-login"
                    >
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
