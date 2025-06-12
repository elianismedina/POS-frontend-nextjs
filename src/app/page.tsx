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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center pattern-bg overflow-hidden">
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="backdrop-blur-sm bg-background/80 border-primary/20 shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  POS
                </span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to POS System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-center text-muted-foreground text-lg">
                Please select your role to sign in
              </p>
              <div className="flex flex-col gap-4">
                <Button
                  asChild
                  className="h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Link href="/admin/signin">Sign in as Admin</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 text-lg font-semibold border-primary/20 hover:bg-primary/5 transition-all duration-300"
                >
                  <Link href="/signin">Sign in as Cashier</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-sm text-muted-foreground/90">
        <p>© 2025 POS System. All rights reserved.</p>
      </div>
    </div>
  );
}
