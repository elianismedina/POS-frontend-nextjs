"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, TrendingUp, DollarSign } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Reports"
        description="View and analyze your business data"
      />

      <div className="grid gap-6">
        {/* Sales Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>View your sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Sales</span>
                </div>
                <p className="text-2xl font-bold mt-2">$12,345.67</p>
                <p className="text-sm text-green-600">+12.5% from last month</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  <span>Orders</span>
                </div>
                <p className="text-2xl font-bold mt-2">156</p>
                <p className="text-sm text-green-600">+8.3% from last month</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Average Order</span>
                </div>
                <p className="text-2xl font-bold mt-2">$79.14</p>
                <p className="text-sm text-green-600">+3.2% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Types Card */}
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Download detailed reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Sales Report",
                "Inventory Report",
                "Customer Report",
                "Cashier Report",
                "Product Report",
                "Branch Report",
              ].map((report) => (
                <div
                  key={report}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <span className="font-medium">{report}</span>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
