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
import { Logo } from "@/components/shared/Logo";

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
      } else if (user.role.name === "waiter") {
        router.replace("/dashboard/waiter");
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
      console.log("🔍 [Login] Starting login request...");
      const response = await api.post("/auth/signin", {
        email: email.trim(),
        password,
      });

      console.log("🔍 [Login] Signin response received:", {
        hasAccessToken: !!response.data.accessToken,
        hasRefreshToken: !!response.data.refreshToken,
        role: response.data.role,
      });

      // Only call login if the API call was successful
      console.log("🔍 [Login] Calling AuthContext login...");
      await login(response.data.accessToken, response.data.refreshToken);
      console.log("✅ [Login] AuthContext login completed");

      setIsSuccess(true);

      // Add a small delay before redirect to show success message
      setTimeout(() => {
        console.log("🔍 [Login] Starting redirect...");
        setLoginAttemptInProgress(false);
        if (response.data.role === "admin") {
          console.log("🔍 [Login] Redirecting to admin dashboard");
          router.replace("/dashboard/admin");
        } else if (response.data.role === "cashier") {
          console.log("🔍 [Login] Redirecting to cashier dashboard");
          router.replace("/dashboard/cashier");
        } else if (response.data.role === "waiter") {
          console.log("🔍 [Login] Redirecting to waiter dashboard");
          router.replace("/dashboard/waiter");
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
      } else if (
        err.code === "ECONNABORTED" ||
        err.message?.includes("timeout")
      ) {
        errorMessage =
          "El servidor está tardando en responder. Inténtalo de nuevo.";
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
              <Logo width={80} height={80} />
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bienvenido a Pladiv POS
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
                  placeholder="Ingresa tu correo electrónico"
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
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Recordarme
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-sm text-muted-foreground/90">
        <p>© 2025 Pladiv POS. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
