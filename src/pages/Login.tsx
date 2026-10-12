import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAuth } from "@/app/Auth";
import { BrandIcon } from "@/components/shared/BrandIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1, "Password is required").max(72),
});

export function Login() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  if (auth.signedIn) return <Navigate to="/soundscapes" replace />;

  return <main className="relative min-h-[100svh] overflow-y-auto bg-[#080b0e]">
    <img src={`${import.meta.env.BASE_URL}branding/passage-alpine-login.webp`} alt="" aria-hidden className="fixed inset-0 h-full w-full object-cover object-[center_58%]" />
    <div className="fixed inset-0 bg-[linear-gradient(90deg,rgba(4,7,10,.88)_0%,rgba(4,7,10,.58)_48%,rgba(4,7,10,.82)_100%)]" />
    <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(3,5,8,.3)_0%,rgba(3,5,8,.2)_45%,rgba(3,5,8,.82)_100%)]" />

    <div className="relative mx-auto grid min-h-[100svh] w-full max-w-[1440px] items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-14 xl:px-20">
     <section className="hidden max-w-xl self-center lg:block">
  <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
    Passage Administration
  </p>

  <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-white xl:text-5xl">
    Shape every listening experience with care.
  </h1>

  <p className="mt-5 max-w-lg text-base leading-7 text-white/68">
    Manage soundscapes, curated collections and listener support from one focused workspace.
  </p>
</section>

      <section className="mx-auto w-full max-w-[440px] rounded-2xl border border-white/12 bg-[#111518]/92 p-6 shadow-2xl shadow-black/35 backdrop-blur-md sm:p-8 lg:mx-0">
        <div className="mb-8 flex items-center gap-3">
          <BrandIcon className="h-12 w-12 rounded-[14px]" />
          <div><p className="text-lg font-semibold tracking-tight">Passage</p><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Admin Portal</p></div>
        </div>
        <div className="mb-7"><h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to manage Passage content and operations.</p></div>
        <form className="space-y-5" onSubmit={form.handleSubmit(async (data) => {
          setError("");
          try { await auth.signIn(data.email, data.password); form.reset(); }
          catch (error) { setError(error instanceof Error ? error.message : "Sign in failed"); }
        })}>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="username" inputMode="email" placeholder="admin@passage.app" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />{form.formState.errors.email && <p role="alert" className="text-sm text-destructive">{form.formState.errors.email.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-11" {...form.register("password")} aria-invalid={!!form.formState.errors.password} /><Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-10" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div>{form.formState.errors.password && <p role="alert" className="text-sm text-destructive">{form.formState.errors.password.message}</p>}</div>
          {error && <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive">{error}</div>}
          <Button size="lg" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? <><LoaderCircle className="animate-spin" />Signing in…</> : <>Sign in<ArrowRight /></>}</Button>
        </form>
        <p className="mt-7 border-t pt-5 text-center text-xs text-muted-foreground">Authorized Passage administrators only</p>
      </section>
    </div>
  </main>;
}
