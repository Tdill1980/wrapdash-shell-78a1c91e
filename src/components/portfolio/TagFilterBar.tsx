import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagFilterBarProps {
  tags: string[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

const DEFAULT_TAGS = [
  'All',
  'Commercial',
  'Residential', 
  'Fleet',
  'Color Change',
  'Printed',
  'PPF',
  'Chrome Delete'
];

export function TagFilterBar({ tags, selectedTag, onTagSelect }: TagFilterBarProps) {
  // Combine default tags with custom tags from jobs
  const allTags = ['All', ...new Set([...DEFAULT_TAGS.slice(1), ...tags])];

  return (
    <div className="flex flex-wrap gap-2 pb-4">
      {allTags.map(tag => {
        const isSelected = (tag === 'All' && !selectedTag) || tag === selectedTag;
        
        return (
          <Button
            key={tag}
            variant="outline"
            size="sm"
            onClick={() => onTagSelect(tag === 'All' ? null : tag)}
            className={cn(
              "rounded-full transition-all",
              isSelected && "bg-pink-500 text-white border-pink-500 hover:bg-pink-600 hover:border-pink-600"
            )}
          >
            {tag}
          </Button>
        );
      })}
    </div>
  );
}
