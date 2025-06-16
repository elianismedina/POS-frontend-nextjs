"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { NewBranchForm } from "@/components/branches/NewBranchForm";

export default function CreateBranchPage() {
  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <CardTitle className="text-2xl font-bold">
              Create New Branch
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <NewBranchForm />
        </CardContent>
      </Card>
    </div>
  );
}
