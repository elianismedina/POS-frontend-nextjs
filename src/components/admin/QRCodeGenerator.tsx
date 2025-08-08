"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode, Download, Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface QRCodeGeneratorProps {
  businessId: string;
  businessName: string;
}

export function QRCodeGenerator({
  businessId,
  businessName,
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, error: errorToast, success } = useToast();

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create QR code client-side since backend API is not available
      const baseUrl =
        process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL ||
        "https://customer-menu-frontend-jc8n.vercel.app";
      const menuUrl = `${baseUrl}/welcome/${businessId}`;

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
  }, [businessId]);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qr-code-${businessName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMenuUrl = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL ||
      "https://customer-menu-frontend-jc8n.vercel.app";
    const menuUrl = `${baseUrl}/welcome/${businessId}`;

    navigator.clipboard.writeText(menuUrl);
    success({
      title: "Copied",
      description: "Menu URL copied to clipboard",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code
        </CardTitle>
        <CardDescription>
          QR code for {businessName} digital menu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-gray-500">Loading QR code...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {qrCodeUrl && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-full max-w-xs mx-auto"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={downloadQRCode}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={copyMenuUrl}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
