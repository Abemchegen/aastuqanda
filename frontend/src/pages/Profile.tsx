import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Calendar,
  Edit2,
  MessageSquare,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Post, Comment } from "@/types";
import { useAPI } from "@/hooks/use-api";

interface PostWithSpace extends Omit<Post, "spaceSlug" | "spaceName"> {
  space: { slug: string };
}

interface CommentWithPost extends Comment {
  postId: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { username: paramUsername } = useParams();
  const { user, updateProfile, logout, deleteAccount } = useAuth();
  const { toast } = useToast();
  const {
    editProfile,
    uploadAvatar,
    fetchMyPosts,
    fetchMyComments,
    fetchMySavedPosts,
    fetchUserProfile,
    fetchUserPostsPublic,
    fetchUserCommentsPublic,
  } = useAPI();
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [myPosts, setMyPosts] = useState<PostWithSpace[]>([]);
  const [myComments, setMyComments] = useState<CommentWithPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostWithSpace[]>([]);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [publicProfile, setPublicProfile] = useState<User | null>(null);
  const isOwnProfile =
    !paramUsername ||
    (user && paramUsername?.toLowerCase() === user.username.toLowerCase());

  useEffect(() => {
    (async () => {
      if (isOwnProfile) {
        const token = localStorage.getItem("campusloop_access_token");
        if (!token) return;
        const [posts, comments, saved] = await Promise.all([
          fetchMyPosts(token),
          fetchMyComments(token),
          fetchMySavedPosts(token),
        ]);
        if (Array.isArray(posts)) setMyPosts(posts);
        if (Array.isArray(comments)) setMyComments(comments);
        if (Array.isArray(saved)) setSavedPosts(saved);
      } else if (paramUsername) {
        const [profile, posts, comments] = await Promise.all([
          fetchUserProfile(paramUsername),
          fetchUserPostsPublic(paramUsername),
          fetchUserCommentsPublic(paramUsername),
        ]);
        setPublicProfile(profile || null);
        if (Array.isArray(posts)) setMyPosts(posts);
        if (Array.isArray(comments)) setMyComments(comments);
        setSavedPosts([]);
      }
    })();
  }, [paramUsername, isOwnProfile]);

  if (!user && !paramUsername) {
    navigate("/login");
    return null;
  }

  const displayUser: User = isOwnProfile ? user : publicProfile;
  const avatarSrc = displayUser?.avatar
    ? (displayUser.avatar as string).startsWith("http")
      ? displayUser.avatar
      : `${API_BASE}${displayUser.avatar}`
    : "";

  const handleAvatarFile = async (file?: File) => {
    if (!file || !user || !isOwnProfile) return;
    const token = localStorage.getItem("campusloop_access_token");
    if (!token) {
      toast({
        title: "Login required",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file, token);
      if (res?.avatar) {
        updateProfile({ avatar: res.avatar });
        await editProfile({ avatar: res.avatar }, token);
        toast({
          title: "Avatar updated!",
          description: "Your profile picture has been changed.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload avatar.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveBio = async () => {
    if (!user || !isOwnProfile) return;
    const token = localStorage.getItem("campusloop_access_token");
    if (!token) {
      toast({
        title: "Login required",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }
    await editProfile({ bio }, token);
    updateProfile({ bio });
    setEditingBio(false);
    toast({
      title: "Bio updated!",
      description: "Your bio has been saved.",
    });
  };

  const handleLogout = () => {
    if (!isOwnProfile) return;
    logout();
    navigate("/");
    toast({
      title: "Logged out",
      description: "You've been signed out successfully.",
    });
  };

  const handleDeleteAccount = async () => {
    if (!user || !isOwnProfile) return;
    setDeletingAccount(true);
    try {
      await deleteAccount();
      logout();
      navigate("/");
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete account.",
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const formatDate = (dt?: Date | string | null) => {
    if (!dt) return "";
    const d = dt instanceof Date ? dt : new Date(dt);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Profile</span>
        </div>
      </header>

      <main className="container max-w-2xl py-6 px-4">
        {/* Profile header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl overflow-hidden">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span role="img" aria-label="avatar">
                      🎓
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold">
                    {displayUser?.username}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    {isOwnProfile && (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Username is permanent</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(displayUser?.createdAt)}</span>
                  </div>
                  <div className="mt-3">
                    {isOwnProfile && (
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer text-primary">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleAvatarFile(e.target.files?.[0] || undefined)
                          }
                          disabled={uploadingAvatar}
                        />
                        <Upload className="h-4 w-4" />
                        {uploadingAvatar
                          ? "Uploading..."
                          : "Upload profile picture"}
                      </label>
                    )}
                  </div>
                </div>
              </div>
              {/* Logout and Delete Account (own profile only) */}
              {isOwnProfile && (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Log Out
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                      >
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your account and remove all your data from our
                          servers, including posts, comments, and profile
                          information.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingAccount ? "Deleting..." : "Delete Account"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Bio</h2>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBio(!editingBio)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    {editingBio ? "Cancel" : "Edit"}
                  </Button>
                )}
              </div>
              {editingBio ? (
                <div className="space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {bio.length}/200
                    </span>
                    <Button size="sm" onClick={handleSaveBio}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {(isOwnProfile ? user?.bio : publicProfile?.bio) ||
                    (isOwnProfile ? "No bio yet. Click edit to add one!" : "")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Tabs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {isOwnProfile
                ? "Your Activity"
                : `${publicProfile?.username || "User"}'s Activity`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="posts">
              <TabsList className="w-full">
                <TabsTrigger value="posts" className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex-1 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger value="saved" className="flex-1 gap-2">
                    <Upload className="h-4 w-4 rotate-180" />
                    Saved
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="posts" className="mt-4 space-y-3">
                {myPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isOwnProfile
                      ? "Your posts will appear here once you start contributing."
                      : "This user doesn't have any posts yet."}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {myPosts.map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/post/${p.id}`}
                          className="block rounded hover:bg-muted/40 p-2"
                        >
                          <div>
                            <div className="font-medium">{p.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(p.createdAt).toLocaleString()} in{" "}
                              {p.space?.slug}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="comments" className="mt-4 space-y-3">
                {myComments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {isOwnProfile
                      ? "Your comments will show up here after you join the discussion."
                      : "This user doesn't have any comments yet."}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {myComments.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={`/post/${c.postId}`}
                          className="block rounded hover:bg-muted/40 p-2"
                        >
                          <div className="truncate">
                            <div className="text-sm truncate">{c.content}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleString()} on post
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="saved" className="mt-4 space-y-3">
                  {savedPosts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Saved posts you add will appear here.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {savedPosts.map((p) => (
                        <li key={p.id}>
                          <Link
                            to={`/post/${p.id}`}
                            className="block rounded hover:bg-muted/40 p-2"
                          >
                            <div>
                              <div className="font-medium">{p.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(p.createdAt).toLocaleString()} in{" "}
                                {p.space?.slug}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
