"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { shiftsService, Shift } from "@/app/services/shifts";
import { useEffect, useState } from "react";
import {
  Clock,
  DollarSign,
  ShoppingCart,
  Calendar,
  Loader2,
  Play,
  Square,
  RefreshCw,
} from "lucide-react";

export default function MyShiftsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/");
        return;
      }
      fetchShifts();
    }
  }, [isAuthenticated, user, router, authLoading]);

  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      const [shiftsData, activeShiftData] = await Promise.all([
        shiftsService.getShiftsByCashier(user!.id),
        shiftsService.getActiveShift(user!.id),
      ]);

      setShifts(shiftsData);
      setActiveShift(activeShiftData);
    } catch (error: any) {
      console.error("Error fetching shifts:", error);
      toast({
        title: "Error",
        description: "Failed to load shifts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary">Ended</Badge>;
  };

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <h2 className="text-2xl font-semibold mb-4">Loading Shifts...</h2>
          <p className="text-gray-500">
            Please wait while we load your shift history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">My Shifts</h1>
        <p className="text-muted-foreground">
          View your shift history and current status
        </p>
      </div>

      {/* Current Shift Status */}
      {activeShift && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Play className="h-5 w-5" />
              Current Active Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(activeShift.startTime)} at{" "}
                    {formatTime(activeShift.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-gray-600">
                    {formatDuration(activeShift.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Initial Amount</p>
                  <p className="text-sm text-gray-600">
                    ${activeShift.initialAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift History */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shift History</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShifts}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {shifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Shifts Found
            </h3>
            <p className="text-gray-500 text-center">
              You haven't started any shifts yet. Start your first shift from
              the dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {shifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Shift #{shift.id.slice(-8)}
                  </CardTitle>
                  {getStatusBadge(shift.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Date and Time */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Date</p>
                    <p className="text-sm">{formatDate(shift.startTime)}</p>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">
                      Duration
                    </p>
                    <p className="text-sm">
                      {shift.endTime
                        ? formatDuration(shift.startTime, shift.endTime)
                        : formatDuration(shift.startTime)}
                    </p>
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">
                      Initial Amount
                    </p>
                    <p className="text-sm font-medium">
                      ${shift.initialAmount.toFixed(2)}
                    </p>
                  </div>

                  {/* Final Amount */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">
                      {shift.endTime ? "Final Amount" : "Current Sales"}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      ${(shift.finalAmount || shift.totalSales || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Additional Details - More Compact */}
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Start: {formatTime(shift.startTime)}</span>
                    </div>

                    {shift.endTime && (
                      <div className="flex items-center gap-1">
                        <Square className="h-3 w-3" />
                        <span>End: {formatTime(shift.endTime)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{shift.totalOrders || 0} orders</span>
                    </div>
                  </div>

                  {/* Notes - Only show if exists */}
                  {shift.notes && (
                    <div className="text-xs text-gray-600 max-w-xs truncate">
                      {shift.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
