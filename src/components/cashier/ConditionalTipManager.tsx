"use client";

import { TipManager } from "./TipManager";
import { Order } from "@/app/services/orders";

interface ConditionalTipManagerProps {
  order: Order;
  onTipUpdated?: (newTipAmount: number, newTipPercentage: number) => void;
}

export function ConditionalTipManager({
  order,
  onTipUpdated,
}: ConditionalTipManagerProps) {
  // Only show tip manager for table orders (dine-in)
  const hasTableOrder = !!order.tableOrderId;

  // Don't render anything if there's no table order
  if (!hasTableOrder) {
    return null;
  }

  // Check if this is a temporary order (no real ID yet)
  const isTemporaryOrder = order.id === "temp";

  return (
    <TipManager
      orderId={order.id}
      currentTipPercentage={order.tipPercentage || 0}
      currentTipAmount={order.tipAmount || 0}
      orderTotal={order.total}
      onTipUpdated={onTipUpdated}
      isTemporary={isTemporaryOrder}
    />
  );
}
