import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getServices, getCategories } from "../api/services";

export default function Home() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    location: "",
    min_price: "",
    max_price: "",
    min_rating: "",
  });

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Drop empty-string filters rather than sending them - the backend
      // treats an absent param and an empty string differently.
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "")
      );
      const res = await getServices(params);
      setServices(res.data);
    } catch {
      setError("Could not load services. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const update = (field) => (e) =>
    setFilters((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    loadServices();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-gray-900">
        Find trusted local services in Quetta
      </h1>
      <p className="mt-1 text-gray-500">
        Tutors, electricians, tailors, and more — from providers near you.
      </p>

      {categories.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setFilters((f) => ({ ...f, category_id: String(c.id) }));
                }}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  filters.category_id === String(c.id)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <input
          placeholder="Search..."
          value={filters.search}
          onChange={update("search")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={filters.category_id}
          onChange={update("category_id")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Location"
          value={filters.location}
          onChange={update("location")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="number"
          placeholder="Min price"
          value={filters.min_price}
          onChange={update("min_price")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="number"
          placeholder="Max price"
          value={filters.max_price}
          onChange={update("max_price")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={filters.min_rating}
          onChange={update("min_rating")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Any rating</option>
          <option value="4">★ 4+ stars</option>
          <option value="3">★ 3+ stars</option>
          <option value="2">★ 2+ stars</option>
        </select>
        <button
          type="submit"
          className="lg:col-span-3 sm:col-span-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Search
        </button>
      </form>

      <div className="mt-8">
        {loading && <p className="text-gray-400 text-sm">Loading...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && !error && services.length === 0 && (
          <p className="text-gray-400 text-sm">
            No services match your filters.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Link
              key={s.id}
              to={`/services/${s.id}`}
              className="block rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-gray-900">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {s.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-900">
                  Rs. {s.price}
                </span>
                <span className="text-gray-400">
                  {s.average_rating
                    ? `★ ${s.average_rating} (${s.review_count})`
                    : "No reviews yet"}
                </span>
              </div>
              {s.location && (
                <p className="mt-1 text-xs text-gray-400">{s.location}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                by {s.provider_name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}