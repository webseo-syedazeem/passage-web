import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminMutation } from "@/hooks/catalogue";
import { soundscapeApi } from "@/services/catalogue";
import {
  defaults,
  formSchema,
  serialize,
  soundFields,
  type FormValues,
} from "@/lib/forms";
import type { Soundscape } from "@/types/catalogue";
import { Button } from "@/components/ui/button";
import { FormFields } from "@/components/shared/FormFields";
import { AudioPreview } from "@/components/shared/MediaPreview";
import { PageHeading, QueryState } from "@/components/shared/States";
import { TagEvents } from "./TagEvents";
export function SoundscapeEditor() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["soundscape", id],
    queryFn: ({ signal }) => soundscapeApi.detail(id!, signal),
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
  return <SoundscapeForm key={id || "new"} record={query.data} />;
}
function SoundscapeForm({ record }: { record?: Soundscape }) {
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(soundFields)),
    defaultValues: defaults(soundFields, record),
  });
  const save = useAdminMutation(
    (values: FormValues) =>
      soundscapeApi.save(record?.id, serialize(soundFields, values, !!record)),
    record ? "Soundscape saved" : "Idea-stage soundscape created",
    () => navigate("/soundscapes"),
  );
  const [artwork, audio, preview] = useWatch({
    control: form.control,
    name: ["artwork_url", "file_url", "preview_url"],
  });
  return (
    <>
      <PageHeading
        title={record ? record.title : "Add soundscape"}
        description={
          record
            ? `Edit catalogue metadata · ${record.status.replaceAll("_", " ")}`
            : "New soundscapes begin at the idea stage."
        }
      >
        <Button variant="outline" asChild>
          <Link to="/soundscapes">Back to soundscapes</Link>
        </Button>
      </PageHeading>
      <form
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="panel space-y-7"
      >
        {soundSections.map((section) => (
          <section
            key={section.title}
            className="space-y-5 border-b pb-7 last:border-0"
          >
            <div>
              <h2 className="text-lg font-medium">{section.title}</h2>
              <p className="muted mt-1">{section.description}</p>
            </div>
            <FormFields
              fields={section.fields.map(
                (name) => soundFields.find((field) => field.name === name)!,
              )}
              form={form}
            />
            {section.title === "Artwork & audio" && (
              <>
                <ImageUpload
                  id="artwork-file"
                  label="Upload artwork"
                  value={String(artwork || "")}
                  onBusy={setUploading}
                  onUploaded={(url) =>
                    form.setValue("artwork_url", url, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <AudioPreview
                    key={`preview-${String(preview)}`}
                    url={String(preview || "")}
                    label="Preview clip"
                  />
                  <AudioPreview
                    key={`full-${String(audio)}`}
                    url={String(audio || "")}
                    label="Full audio"
                  />
                </div>
              </>
            )}
          </section>
        ))}
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
                : "Create idea-stage soundscape"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/soundscapes")}
          >
            Cancel
          </Button>
        </div>
      </form>
      {record && <TagEvents id={record.id} />}
    </>
  );
}

const soundSections = [
  {
    title: "Identity & discovery",
    description: "The essentials listeners use to discover this soundscape.",
    fields: [
      "title",
      "short_title",
      "catalogue_ref",
      "mode",
      "subcategory",
      "one_line_description",
      "detail_description",
      "designed_for",
      "best_use",
      "search_keywords",
      "sort_score",
    ],
  },
  {
    title: "Artwork & audio",
    description:
      "Upload artwork or keep an existing URL. Full audio and preview clips remain separate.",
    fields: [
      "artwork_url",
      "file_url",
      "preview_url",
      "duration_seconds",
      "file_size_bytes",
      "is_loop",
    ],
  },
  {
    title: "Sound characteristics",
    description:
      "Describe what is present, what is absent and how the scene feels.",
    fields: [
      "contains",
      "does_not_contain",
      "animals",
      "instruments",
      "sound_sources",
      "human_presence",
      "perspective",
      "movement",
      "detail_level",
      "intensity",
    ],
  },
  {
    title: "Science, rights & quality",
    description: "Supporting information and release readiness.",
    fields: [
      "science_label",
      "science_note",
      "qa_reviewer",
      "qa_passed_at",
      "rights_status",
      "release_date",
    ],
  },
];
