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
import { Pencil, Trash2 } from "lucide-react";

export default function SubcategoriesPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Subcategories"
        description="Manage your product subcategories"
        onAdd={() => {}}
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Subcategories</CardTitle>
            <CardDescription>
              View and manage your product subcategories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder subcategories */}
              {[1, 2, 3].map((subcategory) => (
                <div
                  key={subcategory}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">Subcategory {subcategory}</h3>
                    <p className="text-sm text-muted-foreground">
                      Parent Category: Category {subcategory}
                    </p>
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
