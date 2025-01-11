"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export default function UserIcon() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to check login status
  const checkLoginStatus = () => {
    const token = localStorage.getItem("authToken"); // Retrieve JWT token from localStorage
    if (!token) return false;

    try {
      // Decode and validate token (optionally)
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
      const isTokenExpired = payload.exp * 1000 < Date.now(); // Check expiration
      return !isTokenExpired; // Return false if the token is expired
    } catch (err) {
      console.error("Invalid token", err);
      return false; // Invalid token
    }
  };

  // Check login status on component mount
  useEffect(() => {
    setIsLoggedIn(checkLoginStatus());
  }, []);

  return (
    <Link href={isLoggedIn ? "/userprofile" : "/login"}>
      <FontAwesomeIcon
        icon={faUser}
        className="h-5 w-5 cursor-pointer text-gray-900"
        aria-label="Mitt konto"
      />
    </Link>
  );
}
