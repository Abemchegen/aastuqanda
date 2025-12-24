import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/types";
import { useAuthAPI } from "@/hooks/use-authapi";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    ok: boolean;
    reason?: "email_not_verified" | "invalid" | "unknown";
  }>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  resendVerification: (email: string) => Promise<{
    ok: boolean;
    emailSent?: boolean;
    message?: string;
    reason?: string;
  }>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    loading,
    error,
    register: apiRegister,
    login: apiLogin,
    getCurrentUser,
    logout: apiLogout,
    resendVerification: apiResendVerification,
    refresh,
    deleteAccount: apiDeleteAccount,
  } = useAuthAPI();

  useEffect(() => {
    // Attempt to restore session from localStorage tokens
    const accessToken = localStorage.getItem("campusloop_access_token");
    const avatar = localStorage.getItem("campusloop_avatar") || "";
    if (accessToken) {
      (async () => {
        try {
          const me = await getCurrentUser(accessToken);
          if (me) {
            const restoredUser: User = {
              id: me.id ?? me.userId ?? `user_${Date.now()}`,
              username: me.username ?? me.name ?? "",
              email: me.email ?? me.email ?? "",
              avatar: me.avatar ?? avatar ?? "",
              createdAt: me.createdAt ? new Date(me.createdAt) : new Date(),
              bio: me.bio ?? "",
            };
            setUser(restoredUser);
            localStorage.setItem(
              "campusloop_user",
              JSON.stringify(restoredUser)
            );
          }
        } catch (_) {
          // If token invalid, clear session
          localStorage.removeItem("campusloop_access_token");
          localStorage.removeItem("campusloop_refresh_token");
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{
    ok: boolean;
    reason?: "email_not_verified" | "invalid" | "unknown";
  }> => {
    try {
      // Backend expects `username`; we pass the email value for login
      const res = await apiLogin({ email, password });
      if (!res) return { ok: false, reason: "unknown" };
      const accessToken = res.accessToken ?? res.token ?? res.access_token;
      const refreshToken = res.refreshToken ?? res.refresh_token;
      if (accessToken)
        localStorage.setItem("campusloop_access_token", accessToken);
      if (refreshToken)
        localStorage.setItem("campusloop_refresh_token", refreshToken);

      const me =
        res.user ?? (accessToken ? await getCurrentUser(accessToken) : null);
      if (me) {
        const loggedInUser: User = {
          id: me.id ?? me.userId ?? `user_${Date.now()}`,
          username:
            me.username ?? me.name ?? (email ? email.split("@")[0] : ""),
          email: me.email ?? email,
          avatar: me.avatar ?? localStorage.getItem("campusloop_avatar") ?? "",
          createdAt: me.createdAt ? new Date(me.createdAt) : new Date(),
          bio: me.bio ?? "",
        };
        setUser(loggedInUser);
        localStorage.setItem("campusloop_user", JSON.stringify(loggedInUser));
        return { ok: true };
      }
      return { ok: false, reason: "unknown" };
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === "email_not_verified")
        return { ok: false, reason: "email_not_verified" };
      if (code === "invalid credentials")
        return { ok: false, reason: "invalid" };
      return { ok: false, reason: "unknown" };
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ): Promise<boolean> => {
    try {
      // Persist avatar separately if backend does not handle it

      const emailToUse = email.trim();
      if (emailToUse.length < 0) return false;
      const res = await apiRegister({
        email: emailToUse,
        password,
        username,
      });
      if (!res) return false;

      // Do not auto-login; require email verification before login
      return true;
    } catch (_) {
      return false;
    }
  };

  const logout = () => {
    const accessToken = localStorage.getItem("campusloop_access_token");
    (async () => {
      try {
        if (accessToken) await apiLogout(accessToken);
      } catch (_) {
        // ignore network errors on logout
      } finally {
        setUser(null);
        localStorage.removeItem("campusloop_user");
        localStorage.removeItem("campusloop_access_token");
        localStorage.removeItem("campusloop_refresh_token");
      }
    })();
  };

  const deleteAccount = async () => {
    const accessToken = localStorage.getItem("campusloop_access_token");
    if (!accessToken) throw new Error("Not logged in");

    await apiDeleteAccount(accessToken);
    // After deletion, logout
    setUser(null);
    localStorage.removeItem("campusloop_user");
    localStorage.removeItem("campusloop_access_token");
    localStorage.removeItem("campusloop_refresh_token");
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;

    // Username cannot be changed!
    const { username, ...allowedUpdates } = updates;

    const updatedUser = { ...user, ...allowedUpdates };
    setUser(updatedUser);
    localStorage.setItem("campusloop_user", JSON.stringify(updatedUser));
    // Persist avatar locally for restoration across sessions
    if (allowedUpdates.avatar) {
      localStorage.setItem("campusloop_avatar", String(allowedUpdates.avatar));
    }
  };

  const resendVerification = async (
    email: string
  ): Promise<{
    ok: boolean;
    emailSent?: boolean;
    message?: string;
    reason?: string;
  }> => {
    try {
      const trimmed = email.trim();
      if (!trimmed) {
        return {
          ok: false,
          emailSent: false,
          message: "Email is required to resend verification.",
        };
      }
      const res = await apiResendVerification(trimmed);
      return {
        ok: Boolean(res?.ok),
        emailSent: res?.emailSent,
        message: res?.message,
        reason: res?.reason,
      };
    } catch (err) {
      return { ok: false, emailSent: false, message: "Resend failed." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        resendVerification,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// export { AVATAR_OPTIONS };
