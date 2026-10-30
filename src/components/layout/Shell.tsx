import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, AudioLines, FolderOpen, SlidersHorizontal, Menu, LogOut, LifeBuoy, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/Auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrandIcon } from "@/components/shared/BrandIcon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { path: "/monitoring", label: "Monitoring", icon: Activity },
  { path: "/soundscapes", label: "Soundscapes", icon: AudioLines },
  { path: "/collections", label: "Collections", icon: FolderOpen },
  { path: "/remote-config", label: "Remote config", icon: SlidersHorizontal },
  { path: "/support", label: "Support & Requests", icon: LifeBuoy },
];

function Navigation({ close, email, signOut }: { close?: () => void; email: string | null; signOut: () => void }) {
  return <>
    <div className="flex items-center gap-3 border-b px-5 py-6">
      <BrandIcon className="h-11 w-11 rounded-xl" />
      <div className="min-w-0 text-lg font-semibold tracking-tight">Passage<p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Admin Portal</p></div>
    </div>
    <p className="px-5 pt-7 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Management</p>
    <nav aria-label="Admin navigation" className="space-y-1 px-3">
      {navigation.map((item) => <NavLink key={item.path} to={item.path} onClick={close} className={({isActive}) => `relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary [&_svg]:text-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}><item.icon size={18} />{item.label}</NavLink>)}
    </nav>
    <div className="mt-auto border-t p-4">
      <div className="mb-2 flex min-w-0 items-center gap-3 rounded-lg px-2 py-2"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck size={17} /></span><div className="min-w-0"><p className="text-xs font-medium">Administrator</p><p className="truncate text-xs text-muted-foreground">{email || "Active admin session"}</p></div></div>
      <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={signOut}><LogOut />Log out</Button>
    </div>
  </>;
}

export function Shell() {
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const location = useLocation();
  const current = navigation.find((item) => location.pathname.startsWith(item.path))?.label || "Workspace";
  return <div className="min-h-screen min-w-0">
    <a href="#main-content" className="sr-only z-[100] rounded-md bg-card p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Skip to content</a>
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col border-r bg-card/95 lg:flex"><Navigation email={auth.email} signOut={auth.signOut} /></aside>
    <div className="min-w-0 lg:ml-68">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b bg-background/88 px-4 backdrop-blur-md sm:px-7 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation" className="lg:hidden"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="flex w-[min(19rem,88vw)] flex-col gap-0 p-0"><SheetHeader className="sr-only"><SheetTitle>Passage navigation</SheetTitle></SheetHeader><Navigation close={() => setOpen(false)} email={auth.email} signOut={auth.signOut} /></SheetContent>
          </Sheet>
          <BrandIcon className="h-8 w-8 shrink-0 rounded-lg lg:hidden" />
          <span className="min-w-0 truncate text-sm text-muted-foreground"><span className="hidden sm:inline">Passage Admin <span className="mx-2 text-muted-foreground/40">/</span></span><span className="text-foreground">{current}</span></span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {/* <span className="hidden max-w-64 truncate text-xs text-muted-foreground sm:block">{auth.email}</span> */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={auth.signOut} aria-label="Log out"><LogOut /></Button>
        </div>
      </header>
      <main id="main-content" className="mx-auto min-w-0 max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-8"><ErrorBoundary title="This page couldn’t load" resetKey={location.pathname}><Outlet /></ErrorBoundary></main>
    </div>
  </div>;
}
