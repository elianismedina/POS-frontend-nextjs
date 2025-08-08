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
  Eye,
  EyeOff,
  Coins,
  FileText,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Shift {
  id: string;
  startTime: string;
  endTime?: string;
  status: "ACTIVE" | "ENDED";
  initialAmount: number;
  finalAmount?: number;
}

interface BlindCount {
  bills100000: number;
  bills50000: number;
  bills20000: number;
  bills10000: number;
  bills5000: number;
  bills2000: number;
  bills1000: number;
  coins500: number;
  coins200: number;
  coins100: number;
  coins50: number;
  total: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculateTotalFromCount = (count: Partial<BlindCount>): number => {
  return (
    (count.bills100000 || 0) * 100000 +
    (count.bills50000 || 0) * 50000 +
    (count.bills20000 || 0) * 20000 +
    (count.bills10000 || 0) * 10000 +
    (count.bills5000 || 0) * 5000 +
    (count.bills2000 || 0) * 2000 +
    (count.bills1000 || 0) * 1000 +
    (count.coins500 || 0) * 500 +
    (count.coins200 || 0) * 200 +
    (count.coins100 || 0) * 100 +
    (count.coins50 || 0) * 50
  );
};

export default function CashReportPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [cashReport, setCashReport] = useState<CashReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShifts, setTotalShifts] = useState(0);
  const [shiftsPerPage] = useState(10);

  // Estado para cuadre ciego
  const [showBlindCountModal, setShowBlindCountModal] = useState(false);
  const [blindCount, setBlindCount] = useState<Partial<BlindCount>>({});
  const [blindCountResult, setBlindCountResult] = useState<{
    physicalCount: number;
    theoreticalAmount: number;
    difference: number;
    isPerfect: boolean;
  } | null>(null);
  const [showTheoreticalAmount, setShowTheoreticalAmount] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadShifts();
    }
  }, [user?.id, currentPage]);

  const loadShifts = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await shiftsService.getShiftsByCashier(user.id, {
        page: currentPage,
        limit: shiftsPerPage,
      });

      setShifts(response?.shifts || []);
      setTotalPages(response?.meta?.totalPages || 1);
      setTotalShifts(response?.meta?.total || 0);
    } catch (error) {
      console.error("Error loading shifts:", error);
      setShifts([]);
      setTotalPages(1);
      setTotalShifts(0);
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

  const handleBlindCount = () => {
    setBlindCount({});
    setBlindCountResult(null);
    setShowTheoreticalAmount(false);
    setShowBlindCountModal(true);
  };

  const handleBlindCountSubmit = () => {
    const physicalCount = calculateTotalFromCount(blindCount);

    // Calcular saldo teórico: efectivo inicial + ventas en efectivo
    const startingCash = cashReport?.startingCash || 0;
    const cashSales =
      cashReport?.salesByPaymentMethod
        .filter(
          (sale) =>
            sale.method.toLowerCase().includes("cash") ||
            sale.method.toLowerCase().includes("efectivo") ||
            sale.method.toLowerCase().includes("dinero")
        )
        .reduce((sum, sale) => sum + sale.amount, 0) || 0;

    const theoreticalAmount = startingCash + cashSales;
    const difference = physicalCount - theoreticalAmount;
    const isPerfect = difference === 0;

    setBlindCountResult({
      physicalCount,
      theoreticalAmount,
      difference,
      isPerfect,
    });

    setShowTheoreticalAmount(true);

    toast({
      title: isPerfect ? "¡Cuadre perfecto!" : "Cuadre completado",
      description: isPerfect
        ? "El conteo físico coincide exactamente con el saldo teórico"
        : `Diferencia: ${formatCurrency(Math.abs(difference))}`,
      variant: isPerfect ? "default" : "destructive",
    });
  };

  const handleBlindCountClose = () => {
    setShowBlindCountModal(false);
    setBlindCount({});
    setBlindCountResult(null);
    setShowTheoreticalAmount(false);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calculator className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Cuadre de Caja</h1>
        </div>
        {selectedShift && cashReport && selectedShift.status === "ACTIVE" && (
          <Button
            onClick={handleBlindCount}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Cuadre Ciego</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Turnos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Seleccionar Turno</span>
              </div>
              {totalShifts > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalShifts} turnos
                </Badge>
              )}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {(currentPage - 1) * shiftsPerPage + 1} -{" "}
                        {Math.min(currentPage * shiftsPerPage, totalShifts)} de{" "}
                        {totalShifts} turnos
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>

                        <div className="flex items-center space-x-1">
                          {getVisiblePages().map((page, index) => (
                            <div key={index}>
                              {page === "..." ? (
                                <span className="px-2 py-1 text-sm text-muted-foreground">
                                  ...
                                </span>
                              ) : (
                                <Button
                                  variant={
                                    currentPage === page ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    handlePageChange(page as number)
                                  }
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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

                {/* Resultado del Cuadre Ciego */}
                {blindCountResult && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>Cuadre Ciego</span>
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Conteo físico:
                          </span>
                          <span className="font-bold">
                            {formatCurrency(blindCountResult.physicalCount)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Diferencia:</span>
                          <span
                            className={`font-bold ${
                              blindCountResult.isPerfect
                                ? "text-green-600"
                                : blindCountResult.difference > 0
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {blindCountResult.isPerfect
                              ? "Perfecto"
                              : blindCountResult.difference > 0
                              ? `+${formatCurrency(
                                  blindCountResult.difference
                                )}`
                              : `-${formatCurrency(
                                  Math.abs(blindCountResult.difference)
                                )}`}
                          </span>
                        </div>
                      </div>
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

      {/* Modal de Cuadre Ciego */}
      {showBlindCountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <h2 className="text-xl font-bold">Cuadre de Caja Ciego</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBlindCountModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Realiza el conteo físico del dinero en caja sin conocer el saldo
                teórico. Esto garantiza un cuadre imparcial y preciso.
              </p>

              <div className="space-y-6">
                {/* Denominaciones */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Billetes</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="bills100000" className="text-xs w-16">
                          $100,000:
                        </Label>
                        <Input
                          id="bills100000"
                          type="number"
                          min="0"
                          value={blindCount.bills100000 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              bills100000: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="bills50000" className="text-xs w-16">
                          $50,000:
                        </Label>
                        <Input
                          id="bills50000"
                          type="number"
                          min="0"
                          value={blindCount.bills50000 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              bills50000: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="bills20000" className="text-xs w-16">
                          $20,000:
                        </Label>
                        <Input
                          id="bills20000"
                          type="number"
                          min="0"
                          value={blindCount.bills20000 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              bills20000: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="bills10000" className="text-xs w-16">
                          $10,000:
                        </Label>
                        <Input
                          id="bills10000"
                          type="number"
                          min="0"
                          value={blindCount.bills10000 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              bills10000: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="bills5000" className="text-xs w-16">
                          $5,000:
                        </Label>
                        <Input
                          id="bills5000"
                          type="number"
                          min="0"
                          value={blindCount.bills5000 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              bills5000: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="bills2000" className="text-xs w-16">
                          $2,000:
                        </Label>
                        <Input
                          id="bills2000"
                          type="number"
                          min="0"
                          value={blindCount.bills2000 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              bills2000: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="bills1000" className="text-xs w-16">
                          $1,000:
                        </Label>
                        <Input
                          id="bills1000"
                          type="number"
                          min="0"
                          value={blindCount.bills1000 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              bills1000: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Monedas</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="coins500" className="text-xs w-16">
                          $500:
                        </Label>
                        <Input
                          id="coins500"
                          type="number"
                          min="0"
                          value={blindCount.coins500 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              coins500: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="coins200" className="text-xs w-16">
                          $200:
                        </Label>
                        <Input
                          id="coins200"
                          type="number"
                          min="0"
                          value={blindCount.coins200 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              coins200: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="coins100" className="text-xs w-16">
                          $100:
                        </Label>
                        <Input
                          id="coins100"
                          type="number"
                          min="0"
                          value={blindCount.coins100 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              coins100: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="coins50" className="text-xs w-16">
                          $50:
                        </Label>
                        <Input
                          id="coins50"
                          type="number"
                          min="0"
                          value={blindCount.coins50 || ""}
                          onChange={(e) =>
                            setBlindCount((prev) => ({
                              ...prev,
                              coins50: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total del Conteo */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      Total del conteo físico:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateTotalFromCount(blindCount))}
                    </span>
                  </div>
                </div>

                {/* Botón para mostrar saldo teórico */}
                {!showTheoreticalAmount && (
                  <div className="text-center">
                    <Button
                      onClick={handleBlindCountSubmit}
                      className="w-full"
                      disabled={calculateTotalFromCount(blindCount) === 0}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Comparar con Saldo Teórico
                    </Button>
                  </div>
                )}

                {/* Resultado de la comparación */}
                {blindCountResult && showTheoreticalAmount && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Conteo físico:
                        </span>
                        <span className="font-bold">
                          {formatCurrency(blindCountResult.physicalCount)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Diferencia:</span>
                        <span
                          className={`font-bold ${
                            blindCountResult.isPerfect
                              ? "text-green-600"
                              : blindCountResult.difference > 0
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {blindCountResult.isPerfect
                            ? "Perfecto"
                            : blindCountResult.difference > 0
                            ? `+${formatCurrency(blindCountResult.difference)}`
                            : `-${formatCurrency(
                                Math.abs(blindCountResult.difference)
                              )}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={handleBlindCountClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
