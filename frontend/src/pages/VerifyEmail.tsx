import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthAPI } from "@/hooks/use-authapi";

type Status = "pending" | "success" | "error";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuthAPI();
  const { loginWithTokens } = useAuth();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState("Verifying your email...");
  const lastVerifiedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing. Please use the latest link.");
      return;
    }

    // In React 18 StrictMode (dev), effects can run twice. Verifying twice can
    // consume the token on the first request, making the second fail and show a
    // misleading error even though the user was already verified/logged in.
    if (lastVerifiedTokenRef.current === token) return;
    lastVerifiedTokenRef.current = token;

    (async () => {
      try {
        const res = await verifyEmail(token);
        if (res?.ok && res.accessToken && res.user) {
          // Automatically log the user in with the returned tokens
          loginWithTokens(res.accessToken, res.refreshToken, res.user);
          setStatus("success");
          setMessage("Email verified! Welcome to AASTU Tea...");
          setTimeout(() => navigate("/", { replace: true }), 1200);
        } else {
          setStatus("error");
          setMessage(
            res?.message || "Verification link is invalid or has expired."
          );
        }
      } catch (_) {
        setStatus("error");
        setMessage("Unable to verify right now. Please try again shortly.");
      }
    })();
  }, [searchParams, navigate, verifyEmail, loginWithTokens]);

  const Icon =
    status === "success"
      ? CheckCircle2
      : status === "error"
      ? XCircle
      : Loader2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Icon
              className={`h-12 w-12 ${
                status === "pending" ? "animate-spin" : ""
              } ${
                status === "success"
                  ? "text-green-500"
                  : status === "error"
                  ? "text-destructive"
                  : "text-primary"
              }`}
            />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          {status === "success" && (
            <p className="text-sm text-muted-foreground">
              You are all set! If the page does not redirect automatically, use
              the button below.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-muted-foreground">
              You can request a new verification email from the login page.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="hero"
              className="flex-1"
              onClick={() => navigate("/", { replace: true })}
            >
              Go to home
            </Button>
            {status === "error" && (
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/login">Resend from login</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
