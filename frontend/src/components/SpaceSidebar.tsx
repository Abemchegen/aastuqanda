import { cn } from "@/lib/utils";
import { Home, Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAPI } from "@/hooks/use-api";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface SpaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpace: string | null;
  onSelectSpace: (slug: string | null) => void;
}

export function SpaceSidebar({
  isOpen,
  onClose,
  selectedSpace,
  onSelectSpace,
}: SpaceSidebarProps) {
  const { fetchSpaces } = useAPI();
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<
    Array<{ id: string; slug: string; icon?: string; description?: string }>
  >([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDescription, setSpaceDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { createSpaceRequest } = useAPI();

  useEffect(() => {
    (async () => {
      const res = await fetchSpaces();
      if (Array.isArray(res)) setSpaces(res);
    })();
  }, []);

  const handleCreateSpace = async () => {
    const name = spaceName.trim();
    const description = spaceDescription.trim();
    if (name.length < 3) {
      toast({
        title: "Name is too short",
        description: "Please enter at least 3 characters.",
        variant: "destructive",
      });
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("campusloop_access_token")
        : null;
    if (!token) {
      toast({
        title: "Please log in",
        description: "You need to be signed in to create a space.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await createSpaceRequest({ name, description }, token);
      toast({
        title: "Space request sent",
        description: "Your space has been submitted for creation.",
      });
      setSpaceName("");
      setSpaceDescription("");
      setCreateOpen(false);
      const refreshed = await fetchSpaces();
      if (Array.isArray(refreshed)) setSpaces(refreshed);
    } catch (err: any) {
      const message = err?.response?.data?.error || "Could not create space.";
      toast({
        title: "Create failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateSpace = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("campusloop_access_token")
        : null;
    if (!token) {
      toast({
        title: "Please log in",
        description: "Create an account or log in to create a space.",
        variant: "destructive",
      });
      return;
    }
    setCreateOpen(true);
  };

  const navItems = [
    { label: "Home", icon: Home, slug: null, path: "/" },
    { label: "Explore", icon: Compass, slug: "explore", path: "/explore" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-sidebar transition-transform duration-300 ease-in-out md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col pt-16 md:pt-0">
          {/* Navigation */}
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant={selectedSpace === item.slug ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  selectedSpace === item.slug &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => {
                  if (item.path === "/explore") {
                    navigate("/explore");
                    // Don't close sidebar on desktop for explore
                    if (window.innerWidth < 768) onClose();
                  } else {
                    onSelectSpace(item.slug);
                    onClose();
                  }
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Divider */}
          <div className="mx-4 h-px bg-sidebar-border" />

          {/* Spaces */}
          <div className="flex-1 overflow-auto p-4">
            <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Spaces
            </h3>

            <Button
              variant="secondary"
              className="mb-3 w-full justify-start gap-2"
              onClick={handleOpenCreateSpace}
            >
              <Plus className="h-4 w-4" />
              Create space
            </Button>

            <nav className="space-y-1">
              {spaces.map((space) => (
                <Link
                  key={space.id}
                  to={`/space/${space.slug}`}
                  onClick={onClose}
                >
                  <Button
                    variant={
                      selectedSpace === space.slug ? "secondary" : "ghost"
                    }
                    className={cn(
                      "w-full justify-start gap-3",
                      selectedSpace === space.slug &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <span className="text-lg">{space.icon}</span>
                    <span className="flex-1 truncate text-left">
                      <span className="text-space-prefix font-medium">
                        loop/
                      </span>
                      {space.slug}
                    </span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <p className="text-xs text-muted-foreground text-center">
              Made for AASTU students 🎓
            </p>
          </div>
        </div>
      </aside>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Create a new space
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Space name</label>
              <Input
                placeholder="e.g. engineering, alumni, cs2025"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="What is this space about?"
                rows={3}
                value={spaceDescription}
                onChange={(e) => setSpaceDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSpace} disabled={submitting}>
              {submitting ? "Creating..." : "Create space"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
