import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// import { posts } from "@/data/mockData";
// import { getCommentsForPost } from "@/data/mockComments";
import { Comment } from "@/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAPI } from "@/hooks/use-api";

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentCard({
  comment,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
}: {
  comment: Comment;
  depth?: number;
  onReply: (parentId: string, text: string) => Promise<void> | void;
  onEdit: (commentId: string, content: string) => Promise<void> | void;
  onDelete: (commentId: string) => Promise<void> | void;
  currentUserId?: string;
}) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const baseVotes = (comment.votes as number) || 0;
  const currentVotes =
    baseVotes + (vote === "up" ? 1 : vote === "down" ? -1 : 0);
  const isDeleted =
    comment.content === "This comment was deleted by the owner.";

  return (
    <div
      className={cn("border-l-2 border-border/50 pl-4", depth > 0 && "ml-4")}
    >
      <div className="py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">
            {comment.author?.username || comment.authorId}
          </span>
          <span>•</span>
          <span>{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p
          className={cn(
            "text-foreground mb-3",
            isDeleted && "text-muted-foreground italic"
          )}
        >
          {comment.content}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant={vote === "up" ? "upvote-active" : "ghost"}
            size="icon-sm"
            onClick={() => setVote(vote === "up" ? null : "up")}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <span
            className={cn(
              "text-sm font-medium tabular-nums",
              vote === "up" && "text-upvote",
              vote === "down" && "text-downvote"
            )}
          >
            {currentVotes}
          </span>
          <Button
            variant={vote === "down" ? "downvote-active" : "ghost"}
            size="icon-sm"
            onClick={() => setVote(vote === "down" ? null : "down")}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          {!isDeleted && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-2"
              onClick={() => setShowReply(!showReply)}
            >
              Reply
            </Button>
          )}
          {currentUserId &&
            comment.authorId === currentUserId &&
            !isDeleted && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    const edited =
                      prompt("Edit your comment", comment.content || "") ||
                      comment.content;
                    if (edited && edited !== comment.content)
                      onEdit(comment.id, edited);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => onDelete(comment.id)}
                >
                  Delete
                </Button>
              </>
            )}
        </div>

        {showReply && (
          <div className="mt-3 flex gap-2">
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              size="icon"
              disabled={!replyText.trim()}
              onClick={async () => {
                const text = replyText.trim();
                if (!text) return;
                await onReply(comment.id, text);
                setReplyText("");
                setShowReply(false);
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {comment.replies &&
        comment.replies.map((reply) => (
          <CommentCard
            key={reply.id}
            comment={reply as any}
            depth={depth + 1}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUserId={currentUserId}
          />
        ))}
    </div>
  );
}

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    fetchPostById,
    fetchComments,
    addComment,
    voteOnPost,
    savePost: apiSavePost,
    unsavePost: apiUnsavePost,
    editPost,
    removePost,
    editComment,
    removeComment,
  } = useAPI();

  // const post = posts.find(p => p.id === postId);
  // const comments = postId ? getCommentsForPost(postId) : [];

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [saved, setSaved] = useState(false);
  const [newComment, setNewComment] = useState("");
  const POST_DELETED_PLACEHOLDER = "This post was deleted by the owner.";
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("campusloop_access_token") || ""
      : "";
  const postUrl =
    typeof window !== "undefined" && postId
      ? `${window.location.origin}/post/${postId}`
      : "";

  // Build a nested tree from flat comments by parentId
  const buildCommentTree = (flat: any[]) => {
    const map = new Map<string, any>();
    const roots: any[] = [];
    flat.forEach((c) => {
      map.set(c.id, { ...c, createdAt: new Date(c.createdAt), replies: [] });
    });
    map.forEach((c) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId).replies.push(c);
      } else {
        roots.push(c);
      }
    });
    return roots;
  };

  useEffect(() => {
    if (!postId) return;
    (async () => {
      setLoading(true);
      try {
        const p = await fetchPostById(postId);
        if (p) {
          setPost(p);
          setEditTitle(p.title || "");
          setEditContent(p.content || "");
          if (p.currentUserVote === "upvote") setVote("up");
          else if (p.currentUserVote === "downvote") setVote("down");
        }
        const cs = await fetchComments(postId);
        if (Array.isArray(cs)) setComments(buildCommentTree(cs));
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  // if (!post) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold mb-2">Post not found</h1>
  //         <Button onClick={() => navigate("/")}>Go back home</Button>
  //       </div>
  //     </div>
  //   );
  // }

  // const currentVotes =
  //   post.upvotes -
  //   post.downvotes +
  //   (vote === "up" ? 1 : vote === "down" ? -1 : 0);

  const handleDeletePost = async () => {
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to delete.",
        variant: "destructive",
      });
      return;
    }
    if (!postId) return;
    try {
      const res = await removePost(postId, token);
      if (res?.post) {
        setPost(res.post);
        setSaved(false);
      }
      toast({ title: "Post deleted" });
    } catch (_) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const isPostDeleted = () => post?.content === POST_DELETED_PLACEHOLDER;

  const handleEditPost = async () => {
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to edit.",
        variant: "destructive",
      });
      return;
    }
    if (!postId || !post) return;
    setEditTitle(post.title || "");
    setEditContent(post.content || "");
    setEditOpen(true);
  };

  const handleEditComment = async (commentId: string, content: string) => {
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Log in to edit.",
        variant: "destructive",
      });
      return;
    }
    if (!postId) return;
    try {
      await editComment(postId, commentId, content, token);
      const cs = await fetchComments(postId);
      if (Array.isArray(cs)) setComments(buildCommentTree(cs));
      toast({ title: "Comment updated" });
    } catch (_) {
      toast({ title: "Failed to update comment", variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Log in to delete.",
        variant: "destructive",
      });
      return;
    }
    if (!postId) return;
    try {
      await removeComment(postId, commentId, token);
      const cs = await fetchComments(postId);
      if (Array.isArray(cs)) setComments(buildCommentTree(cs));
      toast({ title: "Comment deleted" });
    } catch (_) {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    }
  };

  const handleVote = async (type: "upvote" | "downvote" | "none") => {
    if (isPostDeleted()) return;
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to vote.",
        variant: "destructive",
      });
      return;
    }
    if (!postId) return;
    const res = await voteOnPost(postId, { type }, token);
    if (res) {
      setPost(res);
      if (!res.currentUserVote) setVote(null);
      else if (res.currentUserVote === "upvote") setVote("up");
      else if (res.currentUserVote === "downvote") setVote("down");
    }
  };

  const handleToggleSave = async () => {
    if (isPostDeleted()) return;
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to save posts.",
        variant: "destructive",
      });
      return;
    }
    if (!postId) return;
    if (saved) {
      await apiUnsavePost(postId, token);
      setSaved(false);
    } else {
      await apiSavePost(postId, token);
      setSaved(true);
    }
  };

  const handleAddComment = async () => {
    if (isPostDeleted()) return;
    if (!newComment.trim()) return;
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to comment.",
        variant: "destructive",
      });
      return;
    }
    if (!postId) return;
    const res = await addComment(postId, { content: newComment.trim() }, token);
    if (res) {
      toast({
        title: "Comment posted!",
        description: "Your comment was added.",
      });
      setNewComment("");
      const cs = await fetchComments(postId);
      if (Array.isArray(cs)) setComments(buildCommentTree(cs));
    } else {
      toast({
        title: "Failed to comment",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReply = async (parentId: string, text: string) => {
    if (isPostDeleted()) return;
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to reply.",
        variant: "destructive",
      });
      return;
    }
    if (!postId) return;
    const res = await addComment(postId, { content: text, parentId }, token);
    if (res) {
      const cs = await fetchComments(postId);
      if (Array.isArray(cs)) setComments(buildCommentTree(cs));
    } else {
      toast({ title: "Failed to reply", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium text-space-prefix">
            {/* loop/{post.spaceSlug} */}
          </span>
        </div>
      </header>

      <main className="container max-w-3xl py-6 px-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        ) : !post ? (
          <div className="text-center text-muted-foreground">
            Post not found
          </div>
        ) : (
          <>
            {/* Post */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Votes */}
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant={vote === "up" ? "upvote-active" : "upvote"}
                      size="icon"
                      onClick={() =>
                        handleVote(vote === "up" ? "none" : "upvote")
                      }
                    >
                      <ChevronUp className="h-6 w-6" />
                    </Button>
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        vote === "up" && "text-upvote",
                        vote === "down" && "text-downvote"
                      )}
                    >
                      {typeof post?.votes === "number"
                        ? post.votes
                        : (post?.upvotes || 0) - (post?.downvotes || 0)}
                    </span>
                    <Button
                      variant={vote === "down" ? "downvote-active" : "downvote"}
                      size="icon"
                      onClick={() =>
                        handleVote(vote === "down" ? "none" : "downvote")
                      }
                    >
                      <ChevronDown className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>
                        Posted by {post.author?.username || post.authorId}
                      </span>
                      <span>•</span>
                      <span>
                        {post.createdAt
                          ? formatTimeAgo(new Date(post.createdAt))
                          : ""}
                      </span>
                    </div>

                    <h1 className="font-display text-2xl font-bold mb-4">
                      {post.title}
                    </h1>
                    <p
                      className={cn(
                        "text-foreground leading-relaxed mb-4",
                        post.content === POST_DELETED_PLACEHOLDER &&
                          "text-muted-foreground italic"
                      )}
                    >
                      {post.content}
                    </p>

                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {comments.length} Comments
                      </Button>
                      {user &&
                        post.authorId === user.id &&
                        post.content !== POST_DELETED_PLACEHOLDER && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleEditPost}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleDeletePost}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      {post.content !== POST_DELETED_PLACEHOLDER && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(saved && "text-accent")}
                          onClick={handleToggleSave}
                        >
                          <Bookmark
                            className={cn(
                              "h-4 w-4 mr-2",
                              saved && "fill-current"
                            )}
                          />
                          {saved ? "Saved" : "Save"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const urlToCopy = postUrl || window.location.href;
                            await navigator.clipboard.writeText(urlToCopy);
                            toast({
                              title: "Link copied",
                              description: "Post URL copied to clipboard.",
                            });
                          } catch (_) {
                            toast({
                              title: "Copy failed",
                              description: "Could not copy link.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add comment */}
            {isPostDeleted() ? (
              <Card className="mb-6">
                <CardContent className="p-4 text-muted-foreground italic">
                  This post was deleted by the owner. New comments are disabled.
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <Textarea
                    placeholder={
                      user ? "Add a comment..." : "Log in to comment..."
                    }
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-3 min-h-[100px]"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {user ? `Posting as ${user.username}` : "Not logged in"}
                    </span>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Comments */}
            <div className="space-y-2">
              <h2 className="font-semibold text-lg mb-4">
                Comments ({comments.length})
              </h2>
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                comments.map((c) => (
                  <CommentCard
                    key={c.id}
                    comment={{ ...c, createdAt: new Date(c.createdAt) }}
                    onReply={handleReply}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    currentUserId={user?.id}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-base font-medium"
            />
            <Textarea
              placeholder="Update your content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                variant="hero"
                onClick={async () => {
                  if (!user || !token) {
                    toast({
                      title: "Login required",
                      description: "Log in to edit.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!postId || !post) return;
                  if (!editTitle.trim()) {
                    toast({ title: "Title required", variant: "destructive" });
                    return;
                  }
                  try {
                    setEditSaving(true);
                    const updated = await editPost(
                      postId,
                      { title: editTitle.trim(), content: editContent },
                      token
                    );
                    setPost(updated);
                    toast({ title: "Post updated" });
                    setEditOpen(false);
                  } catch (_) {
                    toast({
                      title: "Failed to update",
                      variant: "destructive",
                    });
                  } finally {
                    setEditSaving(false);
                  }
                }}
                disabled={editSaving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
