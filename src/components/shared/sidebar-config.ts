import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  List,
  Layers,
  Building2,
  Calculator,
  BarChart,
  Table,
  UserCheck,
  CreditCard,
  Calendar,
  User,
  ListOrdered,
  Clock,
} from "lucide-react";

export interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  isActive?: boolean;
  condition?: (user: any) => boolean; // Optional condition for showing the item
}

export interface SidebarGroup {
  key: string;
  label?: string;
  items: SidebarItem[];
}

export interface SidebarConfig {
  title: string;
  groups: SidebarGroup[];
}

// Navigation configurations for different roles
export const sidebarConfigs: Record<string, SidebarConfig> = {
  admin: {
    title: "Panel de Administración",
    groups: [
      {
        key: "main-nav",
        items: [
          {
            icon: LayoutDashboard,
            label: "Panel Principal",
            href: "/dashboard/admin",
          },
          {
            icon: Store,
            label: "Mi Negocio",
            href: "/dashboard/admin/business",
            condition: (user) =>
              Array.isArray(user?.business) && user.business.length > 0,
          },
        ],
      },
      {
        key: "operations-nav",
        label: "Operaciones",
        items: [
          {
            icon: Building2,
            label: "Sucursales",
            href: "/dashboard/admin/branches",
          },
          {
            icon: Table,
            label: "Mesas Físicas",
            href: "/dashboard/admin/physical-tables",
          },
          {
            icon: ShoppingCart,
            label: "Ordenes de mesa",
            href: "/dashboard/admin/table-orders",
          },
        ],
      },
      {
        key: "catalog-nav",
        label: "Catálogo",
        items: [
          {
            icon: Package,
            label: "Productos",
            href: "/dashboard/admin/products",
          },
          {
            icon: List,
            label: "Categorías",
            href: "/dashboard/admin/categories",
          },
          {
            icon: Layers,
            label: "Subcategorías",
            href: "/dashboard/admin/subcategories",
          },
        ],
      },
      {
        key: "settings-nav",
        label: "Configuración",
        items: [
          {
            icon: Calculator,
            label: "Impuestos",
            href: "/dashboard/admin/taxes",
          },
          {
            icon: CreditCard,
            label: "Métodos de Pago",
            href: "/dashboard/admin/payment-methods",
          },
        ],
      },
      {
        key: "business-nav",
        label: "Gestión",
        items: [
          {
            icon: ShoppingCart,
            label: "Pedidos",
            href: "/dashboard/admin/orders",
          },
          {
            icon: Users,
            label: "Clientes",
            href: "/dashboard/admin/customers",
          },
          {
            icon: Calendar,
            label: "Reservaciones",
            href: "/dashboard/admin/reservations",
          },
          {
            icon: UserCheck,
            label: "Cajeros",
            href: "/dashboard/admin/cashiers",
          },
          {
            icon: Users,
            label: "Meseros",
            href: "/dashboard/admin/waiters",
          },
        ],
      },
      {
        key: "reports-nav",
        label: "Reportes",
        items: [
          {
            icon: BarChart,
            label: "Reportes",
            href: "/dashboard/admin/reports",
          },
        ],
      },
    ],
  },
  cashier: {
    title: "Panel de Cajero",
    groups: [
      {
        key: "main-nav",
        items: [
          {
            icon: LayoutDashboard,
            label: "Panel Principal",
            href: "/dashboard/cashier",
          },
          {
            icon: ShoppingCart,
            label: "Nueva Venta",
            href: "/dashboard/cashier/sales",
          },
          {
            icon: Package,
            label: "Productos",
            href: "/dashboard/cashier/products",
          },
          {
            icon: Users,
            label: "Clientes",
            href: "/dashboard/cashier/customers",
          },
          {
            icon: ListOrdered,
            label: "Pedidos",
            href: "/dashboard/cashier/orders",
          },
          {
            icon: Table,
            label: "Mesas",
            href: "/dashboard/cashier/tables",
          },
          {
            icon: Clock,
            label: "Mis Turnos",
            href: "/dashboard/cashier/shifts",
          },
          {
            icon: Calculator,
            label: "Cuadre de Caja",
            href: "/dashboard/cashier/cash-report",
          },
          {
            icon: User,
            label: "Perfil",
            href: "/dashboard/cashier/profile",
          },
        ],
      },
    ],
  },
  waiter: {
    title: "Panel de Mesero",
    groups: [
      {
        key: "main-nav",
        items: [
          {
            icon: LayoutDashboard,
            label: "Panel Principal",
            href: "/dashboard/waiter",
          },
          {
            icon: ShoppingCart,
            label: "Nuevo Pedido",
            href: "/dashboard/waiter/new-order",
          },
          {
            icon: ListOrdered,
            label: "Mis Pedidos",
            href: "/dashboard/waiter/orders",
          },
          {
            icon: Users,
            label: "Clientes",
            href: "/dashboard/waiter/customers",
          },
          {
            icon: Table,
            label: "Mesas",
            href: "/dashboard/waiter/tables",
          },
          {
            icon: User,
            label: "Perfil",
            href: "/dashboard/waiter/profile",
          },
        ],
      },
    ],
  },
};

// Helper function to get sidebar config based on user role and current path
export function getSidebarConfig(
  role: string,
  pathname: string,
  user: any
): SidebarConfig {
  const config = sidebarConfigs[role];
  if (!config) {
    throw new Error(`Sidebar config not found for role: ${role}`);
  }

  // Add isActive property to items based on current pathname
  const updatedGroups = config.groups.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => !item.condition || item.condition(user))
      .map((item) => ({
        ...item,
        isActive:
          pathname === item.href ||
          (item.href !== "/dashboard/admin" &&
            item.href !== "/dashboard/cashier" &&
            item.href !== "/dashboard/waiter" &&
            pathname.includes(item.href.split("/").pop() || "")),
      })),
  }));

  return {
    ...config,
    groups: updatedGroups,
  };
}
