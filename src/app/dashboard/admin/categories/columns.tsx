"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../../../../components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "../../../../components/ui/badge";
import { format } from "date-fns";

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function ActionsCell({ category }: { category: Category }) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          router.push(`/dashboard/admin/categories/${category.id}`)
        }
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => {
          // TODO: Implement delete functionality
          console.log("Delete category:", category.id);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      return format(new Date(date), "PPp");
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as string;
      return format(new Date(date), "PPp");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell category={row.original} />,
  },
];
