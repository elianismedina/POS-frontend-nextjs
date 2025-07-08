"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { cashReportService, CashReport } from "@/services/cash-report";
import { shiftsService, Shift as ShiftType } from "@/app/services/shifts";
import {
  Calculator,
  Clock,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Shift {
  id: string;
  startTime: string;
  endTime?: string;
  status: "ACTIVE" | "ENDED";
  initialAmount: number;
  finalAmount?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CashReportPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [cashReport, setCashReport] = useState<CashReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadShifts();
    }
  }, [user?.id]);

  const loadShifts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await shiftsService.getShiftsByCashier(user.id);
      setShifts(response as Shift[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los turnos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCashReport = async (shiftId: string) => {
    try {
      setReportLoading(true);
      const report = await cashReportService.getCashReport(shiftId);
      setCashReport(report);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el reporte de caja",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleShiftSelect = (shift: Shift) => {
    setSelectedShift(shift);
    loadCashReport(shift.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    return status === "ACTIVE" ? (
      <Badge variant="default" className="bg-green-500">
        <Clock className="h-3 w-3 mr-1" />
        Activo
      </Badge>
    ) : (
      <Badge variant="secondary">
        <CheckCircle className="h-3 w-3 mr-1" />
        Cerrado
      </Badge>
    );
  };

  const getCashDifferenceStatus = (difference?: number) => {
    if (difference === undefined) return null;

    if (difference === 0) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span className="font-medium">Cuadre perfecto</span>
        </div>
      );
    } else if (difference > 0) {
      return (
        <div className="flex items-center text-orange-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="font-medium">
            Sobrante: {formatCurrency(difference)}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="font-medium">
            Faltante: {formatCurrency(Math.abs(difference))}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Calculator className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Cuadre de Caja</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Turnos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Seleccionar Turno</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando turnos...</div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No hay turnos disponibles
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedShift?.id === shift.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleShiftSelect(shift)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">
                        Turno #{shift.id.slice(-8)}
                      </div>
                      {getStatusBadge(shift.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Inicio: {formatDate(shift.startTime)}</div>
                      {shift.endTime && (
                        <div>Fin: {formatDate(shift.endTime)}</div>
                      )}
                      <div>
                        Monto inicial: {formatCurrency(shift.initialAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reporte de Caja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Reporte de Caja</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedShift ? (
              <div className="text-center py-8 text-muted-foreground">
                Selecciona un turno para ver el reporte
              </div>
            ) : reportLoading ? (
              <div className="text-center py-4">Generando reporte...</div>
            ) : cashReport ? (
              <div className="space-y-6">
                {/* Resumen Principal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(cashReport.totalSales)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ventas Totales
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">
                      {cashReport.totalOrders}
                    </div>
                    <div className="text-sm text-muted-foreground">Pedidos</div>
                  </div>
                </div>

                <Separator />

                {/* Detalles del Turno */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Detalles del Turno</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Efectivo inicial:
                      </span>
                      <div className="font-medium">
                        {formatCurrency(cashReport.startingCash)}
                      </div>
                    </div>
                    {cashReport.endingCash !== undefined && (
                      <div>
                        <span className="text-muted-foreground">
                          Efectivo final:
                        </span>
                        <div className="font-medium">
                          {formatCurrency(cashReport.endingCash)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Ventas por Método de Pago */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Ventas por Método de Pago</h3>
                  <div className="space-y-2">
                    {cashReport.salesByPaymentMethod.map((sale, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="font-medium">{sale.method}</span>
                        <span className="font-bold">
                          {formatCurrency(sale.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diferencia de Caja */}
                {cashReport.cashDifference !== undefined && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold">Diferencia de Caja</h3>
                      {getCashDifferenceStatus(cashReport.cashDifference)}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No se pudo cargar el reporte
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
