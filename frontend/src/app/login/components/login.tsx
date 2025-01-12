"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    try {
      console.log("Token request initiated", { username, password });

      // Send login credentials to backend
      const response = await fetch("https://backend.equibox.se/wp-json/jwt-auth/v1/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        /* credentials: "include",  */
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }
      console.log("Login Response Headers:");
      for (const [key, value] of response.headers.entries()) {
        console.log(`${key}: ${value}`);
      }
      // Optionally verify login success
      const data = await response.json();
      console.log("Login successful", data);
       // Store the user's email and name in sessionStorage
      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("userEmail", data.user_email); 
      sessionStorage.setItem("userName", data.user_display_name);

       // Set the cookie
       document.cookie = `authToken=${data.token}; path=/`;

      // Redirect to the dashboard
      console.log("Before redirection:", window.location.href);
      router.push("/userprofile");
      console.log("After redirection:", window.location.href);
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
      <div className="max-w-[1280px] mx-auto mt-32">
        <div className="bg-base-300 shadow-2xl rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[650px]">
              <Image
                src="/section-img.webp"
                alt="Person receiving Equibox delivery"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded-lg"
              />
            </div>
            
            <div className="space-y-6 mx-auto">
              <p className="text-sm uppercase tracking-wider">Välkommen tillbaka</p>
              
              <h2 className="text-4xl font-bold text-primary">
                Logga in på ditt konto
              </h2>

              {error && <p className="text-red-500">{error}</p>}
              
              <div className="space-y-4 max-w-md">
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
                <div className="text-center mt-4">
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
