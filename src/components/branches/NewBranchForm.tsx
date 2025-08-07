"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const branchFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre de la sucursal debe tener al menos 2 caracteres.",
  }),
  address: z.string().min(5, {
    message: "La dirección debe tener al menos 5 caracteres.",
  }),
  phone: z.string().min(10, {
    message: "El número de teléfono debe tener al menos 10 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingresa una dirección de email válida.",
  }),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

export function NewBranchForm() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchCount, setBranchCount] = useState<number>(0);
  const [branchLimit, setBranchLimit] = useState<number>(0);
  const { toast } = useToast();

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    const fetchBranchCount = async () => {
      if (!token || !user?.business?.[0]?.id) return;

      try {
        const businessId = user.business[0].id;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/branches/business/${businessId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch branches");
        }

        const branches = await response.json();
        setBranchCount(branches.length);
        setBranchLimit(user.business[0].branchLimit);
      } catch (err) {
        console.error("Error fetching branch count:", err);
      }
    };

    fetchBranchCount();
  }, [token, user]);

  const onSubmit = async (data: BranchFormValues) => {
    if (!token || !user?.business?.[0]?.id) {
      setError("No hay un negocio asociado con tu cuenta");
      return;
    }

    if (branchCount >= branchLimit) {
      setError(
        `Has alcanzado el número máximo de sucursales (${branchLimit}) permitidas para tu plan de negocio. Por favor actualiza tu plan para agregar más sucursales.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const businessId = user.business[0].id;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/branches/business/${businessId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la sucursal");
      }

      toast({
        title: "Éxito",
        description: "Sucursal creada exitosamente",
      });

      router.push("/dashboard/admin/branches");
    } catch (err) {
      console.error("Error creating branch:", err);
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Sucursal</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ingresa el nombre de la sucursal"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ingresa la dirección de la sucursal"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el número de teléfono" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa la dirección de email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Sucursal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
