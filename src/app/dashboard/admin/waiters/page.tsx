"use client";
import { useEffect, useState } from "react";
import { getWaiters, createWaiter } from "@/app/services/waiters";
import { getBranches } from "@/app/services/branches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function WaitersPage() {
  const { toast } = useToast();
  const [waiters, setWaiters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    branchId: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchWaiters = async () => {
    setLoading(true);
    try {
      const data = await getWaiters();
      setWaiters(data);
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los meseros",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchWaiters();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createWaiter(form);
      toast({ title: "Éxito", description: "Mesero creado correctamente" });
      setForm({ email: "", password: "", name: "", branchId: "" });
      fetchWaiters();
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudo crear el mesero",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Crear Mesero</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-4 max-w-md"
          >
            <Input
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Correo electrónico"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              placeholder="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              required
              className="border rounded px-3 py-2"
            >
              <option value="">Selecciona una sucursal</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Mesero"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meseros</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando...</div>
          ) : waiters.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No se encontraron meseros.
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Nombre</th>
                  <th className="text-left">Correo</th>
                  <th className="text-left">Sucursal</th>
                </tr>
              </thead>
              <tbody>
                {waiters.map((waiter: any) => (
                  <tr key={waiter.id}>
                    <td>{waiter.name}</td>
                    <td>{waiter.email}</td>
                    <td>{waiter.branch?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
