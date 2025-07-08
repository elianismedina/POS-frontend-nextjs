"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ordersService } from "@/app/services/orders";

interface TipManagerProps {
  orderId: string;
  currentTipPercentage: number;
  currentTipAmount: number;
  orderTotal: number;
  onTipUpdated?: (newTipAmount: number, newTipPercentage: number) => void;
  isTemporary?: boolean;
}

export function TipManager({
  orderId,
  currentTipPercentage,
  currentTipAmount,
  orderTotal,
  onTipUpdated,
  isTemporary,
}: TipManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tipPercentage, setTipPercentage] = useState(currentTipPercentage);
  const { toast } = useToast();

  const handleTipUpdate = async () => {
    setIsLoading(true);
    try {
      if (isTemporary) {
        // For temporary orders, just calculate the tip amount locally
        const newTipAmount = orderTotal * tipPercentage;
        const newTipPercentage = tipPercentage;

        toast({
          title: "Propina actualizada",
          description: `La propina se ha actualizado a ${(
            newTipPercentage * 100
          ).toFixed(0)}%`,
        });

        onTipUpdated?.(newTipAmount, newTipPercentage);
      } else {
        // For real orders, call the backend API
        const updatedOrder = await ordersService.updateTip(
          orderId,
          tipPercentage
        );
        const newTipAmount = updatedOrder.tipAmount;
        const newTipPercentage = updatedOrder.tipPercentage;

        toast({
          title: "Propina actualizada",
          description: `La propina se ha actualizado a ${(
            newTipPercentage * 100
          ).toFixed(0)}%`,
        });

        onTipUpdated?.(newTipAmount, newTipPercentage);
      }
    } catch (error) {
      console.error("Error updating tip:", error);
      toast({
        title: "Error al actualizar propina",
        description:
          "Hubo un problema al actualizar la propina. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTip = (percentage: number) => {
    setTipPercentage(percentage);
  };

  const calculateTipAmount = (percentage: number) => {
    return orderTotal * percentage;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Propina (Opcional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="tipPercentage" className="text-sm">
            %:
          </Label>
          <Input
            id="tipPercentage"
            type="number"
            min="0"
            max="100"
            step="1"
            value={Math.round(tipPercentage * 100)}
            onChange={(e) => setTipPercentage(parseInt(e.target.value) / 100)}
            className="w-20"
          />
          <div className="flex gap-1 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickTip(0)}
              className={`text-xs px-2 py-1 ${
                tipPercentage === 0 ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              0%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickTip(0.1)}
              className={`text-xs px-2 py-1 ${
                tipPercentage === 0.1
                  ? "bg-primary text-primary-foreground"
                  : ""
              }`}
            >
              10%
            </Button>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(orderTotal)}</span>
          </div>
          {tipPercentage > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Propina ({Math.round(tipPercentage * 100)}%):</span>
              <span>{formatCurrency(calculateTipAmount(tipPercentage))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total:</span>
            <span>
              {formatCurrency(orderTotal + calculateTipAmount(tipPercentage))}
            </span>
          </div>
        </div>

        <Button
          onClick={handleTipUpdate}
          disabled={isLoading || tipPercentage === currentTipPercentage}
          className="w-full text-sm py-1"
          size="sm"
        >
          {isLoading ? "Actualizando..." : "Actualizar"}
        </Button>
      </CardContent>
    </Card>
  );
}
