import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit max-w-full",
        months: "flex max-w-full flex-col gap-4 sm:flex-row",
        month: "space-y-3",
        month_caption: "relative flex h-9 items-center justify-center px-10",
        caption_label: "text-sm font-semibold",
        nav: "absolute inset-x-3 top-3 flex justify-between",
        button_previous: "flex size-9 items-center justify-center rounded-md border hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        button_next: "flex size-9 items-center justify-center rounded-md border hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        chevron: "size-4 fill-current",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-[0.7rem] font-medium text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center",
        day_button: "size-9 rounded-md text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected: "rounded-md bg-primary text-primary-foreground",
        today: "rounded-md border border-primary/60 text-primary",
        outside: "text-muted-foreground/40",
        disabled: "pointer-events-none opacity-30",
        range_start: "rounded-l-md bg-primary text-primary-foreground",
        range_middle: "rounded-none bg-primary/15",
        range_end: "rounded-r-md bg-primary text-primary-foreground",
        ...classNames,
      }}
      {...props}
    />
  );
}
