import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAPI } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Trash2 } from "lucide-react";
import { X, Upload, Edit, Check, X as CancelIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

function isDeletedText(text?: string): boolean {
  if (!text) return false;
  return (
    text.startsWith("This post was deleted by") ||
    text.startsWith("This comment was deleted by")
  );
}

export default function SpaceAdmin() {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    fetchSpaceById,
    fetchPostsPaged,
    removePost,
    fetchComments,
    removeComment,
    uploadSpaceImage,
    setSpaceImage,
    removeSpaceImage,
    setSpaceDescription,
  } = useAPI();

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusloop_access_token")
      : null;

  const [space, setSpace] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");

  useEffect(() => {
    if (!spaceSlug) return;
    (async () => {
      setLoading(true);
      const s = await fetchSpaceById(spaceSlug);
      if (!s) {
        setLoading(false);
        return;
      }
      setSpace(s);
      setIsOwner(Boolean(user && s?.creator?.id === user.id));
      setDescriptionValue(s.description || "");
      const list = await fetchPostsPaged({
        spaceSlug,
        sort: "new",
        limit: 200,
      });
      const items = Array.isArray(list?.items)
        ? list.items
        : Array.isArray(list)
        ? list
        : [];
      setPosts(items);
      setLoading(false);
    })();
  }, [spaceSlug, user?.id]);

  useEffect(() => {
    if (!selectedPostId) {
      setComments([]);
      return;
    }
    (async () => {
      const cs = await fetchComments(selectedPostId);
      setComments(Array.isArray(cs) ? cs : []);
    })();
  }, [selectedPostId]);

  const handleDeleteSpace = async () => {
    if (!token || !space) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }
    if (!isOwner) {
      toast({
        title: "Forbidden",
        description: "Only the owner can delete this space.",
        variant: "destructive",
      });
      return;
    }
    try {
      // Use API helper (fixed route in api.ts)
      const res = await (
        await import("@/api/api")
      ).deleteSpace(space.id, token);
      if (res?.ok) {
        toast({ title: "Space deleted" });
        navigate("/explore");
      } else {
        toast({ title: "Could not delete space", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error deleting space", variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }
    try {
      const res = await removePost(postId, token);
      if (res?.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPostId === postId) setSelectedPostId(null);
        toast({ title: "Post deleted" });
      } else {
        toast({ title: "Could not delete post", variant: "destructive" });
      }
    } catch (_) {
      toast({ title: "Error deleting post", variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token || !selectedPostId) return;
    try {
      const res = await removeComment(selectedPostId, commentId, token);
      if (res?.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast({ title: "Comment deleted" });
      } else {
        toast({ title: "Could not delete comment", variant: "destructive" });
      }
    } catch (_) {
      toast({ title: "Error deleting comment", variant: "destructive" });
    }
  };

  const handleSaveDescription = async () => {
    if (!token || !space) return;
    try {
      const updated = await setSpaceDescription(
        space.id,
        descriptionValue,
        token
      );
      if (updated) {
        setSpace(updated);
        setEditingDescription(false);
        toast({ title: "Description updated" });
      } else {
        toast({
          title: "Could not update description",
          variant: "destructive",
        });
      }
    } catch (_) {
      toast({ title: "Error updating description", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Space not found
          </h1>
          <Link to="/explore">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Explore
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Forbidden</h1>
          <p className="text-muted-foreground mb-6">
            Only the owner can manage this space.
          </p>
          <Link to={`/space/${space.slug}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Space
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground break-words">
              Manage {space.slug}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex  items-center gap-1 text-muted-foreground whitespace-nowrap">
              <Users className="h-4 w-4" />
              {space.memberCount?.toLocaleString() || 0} members
            </span>
            <Button
              size="sm"
              variant="default"
              onClick={() => setEditingDescription(true)}
              className="mt-1 p-3 h-auto text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit Description
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Space
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Space</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete this space and all its posts? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSpace}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="min-w-0">
          {" "}
          <div className="flex items-start gap-2">
            {editingDescription ? (
              <div className="flex-1 space-y-2">
                <textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  className="w-full p-2 border rounded resize-none"
                  rows={3}
                  placeholder="Enter space description..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={!token}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingDescription(false);
                      setDescriptionValue(space.description || "");
                    }}
                  >
                    <CancelIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-muted-foreground break-words whitespace-pre-wrap">
                  {space.description || "No description"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Space image management */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Space Image</h2>
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 rounded border bg-muted/30 overflow-hidden">
              {space.image ? (
                <img
                  src={space.image}
                  alt={`${space.slug} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f && f.type.startsWith("image/")) {
                    setImageFile(f);
                    setImagePreview(URL.createObjectURL(f));
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {space.image ? "Replace image" : "Upload image"}
                </Button>
                {space.image && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!token) {
                        toast({
                          title: "Login required",
                          variant: "destructive",
                        });
                        return;
                      }
                      try {
                        const res = await removeSpaceImage(
                          space.id || spaceSlug!,
                          token
                        );
                        if (res?.ok || res?.space) {
                          toast({ title: "Image removed" });
                          const refreshed = await fetchSpaceById(spaceSlug!);
                          if (refreshed) setSpace(refreshed);
                        } else {
                          toast({
                            title: "Could not remove image",
                            variant: "destructive",
                          });
                        }
                      } catch (_) {
                        toast({
                          title: "Error removing image",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove image
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 rounded border object-cover"
                  />
                  <Button
                    onClick={async () => {
                      if (!imageFile || !token) {
                        toast({
                          title: "Login required",
                          variant: "destructive",
                        });
                        return;
                      }
                      try {
                        setImageUploading(true);
                        const up = await uploadSpaceImage(imageFile, token);
                        const url = up?.url || "";
                        if (!url) throw new Error("upload failed");
                        const saved = await setSpaceImage(
                          space.id || spaceSlug!,
                          url,
                          token
                        );
                        if (saved) {
                          toast({ title: "Image updated" });
                          const refreshed = await fetchSpaceById(spaceSlug!);
                          if (refreshed) setSpace(refreshed);
                          setImageFile(null);
                          setImagePreview("");
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }
                      } catch (_) {
                        toast({
                          title: "Error updating image",
                          variant: "destructive",
                        });
                      } finally {
                        setImageUploading(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Posts management */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Posts</h2>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts in this space</p>
          ) : (
            <div className="grid gap-2">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 p-3 border rounded-md"
                >
                  <div className="min-w-0">
                    <div className="font-medium break-words">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPostId(p.id)}
                    >
                      Comments
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeletePost(p.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Comments for selected post */}
        {selectedPostId && (
          <section className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Comments</h2>
              <Button variant="outline" onClick={() => setSelectedPostId(null)}>
                Close
              </Button>
            </div>
            {comments.length === 0 ? (
              <p className="text-muted-foreground">No comments</p>
            ) : (
              <div className="grid gap-2">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 p-3 border rounded-md"
                  >
                    <div className="min-w-0">
                      <div className="text-sm break-words whitespace-pre-wrap">
                        {c.content}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by{" "}
                        {isDeletedText(c.content) ? (
                          "deleted user"
                        ) : c.author?.username ? (
                          <Link
                            to={`/profile/${encodeURIComponent(
                              c.author.username
                            )}`}
                            className="hover:underline break-words"
                          >
                            {c.author.username}
                          </Link>
                        ) : (
                          "unknown"
                        )}{" "}
                        • {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
