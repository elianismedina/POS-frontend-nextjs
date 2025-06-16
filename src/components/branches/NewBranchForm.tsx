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
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const branchFormSchema = z.object({
  name: z.string().min(2, {
    message: "Branch name must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

export function NewBranchForm() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function onSubmit(data: BranchFormValues) {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No authentication token available",
      });
      return;
    }

    if (!user?.business?.[0]?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No business associated with your account",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const businessId = user.business[0].id;
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/branches/business/${businessId}`;

      // Log the request data for debugging
      console.log("Creating branch with data:", {
        url,
        data,
        businessId,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name.trim(),
          address: data.address.trim(),
          phone: data.phone.trim(),
          email: data.email.trim(),
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Error response:", responseData);
        if (response.status === 404) {
          throw new Error("Business not found or is inactive");
        } else if (response.status === 403) {
          throw new Error(
            "You do not have permission to create branches for this business"
          );
        } else if (response.status === 400) {
          throw new Error(responseData.message || "Invalid branch data");
        } else if (response.status === 500) {
          throw new Error(
            "Failed to create branch. Please check if the business is active and try again."
          );
        } else {
          throw new Error(responseData.message || "Failed to create branch");
        }
      }

      console.log("Branch created successfully:", responseData);
      toast({
        title: "Success",
        description: "Branch created successfully",
      });
      router.push(`/dashboard/admin/business/${businessId}/branches`);
    } catch (error) {
      console.error("Error creating branch:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create branch",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter branch name" {...field} />
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter branch address" {...field} />
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
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
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
                <Input
                  placeholder="Enter email address"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/branches")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Branch"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
