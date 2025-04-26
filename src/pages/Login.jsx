// -------------------------------
// LOGIN PAGE COMPONENT
// -------------------------------
// Responsibilities:
// 1. User authentication
// 2. Form validation
// 3. Session management
// -------------------------------

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useNotification } from "../services/notificationService";
import Button from "../components/ui/button";

const Login = () => {
  // -------------------------------
  // STATE MANAGEMENT
  // -------------------------------
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // -------------------------------
  // DEVELOPMENT MODE BYPASS
  // -------------------------------
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      setCredentials({
        email: "admin@test.com",
        password: "pass"
      });
    }
  }, []);

  // -------------------------------
  // AUTHENTICATION HANDLER
  // -------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!credentials.email || !credentials.password) {
      addNotification("Please fill in all fields", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Supabase authentication
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;
      
      // Redirect on success
      navigate("/dashboard");
      addNotification("Login successful!", "success");

    } catch (error) {
      addNotification(error.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // RENDER LOGIC
  // -------------------------------
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            FaceTrack System
          </h1>
          <p className="text-gray-400">
            Secure facial recognition platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow-lg space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-lg"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </Button>

          {/* Development Mode Notice */}
          {import.meta.env.MODE === "development" && (
            <p className="text-yellow-500 text-sm text-center">
              Development mode: Credentials pre-filled
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;