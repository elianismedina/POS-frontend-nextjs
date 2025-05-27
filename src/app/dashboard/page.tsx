"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { getUserName } from "../utils/user";
import { formatDate } from "../utils/date";

export default function DashboardPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  console.log(
    "Dashboard - Rendering, isAuthenticated:",
    isAuthenticated,
    "User:",
    user
  );

  useEffect(() => {
    console.log(
      "Dashboard - useEffect, isAuthenticated:",
      isAuthenticated,
      "User:",
      user
    );
    if (!isAuthenticated) {
      console.log("Dashboard - Initiating redirect to /login");
      router.push("/login");
    }
  }, [isAuthenticated, router, user]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!isAuthenticated) {
    console.log("Dashboard - Returning null due to unauthenticated state");
    return null;
  }

  console.log("Dashboard - Full user object:", JSON.stringify(user, null, 2));
  console.log("Dashboard - CreatedAt value:", user?.createdAt);
  console.log("Dashboard - CreatedAt type:", typeof user?.createdAt);
  console.log("Dashboard - getUserName result:", getUserName(user));
  console.log("Dashboard - user.email:", user?.email);

  const formattedDate = formatDate(user?.createdAt);
  const userName = getUserName(user) || "User";
  const userEmail = user?.email || "N/A";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <div className="text-gray-600">
              <p>Welcome back, {userName}!</p>
              <p className="mt-2">Email: {userEmail}</p>
              <p className="mt-2">Member since: {formattedDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
