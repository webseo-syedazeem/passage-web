import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, onSessionExpired, setToken } from "@/lib/api";
import { authApi, soundscapeApi } from "@/services/catalogue";
const AuthContext = createContext<{
  signedIn: boolean;
  email: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();
  // AU-4: several parallel requests can 401 at once; only handle the first.
  const expiryHandledRef = useRef(false);

  const clearSession = useCallback(() => {
    setToken(null);
    setSignedIn(false);
    setEmail(null);
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);

  const signOut = useCallback(() => {
    // AU-2: best-effort server-side revocation while the token is still set.
    // (request() reads the in-memory token synchronously, before this returns.)
    void authApi.signOut().catch(() => {});
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    onSessionExpired(() => {
      if (expiryHandledRef.current) return;
      expiryHandledRef.current = true;
      // The token is already invalid here, so skip the server call (and the
      // 401 loop it would cause) and just clear local state.
      clearSession();
      toast.error("Your session expired. Please sign in again.");
    });
  }, [clearSession]);

  const signIn = async (email: string, password: string) => {
    expiryHandledRef.current = false;
    setToken(null);
    const result = await authApi.signIn(email.trim(), password);
    if (!result.session?.access_token)
      throw new Error("Sign-in response is missing the access token");
    setToken(result.session.access_token);
    try {
      const rows = await soundscapeApi.list();
      queryClient.setQueryData(["soundscapes", ""], rows);
      setSignedIn(true);
      setEmail(email.trim());
      toast.success("Signed in to Passage Admin");
    } catch (error) {
      setToken(null);
      if (error instanceof ApiError && error.status === 403)
        throw new Error("This account does not have admin access.", {
          cause: error,
        });
      throw error;
    }
  };
  return (
    <AuthContext.Provider value={{ signedIn, email, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is required");
  return auth;
}
