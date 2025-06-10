"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AdminDashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/signin");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <p className="text-gray-600 mb-4">Manage your product categories</p>
          <button
            onClick={() => router.push("/dashboard/admin/categories")}
            className="text-blue-600 hover:text-blue-800"
          >
            View Categories →
          </button>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <p className="text-gray-600 mb-4">Manage system users</p>
          <button
            onClick={() => router.push("/dashboard/admin/users")}
            className="text-blue-600 hover:text-blue-800"
          >
            View Users →
          </button>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Business</h2>
          <p className="text-gray-600 mb-4">Manage business settings</p>
          <button
            onClick={() => router.push("/dashboard/admin/business")}
            className="text-blue-600 hover:text-blue-800"
          >
            View Business →
          </button>
        </div>
      </div>
    </div>
  );
}
