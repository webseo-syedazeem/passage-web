import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminMutation } from "@/hooks/catalogue";
import { remoteApi } from "@/services/catalogue";
import {
  defaults,
  formSchema,
  remoteFields,
  type FormValues,
} from "@/lib/forms";
import type { RemoteEntry } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { FormFields } from "@/components/shared/FormFields";
import { PageHeading, QueryState } from "@/components/shared/States";
export function RemoteEditor() {
  const { key } = useParams();
  const query = useQuery({
    queryKey: ["remote-entry", key],
    queryFn: ({ signal }) => remoteApi.detail(key!, signal),
    enabled: !!key,
  });
  if (key && (query.isPending || query.error))
    return (
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
    );
  return <RemoteForm key={key || "new"} entry={query.data} />;
}
function RemoteForm({ entry }: { entry?: RemoteEntry }) {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(remoteFields)),
    defaultValues: defaults(remoteFields, entry),
  });
  const save = useAdminMutation(
    (values: FormValues) =>
      remoteApi.save(
        entry?.key || String(values.key).trim(),
        JSON.parse(String(values.value)),
        values.is_verified === true,
      ),
    "Remote config saved",
    () => navigate("/remote-config"),
  );
  return (
    <>
      <PageHeading
        title={entry ? `Edit ${entry.key}` : "Add remote config entry"}
        description="Only verified entries are available through the public API."
      >
        <Button variant="outline" asChild>
          <Link to="/remote-config">Back to remote config</Link>
        </Button>
      </PageHeading>
      <form
        className="panel space-y-6"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        <FormFields
          fields={remoteFields}
          form={form}
          readOnly={entry ? ["key"] : []}
        />
        <p className="muted">
          Value accepts any valid JSON: objects, arrays, strings, numbers,
          booleans or null. Creating an existing key updates that entry.
        </p>
        {save.error && (
          <p role="alert" className="text-sm text-destructive">
            {save.error.message}
          </p>
        )}
        <div className="actions border-t pt-5">
          <Button disabled={save.isPending}>
            {save.isPending
              ? "Saving…"
              : entry
                ? "Save changes"
                : "Create entry"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/remote-config")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
