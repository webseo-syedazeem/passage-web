import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { remoteApi } from "@/services/catalogue";
import { useAdminMutation } from "@/hooks/catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { PageHeading, QueryState } from "@/components/shared/States";

type Mode = "focus" | "sleep" | "relax";
type Testimonial = { id: string; mode: Mode; quote: string; name: string; role?: string; avatar_url?: string; consent_confirmed: boolean };

const blank = (): Testimonial => ({ id: crypto.randomUUID(), mode: "focus", quote: "", name: "", role: "", avatar_url: "", consent_confirmed: false });

export function TestimonialsEditor() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["remote-config"], queryFn: ({ signal }) => remoteApi.list(signal) });
  const existing = useMemo(() => query.data?.find((row) => row.key === "home_testimonials"), [query.data]);
  const initial = useMemo(() => {
    const value = existing?.value as { testimonials?: Testimonial[] } | undefined;
    return Array.isArray(value?.testimonials) ? value.testimonials : [];
  }, [existing]);
  if (query.isPending || query.error) return <QueryState pending={query.isPending} error={query.error} retry={query.refetch} />;
  return <TestimonialsForm key={existing?.updated_at || "new"} initial={initial} verified={existing?.is_verified === true} onDone={() => navigate("/remote-config")} />;
}

function TestimonialsForm({ initial, verified, onDone }: { initial: Testimonial[]; verified: boolean; onDone: () => void }) {
  const [rows, setRows] = useState<Testimonial[]>(initial);
  const [isVerified, setVerified] = useState(verified);
  const save = useAdminMutation(() => remoteApi.save("home_testimonials", { testimonials: rows }, isVerified), "Testimonials saved", onDone);
  const update = (index: number, patch: Partial<Testimonial>) => setRows((all) => all.map((row, i) => i === index ? { ...row, ...patch } : row));
  const invalid = rows.some((row) => !row.name.trim() || !row.quote.trim() || !row.consent_confirmed || (!!row.avatar_url && !/^https:\/\//i.test(row.avatar_url)));
  return <>
    <PageHeading title="Testimonials" description="Publish genuine, consent-confirmed testimonials for Focus, Sleep, or Relax.">
      <Button variant="outline" asChild><Link to="/remote-config">Back to remote config</Link></Button>
    </PageHeading>
    <div className="space-y-4">
      {rows.map((row, index) => <section className="panel space-y-4" key={row.id}>
        <div className="flex items-center justify-between"><h2 className="font-medium">Testimonial {index + 1}</h2><Button type="button" size="sm" variant="outline" onClick={() => setRows((all) => all.filter((_, i) => i !== index))}><Trash2 /> Remove</Button></div>
        <div className="form-grid">
          <div className="space-y-2"><Label>Mode</Label><OptionSelect value={row.mode} onValueChange={(mode) => update(index, { mode: mode as Mode })} options={["focus", "sleep", "relax"]} /></div>
          <div className="space-y-2"><Label>Name</Label><Input value={row.name} maxLength={80} onChange={(e) => update(index, { name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Role (optional)</Label><Input value={row.role || ""} maxLength={100} onChange={(e) => update(index, { role: e.target.value })} /></div>
          <div className="space-y-2"><Label>Avatar HTTPS URL (optional)</Label><Input value={row.avatar_url || ""} onChange={(e) => update(index, { avatar_url: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Quote</Label><Textarea rows={3} maxLength={280} value={row.quote} onChange={(e) => update(index, { quote: e.target.value })} /></div>
          <label className="flex items-center gap-3 md:col-span-2"><input type="checkbox" className="h-4 w-4" checked={row.consent_confirmed} onChange={(e) => update(index, { consent_confirmed: e.target.checked })} /><span className="text-sm">I confirm this person approved publication of this quote and attribution.</span></label>
        </div>
      </section>)}
      <Button type="button" variant="outline" onClick={() => setRows((all) => [...all, blank()])}><Plus /> Add testimonial</Button>
      <div className="panel space-y-4">
        <label className="flex items-center gap-3"><input type="checkbox" className="h-4 w-4" checked={isVerified} onChange={(e) => setVerified(e.target.checked)} /><span>Verified and visible in the app</span></label>
        <p className="muted">Unverified content is stored as a draft and is never returned by the public API.</p>
        {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
        <Button disabled={invalid || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save testimonials"}</Button>
      </div>
    </div>
  </>;
}
