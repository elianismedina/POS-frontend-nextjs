"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BusinessPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="My Business"
        description="Manage your business information and settings"
        onAdd={() => {}}
        addButtonText="Update Business"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              View and update your business details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Business Name
                  </p>
                  <p className="text-lg">Your Business Name</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tax ID
                  </p>
                  <p className="text-lg">123-456-789</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
