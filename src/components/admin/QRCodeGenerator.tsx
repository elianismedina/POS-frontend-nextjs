"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Download, Copy, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface QRCodeGeneratorProps {
  businessId: string;
  businessName: string;
}

export function QRCodeGenerator({ businessId, businessName }: QRCodeGeneratorProps) {
  const [tableId, setTableId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = async () => {
    if (!tableId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a table ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customer-menu/qr/${businessId}/${tableId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to generate QR code: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
      
      toast({
        title: "Success",
        description: "QR code generated successfully",
      });
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError("Failed to generate QR code. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qr-code-${businessName}-table-${tableId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMenuUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_MENU_URL || "https://menu.yourdomain.com";
    const menuUrl = `${baseUrl}/menu/${businessId}?table=${tableId}`;
    
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: "Copied",
      description: "Menu URL copied to clipboard",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code Generator
        </CardTitle>
        <CardDescription>
          Generate QR codes for {businessName} tables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tableId">Table ID</Label>
          <Input
            id="tableId"
            placeholder="e.g., table-1, A1, etc."
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
          />
        </div>

        <Button 
          onClick={generateQRCode} 
          disabled={loading || !tableId.trim()}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate QR Code"}
        </Button>

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