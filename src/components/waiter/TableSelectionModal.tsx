import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Table, Users, MapPin } from "lucide-react";
import { PhysicalTable } from "@/services/physical-tables";
import { useToast } from "@/components/ui/use-toast";

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (table: PhysicalTable) => void;
  tables: PhysicalTable[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
}

export function TableSelectionModal({
  isOpen,
  onClose,
  onSelectTable,
  tables,
  searchTerm,
  setSearchTerm,
  isLoading,
}: TableSelectionModalProps) {
  const { toast } = useToast();

  if (!isOpen) return null;

  const filteredTables = tables.filter((table) =>
    table.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (table.tableName && table.tableName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (table.location && table.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTableSelect = (table: PhysicalTable) => {
    onSelectTable(table);
    onClose();
    setSearchTerm("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Table className="h-5 w-5" />
            Seleccionar Mesa
          </h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar mesas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando mesas...</span>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-8">
            <Table className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No hay mesas disponibles.</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-8">
            <Table className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No se encontraron mesas</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? "Intenta con otros términos" : "No hay mesas configuradas"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleTableSelect(table)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{table.tableNumber}</h4>
                  <Badge variant="secondary" className="text-xs">
                    Disponible
                  </Badge>
                </div>
                {table.tableName && (
                  <p className="text-sm text-gray-600 mb-2">
                    {table.tableName}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {table.capacity > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {table.capacity}
                    </span>
                  )}
                  {table.location && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {table.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 