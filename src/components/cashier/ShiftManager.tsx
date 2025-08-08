"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { shiftsService, Shift } from "@/app/services/shifts";
import { formatPrice } from "@/lib/utils";
import {
  Play,
  Square,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Helper function to safely format dates
const formatDate = (dateString: string): string => {
  try {
    // Try parsing as ISO string first
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) {
      // If that fails, try as regular date
      const fallbackDate = new Date(dateString);
      if (isNaN(fallbackDate.getTime())) {
        return "Invalid date";
      }
      return format(fallbackDate, "MMM dd, yyyy 'at' h:mm a");
    }
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Invalid date";
  }
};

export function ShiftManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [isEndingShift, setIsEndingShift] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialAmount, setInitialAmount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchActiveShift();
    }
  }, [user?.id]);

  // Auto-refresh shift data every 30 seconds when there's an active shift
  useEffect(() => {
    if (!activeShift) return;

    const interval = setInterval(() => {
      fetchActiveShift();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [activeShift]);

  // Listen for custom refresh events (e.g., when returning from sales page)
  useEffect(() => {
    const handleRefreshEvent = () => {
      if (activeShift) {
        fetchActiveShift();
      }
    };

    window.addEventListener("refreshShiftData", handleRefreshEvent);
    return () => {
      window.removeEventListener("refreshShiftData", handleRefreshEvent);
    };
  }, [activeShift]);

  const fetchActiveShift = async () => {
    try {
      setIsLoading(true);
      const shift = await shiftsService.getActiveShift(user!.id);
      console.log("Active shift data:", shift);
      if (shift) {
        console.log(
          "Start time format:",
          shift.startTime,
          typeof shift.startTime
        );
      }
      setActiveShift(shift);
    } catch (error: any) {
      console.error("Error fetching active shift:", error);
      toast({
        title: "Error",
        description: "Failed to load shift information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshShift = async () => {
    if (!activeShift) return;

    try {
      setIsRefreshing(true);
      await fetchActiveShift();
      toast({
        title: "Refreshed",
        description: "Shift statistics updated",
      });
    } catch (error) {
      console.error("Error refreshing shift:", error);
      toast({
        title: "Error",
        description: "Failed to refresh shift data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartShift = async () => {
    if (!initialAmount || parseFloat(initialAmount) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid initial cash amount",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStartingShift(true);
      const shift = await shiftsService.startShift({
        cashierId: user!.id,
        initialAmount: parseFloat(initialAmount),
      });
      setActiveShift(shift);
      setInitialAmount("");
      toast({
        title: "Shift Started",
        description: "Your shift has been started successfully",
      });
    } catch (error: any) {
      console.error("Error starting shift:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start shift",
        variant: "destructive",
      });
    } finally {
      setIsStartingShift(false);
    }
  };

  const handleEndShift = async () => {
    if (!finalAmount || parseFloat(finalAmount) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid final cash amount",
        variant: "destructive",
      });
      return;
    }

    if (!activeShift) {
      toast({
        title: "Error",
        description: "No se encontró un turno activo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEndingShift(true);
      const endedShift = await shiftsService.endShift(activeShift.id, {
        finalAmount: parseFloat(finalAmount),
      });
      setActiveShift(null);
      setFinalAmount("");
      toast({
        title: "Shift Ended",
        description: `Shift ended successfully. Total sales: ${formatPrice(
          endedShift.totalSales || 0
        )}`,
      });
    } catch (error: any) {
      console.error("Error ending shift:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to end shift",
        variant: "destructive",
      });
    } finally {
      setIsEndingShift(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-1 text-xs text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1 text-xs">
          <Clock className="h-2.5 w-2.5" />
          Gestión de Turnos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {activeShift ? (
          // Active Shift Display - Ultra Compact
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge
                variant="default"
                className="flex items-center gap-1 text-xs"
              >
                <Play className="h-2 w-2" />
                Activo
              </Badge>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshShift}
                  disabled={isRefreshing}
                  className="h-4 w-4 p-0"
                >
                  <RefreshCw
                    className={`h-2 w-2 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
                <span className="text-xs text-gray-600">
                  {activeShift.startTime
                    ? formatDate(activeShift.startTime)
                    : "Unknown"}
                </span>
              </div>
            </div>

            {/* Ultra Compact Stats Grid */}
            <div className="grid grid-cols-3 gap-1">
              <div className="flex items-center gap-1 p-1 bg-gray-50 rounded text-xs">
                <DollarSign className="h-2 w-2 text-green-600" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Inicial</p>
                  <p className="text-xs font-semibold truncate">
                    {formatPrice(activeShift.initialAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-gray-50 rounded text-xs">
                <TrendingUp className="h-2 w-2 text-blue-600" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Ventas</p>
                  <p className="text-xs font-semibold truncate">
                    {formatPrice(activeShift.totalSales || 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-gray-50 rounded text-xs">
                <Clock className="h-2 w-2 text-purple-600" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">Pedidos</p>
                  <p className="text-xs font-semibold">
                    {activeShift.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Ultra Compact End Shift Form */}
            <div className="border-t pt-1">
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <Label htmlFor="finalAmount" className="text-xs">
                    Efectivo Final
                  </Label>
                  <Input
                    id="finalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Monto final"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(e.target.value)}
                    className="mt-1 h-6 text-xs"
                  />
                </div>
                <Button
                  onClick={handleEndShift}
                  disabled={isEndingShift || !finalAmount}
                  variant="destructive"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  {isEndingShift ? (
                    <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-1"></div>
                  ) : (
                    <Square className="h-2 w-2 mr-1" />
                  )}
                  Finalizar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Ultra Compact Start Shift Form
          <div className="space-y-1">
            <div className="text-center py-1">
              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <Clock className="h-3 w-3 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1">
                Sin Turno Activo
              </h3>
              <p className="text-xs text-gray-600">
                Inicia tu turno para comenzar a procesar ventas
              </p>
            </div>

            <div className="space-y-1">
              <div>
                <Label htmlFor="initialAmount" className="text-xs">
                  Efectivo Inicial
                </Label>
                <Input
                  id="initialAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ingresa monto inicial"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="mt-1 h-6 text-xs"
                />
              </div>
              <Button
                onClick={handleStartShift}
                disabled={isStartingShift || !initialAmount}
                size="sm"
                className="w-full h-6 text-xs"
              >
                {isStartingShift ? (
                  <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white mr-1"></div>
                ) : (
                  <Play className="h-2 w-2 mr-1" />
                )}
                Iniciar Turno
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
