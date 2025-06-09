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
import { Pencil, Trash2, UserCog } from "lucide-react";

export default function CashiersPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Cashiers"
        description="Manage your cashier accounts"
        onAdd={() => {}}
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Cashiers</CardTitle>
            <CardDescription>
              View and manage your cashier accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder cashiers */}
              {[1, 2, 3].map((cashier) => (
                <div
                  key={cashier}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <UserCog className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Cashier {cashier}</h3>
                      <p className="text-sm text-muted-foreground">
                        cashier{cashier}@example.com | Branch: Branch {cashier}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
