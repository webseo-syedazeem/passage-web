import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "@/app/Auth";
import { Shell } from "@/components/layout/Shell";
import { Login } from "@/pages/Login";
const SupportList = lazy(() =>
  import("@/features/support/SupportList").then((m) => ({
    default: m.SupportList,
  })),
);
const SupportDetail = lazy(() =>
  import("@/features/support/SupportDetail").then((m) => ({
    default: m.SupportDetail,
  })),
);
const SoundscapeList = lazy(() =>
  import("@/features/soundscapes/SoundscapeList").then((m) => ({
    default: m.SoundscapeList,
  })),
);
const SoundscapeEditor = lazy(() =>
  import("@/features/soundscapes/SoundscapeEditor").then((m) => ({
    default: m.SoundscapeEditor,
  })),
);
const CollectionList = lazy(() =>
  import("@/features/collections/CollectionList").then((m) => ({
    default: m.CollectionList,
  })),
);
const CollectionEditor = lazy(() =>
  import("@/features/collections/CollectionEditor").then((m) => ({
    default: m.CollectionEditor,
  })),
);
const CollectionDetail = lazy(() =>
  import("@/features/collections/CollectionDetail").then((m) => ({
    default: m.CollectionDetail,
  })),
);
const RemoteList = lazy(() =>
  import("@/features/remote-config/RemoteList").then((m) => ({
    default: m.RemoteList,
  })),
);
const RemoteEditor = lazy(() =>
  import("@/features/remote-config/RemoteEditor").then((m) => ({
    default: m.RemoteEditor,
  })),
);
const MonitoringDashboard = lazy(() =>
  import("@/features/monitoring/MonitoringDashboard").then((m) => ({
    default: m.MonitoringDashboard,
  })),
);
export function AdminRoutes() {
  const { signedIn } = useAuth();
  return (
    <Suspense
      fallback={
        <div className="p-8 text-muted-foreground" role="status">
          Loading workspace…
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={signedIn ? <Shell /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/monitoring" replace />} />
          <Route path="monitoring" element={<MonitoringDashboard />} />
          <Route path="soundscapes" element={<SoundscapeList />} />
          <Route path="soundscapes/new" element={<SoundscapeEditor />} />
          <Route path="soundscapes/:id" element={<SoundscapeEditor />} />
          <Route path="collections" element={<CollectionList />} />
          <Route path="collections/new" element={<CollectionEditor />} />
          <Route path="collections/:id" element={<CollectionDetail />} />
          <Route path="collections/:id/edit" element={<CollectionEditor />} />
          <Route path="remote-config" element={<RemoteList />} />
          <Route path="remote-config/new" element={<RemoteEditor />} />
          <Route path="remote-config/:key/edit" element={<RemoteEditor />} />
          <Route path="support" element={<SupportList />} />
          <Route path="support/:id" element={<SupportDetail />} />
          <Route
            path="*"
            element={
              <div className="panel">
                <h1 className="page-heading">Page not found</h1>
                <p className="muted mt-3">
                  Choose a workspace from the navigation.
                </p>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
