import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadImage } from "@/services/media";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "./MediaPreview";

export function ImageUpload({
  id,
  label,
  value,
  onUploaded,
  onBusy,
}: {
  id: string;
  label: string;
  value: string;
  onUploaded: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [file, setFile] = useState<File>();
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose an image first.");
      return uploadImage(file);
    },
    onMutate: () => onBusy(true),
    onSuccess: ({ url }) => {
      onUploaded(url);
      toast.success("Image uploaded. Save your changes to apply it.");
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => onBusy(false),
  });
  return (
    <div className="grid min-w-0 gap-6 rounded-xl border bg-background/40 p-4 sm:p-5 md:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="file"
          disabled={upload.isPending}
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setFile(e.target.files?.[0]);
            upload.reset();
          }}
        />
        <p className="muted">
          JPEG, PNG or WebP · up to 5 MB. Images are converted to WebP. Save the
          form to apply the uploaded URL.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={upload.isPending}
          onClick={() => upload.mutate()}
        >
          <Upload />
          {upload.isPending ? "Uploading…" : "Upload selected image"}
        </Button>
        <p
          aria-live="polite"
          role={upload.error ? "alert" : "status"}
          className={upload.error ? "text-sm text-destructive" : "muted"}
        >
          {upload.error?.message ||
            (upload.isSuccess
              ? "Uploaded. The image URL is ready to save."
              : "")}
        </p>
      </div>
      <ImagePreview large url={value} title={`${label} preview`} />
    </div>
  );
}
