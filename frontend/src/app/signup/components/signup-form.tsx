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
      <div className="max-w-[1280px] mx-auto mt-32">
        <div className="bg-base-300 shadow-2xl rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[650px]">
              <Image
                src="/section-img4.webp"
                alt="Person receiving Equibox delivery"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded-lg"
              />
            </div>
            
            <div className="space-y-6 mx-auto">
              <p className="text-sm uppercase tracking-wider">Bli medlem</p>
              
              <h2 className="text-4xl font-bold text-primary">
                Skapa ett konto
              </h2>

              {message && <p className="text-red-500">{message}</p>}
              
              <div className="space-y-4 max-w-md">
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
