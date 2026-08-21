import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/errors";

export default function Register() {
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get("role") === "provider" ? "provider" : "customer";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: preselectedRole,
    phone: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Mirrors the backend's Field(min_length=8) on UserCreate.password -
    // catches the obvious case client-side, backend still re-validates.
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-sm mx-auto mt-16 px-6 text-center">
        <p className="text-gray-900 font-medium">Account created!</p>
        <p className="text-sm text-gray-500 mt-1">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-6">
      <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            required
            value={form.name}
            onChange={update("name")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            required
            value={form.password}
            onChange={update("password")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            I am a...
          </label>
          <select
            value={form.role}
            onChange={update("role")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="customer">Customer — looking for services</option>
            <option value="provider">Provider — offering services</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone (optional)
          </label>
          <input
            value={form.phone}
            onChange={update("phone")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location (optional)
          </label>
          <input
            value={form.location}
            onChange={update("location")}
            placeholder="e.g. Quetta Cantt"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-gray-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}