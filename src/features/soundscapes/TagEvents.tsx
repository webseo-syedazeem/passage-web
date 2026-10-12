import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminMutation } from "@/hooks/catalogue";
import { soundscapeApi } from "@/services/catalogue";
import {
  defaults,
  formSchema,
  serialize,
  tagFields,
  type FormValues,
} from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormFields } from "@/components/shared/FormFields";
import { Empty, QueryState, dateLabel } from "@/components/shared/States";
export function TagEvents({ id }: { id: string }) {
  const query = useQuery({
    queryKey: ["tag-events", id],
    queryFn: ({ signal }) => soundscapeApi.tags(id, signal),
  });
  const initial = {
    ...defaults(tagFields),
    tag_group: "contains",
    state: "intended",
  };
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(tagFields)),
    defaultValues: initial,
  });
  const add = useAdminMutation(
    (values: FormValues) =>
      soundscapeApi.addTag(id, serialize(tagFields, values, false)),
    "Tag event logged",
    () => form.reset(initial),
  );
  return (
    <section className="panel mt-6">
      <h2 className="text-lg font-medium">Tag events</h2>
      <p className="muted mt-2 mb-6">
        Governance trail only. Logging a verified event does not change the
        catalogue’s filter arrays.
      </p>
      <form
        onSubmit={form.handleSubmit((values) => add.mutate(values))}
        className="mb-6 space-y-4"
      >
        <FormFields fields={tagFields} form={form} />
        <Button disabled={add.isPending}>
          {add.isPending ? "Logging…" : "Log tag event"}
        </Button>
        {add.error && (
          <p role="alert" className="text-sm text-destructive">
            {add.error.message}
          </p>
        )}
      </form>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
      {!query.isPending && !query.error && (
        <div className="overflow-x-auto rounded-lg border">
          {query.data?.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  {["Group", "Value", "State", "Source", "Created"].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.map((event) => (
                  <tr key={event.id}>
                    <td data-label="Group">{event.tag_group}</td>
                    <td data-label="Value">{event.tag_value}</td>
                    <td data-label="State">
                      <StatusBadge value={event.state} />
                    </td>
                    <td data-label="Source">{event.source || "—"}</td>
                    <td data-label="Created">{dateLabel(event.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>No tag events logged for this soundscape yet.</Empty>
          )}
        </div>
      )}
    </section>
  );
}
