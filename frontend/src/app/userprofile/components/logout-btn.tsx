"use client";

import { useRouter } from "next/navigation";
import styles from "../userprofile.module.css";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // Remove token from local storage
    localStorage.removeItem("authToken");

    // Redirect to login
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className={` px-6 py-2 ${styles["btn-error"]}`}
    >
      Logga ut
    </button>
  );
}
