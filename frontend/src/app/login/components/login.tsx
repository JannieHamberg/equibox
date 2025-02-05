"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      // No token, stay on login page
      return;
    }

    // Verify token is valid
    fetch("https://backend.equibox.se/wp-json/jwt-auth/v1/token/validate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        router.push('/userprofile');
      } else {
        // Invalid token, clear it
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("userName");
      }
    })
    .catch(() => {
      // Error checking token, clear it
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userName");
    });
  }, [router]);

  const handleLogin = async () => {
    setError(null);
    try {
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

      // Store user data
      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("userEmail", data.user_email);
      sessionStorage.setItem("userName", data.user_display_name);
      document.cookie = `authToken=${data.token}; path=/`;

      // Use replace instead of push to prevent going back to login page
      window.location.href = '/userprofile';
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <motion.section 
      className="container mx-auto px-4"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="bg-base-300 shadow-2xl rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center">
            {/* Image container */}
            <div className="px-2 py-2 lg:p-0 mb-2 lg:mb-0">
              <div className="relative h-[300px] md:h-[400px] lg:h-[650px] w-full">
                <Image
                  src="/section-img.webp"
                  alt="Person receiving Equibox delivery"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-fill md:object-cover rounded-md"
                />
              </div>
            </div>
            
            {/* Form content */}
            <div className="space-y-4 md:space-y-6 mx-auto p-4 md:p-0 w-full">
              <p className="text-sm uppercase tracking-wider mb-1 md:mb-4 px-4 md:pl-4 lg:pl-0">Välkommen tillbaka</p>
              
              <h2 className="text-2xl md:text-4xl font-bold text-primary mt-1 md:mt-4 px-4 md:pl-4 lg:pl-0">
                Logga in på ditt konto
              </h2>

              {error && <p className="text-red-500">{error}</p>}
              
              <div className="space-y-4 w-full px-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-[var(--color-gold)]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-[var(--color-gold)]"
                />
                <button
                  onClick={handleLogin}
                  className="w-full bg-black text-white px-8 py-3 rounded-md hover:bg-[var(--color-gold)] transition-colors"
                >
                  Login
                </button>
                <div className="text-center mt-4 md:pb-4 lg:pb-0">
                  <p>
                    Har du inget konto?{" "}
                    <a href="/signup" className="text-[var(--color-gold)] hover:underline">
                      Skapa konto
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
