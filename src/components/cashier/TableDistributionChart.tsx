import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableOrder } from "@/services/table-orders";

interface TableDistributionChartProps {
  tableOrders: TableOrder[];
  availablePhysicalTables: any[];
}

const COLORS = {
  active: "#10b981", // green-500
  closed: "#ef4444", // red-500
  cancelled: "#f59e0b", // amber-500
  available: "#3b82f6", // blue-500
  total: "#6b7280", // gray-500
};

export default function TableDistributionChart({
  tableOrders,
  availablePhysicalTables,
}: TableDistributionChartProps) {
  // Calculate distribution data
  const activeTables = tableOrders.filter((table) => table.status === "active");
  const closedTables = tableOrders.filter((table) => table.status === "closed");
  const cancelledTables = tableOrders.filter(
    (table) => table.status === "cancelled"
  );

  // Get physical table IDs that have active table orders
  const activePhysicalTableIds = new Set(
    activeTables.map((table) => table.physicalTableId)
  );

  // Available tables = physical tables that don't have active table orders
  const availableTables = availablePhysicalTables.filter(
    (table) => !activePhysicalTableIds.has(table.id)
  );

  // Total tables = all physical tables (active + available)
  const totalTables = availablePhysicalTables.length;

  // Debug logging
  console.log("=== TABLE DISTRIBUTION CHART DEBUG ===");
  console.log("tableOrders:", tableOrders);
  console.log("availablePhysicalTables:", availablePhysicalTables);
  console.log("activeTables:", activeTables);
  console.log("activePhysicalTableIds:", Array.from(activePhysicalTableIds));
  console.log("availableTables:", availableTables);
  console.log("totalTables:", totalTables);
  console.log("=== END DEBUG ===");

  // Data for bar chart
  const barChartData = [
    {
      name: "Activas",
      value: activeTables.length,
      color: COLORS.active,
    },
    {
      name: "Cerradas",
      value: closedTables.length,
      color: COLORS.closed,
    },
    {
      name: "Canceladas",
      value: cancelledTables.length,
      color: COLORS.cancelled,
    },
    {
      name: "Disponibles",
      value: availableTables.length,
      color: COLORS.available,
    },
  ];

  // Data for pie chart
  const pieChartData = [
    {
      name: "Activas",
      value: activeTables.length,
      color: COLORS.active,
    },
    {
      name: "Cerradas",
      value: closedTables.length,
      color: COLORS.closed,
    },
    {
      name: "Canceladas",
      value: cancelledTables.length,
      color: COLORS.cancelled,
    },
    {
      name: "Disponibles",
      value: availableTables.length,
      color: COLORS.available,
    },
  ];

  // Calculate revenue by status
  const revenueByStatus = [
    {
      name: "Activas",
      revenue: activeTables.reduce((sum, table) => sum + table.totalAmount, 0),
      color: COLORS.active,
    },
    {
      name: "Cerradas",
      revenue: closedTables.reduce((sum, table) => sum + table.totalAmount, 0),
      color: COLORS.closed,
    },
    {
      name: "Canceladas",
      revenue: cancelledTables.reduce(
        (sum, table) => sum + table.totalAmount,
        0
      ),
      color: COLORS.cancelled,
    },
  ];

  console.log("=== REVENUE CALCULATIONS DEBUG ===");
  console.log("activeTables:", activeTables);
  console.log("closedTables:", closedTables);
  console.log("cancelledTables:", cancelledTables);
  console.log("revenueByStatus:", revenueByStatus);
  console.log("=== END REVENUE DEBUG ===");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Mesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">
              {totalTables}
            </div>
            <p className="text-xs text-gray-500">Mesas en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mesas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeTables.length}
            </div>
            <p className="text-xs text-gray-500">En uso actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mesas Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {availableTables.length}
            </div>
            <p className="text-xs text-gray-500">Libres para usar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tasa de Ocupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalTables > 0
                ? Math.round((activeTables.length / totalTables) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500">Mesas en uso</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Mesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width={60} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={<CustomTooltip />}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Mesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) =>
                    `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Estado de Mesa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Ingresos",
                ]}
                labelStyle={{ fontWeight: "bold" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {revenueByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
