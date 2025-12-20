import { useEffect, useState } from "react";
import { X, Send, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { spaces, faqs } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { useAPI } from "@/hooks/use-api";
import { useAuth } from "@/contexts/AuthContext";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  defaultSpaceId,
  lockSpace = false,
}: CreatePostDialogProps & { defaultSpaceId?: string; lockSpace?: boolean }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSpace, setSelectedSpace] = useState(defaultSpaceId || "");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [spaces, setSpaces] = useState<
    Array<{ id: string; slug: string; icon?: string; description?: string }>
  >([]);
  const { addPost, fetchSpaces } = useAPI();
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const res = await fetchSpaces();
      if (Array.isArray(res)) {
        setSpaces(res);
      }
    })();
  }, []);

  useEffect(() => {
    if (defaultSpaceId) setSelectedSpace(defaultSpaceId);
  }, [defaultSpaceId]);

  // const suggestedFaqs = title.length > 5
  //   ? faqs.filter((faq) =>
  //       faq.question.toLowerCase().includes(title.toLowerCase().slice(0, 20))
  //     )
  //   : [];

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedSpace) {
      toast({
        title: "Missing fields",
        description: "Please add a title and select a space.",
        variant: "destructive",
      });
      return;
    }
    const token = localStorage.getItem("campusloop_access_token") || "";
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Create an account or log in to post.",
        variant: "destructive",
      });
      return;
    }
    const res = await addPost(
      { title, content, spaceId: selectedSpace },
      token
    );
    if (res) {
      toast({
        title: "Post created!",
        description: "Your anonymous question has been posted.",
      });
      setTitle("");
      setContent("");
      setSelectedSpace("");
      setTags([]);
      onOpenChange(false);
    } else {
      toast({
        title: "Failed to create post",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Create Anonymous Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Space selector */}
          <Select
            value={selectedSpace}
            onValueChange={setSelectedSpace}
            disabled={lockSpace}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a space" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  <span className="flex items-center gap-2">
                    <span>{space.icon}</span>
                    <span className="text-primary font-medium">loop/</span>
                    {space.slug}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Title */}
          <div>
            <Input
              placeholder="What's your question or topic?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
            />

            {/* FAQ suggestions */}
            {/* {suggestedFaqs.length > 0 && (
              <div className="mt-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs font-medium text-accent-foreground flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Similar questions already asked:
                </p>
                {suggestedFaqs.slice(0, 2).map((faq) => (
                  <button
                    key={faq.id}
                    className="block w-full text-left text-sm text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent/10 transition-colors"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )} */}
          </div>

          {/* Content */}
          <Textarea
            placeholder="Add more details (optional)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          {/* Tags */}
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tags (max 5)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleAddTag}
                disabled={tags.length >= 5}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Anonymous notice */}
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            🔒 Your post will be completely anonymous. A random ID will be
            assigned to you for this thread only.
          </p>

          {/* Submit */}
          <Button onClick={handleSubmit} className="w-full" variant="hero">
            <Send className="h-4 w-4 mr-2" />
            Post Anonymously
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
