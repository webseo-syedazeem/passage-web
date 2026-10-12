import { useId, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatDate,
  parseDateOnly,
  splitLocalDateTime,
  toApiDate,
  toApiDateTime,
} from "@/lib/date";

export function DatePicker({ id, value, onChange, disabled, invalid, describedBy, placeholder = "Choose date" }: {
  id: string; value: string; onChange: (value: string) => void; disabled?: boolean;
  invalid?: boolean; describedBy?: string; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDateOnly(value);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button id={id} type="button" variant="outline" disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} className="h-10 w-full justify-between font-normal">
      <span className={selected ? "" : "text-muted-foreground"}>{selected ? formatDate(selected) : placeholder}</span><CalendarDays />
    </Button></PopoverTrigger>
    <PopoverContent align="start" sideOffset={8} collisionPadding={12} className="w-auto max-w-[calc(100vw-1.5rem)] overflow-auto p-0">
      <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={date => {onChange(toApiDate(date)); setOpen(false);}} />
      {selected && <div className="border-t p-2"><Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => {onChange("");setOpen(false);}}>Clear date</Button></div>}
    </PopoverContent>
  </Popover>;
}

export function DateTimePicker({ id, value, onChange, disabled, invalid, describedBy }: {
  id: string; value: string; onChange: (value: string) => void; disabled?: boolean; invalid?: boolean; describedBy?: string;
}) {
  const parts = splitLocalDateTime(value);
  const update = (date: string, time: string) => onChange(date && time ? toApiDateTime(date, time) : "");
  return <div role="group" aria-invalid={invalid} aria-describedby={describedBy} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
    <DatePicker id={id} value={parts.date} onChange={date => update(date, parts.time || "09:00")} disabled={disabled} invalid={invalid} placeholder="Choose date" />
    <Input aria-label="Time" type="time" step={60} autoComplete="off" disabled={disabled || !parts.date} value={parts.time} onChange={event => update(parts.date, event.target.value)} />
  </div>;
}

export function DateRangePicker({ id, from, to, onChange }: {id?: string; from: string; to: string; onChange: (from: string, to: string) => void}) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const range: DateRange = { from: parseDateOnly(from), to: parseDateOnly(to) };
  const label = range.from ? `${formatDate(range.from)}${range.to ? ` → ${formatDate(range.to)}` : ""}` : "Any submission date";
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button id={id} type="button" variant="outline" aria-labelledby={labelId} className="h-10 w-full justify-between font-normal"><span id={labelId} className={range.from ? "truncate" : "truncate text-muted-foreground"}>{label}</span><ChevronDown /></Button></PopoverTrigger>
    <PopoverContent align="start" collisionPadding={12} className="w-auto max-w-[calc(100vw-1.5rem)] overflow-auto p-0">
      <Calendar mode="range" selected={range} defaultMonth={range.from} numberOfMonths={1} onSelect={next => onChange(toApiDate(next?.from),toApiDate(next?.to))} />
      <div className="flex flex-wrap justify-between gap-2 border-t p-2"><Button type="button" variant="ghost" size="sm" onClick={() => onChange("","")}>Clear</Button><Button type="button" size="sm" onClick={() => setOpen(false)}>Done</Button></div>
    </PopoverContent>
  </Popover>;
}
