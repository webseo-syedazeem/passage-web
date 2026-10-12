import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export interface SearchPickerOption { value: string; title: string; meta?: string }

export function SearchPicker({ id, value, onChange, options, invalid }: {
  id: string; value: string; onChange: (value: string) => void;
  options: SearchPickerOption[]; invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchId = useId().replaceAll(":", "");
  const selectedRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open || !selectedRef.current) return;
    const frame = requestAnimationFrame(() => selectedRef.current?.scrollIntoView({ block: "nearest" }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return <Popover open={open} onOpenChange={(next) => { setOpen(next); setSearch(""); }}>
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} aria-invalid={invalid} disabled={!options.length} className="h-11 w-full min-w-0 justify-between text-left font-normal">
        <span className="min-w-0 truncate">{selected?.title || (options.length ? "Search or choose a soundscape" : "No soundscapes available")}</span>
        <ChevronsUpDown className="shrink-0 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" sideOffset={8} collisionPadding={12} avoidCollisions className="z-[70] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-1.5rem)] overflow-hidden p-0">
      <Command label="Search available soundscapes" shouldFilter>
        <CommandInput id={`soundscape-search-${searchId}`} name={`soundscape_picker_search_${searchId}`} value={search} onValueChange={setSearch} placeholder="Search soundscapes…" aria-label="Search available soundscapes" autoComplete="new-password" autoCorrect="off" autoCapitalize="none" spellCheck={false} data-lpignore="true" data-1p-ignore="true" data-form-type="other" />
        <CommandList className="max-h-72 overscroll-contain" onWheel={(event) => event.stopPropagation()}>
          <CommandEmpty>No soundscapes found</CommandEmpty>
          {options.map((item) => <CommandItem ref={item.value === value ? selectedRef : undefined} key={item.value} value={`${item.title} ${item.meta || ""}`} keywords={[item.title, item.meta || ""]} onSelect={() => { onChange(item.value); setSearch(""); setOpen(false); }} className="items-start gap-3 py-2.5">
            <Check className={`mt-0.5 shrink-0 ${value === item.value ? "opacity-100" : "opacity-0"}`} />
            <span className="min-w-0"><span className="block truncate font-medium text-foreground">{item.title}</span>{item.meta && <span className="mt-0.5 block truncate text-xs capitalize text-muted-foreground">{item.meta}</span>}</span>
          </CommandItem>)}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
