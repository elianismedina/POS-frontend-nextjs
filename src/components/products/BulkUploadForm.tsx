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
        title: "Tipo de archivo inválido",
        description: "Por favor, seleccione un archivo CSV",
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
        throw new Error("Formato de respuesta inválido del servidor");
      }

      setUploadResult({ result });

      if (result.successful > 0) {
        toast({
          title: "Carga exitosa",
          description: `Se crearon exitosamente ${result.successful} productos`,
        });
        onSuccess();
      } else {
        toast({
          title: "Carga fallida",
          description:
            "No se crearon productos. Por favor, verifique el formato del CSV.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error de carga masiva:", error);

      // Provide more specific error messages
      let errorMessage = "Error al cargar los productos";

      if (error.response?.data?.message) {
        const message = error.response.data.message;
        if (message.includes("Invalid Record Length")) {
          errorMessage =
            "Error de formato CSV: El archivo tiene un número inconsistente de columnas. Asegúrese de que todas las filas tengan el mismo número de columnas y use comas como separadores.";
        } else if (message.includes("CSV file is empty")) {
          errorMessage =
            "El archivo CSV está vacío. Por favor, agregue datos de productos al archivo.";
        } else if (message.includes("Missing required fields")) {
          errorMessage =
            "Error CSV: Algunos campos requeridos (nombre, precio, stock) están faltando o son inválidos.";
        } else {
          errorMessage = message;
        }
      }

      toast({
        title: "Error de carga",
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
    // Use the ProductsUpload.csv file from public assets
    const templateUrl = "/assets/files/ProductsUpload.csv";

    // Create a link element to download the file
    const link = document.createElement("a");
    link.href = templateUrl;
    link.download = "ProductsUpload.csv";
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
            Carga Masiva de Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              Sube un archivo CSV para crear múltiples productos a la vez. El
              archivo CSV debe incluir las siguientes columnas:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>name</strong> (requerido): Nombre del producto
              </li>
              <li>
                <strong>description</strong> (opcional): Descripción del
                producto
              </li>
              <li>
                <strong>price</strong> (requerido): Precio del producto
                (numérico)
              </li>
              <li>
                <strong>stock</strong> (requerido): Cantidad inicial en
                inventario (numérico)
              </li>
              <li>
                <strong>imageUrl</strong> (opcional): URL de la imagen del
                producto
              </li>
              <li>
                <strong>barcode</strong> (opcional): Código de barras del
                producto en formato EAN-13
              </li>
              <li>
                <strong>discountable</strong> (opcional): Si el producto puede
                tener descuento (true/false)
              </li>
              <li>
                <strong>categoryId</strong> (opcional): UUID de la categoría
              </li>
              <li>
                <strong>subcategoryId</strong> (opcional): UUID de la
                subcategoría
              </li>
            </ul>

            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Requisitos de formato CSV:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Usa comas (,) como separador de columnas</li>
                    <li>
                      Si un campo de texto contiene comas, enciérralo entre
                      comillas dobles (")
                    </li>
                    <li>
                      Asegúrate de que todas las filas tengan exactamente 9
                      columnas
                    </li>
                    <li>
                      Deja los campos opcionales vacíos (no necesitas comillas
                      para campos vacíos)
                    </li>
                    <li>Usa punto (.) para decimales en precios, no comas</li>
                    <li>Guarda el archivo con codificación UTF-8</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="cancel"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Plantilla
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
                ? "Subiendo..."
                : "Haz clic para seleccionar un archivo CSV o arrástralo aquí"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Solo se admiten archivos CSV
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
              Resultados de la Carga
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {uploadResult.result.total}
                </div>
                <div className="text-sm text-gray-600">Registros Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.result.successful}
                </div>
                <div className="text-sm text-gray-600">Exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.result.failed}
                </div>
                <div className="text-sm text-gray-600">Fallidos</div>
              </div>
            </div>

            {uploadResult.result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Errores ({uploadResult.result.errors.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadResult.result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm"
                    >
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Fila {error.row}:</span>{" "}
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
        <Button variant="cancel" onClick={onCancel}>
          Cerrar
        </Button>
        {uploadResult && uploadResult.result.successful > 0 && (
          <Button variant="submit" onClick={onCancel}>
            Listo
          </Button>
        )}
      </div>
    </div>
  );
}
