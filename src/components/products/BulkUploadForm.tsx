"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  productsService,
  BulkCreateProductsResponse,
} from "@/app/services/products";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BulkUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function BulkUploadForm({ onSuccess, onCancel }: BulkUploadFormProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] =
    useState<BulkCreateProductsResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await productsService.bulkCreate(file);

      // Handle both response structures (with and without result wrapper)
      const result = response.result || response;

      if (!result || typeof result !== "object") {
        throw new Error("Invalid response format from server");
      }

      setUploadResult({ result });

      if (result.successful > 0) {
        toast({
          title: "Upload Successful",
          description: `Successfully created ${result.successful} products`,
        });
        onSuccess();
      } else {
        toast({
          title: "Upload Failed",
          description: "No products were created. Please check the CSV format.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to upload products";

      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes("Invalid Record Length")) {
          errorMessage =
            "CSV format error: The file has inconsistent column counts. Please ensure all rows have the same number of columns and use commas as separators.";
        } else if (message.includes("CSV file is empty")) {
          errorMessage =
            "The CSV file is empty. Please add product data to the file.";
        } else if (message.includes("Missing required fields")) {
          errorMessage =
            "CSV error: Some required fields (name, price, stock) are missing or invalid.";
        } else {
          errorMessage = message;
        }
      }

      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const downloadTemplate = () => {
    // Use the existing products.csv file from public assets
    const templateUrl = "/assets/files/products.csv";

    // Create a link element to download the file
    const link = document.createElement("a");
    link.href = templateUrl;
    link.download = "products_template.csv";
    link.target = "_blank";

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              Upload a CSV file to create multiple products at once. The CSV
              should include the following columns:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>name</strong> (required): Product name
              </li>
              <li>
                <strong>description</strong> (optional): Product description
              </li>
              <li>
                <strong>price</strong> (required): Product price (numeric)
              </li>
              <li>
                <strong>stock</strong> (required): Initial stock quantity
                (numeric)
              </li>
              <li>
                <strong>imageUrl</strong> (optional): URL of the product image
              </li>
              <li>
                <strong>barcode</strong> (optional): Product barcode in EAN-13
                format
              </li>
              <li>
                <strong>discountable</strong> (optional): Whether the product
                can be discounted (true/false)
              </li>
              <li>
                <strong>categoryId</strong> (optional): UUID of the category
              </li>
              <li>
                <strong>subcategoryId</strong> (optional): UUID of the
                subcategory
              </li>
            </ul>

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">CSV Format Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use commas (,) as column separators</li>
                    <li>
                      Enclose text fields in double quotes (") if they contain
                      commas
                    </li>
                    <li>Ensure all rows have exactly 9 columns</li>
                    <li>
                      Leave optional fields empty (no quotes needed for empty
                      fields)
                    </li>
                    <li>Use decimal points (.) for prices, not commas</li>
                    <li>Save the file with UTF-8 encoding</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isUploading
                ? "Uploading..."
                : "Click to select a CSV file or drag and drop"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Only CSV files are supported
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {uploadResult.result.total}
                </div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.result.successful}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.result.failed}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {uploadResult.result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Errors ({uploadResult.result.errors.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadResult.result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm"
                    >
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Row {error.row}:</span>{" "}
                        {error.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Close
        </Button>
        {uploadResult && uploadResult.result.successful > 0 && (
          <Button onClick={onCancel}>Done</Button>
        )}
      </div>
    </div>
  );
}
