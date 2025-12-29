import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SpaceLogo } from "@/components/SpaceLogo";
import { PostCard } from "@/components/PostCard";
import { FeedFilters } from "@/components/FeedFilters";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { useAPI } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [posts, setPosts] = useState<any[]>([]);
  const { fetchPostsPaged, fetchSpaces } = useAPI();
  const [spaces, setSpaces] = useState<
    Array<{
      id: string;
      slug: string;
      icon?: string;
      description?: string;
      image?: string;
    }>
  >([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const { user } = useAuth();

  // Initial load and reload on filter/sort changes
  useEffect(() => {
    (async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("campusloop_access_token")
          : null;
      const joinedOnly = !selectedSpace && Boolean(token);
      const ps = await fetchPostsPaged({
        page: 1,
        limit,
        sort: sortBy,
        spaceSlug: selectedSpace ?? undefined,
        joinedOnly,
      });
      if (ps?.items) {
        setPosts(ps.items);
        setHasMore(Boolean(ps.hasMore ?? ps.items.length === limit));
      } else if (Array.isArray(ps)) {
        setPosts(ps);
        setHasMore(ps.length === limit);
      }
      setPage(1);
      const sp = await fetchSpaces();
      if (Array.isArray(sp)) setSpaces(sp);
    })();
  }, [limit, sortBy, selectedSpace]);

  // Infinite scroll: observe sentinel at list end
  useEffect(() => {
    const sentinel = document.getElementById("feed-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isFetchingMore) {
          setIsFetchingMore(true);
          const nextPage = page + 1;
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("campusloop_access_token")
              : null;
          const joinedOnly = !selectedSpace && Boolean(token);
          const ps = await fetchPostsPaged({
            page: nextPage,
            limit,
            sort: sortBy,
            spaceSlug: selectedSpace ?? undefined,
            joinedOnly,
          });
          if (ps?.items) {
            setPosts((prev) => [...prev, ...ps.items]);
            setHasMore(Boolean(ps.hasMore ?? ps.items.length === limit));
          } else if (Array.isArray(ps)) {
            setPosts((prev) => [...prev, ...ps]);
            setHasMore(ps.length === limit);
          }
          setPage(nextPage);
          setIsFetchingMore(false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    page,
    limit,
    sortBy,
    selectedSpace,
    hasMore,
    isFetchingMore,
    fetchPostsPaged,
  ]);

  const filteredPosts =
    selectedSpace &&
    selectedSpace !== "trending" &&
    selectedSpace !== "explore" &&
    selectedSpace !== "saved"
      ? posts.filter(
          (post) =>
            post.spaceSlug === selectedSpace ||
            post.space?.slug === selectedSpace
        )
      : posts;

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === "new")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    const aval =
      typeof a.votes === "number"
        ? a.votes
        : (a.upvotes || 0) - (a.downvotes || 0);
    const bval =
      typeof b.votes === "number"
        ? b.votes
        : (b.upvotes || 0) - (b.downvotes || 0);
    if (sortBy === "top") return bval - aval;
    const aScore =
      aval /
      Math.pow(
        (Date.now() - new Date(a.createdAt).getTime()) / 3600000 + 2,
        1.5
      );
    const bScore =
      bval /
      Math.pow(
        (Date.now() - new Date(b.createdAt).getTime()) / 3600000 + 2,
        1.5
      );
    return bScore - aScore;
  });

  const currentSpace = spaces.find((s) => s.slug === selectedSpace);
  const isHomeJoinedFeed =
    !selectedSpace &&
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem("campusloop_access_token"));

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <div className="">
          {/* Feed */}
          <div className="space-y-4">
            {/* Space header */}
            {currentSpace && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border animate-fade-in">
                <SpaceLogo
                  image={currentSpace?.image}
                  alt={`${currentSpace?.slug} logo`}
                  className="h-10 w-10"
                />
                <div>
                  <h1 className="font-display font-bold text-xl">
                    {currentSpace.slug}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {currentSpace.description}
                  </p>
                </div>
              </div>
            )}

            {/* Welcome banner for home */}
            {!selectedSpace && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 animate-fade-in">
                <h1 className="font-display font-bold text-2xl mb-2">
                  Welcome to <span className="text-primary">AASTU Q&A</span> 🎓
                </h1>
                <p className="text-muted-foreground">
                  Your anonymous space to ask questions, share experiences, and
                  connect with fellow AASTU students.
                </p>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FeedFilters activeSort={sortBy} onSortChange={setSortBy} />
              <div className="w-full sm:w-64">
                <Select
                  value={selectedSpace ?? "all"}
                  onValueChange={(val) =>
                    setSelectedSpace(val === "all" ? null : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All spaces</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.slug} value={space.slug}>
                        <span className="flex items-center gap-2">
                          <SpaceLogo
                            image={space.image}
                            alt={`${space.slug} logo`}
                            className="h-4 w-4"
                          />

                          {space.slug}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-3">
              {sortedPosts.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-10">
                  {isHomeJoinedFeed ? (
                    <div className="space-y-3">
                      <p>No posts from your joined spaces yet.</p>
                      <div className="flex items-center justify-center gap-2">
                        <Link to="/explore">
                          <Button variant="outline">Explore spaces</Button>
                        </Link>
                        <Link to="/explore">
                          <Button>Join a space</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p>No posts yet.</p>
                  )}
                </div>
              ) : (
                sortedPosts.map((post, index) => (
                  <div
                    key={post.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-slide-up"
                  >
                    <PostCard
                      post={{
                        ...post,
                        createdAt: new Date(post.createdAt),
                        spaceSlug: post.spaceSlug ?? post.space?.slug ?? "",
                        commentCount:
                          post.commentCount ?? post.commentsCount ?? 0,
                        tags: post.tags ?? [],
                      }}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Infinite scroll sentinel */}
            {sortedPosts.length > 0 && (
              <>
                <div id="feed-sentinel" className="h-8" />
                {isFetchingMore && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    Loading more…
                  </div>
                )}
                {!hasMore && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    No more posts
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
