import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return null;
    try {
      const decoded = jwtDecode(savedToken);
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : decoded;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    const res = await axios.post("/auth/login", { email, password });
    const data = res.data;
    const accessToken = data.access_token;

    // Decode role directly from JWT payload
    let decodedUser = {};
    try {
      decodedUser = jwtDecode(accessToken);
    } catch (e) {
      console.error("Failed to decode token", e);
    }

    const userData = {
      id: data.user?.id || decodedUser.id || decodedUser.sub,
      email: data.user?.email || decodedUser.email || email,
      name: data.user?.name || data.user?.full_name || decodedUser.name || email.split("@")[0],
      role: (data.user?.role || data.role || decodedUser.role || "customer").toLowerCase(),
    };

    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);