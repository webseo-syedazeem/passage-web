import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { supportApi } from "@/services/support";
import { useOptimisticSupportStatus } from "@/hooks/optimistic";
import {
  supportLabels,
  supportStatuses,
  type SupportRequest,
  type SupportStatus,
} from "@/types/support";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeading, QueryState, dateLabel } from "@/components/shared/States";
export function SupportDetail() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["support-detail", id],
    queryFn: ({ signal }) => supportApi.detail(id!, signal),
  });
  if (query.isPending || query.error)
    return (
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
      />
    );
  return (
    <RequestDetail
      key={`${query.data.id}-${query.data.status}`}
      record={query.data}
    />
  );
}
function RequestDetail({ record }: { record: SupportRequest }) {
  const [status, setStatus] = useState(record.status);
  const update = useOptimisticSupportStatus(record);
  return (
    <>
      <PageHeading
        title={record.subject || supportLabels[record.type]}
        description={`${supportLabels[record.type]} · Submitted ${dateLabel(record.created_at)}`}
      >
        <Button variant="outline" asChild>
          <Link to="/support">Back to support</Link>
        </Button>
      </PageHeading>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="panel space-y-6">
          <h2 className="text-lg font-medium">Message</h2>
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {record.message}
          </p>
          {record.reason && (
            <div className="border-t pt-5">
              <h3 className="mb-2 font-medium">Reported reason</h3>
              <p className="whitespace-pre-wrap break-words text-muted-foreground">
                {record.reason}
              </p>
            </div>
          )}
        </section>
        <div className="space-y-6">
          <section className="panel space-y-4">
            <h2 className="text-lg font-medium">Workflow</h2>
            <Label htmlFor="request-status">Status</Label>
            <OptionSelect
              id="request-status"
              value={status}
              onValueChange={(value) => setStatus(value as SupportStatus)}
              disabled={update.isPending}
              options={supportStatuses.map((value) => ({
                value,
                label: supportLabels[value],
              }))}
            />
            <Button
              disabled={update.isPending || status === record.status}
              onClick={() => update.mutate(status)}
            >
              {update.isPending ? "Saving…" : "Save status"}
            </Button>
            {update.error && (
              <p role="alert" className="text-sm text-destructive">
                {update.error.message}
              </p>
            )}
            <p className="muted">Updated {dateLabel(record.updated_at)}</p>
          </section>
          <section className="panel space-y-4">
            <h2 className="text-lg font-medium">Listener & context</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Listener</dt>
                <dd className="mt-1">
                  {record.user?.name ||
                    (record.user_id ? "Registered listener" : "Guest")}
                </dd>
              </div>
              {record.contact_email && (
                <div>
                  <dt className="text-muted-foreground">Submitted email</dt>
                  <dd className="mt-1 break-all">{record.contact_email}</dd>
                </div>
              )}
              {record.user?.email && (
                <div>
                  <dt className="text-muted-foreground">Account email</dt>
                  <dd className="mt-1 break-all">{record.user.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Related soundscape</dt>
                <dd className="mt-1">
                  {record.soundscape ? (
                    <Link
                      className="text-primary"
                      to={`/soundscapes/${record.soundscape.id}`}
                    >
                      {record.soundscape.title}
                    </Link>
                  ) : (
                    "No linked soundscape"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Request reference</dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {record.id}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
