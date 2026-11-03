import { useContext } from "react";
import { AuthContext } from "./authContext";

// Hook for reading auth state. Kept separate from AuthContext.jsx so that file
// exports only the <AuthProvider> component (React Fast Refresh requirement).
export function useAuth() {
  return useContext(AuthContext);
}
