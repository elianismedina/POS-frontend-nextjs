"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function WaiterDashboard() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bienvenido, Mesero</h1>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
      <p>
        Este es tu panel principal. Aquí podrás ver tus órdenes, mesas y más.
      </p>
      {/* Agrega aquí las funcionalidades específicas para meseros */}
    </div>
  );
}
