"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage("Lösenorden matchar inte!");
      return;
    }

    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Kunde inte skapa ett konto.");
      }

      setMessage("Konto skapat framgångsrikt! Logga in med ditt konto.");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push('/login'), 1000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ett okänt fel inträffade.");
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
            <div className="px-2 py-2 lg:p-0 mb-2 lg:mb-0">
              <div className="relative h-[300px] md:h-[500px] lg:h-[650px] w-full">
                <Image
                  src="/section-img4.webp"
                  alt="Person receiving Equibox delivery"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-fill md:object-cover md:object-top lg:object-center rounded-md"
                />
              </div>
            </div>
            
            <div className="space-y-4 md:space-y-6 mx-auto p-4 md:p-0 w-full">
              <p className="text-sm uppercase tracking-wider mb-1 md:mb-4 px-4 md:pl-4 lg:pl-0">BLI MEDLEM</p>
              
              <h2 className="text-2xl md:text-4xl font-bold text-primary mt-1 md:mt-4 px-4 md:pl-4 lg:pl-0">
                Skapa ett konto
              </h2>

              {message && <p className="text-blue-500 px-4">{message}</p>}
              
              <div className="space-y-4 w-full px-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Användarnamn"
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-[var(--color-gold)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-post"
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-[var(--color-gold)]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Lösenord"
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-[var(--color-gold)]"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Bekräfta lösenord"
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:border-[var(--color-gold)]"
                />
                <button
                  onClick={handleSignup}
                  className="w-full bg-black text-white px-8 py-3 rounded-md hover:bg-[var(--color-gold)] transition-colors"
                >
                  Skapa konto
                </button>
                <div className="text-center mt-4">
                  <p>
                    Har du redan ett konto?{" "}
                    <a href="/login" className="text-[var(--color-gold)] hover:underline">
                      Logga in
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
