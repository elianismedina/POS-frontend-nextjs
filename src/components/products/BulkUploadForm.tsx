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
      const result = await productsService.bulkCreate(file);
      setUploadResult(result);

      if (result.result.successful > 0) {
        toast({
          title: "Upload Successful",
          description: `Successfully created ${result.result.successful} products`,
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
      toast({
        title: "Upload Error",
        description:
          error.response?.data?.message || "Failed to upload products",
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
    const csvContent = `name,description,price,stock,imageUrl,barcode,discountable,categoryId,subcategoryId
"Sample Product","A sample product description",29.99,100,"https://example.com/image.jpg","1234567890128",true,"",""
"Another Product","Another sample product",49.99,50,"","",true,"",""`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
