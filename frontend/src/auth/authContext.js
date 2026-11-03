import { createContext } from "react";

// Raw auth context, kept in its own module so AuthContext.jsx exports only the
// <AuthProvider> component and useAuth.js exports only the useAuth hook. This is
// required for React Fast Refresh to work correctly.
export const AuthContext = createContext(null);
