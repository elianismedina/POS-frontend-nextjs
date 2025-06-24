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
import { Play, Square, Clock, DollarSign, TrendingUp } from "lucide-react";
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
  const [initialAmount, setInitialAmount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchActiveShift();
    }
  }, [user?.id]);

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
        description: "No active shift found",
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
        description: `Shift ended successfully. Total sales: $${
          endedShift.totalSales?.toFixed(2) || "0.00"
        }`,
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
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading shift information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Shift Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeShift ? (
          // Active Shift Display
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                Active Shift
              </Badge>
              <span className="text-sm text-gray-600">
                Started:{" "}
                {activeShift.startTime
                  ? formatDate(activeShift.startTime)
                  : "Unknown time"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Initial Cash</p>
                  <p className="font-semibold">
                    ${activeShift.initialAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="font-semibold">
                    ${activeShift.totalSales?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Orders</p>
                  <p className="font-semibold">
                    {activeShift.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* End Shift Form */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">End Shift</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="finalAmount">Final Cash Amount</Label>
                  <Input
                    id="finalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter final cash amount"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleEndShift}
                    disabled={isEndingShift || !finalAmount}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    {isEndingShift ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Square className="h-4 w-4 mr-2" />
                    )}
                    End Shift
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Start Shift Form
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Shift
              </h3>
              <p className="text-gray-600">
                Start your shift to begin processing sales
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="initialAmount">Initial Cash Amount</Label>
                <Input
                  id="initialAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter initial cash amount"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleStartShift}
                disabled={isStartingShift || !initialAmount}
                className="w-full"
              >
                {isStartingShift ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Shift
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
