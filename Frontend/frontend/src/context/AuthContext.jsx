import { createContext, useContext, useState } from "react";
import {
  loginUser as loginRequest,
  registerUser as registerRequest,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const res = await loginRequest({ email, password });
    const { access_token } = res.data;

    // The login endpoint only returns a token, not the user object, so
    // decode the JWT payload to get id/role without a second round trip.
    const payload = JSON.parse(atob(access_token.split(".")[1]));
    const loggedInUser = { id: Number(payload.sub), role: payload.role };

    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (data) => {
    // Registration doesn't log the user in automatically - the backend
    // returns the created user, not a token, so send them to log in next.
    await registerRequest(data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}