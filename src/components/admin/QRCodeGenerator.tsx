"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface QRCodeGeneratorProps {
  businessId: string;
  businessName: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  businessId,
  businessName,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create QR code client-side since backend API is not available
      const baseUrl =
        process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL ||
        "https://customer-menu-frontend-jc8n.vercel.app"; // Corrected base URL
      const menuUrl = `${baseUrl}/welcome/${businessId}`; // Corrected path

      // Create a simple QR code using a public QR code API
      const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        menuUrl
      )}`;

      const qrResponse = await fetch(qrCodeApiUrl);
      if (qrResponse.ok) {
        const blob = await qrResponse.blob();
        const url = URL.createObjectURL(blob);
        setQrCodeUrl(url);
        return;
      }

      throw new Error("Could not generate QR code using fallback method");
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError("Failed to generate QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate QR code when component mounts
  useEffect(() => {
    generateQRCode();
  }, [businessId]); // Dependency on businessId ensures it regenerates for different businesses

  const copyToClipboard = async () => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL ||
        "https://customer-menu-frontend-jc8n.vercel.app";
      const menuUrl = `${baseUrl}/welcome/${businessId}`;

      await navigator.clipboard.writeText(menuUrl);
      toast({
        title: "Success",
        description: "URL copied to clipboard",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to copy URL:", err);
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard",
        variant: "error",
      });
    }
  };

  const openMenuUrl = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL ||
      "https://customer-menu-frontend-jc8n.vercel.app";
    const menuUrl = `${baseUrl}/welcome/${businessId}`;
    window.open(menuUrl, "_blank");
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code {/* Changed title */}
        </CardTitle>
        <p className="text-sm text-gray-600">
          QR code for {businessName} digital menu {/* Changed description */}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-gray-500">Loading QR code...</div>
          </div>
        )}

        {error && (
          <div className="text-center p-4">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button variant="submit" onClick={generateQRCode}>
              Try Again
            </Button>
          </div>
        )}

        {qrCodeUrl && !loading && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrCodeUrl}
                alt={`QR Code for ${businessName}`}
                className="border border-gray-200 rounded-lg"
                width={200}
                height={200}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="cancel"
                onClick={copyToClipboard}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                onClick={openMenuUrl}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Menu
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
