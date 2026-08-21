import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <Link to="/" className="text-lg font-semibold text-gray-900">
        Quetta Services
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          Services
        </Link>
        {!user && (
          <Link to="/register?role=provider" className="text-gray-600 hover:text-gray-900">
            Become a Provider
          </Link>
        )}
        {!user && (
          <>
            <Link to="/login" className="text-gray-600 hover:text-gray-900">
              Log In
            </Link>
            <Link to="/register" className="text-gray-600 hover:text-gray-900">
              Sign Up
            </Link>
          </>
        )}
        {user?.role === "customer" && (
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
            My Bookings
          </Link>
        )}
        {user?.role === "provider" && (
          <Link to="/provider" className="text-gray-600 hover:text-gray-900">
            My Dashboard
          </Link>
        )}
        {user?.role === "admin" && (
          <Link to="/admin" className="text-gray-600 hover:text-gray-900">
            Admin
          </Link>
        )}
        {user && (
          <button
            onClick={logout}
            className="text-gray-600 hover:text-gray-900"
          >
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
}