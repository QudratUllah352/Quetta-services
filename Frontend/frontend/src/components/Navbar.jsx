import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkStyle = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive
        ? "text-blue-600 font-semibold"
        : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              Q
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                Quetta<span className="text-blue-600">Services</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block -mt-0.5">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" className={navLinkStyle}>
              Home
            </NavLink>

            {/* Role-Specific Links */}
            {token && user?.role === "customer" && (
              <NavLink to="/dashboard" className={navLinkStyle}>
                My Bookings
              </NavLink>
            )}

            {token && user?.role === "provider" && (
              <NavLink to="/provider" className={navLinkStyle}>
                Provider Portal
              </NavLink>
            )}

            {token && user?.role === "admin" && (
              <NavLink to="/admin" className={navLinkStyle}>
                Admin Panel
              </NavLink>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-3">
                {/* User Profile Pill */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center uppercase">
                    {user?.name ? user.name.charAt(0) : "U"}
                  </div>
                  <div className="text-left pr-1">
                    <p className="text-xs font-semibold text-slate-800 leading-none">
                      {user?.name || "My Account"}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {user?.role || "Member"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>

          {token && user?.role === "customer" && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              My Bookings
            </Link>
          )}

          {token && user?.role === "provider" && (
            <Link
              to="/provider"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Provider Portal
            </Link>
          )}

          {token && user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
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
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Log Out ({user?.name || "Account"})
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-xs"
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