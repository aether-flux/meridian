import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAppStore } from "../store/useAppStore.js";

const TOKEN_STORAGE_KEY = "meridian_token";
const USER_STORAGE_KEY = "meridian_user";
const AuthContext = createContext(null);

function getInitialAuth() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  try {
    return {
      token,
      user: JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null"),
      activeWorkspace: JSON.parse(
        localStorage.getItem("meridian_active_workspace") || "null",
      ),
    };
  } catch {
    return { token, user: null, activeWorkspace: null };
  }
}

function normalizeUser(user) {
  const initials = user.displayName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return { ...user, initials: user.initials || initials || "U" };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuth);

  useEffect(() => {
    useAppStore.setState((state) => ({
      user: auth.user,
      activeWorkspace: auth.activeWorkspace || state.activeWorkspace,
      workspaces: auth.activeWorkspace
        ? [
            auth.activeWorkspace,
            ...state.workspaces.filter(
              (workspace) => workspace.id !== auth.activeWorkspace.id,
            ),
          ]
        : state.workspaces,
    }));
  }, [auth.user, auth.activeWorkspace]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuth({ user: null, token: null });
      useAppStore.setState({ user: null, activeWorkspace: null });
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const saveAuth = ({ user, token }) => {
    const normalizedUser = normalizeUser(user);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
    setAuth({ user: normalizedUser, token });
    useAppStore.setState((state) => ({
      user: normalizedUser,
      activeWorkspace: state.activeWorkspace || state.workspaces[0] || null,
    }));
    return normalizedUser;
  };

  const login = async (credentials) =>
    saveAuth(await api.post("/auth/login", credentials));

  const register = async (details) =>
    saveAuth(await api.post("/auth/register", details));

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setAuth({ user: null, token: null });
    useAppStore.setState({ user: null, activeWorkspace: null });
  };

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        isAuthenticated: Boolean(auth.token && auth.user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}