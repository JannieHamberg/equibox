"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setError(null); // Reset any previous errors
    try {
        console.log("Token request initiated", { username, password });
      // Send login credentials to backend
      const response = await fetch("https://backend.equibox.se/wp-json/jwt-auth/v1/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();

      // Store the JWT token in localStorage or cookies
      localStorage.setItem("authToken", data.token);

      // Redirect to the dashboard
      router.push("/userprofile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    
    <div className=" max-w-sm mx-auto mt-60 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />
      <button
        onClick={handleLogin}
        className="w-full btn text-white p-2 "
      >
        Login
      </button>
    </div>
    
  );
}
