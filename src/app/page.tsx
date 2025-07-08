"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loginAttemptInProgress, setLoginAttemptInProgress] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // Handle redirects only for users already authenticated from previous session
  useEffect(() => {
    // Don't redirect if there's an error, if we're loading, or if a login attempt is in progress
    if (error || isLoading || loginAttemptInProgress) {
      return;
    }

    if (isAuthenticated && !authLoading && user) {
      if (user.role.name === "admin") {
        router.replace("/dashboard/admin");
      } else if (user.role.name === "cashier") {
        router.replace("/dashboard/cashier");
      }
    }
  }, [
    isAuthenticated,
    authLoading,
    user,
    isLoading,
    error,
    isSuccess,
    loginAttemptInProgress,
    router,
  ]);

  // Add a separate effect to prevent any navigation when there's an error
  useEffect(() => {
    if (error) {
      // Force the page to stay on the current URL
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath !== "/") {
          // Prevent navigation away from login page
        }
      }
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setIsSuccess(false);
    setLoginAttemptInProgress(true);

    // Basic validation
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico.");
      setLoginAttemptInProgress(false);
      return;
    }

    if (!password.trim()) {
      setError("Por favor ingresa tu contraseña.");
      setLoginAttemptInProgress(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/signin", {
        email: email.trim(),
        password,
      });

      // Only call login if the API call was successful
      await login(response.data.accessToken, response.data.refreshToken);

      setIsSuccess(true);

      // Add a small delay before redirect to show success message
      setTimeout(() => {
        setLoginAttemptInProgress(false);
        if (response.data.role === "admin") {
          router.replace("/dashboard/admin");
        } else if (response.data.role === "cashier") {
          router.replace("/dashboard/cashier");
        }
      }, 1500);
    } catch (err: any) {
      // Handle specific error messages from the backend
      let errorMessage = "Error inesperado. Inténtalo de nuevo.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage =
          "Credenciales inválidas. Verifica tu correo y contraseña.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Error interno del servidor. Inténtalo de nuevo más tarde.";
      } else if (err.code === "NETWORK_ERROR" || err.code === "ERR_NETWORK") {
        errorMessage = "Error de conexión. Verifica tu conexión a internet.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoginAttemptInProgress(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setLoginAttemptInProgress(false);
    setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setLoginAttemptInProgress(false);
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {isSuccess && (
                <Alert className="border-green-500 bg-green-50 text-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    ¡Inicio de sesión exitoso! Redirigiendo...
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
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
