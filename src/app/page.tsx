"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isRedirecting) {
      console.log("User authenticated:", user);
      setIsRedirecting(true);

      if (user.role.name === "admin") {
        console.log("Redirecting to admin dashboard");
        router.push("/dashboard/admin");
      } else if (user.role.name === "cashier") {
        console.log("Redirecting to cashier dashboard");
        router.push("/dashboard/cashier");
      }
    }
  }, [isAuthenticated, user, router, isLoading, isRedirecting]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to POS System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please select your role to sign in
            </p>
            <div className="flex flex-col gap-4">
              <Button asChild variant="default">
                <Link href="/admin/signin">Sign in as Admin</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/signin">Sign in as Cashier</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
