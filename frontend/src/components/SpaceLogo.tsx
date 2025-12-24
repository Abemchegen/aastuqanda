import { cn } from "@/lib/utils";

export function SpaceLogo({
  image,
  alt,
  className,
  variant = "default",
  letter = "SPACE",
}: {
  image?: string;
  alt?: string;
  className?: string;
  variant?: "default" | "sidebar";
  letter?: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt ?? "space logo"}
        className={cn("rounded object-cover", className)}
      />
    );
  }
  const sizeClass =
    variant === "sidebar" ? "text-[0.65rem] px-0.5" : "text-sm px-1";
  const displayText = variant === "sidebar" ? letter?.[0] ?? "S" : letter;

  return (
    <div
      className={cn(
        "rounded border bg-muted/30 overflow-hidden",
        "flex items-center justify-center",
        "w-full h-full",
        className
      )}
    >
      <span
        className={cn(
          "font-display font-bold uppercase leading-none text-center",
          "bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent",
          sizeClass,
          variant === "sidebar" ? "tracking-tight" : "tracking-wide"
        )}
      >
        {displayText}
      </span>
    </div>
  );
}
