import { Controller, type UseFormReturn } from "react-hook-form";
import { OptionSelect } from "./OptionSelect";
import type { FieldSpec, FormValues } from "@/lib/forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker, DateTimePicker } from "@/components/shared/DatePickers";

export function FormFields({
  fields,
  form,
  readOnly = [],
}: {
  fields: FieldSpec[];
  form: UseFormReturn<FormValues>;
  readOnly?: string[];
}) {
  return (
    <div className="form-grid">
      {fields.map((field) => {
        const error = form.formState.errors[field.name]?.message;
        const controlId = `field-${field.name}`;
        const props = {
          id: controlId,
          "aria-invalid": !!error,
          "aria-describedby": error
            ? `${controlId}-error`
            : field.hint
              ? `${controlId}-hint`
              : undefined,
          readOnly: readOnly.includes(field.name),
          ...form.register(field.name),
        };
        return (
          <div
            key={field.name}
            className={
              field.type === "textarea"
                ? "space-y-2 md:col-span-2"
                : "space-y-2"
            }
          >
            {field.type === "checkbox" ? (
              <div className="flex min-h-10 items-center gap-3 pt-5">
                <input {...props} type="checkbox" className="h-4 w-4" />
                <Label htmlFor={controlId}>{field.label}</Label>
              </div>
            ) : (
              <>
                <Label htmlFor={controlId} className="capitalize">
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-primary">*</span>
                  )}
                </Label>
                {field.options ? (
                  <Controller
                    control={form.control}
                    name={field.name}
                    render={({ field: controlled }) => (
                      <OptionSelect
                        id={controlId}
                        name={controlled.name}
                        value={String(controlled.value || "")}
                        onValueChange={controlled.onChange}
                        onBlur={controlled.onBlur}
                        aria-invalid={!!error}
                        aria-describedby={props["aria-describedby"]}
                        disabled={readOnly.includes(field.name)}
                        options={field.options!}
                        emptyLabel={
                          field.required
                            ? "Choose…"
                            : field.name === "mode"
                              ? "No mode"
                              : "Not set"
                        }
                      />
                    )}
                  />
                ) : field.type === "date" || field.type === "datetime-local" ? (
                  <Controller
                    control={form.control}
                    name={field.name}
                    render={({ field: controlled }) =>
                      field.type === "date" ? (
                        <DatePicker id={controlId} value={String(controlled.value || "")} onChange={controlled.onChange} disabled={readOnly.includes(field.name)} invalid={!!error} describedBy={props["aria-describedby"]} />
                      ) : (
                        <DateTimePicker id={controlId} value={String(controlled.value || "")} onChange={controlled.onChange} disabled={readOnly.includes(field.name)} invalid={!!error} describedBy={props["aria-describedby"]} />
                      )
                    }
                  />
                ) : field.type === "textarea" ? (
                  <Textarea
                    {...props}
                    rows={field.name === "value" ? 12 : 3}
                    className={field.name === "value" ? "font-mono" : ""}
                  />
                ) : (
                  <Input
                    {...props}
                    type={field.type === "url" ? "text" : field.type || "text"}
                    min={field.min}
                    max={field.max}
                    step={field.type === "number" ? 1 : undefined}
                  />
                )}
              </>
            )}
            {field.hint && (
              <p
                id={`${controlId}-hint`}
                className="text-xs text-muted-foreground"
              >
                {field.hint}
              </p>
            )}
            {error && (
              <p
                id={`${controlId}-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {String(error)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
