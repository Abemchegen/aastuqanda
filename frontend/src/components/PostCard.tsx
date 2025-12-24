import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Bookmark,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/types";
import { cn } from "@/lib/utils";
import { useAPI } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

function formatTimeAgo(
  dateLike: Date | string | number | null | undefined
): string {
  const date =
    dateLike instanceof Date ? dateLike : new Date(dateLike ?? Date.now());
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Extract image URLs from Markdown content (and basic <img> tags)
function extractImageUrlsFromMarkdown(md: string | undefined): string[] {
  if (!md) return [];
  const urls: string[] = [];
  // Markdown images: ![alt](url "title")
  const mdImg = /!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdImg.exec(md)) !== null) {
    urls.push(m[1]);
  }
  // HTML <img src="...">
  const htmlImg = /<img[^>]*src=\"([^\"]+)\"[^>]*>/gi;
  while ((m = htmlImg.exec(md)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

// Remove image markdown/tags for a cleaner text preview
function stripImagesFromMarkdown(md: string | undefined): string {
  if (!md) return "";
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<img[^>]*>/gi, "")
    .trim();
}

export function PostCard({ post, onClick }: PostCardProps) {
  const navigate = useNavigate();
  const initialVote = (post as any).currentUserVote;
  const [vote, setVote] = useState<"up" | "down" | null>(
    initialVote === "upvote" ? "up" : initialVote === "downvote" ? "down" : null
  );
  const [score, setScore] = useState<number>(
    typeof post.votes === "number" ? post.votes : 0
  );
  const [saved, setSaved] = useState(false);
  const { voteOnPost, savePost, unsavePost } = useAPI();
  const { toast } = useToast();

  const currentVotes = score;

  const requireAuthToast = () => {
    toast({
      title: "Login required",
      description: "Create an account or log in to vote.",
      variant: "destructive",
    });
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/post/${post.id}`);
    }
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    navigate(`/tag/${tag}`);
  };

  const imageUrls = extractImageUrlsFromMarkdown(post.content);
  const previewImage = imageUrls[0];
  const previewText = stripImagesFromMarkdown(post.content);

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md hover:border-primary/20 animate-fade-in",
        post.isFaq && "border-accent/30 bg-accent/5"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={vote === "up" ? "upvote-active" : "upvote"}
              size="icon-sm"
              onClick={async (e) => {
                e.stopPropagation();
                const token =
                  localStorage.getItem("campusloop_access_token") || "";
                if (!token) {
                  requireAuthToast();
                  return;
                }
                const next = vote === "up" ? null : "up";
                setVote(next);
                const res = await voteOnPost(
                  post.id,
                  {
                    type: next
                      ? next === "up"
                        ? "upvote"
                        : "downvote"
                      : "none",
                  },
                  token
                );
                if (res) {
                  setScore(typeof res.votes === "number" ? res.votes : score);
                  if (!res.currentUserVote) setVote(null);
                  else if (res.currentUserVote === "upvote") setVote("up");
                  else if (res.currentUserVote === "downvote") setVote("down");
                }
              }}
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                vote === "up" && "text-upvote",
                vote === "down" && "text-downvote"
              )}
            >
              {currentVotes}
            </span>
            <Button
              variant={vote === "down" ? "downvote-active" : "downvote"}
              size="icon-sm"
              onClick={async (e) => {
                e.stopPropagation();
                const token =
                  localStorage.getItem("campusloop_access_token") || "";
                if (!token) {
                  requireAuthToast();
                  return;
                }
                const next = vote === "down" ? null : "down";
                setVote(next);
                const res = await voteOnPost(
                  post.id,
                  {
                    type: next
                      ? next === "down"
                        ? "downvote"
                        : "upvote"
                      : "none",
                  },
                  token
                );
                if (res) {
                  setScore(typeof res.votes === "number" ? res.votes : score);
                  if (!res.currentUserVote) setVote(null);
                  else if (res.currentUserVote === "upvote") setVote("up");
                  else if (res.currentUserVote === "downvote") setVote("down");
                }
              }}
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
              <span className="font-medium text-space-prefix">
                {post.spaceSlug}
              </span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
              {post.isFaq && (
                <Badge
                  variant="secondary"
                  className="bg-accent/20 text-accent-foreground text-xs"
                >
                  FAQ
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-display font-semibold text-foreground leading-snug mb-1 line-clamp-2">
              {post.title}
            </h3>

            {/* Preview with optional image thumbnail */}
            {/* <p className="text-sm text-muted-foreground line-clamp-2 flex-1 min-w-0">
                {previewText}
              </p> */}
            {previewImage && (
              <div className="shrink-0">
                <img
                  src={previewImage}
                  alt="post image"
                  className="rounded-md w-28 h-20 object-cover border"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/post/${post.id}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <div className="flex items-center gap-1 ml-11">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {post.commentCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-muted-foreground", saved && "text-accent")}
            onClick={(e) => {
              e.stopPropagation();
              const next = !saved;
              setSaved(next);
              const token =
                localStorage.getItem("campusloop_access_token") || "";
              if (next) {
                savePost(post.id, token);
              } else {
                unsavePost(post.id, token);
              }
            }}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={async (e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/post/${post.id}`;
              try {
                await navigator.clipboard.writeText(url);
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
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
