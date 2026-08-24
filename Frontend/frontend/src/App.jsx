import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Customer Only Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Provider Only Route */}
        <Route
          path="/provider"
          element={
            <ProtectedRoute roles={["provider"]}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}