import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminMutation } from "@/hooks/catalogue";
import { collectionApi } from "@/services/catalogue";
import {
  collectionFields,
  defaults,
  formSchema,
  serialize,
  type FormValues,
} from "@/lib/forms";
import type { Collection } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { FormFields } from "@/components/shared/FormFields";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { PageHeading, QueryState } from "@/components/shared/States";
export function CollectionEditor() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["collection", id],
    queryFn: ({ signal }) => collectionApi.detail(id!, signal),
    enabled: !!id,
  });
  if (id && (query.isPending || query.error))
    return (
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
    );
  return <CollectionForm key={id || "new"} record={query.data} />;
}
function CollectionForm({ record }: { record?: Collection }) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const fields = collectionFields.map((field) =>
    field.name === "explore_group"
      ? {
          ...field,
          required: !record,
          hint: record
            ? field.hint
            : "Select where this collection appears in Explore",
        }
      : field,
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(fields)),
    defaultValues: defaults(fields, record),
  });
  const cover = useWatch({ control: form.control, name: "cover_image_url" });
  const save = useAdminMutation(
    (values: FormValues) =>
      collectionApi.save(record?.id, serialize(fields, values, !!record)),
    record ? "Collection saved" : "Unpublished collection created",
    (result) =>
      navigate(
        result.collection
          ? `/collections/${result.collection.id}`
          : "/collections",
      ),
  );
  return (
    <>
      <PageHeading
        title={record ? `Edit ${record.title}` : "Add collection"}
        description={
          record
            ? "Update collection metadata and ordering."
            : "New collections are unpublished until you publish them."
        }
      >
        <Button variant="outline" asChild>
          <Link to="/collections">Back to collections</Link>
        </Button>
      </PageHeading>
      <form
        className="panel space-y-6"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        <FormFields fields={fields} form={form} />
        <ImageUpload
          id="cover-file"
          label="Upload cover image"
          value={String(cover || "")}
          onBusy={setUploading}
          onUploaded={(url) =>
            form.setValue("cover_image_url", url, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
        {save.error && (
          <p role="alert" className="text-sm text-destructive">
            {save.error.message}
          </p>
        )}
        <div className="actions border-t pt-5">
          <Button disabled={save.isPending || uploading}>
            {save.isPending
              ? "Saving…"
              : record
                ? "Save changes"
                : "Create unpublished collection"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/collections")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
