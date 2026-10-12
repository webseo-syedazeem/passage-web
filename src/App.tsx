import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/app/Auth";
import { ApiError } from "@/lib/api";
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
export default function App() {
  return (
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
  );
}
