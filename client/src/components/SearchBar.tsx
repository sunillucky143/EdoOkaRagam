import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  return (
    <div className="relative max-w-2xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder="What do you want to listen to?"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch?.(e.target.value);
          console.log(`Searching for: ${e.target.value}`);
        }}
        className="pl-12 h-12 bg-card border-input text-base focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="input-search"
      />
    </div>
  );
}
