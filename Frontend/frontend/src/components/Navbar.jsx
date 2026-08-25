import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRole = (user?.role || "").toLowerCase();
  const isProvider = token && userRole === "provider";
  const isCustomer = token && userRole === "customer";
  const isAdmin = token && userRole === "admin";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Animated Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group relative">
            <div className="relative w-11 h-11 rounded-2xl bg-linear-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/50 group-hover:scale-105 transition-all duration-300 ease-out">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <span className="text-white font-black text-xl tracking-wider group-hover:rotate-6 transition-transform duration-300">
                  Q
                </span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors duration-200">
                Quetta<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">Services</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Marketplace
              </span>
            </div>
          </Link>

          {/* Floating Pill Main Navigation */}
          <nav className="hidden md:flex items-center bg-slate-100/80 p-1.5 rounded-full border border-slate-200/80 shadow-inner backdrop-blur-md">
            
            {/* Home Link */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-white text-blue-600 shadow-md shadow-slate-900/5 scale-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`
              }
            >
              Home
            </NavLink>

            {/* Customer Dashboard Link */}
            {isCustomer && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-white text-blue-600 shadow-md shadow-slate-900/5 scale-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`
                }
              >
                Customer Dashboard
              </NavLink>
            )}

            {/* Provider Portal Link */}
            {isProvider && (
              <NavLink
                to="/provider"
                className={({ isActive }) =>
                  `relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-white text-emerald-600 shadow-md shadow-slate-900/5 scale-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`
                }
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Provider Portal
                </span>
              </NavLink>
            )}

            {/* Admin Panel Link */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `relative px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-white text-purple-600 shadow-md shadow-slate-900/5 scale-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`
                }
              >
                Admin Panel
              </NavLink>
            )}
          </nav>

          {/* Right Action & User Profile Section */}
          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-1.5 pr-3 rounded-2xl shadow-2xs">
                {/* Real-time Notification Bell Dropdown */}
                <NotificationBell />

                {/* Profile Pill */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl text-white text-xs font-black flex items-center justify-center uppercase shadow-2xs transition-transform duration-200 hover:scale-105 ${
                      isProvider
                        ? "bg-linear-to-tr from-emerald-600 to-teal-500"
                        : isAdmin
                        ? "bg-linear-to-tr from-purple-600 to-pink-500"
                        : "bg-linear-to-tr from-blue-600 to-indigo-500"
                    }`}
                  >
                    {user?.name || user?.full_name
                      ? (user.name || user.full_name).charAt(0)
                      : "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {user?.name || user?.full_name || "Account"}
                    </p>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider block ${
                        isProvider
                          ? "text-emerald-600"
                          : isAdmin
                          ? "text-purple-600"
                          : "text-blue-600"
                      }`}
                    >
                      {userRole || "Customer"}
                    </span>
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all duration-150"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="relative group px-5 py-2.5 rounded-xl overflow-hidden shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 transition-all group-hover:scale-105"></div>
                  <span className="relative text-xs font-bold text-white tracking-wide">
                    Get Started →
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Bar: Notification Bell + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {token && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Animated Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Home
          </Link>

          {isCustomer && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Customer Dashboard
            </Link>
          )}

          {isProvider && (
            <Link
              to="/provider"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              Provider Portal
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-bold text-purple-600 hover:bg-purple-50 transition-colors"
            >
              Admin Panel
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100">
            {token ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Log Out ({user?.name || user?.full_name || "User"})
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}