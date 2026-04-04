import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "doctor" | "receptionist" | "pharmacy";

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  email: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    email: null,
  });

  const login = (email: string, role: UserRole) => {
    setAuth({ isAuthenticated: true, role, email });
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, role: null, email: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
