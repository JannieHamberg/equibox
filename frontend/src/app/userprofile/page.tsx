"use client";
import UserDashboard from "./components/user-dashboard";


export default function UserProfilePage() {
  console.log("Rendering UserProfilePage");
  return (
    <div className="bg-base-100">
      <UserDashboard />
    </div>
  );
}
