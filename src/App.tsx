import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/app/Auth";
import { ApiError } from "@/lib/api";
import { configError } from "@/lib/config";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminRoutes } from "@/routes/AdminRoutes";
const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: (count, error) =>
        count < 1 &&
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        maxWidth: 560,
        margin: "15vh auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        color: "#e5e7eb",
        background: "#1b1c1e",
        border: "1px solid #3a3b3d",
        borderRadius: 12,
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Admin is not configured</h1>
      <p style={{ lineHeight: 1.6, color: "#9ca3af" }}>{message}</p>
    </div>
  );
}

export default function App() {
  // PR-1: a misconfigured API origin now shows a readable screen instead of a
  // blank white page.
  if (configError) return <ConfigErrorScreen message={configError} />;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <AdminRoutes />
            <Toaster
              theme="dark"
              richColors
              closeButton
              position="bottom-right"
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
