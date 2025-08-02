"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function DebugPage() {
  const [apiStatus, setApiStatus] = useState<string>("pending");
  const [apiError, setApiError] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check environment variables
    setEnvVars({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    });

    // Test API connectivity
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      console.log("Testing API connection...");
      console.log("Base URL:", api.defaults.baseURL);

      const response = await api.get("/auth/whoami");
      console.log("API Response:", response);
      setApiStatus("success");
    } catch (error: any) {
      console.error("API Error:", error);
      setApiStatus("error");
      setApiError(error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "API is reachable";
      case "error":
        return "API connection failed";
      default:
        return "Testing API connection...";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(apiStatus)}
              API Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span
                className={`text-sm ${
                  apiStatus === "success"
                    ? "text-green-600"
                    : apiStatus === "error"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {getStatusText(apiStatus)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Base URL:</span>
              <span className="text-sm text-gray-600 font-mono">
                {api.defaults.baseURL}
              </span>
            </div>

            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={testApiConnection}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test API Connection"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{key}:</span>
                  <span className="text-sm text-gray-600 font-mono">
                    {String(value || "undefined")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Agent:</span>
                <span className="text-sm text-gray-600">
                  {typeof window !== "undefined"
                    ? window.navigator.userAgent
                    : "Server-side"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current URL:</span>
                <span className="text-sm text-gray-600">
                  {typeof window !== "undefined"
                    ? window.location.href
                    : "Server-side"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
