import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { FeedFilters } from "@/components/FeedFilters";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { useAPI } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";
import { Space, Post } from "@/types";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Check, Plus } from "lucide-react";
import { SpaceLogo } from "@/components/SpaceLogo";
import { useToast } from "@/hooks/use-toast";

export default function SpaceDetail() {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const {
    fetchSpaceById,
    fetchPostsPaged,
    joinSpace: apiJoinSpace,
    leaveSpace: apiLeaveSpace,
    fetchMySpaces,
  } = useAPI();
  const { user } = useAuth();
  const { toast } = useToast();

  const token = localStorage.getItem("campusloop_access_token");

  const [space, setSpace] = useState<Space | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("new");
  const [isJoined, setIsJoined] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  useEffect(() => {
    if (!spaceSlug) return;
    (async () => {
      setLoading(true);
      const spaceRes = await fetchSpaceById(spaceSlug);
      if (spaceRes) {
        setSpace(spaceRes);
        setIsJoined(!!spaceRes.joined);
        setIsOwner(Boolean(user) && spaceRes?.creator?.id === user.id);
      }
      const postsRes = await fetchPostsPaged({ spaceSlug, sort: sortBy });
      if (postsRes?.items) setPosts(postsRes.items);
      else if (Array.isArray(postsRes)) setPosts(postsRes);
      const accessToken = localStorage.getItem("campusloop_access_token");
      if (accessToken) {
        try {
          const mySpaces = await fetchMySpaces(accessToken);
          if (Array.isArray(mySpaces)) {
            const joined = mySpaces.some(
              (m: any) => m.space?.slug === spaceSlug || m.slug === spaceSlug
            );
            setIsJoined(joined);
          }
        } catch (_) {
          // ignore
        }
      }
      setLoading(false);
    })();
  }, [spaceSlug, sortBy]);

  // Keep isOwner in sync if user or space loads later
  useEffect(() => {
    setIsOwner(
      Boolean(user) && Boolean(space) && space?.creator?.id === user?.id
    );
  }, [user?.id, space?.creator?.id]);

  const handleManageSpace = async () => {
    if (!space) return;
    // Navigate to owner management page
    window.location.href = `/space/${space.slug}/admin`;
  };

  const handleJoinToggle = async () => {
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Please login to join spaces",
        variant: "destructive",
      });
      return;
    }

    setJoiningLoading(true);
    try {
      if (isJoined) {
        await apiLeaveSpace(space?.id || spaceSlug!, token);
        setIsJoined(false);
        toast({
          title: "Left space",
          description: `You left ${spaceSlug}`,
        });
        // Refresh space to update member count
        const refreshed = await fetchSpaceById(spaceSlug!);
        if (refreshed) setSpace(refreshed);
      } else {
        await apiJoinSpace(space?.id || spaceSlug!, token);
        setIsJoined(true);
        toast({
          title: "Joined space",
          description: `Welcome to${spaceSlug}!`,
        });
        // Refresh space to update member count
        const refreshed = await fetchSpaceById(spaceSlug!);
        if (refreshed) setSpace(refreshed);
        // Recompute membership from my spaces
        try {
          const mySpaces = await useAPI().fetchMySpaces(token);
          if (Array.isArray(mySpaces)) {
            const joined = mySpaces.some(
              (m: any) => m.space?.slug === spaceSlug || m.slug === spaceSlug
            );
            setIsJoined(joined);
          }
        } catch (_) {}
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
    setJoiningLoading(false);
  };

  const handleNewPostClick = () => {
    const token = localStorage.getItem("campusloop_access_token");
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to post.",
        variant: "destructive",
      });
      return;
    }
    setCreatePostOpen(true);
  };

  const handlePostCreated = async () => {
    // Refresh posts list to include the new post immediately
    if (!spaceSlug) return;
    const postsRes = await fetchPostsPaged({ spaceSlug, sort: sortBy });
    if (postsRes?.items) setPosts(postsRes.items);
    else if (Array.isArray(postsRes)) setPosts(postsRes);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 p">
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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4">
        {/* Back button */}
        <Link
          to="/explore"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Link>

        {/* Space Header */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <SpaceLogo
              image={space.image}
              alt={`${space.slug} logo`}
              className="h-16 w-16"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {space.slug}
              </h1>
              <p className="text-muted-foreground mt-1">{space.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {space.memberCount?.toLocaleString() || 0} members
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={isOwner ? handleManageSpace : handleJoinToggle}
                variant={isJoined ? "outline" : "default"}
                className="shrink-0"
              >
                {joiningLoading ? (
                  "Loading..."
                ) : isOwner ? (
                  <>Manage Space</>
                ) : isJoined ? (
                  <>Leave Space</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Join Space
                  </>
                )}
              </Button>
              <Button variant="hero" onClick={handleNewPostClick}>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>
        </div>

        {/* Feed Filters */}
        <FeedFilters activeSort={sortBy} onSortChange={setSortBy} />

        {/* Posts */}
        <div className="space-y-4 mt-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts in this space yet</p>
              <p className="text-sm mt-1">
                Be the first to start a conversation!
              </p>
            </div>
          ) : (
            posts.map((post: any) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  createdAt: new Date(post.createdAt),
                  spaceSlug: post.spaceSlug ?? post.space?.slug ?? "",
                  commentCount: post.commentCount ?? post.commentsCount ?? 0,
                  tags: post.tags ?? [],
                }}
              />
            ))
          )}
        </div>
      </main>
      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        onCreated={handlePostCreated}
        defaultSpaceId={space?.id || ""}
        lockSpace
      />
    </div>
  );
}
