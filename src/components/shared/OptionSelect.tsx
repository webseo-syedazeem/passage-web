import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type Option = string | { value: string; label: string };
export function OptionSelect({
  value,
  onValueChange,
  options,
  emptyLabel,
  ...props
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly Option[];
  emptyLabel?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select
      value={value || "__empty__"}
      onValueChange={(value) =>
        onValueChange(value === "__empty__" ? "" : value)
      }
      disabled={props.disabled}
      name={props.name}
    >
      <SelectTrigger
        {...props}
        className={`h-10 w-full ${props.className || ""}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="z-50 max-h-72">
        {emptyLabel && <SelectItem value="__empty__">{emptyLabel}</SelectItem>}
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? { value: option, label: option.replaceAll("_", " ") }
              : option;
          return (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
