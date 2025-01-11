"use client";

import { useRouter } from "next/navigation";
import styles from "../userprofile.module.css";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    console.log("Logout clicked"); // Debug log

    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear specific items if you prefer
      // localStorage.removeItem("authToken");
      // sessionStorage.removeItem("authToken");
      // sessionStorage.removeItem("userEmail");
      // sessionStorage.removeItem("userName");

      // Clear the auth cookie
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      console.log("Storage cleared"); // Debug log

      // Redirect to login
      router.push("/login");
      
      // Force a complete page refresh
      window.location.reload();
      
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-6 py-2 ${styles["btn-error"]}`}
      aria-label="Logga ut"
    >
      Logga ut
    </button>
  );
}
