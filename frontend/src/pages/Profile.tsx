import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAPI } from "@/hooks/use-api";

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const {
    editProfile,
    uploadAvatar,
    fetchMyPosts,
    fetchMyComments,
    fetchMySavedPosts,
  } = useAPI();

  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  if (!user) {
    navigate("/login");
    return null;
  }

  const avatarSrc = user.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `http://localhost:4000${user.avatar}`
    : "";

  const handleAvatarFile = async (file?: File) => {
    if (!file || !user) return;
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
    if (!user) return;
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
    logout();
    navigate("/");
    toast({
      title: "Logged out",
      description: "You've been signed out successfully.",
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
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
                    {user.username}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Lock className="h-4 w-4" />
                    <span>Username is permanent</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                  <div className="mt-3">
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
                  </div>
                </div>
              </div>
              {/* Logout */}
              <div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Bio</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBio(!editingBio)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  {editingBio ? "Cancel" : "Edit"}
                </Button>
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
                  {user.bio || "No bio yet. Click edit to add one!"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Tabs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Your Activity</CardTitle>
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
                <TabsTrigger value="saved" className="flex-1 gap-2">
                  <Upload className="h-4 w-4 rotate-180" />
                  Saved
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4 space-y-3">
                {myPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Your posts will appear here once you start contributing.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {myPosts.map((p) => (
                      <li
                        key={p.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleString()} in loop/
                            {p.space?.slug}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/post/${p.id}`)}
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="comments" className="mt-4 space-y-3">
                {myComments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Your comments will show up here after you join the
                    discussion.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {myComments.map((c) => (
                      <li
                        key={c.id}
                        className="flex justify-between items-center"
                      >
                        <div className="truncate">
                          <div className="text-sm truncate">{c.content}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString()} on post
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/post/${c.postId}`)}
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-4 space-y-3">
                {savedPosts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Saved posts you add will appear here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {savedPosts.map((p) => (
                      <li
                        key={p.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleString()} in loop/
                            {p.space?.slug}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/post/${p.id}`)}
                        >
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
