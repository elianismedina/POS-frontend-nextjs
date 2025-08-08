"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Scan,
  X,
  Search,
  Keyboard,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
  placeholder?: string;
  title?: string;
}

export function BarcodeScanner({
  onBarcodeScanned,
  onClose,
  isOpen,
  placeholder = "Scan or enter barcode...",
  title = "Barcode Scanner",
}: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"manual" | "hardware">("hardware");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle hardware scanner input (auto-submit on Enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && barcode.trim()) {
        e.preventDefault();
        handleBarcodeSubmit(barcode.trim());
      }
    },
    [barcode]
  );

  // Handle barcode submission
  const handleBarcodeSubmit = useCallback(
    (scannedBarcode: string) => {
      if (!scannedBarcode.trim()) {
        toast({
          title: "Invalid Barcode",
          description: "Please enter a valid barcode",
          variant: "destructive",
        });
        return;
      }

      setIsScanning(true);
      setLastScanned(scannedBarcode);

      // Add to scan history
      setScanHistory((prev) => {
        const newHistory = [
          scannedBarcode,
          ...prev.filter((b) => b !== scannedBarcode),
        ].slice(0, 5);
        return newHistory;
      });

      // Simulate processing delay for better UX
      setTimeout(() => {
        setIsScanning(false);
        onBarcodeScanned(scannedBarcode);
        setBarcode("");

        // Show success feedback
        toast({
          title: "Barcode Scanned",
          description: `Successfully scanned: ${scannedBarcode}`,
        });

        // Refocus input for next scan
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    },
    [onBarcodeScanned, toast]
  );

  // Handle manual input submission
  const handleManualSubmit = () => {
    if (barcode.trim()) {
      handleBarcodeSubmit(barcode.trim());
    }
  };

  // Clear barcode input
  const handleClear = () => {
    setBarcode("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Rescan last barcode
  const handleRescanLast = () => {
    if (lastScanned) {
      handleBarcodeSubmit(lastScanned);
    }
  };

  // Select from history
  const handleHistorySelect = (historyBarcode: string) => {
    handleBarcodeSubmit(historyBarcode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Scan Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === "hardware" ? "submit" : "cancel"}
              size="sm"
              onClick={() => setScanMode("hardware")}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Hardware Scanner
            </Button>
            <Button
              variant={scanMode === "manual" ? "submit" : "cancel"}
              size="sm"
              onClick={() => setScanMode("manual")}
              className="flex-1"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>

          {/* Barcode Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="pl-10 pr-20"
                disabled={isScanning}
                autoComplete="off"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                {barcode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {scanMode === "manual" && barcode && (
                  <Button
                    variant="submit"
                    size="sm"
                    onClick={handleManualSubmit}
                    disabled={isScanning}
                    className="h-6 w-6 p-0"
                  >
                    {isScanning ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Scan Status */}
            {isScanning && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing barcode...
              </div>
            )}

            {lastScanned && !isScanning && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Last scanned: {lastScanned}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            {scanMode === "hardware" ? (
              <>
                <p>• Connect your barcode scanner and scan products</p>
                <p>• Scanner will automatically submit on Enter key</p>
                <p>• Keep scanner focused on this input field</p>
              </>
            ) : (
              <>
                <p>• Type the barcode manually</p>
                <p>• Press Enter or click the check button to submit</p>
                <p>• Use for products without barcodes or scanner issues</p>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {lastScanned && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRescanLast}
                disabled={isScanning}
                className="flex-1"
              >
                <Scan className="h-4 w-4 mr-2" />
                Rescan Last
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
          </div>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Recent Scans
              </h4>
              <div className="flex flex-wrap gap-2">
                {scanHistory.map((historyBarcode, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handleHistorySelect(historyBarcode)}
                  >
                    {historyBarcode}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Manual Submit Button for Manual Mode */}
          {scanMode === "manual" && barcode && (
            <Button
              onClick={handleManualSubmit}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Submit Barcode
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
