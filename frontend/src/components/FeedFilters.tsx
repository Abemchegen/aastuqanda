import { Filter, Flame, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortOption = "hot" | "new" | "top";

interface FeedFiltersProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function FeedFilters({ activeSort, onSortChange }: FeedFiltersProps) {
  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: "hot", label: "Hot", icon: <Flame className="h-4 w-4" /> },
    { value: "new", label: "New", icon: <Clock className="h-4 w-4" /> },
    { value: "top", label: "Top", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-card border">
      <Filter className="h-4 w-4 text-muted-foreground ml-2" />
      {sortOptions.map((option) => (
        <Button
          key={option.value}
          variant={activeSort === option.value ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "gap-1.5",
            activeSort === option.value && "bg-primary/10 text-primary"
          )}
          onClick={() => onSortChange(option.value)}
        >
          {option.icon}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
