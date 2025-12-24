import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
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
import { SpaceLogo } from "@/components/SpaceLogo";
import { uploadPostImages } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (post: any) => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  onCreated,
  defaultSpaceId,
  lockSpace = false,
}: CreatePostDialogProps & { defaultSpaceId?: string; lockSpace?: boolean }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSpace, setSelectedSpace] = useState(defaultSpaceId || "");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [spaces, setSpaces] = useState<
    Array<{
      id: string;
      slug: string;
      icon?: string;
      description?: string;
      image?: string;
    }>
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

  const handleImagesSelected = (files: FileList | null) => {
    if (!files) return;
    processNewFiles(Array.from(files));
  };

  const processNewFiles = (files: File[]) => {
    // only accept images
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    // merge with existing and cap at 6
    const merged = [...images, ...imageFiles].slice(0, 6);
    setImages(merged);
    setImagePreviews(merged.map((f) => URL.createObjectURL(f)));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer;
    const files: File[] = [];
    if (dt.items) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
    } else if (dt.files) {
      for (let i = 0; i < dt.files.length; i++) files.push(dt.files[i]);
    }
    if (files.length) processNewFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeNewImageAt = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
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
    let contentWithImages = content;
    if (images.length > 0) {
      try {
        const res = await uploadPostImages(images, token);
        const urls: string[] = Array.isArray(res?.urls) ? res.urls : [];
        if (urls.length > 0) {
          const md = urls.map((u) => `\n![image](${u})`).join("");
          contentWithImages += md;
        }
      } catch (_) {
        // ignore upload errors, continue without images
      }
    }
    const res = await addPost(
      { title, content: contentWithImages, spaceId: selectedSpace },
      token
    );
    if (res) {
      toast({
        title: "Post created!",
        description: "Your anonymous question has been posted.",
      });
      // notify parent to refresh list immediately
      onCreated?.(res);
      setTitle("");
      setContent("");
      setSelectedSpace("");
      setImages([]);
      setImagePreviews([]);
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

          {/* Images */}
          <div>
            {/* Hidden file input for click-to-select via drop zone */}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImagesSelected(e.target.files)}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            {/* Drag & drop zone */}
            <div
              className={
                "mt-2 p-4 rounded border-2 border-dashed text-sm cursor-pointer " +
                (isDragging ? "border-primary bg-primary/5" : "border-muted")
              }
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              Drag & drop images here, or click to select. (Up to 6 images)
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`preview-${i}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/70"
                      onClick={() => removeNewImageAt(i)}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} className="w-full" variant="hero">
            <Send className="h-4 w-4 mr-2" />
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
