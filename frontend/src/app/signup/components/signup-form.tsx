"use client";

import { useState } from "react";
import styles from "../signup-form.module.css";
import LoginPage from "@/app/login/components/login";


export default function SignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false); // Toggle between signup and login forms

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

      // If registration is successful, switch to the login form
      setMessage("Konto skapat framgångsrikt! Logga in med ditt konto.");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowLoginForm(true), 2000); // Wait for 2 seconds before switching to login form
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ett okänt fel inträffade.");
    }
  };

  if (showLoginForm) {
    return <LoginPage />; // Render the login form 
  }

  return (
    <form onSubmit={handleSignup} className={styles.signupForm}>
      <h2>Skapa ett konto</h2>
      {message && <p className={styles.message}>{message}</p>}
      <input
        type="text"
        placeholder="Användarnamn"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="E-post"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Bekräfta lösenord"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <div className={styles.buttonContainer}>
        <button type="submit" className="btn justify-end">
          Skapa konto
        </button>
      </div>
    </form>
  );
}
