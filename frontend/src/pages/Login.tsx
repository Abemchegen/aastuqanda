import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login, user, resendVerification, forgotPassword } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.ok) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        navigate("/");
      } else {
        if (result.reason === "email_not_verified") {
          toast({
            title: "Verify your email",
            description: "We sent you a verification link. Resend if needed.",
          });
        } else {
          toast({
            title: "Login failed",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: "Add your email first",
        description: "Enter the email you registered with to resend the link.",
        variant: "destructive",
      });
      return;
    }
    setIsResending(true);
    try {
      const res = await resendVerification(trimmedEmail);
      if (res?.ok && res.emailSent !== false) {
        toast({
          title: "Verification email sent",
          description: "Check your inbox (and spam) for the link.",
        });
      } else {
        const isSmtpMissing = res?.reason === "smtp_not_configured";
        toast({
          title: isSmtpMissing ? "Email not configured" : "Could not resend",
          description:
            res?.message ||
            (isSmtpMissing
              ? "Email is not configured on the server. Contact support/admin."
              : "Please try again in a moment."),
          variant: "destructive",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: "Add your email first",
        description:
          "Enter the email you registered with to reset your password.",
        variant: "destructive",
      });
      return;
    }
    setIsForgotPasswordLoading(true);
    try {
      const res = await forgotPassword(trimmedEmail);
      if (res?.ok && res.emailSent !== false) {
        toast({
          title: "Reset email sent",
          description: "Check your inbox (and spam) for the reset link.",
        });
      } else {
        toast({
          title: "Could not send reset email",
          description: res?.message || "Please try again in a moment.",
          variant: "destructive",
        });
      }
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">
                C
              </span>
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold">
            Campus<span className="text-primary">Loop</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, AASTU student!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={handleForgotPassword}
                    disabled={isForgotPasswordLoading}
                  >
                    {isForgotPasswordLoading
                      ? "Sending..."
                      : "Forgot Password?"}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-3 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Need a new verification email?
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend verification link"}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Continue browsing anonymously →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
