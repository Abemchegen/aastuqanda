import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Plus, Menu, Bell, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAPI } from "@/hooks/use-api";

interface HeaderProps {
  onMenuClick: () => void;
  onCreatePost?: () => void;
  showCreateButton?: boolean;
}

export function Header({
  onMenuClick,
  onCreatePost,
  showCreateButton = true,
}: HeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsFetched, setNotificationsFetched] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchNotifications, readNotification } = useAPI();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setNotifications([]);
    setNotificationsFetched(false);
  }, [user?.id]);

  useEffect(() => {
    const shouldLoad = notificationsOpen && user && !notificationsFetched;
    if (!shouldLoad) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("campusloop_access_token")
        : null;
    if (!token) return;

    (async () => {
      try {
        setNotificationsLoading(true);
        const res = await fetchNotifications(token);
        const list = Array.isArray(res) ? res : res?.items || [];
        setNotifications(list);
        setNotificationsFetched(true);
      } finally {
        setNotificationsLoading(false);
      }
    })();
  }, [fetchNotifications, notificationsFetched, notificationsOpen, user]);

  const isDark = useMemo(() => {
    if (!mounted) return false;
    if (theme === "system") return resolvedTheme === "dark";
    return theme === "dark";
  }, [mounted, resolvedTheme, theme]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  // Friendly notification formatter
  const formatNotification = (n: any) => {
    const type = n?.type as string | undefined;
    const payload = n?.payload || {};
    let title: string = n?.title || "Notification";
    let message: string | undefined;
    let href: string | undefined;

    switch (type) {
      case "post_upvotes_milestone": {
        const votes = payload?.votes;
        const postId = payload?.postId;
        const postTitle = payload?.title;
        title = votes
          ? `Your post reached ${votes} upvotes`
          : "Post upvotes milestone";
        message = postTitle ? `“${postTitle}”` : undefined;
        href = postId ? `/post/${postId}` : undefined;
        break;
      }
      case "post_comments_milestone": {
        const comments = payload?.comments;
        const postId = payload?.postId;
        const postTitle = payload?.title;
        title = comments
          ? `Your post got ${comments} comments`
          : "Post comments milestone";
        message = postTitle ? `“${postTitle}”` : undefined;
        href = postId ? `/post/${postId}` : undefined;
        break;
      }
      case "space_members_milestone": {
        const members = payload?.members;
        const slug = payload?.slug;
        title = members
          ? `Your space reached ${members} members`
          : "Space members milestone";
        message = slug ? `Space: ${slug}` : undefined;
        href = slug ? `/space/${slug}` : undefined;
        break;
      }
      default: {
        title = n?.title || type || "Notification";
        message = n?.message;
      }
    }
    return { title, message, href };
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary overflow-hidden">
            <img
              src="/image.png"
              alt="AASTU Tea logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="hidden font-display text-xl font-bold md:inline-block">
            AASTU <span className="text-primary">Tea</span>
          </span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions, spaces, or topics..."
              className="pl-10 bg-secondary border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationsLoading ? (
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  Loading...
                </DropdownMenuItem>
              ) : notifications.length === 0 ? (
                <DropdownMenuItem className="text-sm text-muted-foreground">
                  No notifications
                </DropdownMenuItem>
              ) : (
                notifications.map((n) => {
                  const f = formatNotification(n);
                  const content = (
                    <div className="flex w-full flex-col items-start gap-1">
                      <span
                        className={`text-sm font-medium ${
                          n.read ? "" : "text-primary"
                        }`}
                      >
                        {f.title}
                      </span>
                      {f.message && (
                        <span className="text-xs text-muted-foreground">
                          {f.message}
                        </span>
                      )}
                      {n.createdAt && (
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  );
                  return (
                    <DropdownMenuItem
                      key={n.id ?? n._id ?? n.title}
                      className="flex flex-col items-start gap-1"
                      onSelect={(e) => {
                        // Allow navigation when a destination exists
                        if (f.href) {
                          e.preventDefault();
                          // Mark as read if possible
                          const token =
                            typeof window !== "undefined"
                              ? localStorage.getItem("campusloop_access_token")
                              : null;
                          if (token && n.id) {
                            readNotification(n.id, token).catch(() => {});
                          }
                          setNotificationsOpen(false);
                          navigate(f.href);
                        }
                      }}
                    >
                      {content}
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile / Login */}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="text-2xl"
            >
              <User />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
            >
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}

          {showCreateButton && (
            <>
              <Button
                variant="hero"
                onClick={onCreatePost}
                className="hidden sm:flex"
              >
                <Plus className="h-4 w-4" />
                New Post
              </Button>
              <Button
                variant="hero"
                size="icon"
                onClick={onCreatePost}
                className="sm:hidden"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
