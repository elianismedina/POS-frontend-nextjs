"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSidebarConfig, type SidebarItem } from "./sidebar-config";

interface AppSidebarProps {
  role: "admin" | "cashier" | "waiter";
}

function SidebarHeaderContent({ title }: { title: string }) {
  const { open } = useSidebar();

  return (
    <div className="flex items-center justify-between">
      <h2
        className={cn(
          "text-sm font-bold text-white bg-black/20 px-3 py-1 rounded border border-gray-500",
          !open && "hidden"
        )}
      >
        {title}
      </h2>
      <SidebarTrigger />
    </div>
  );
}

function SidebarItemComponent({ item }: { item: SidebarItem }) {
  const router = useRouter();
  const { open } = useSidebar();
  const IconComponent = item.icon;

  console.log(`🔍 [SidebarItem] Rendering: ${item.label}`, {
    isActive: item.isActive,
    open,
  });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={item.isActive}
        className="text-white hover:text-white hover:bg-white/20"
      >
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 h-10 px-3 text-sm text-gray-100 hover:text-white hover:bg-gray-600 cursor-pointer transition-all duration-200 font-medium bg-gray-700/50 border border-gray-600",
            item.isActive &&
              "bg-gray-600 text-white font-bold shadow-lg border border-gray-400",
            !open && "justify-center"
          )}
          onClick={() => router.push(item.href)}
          title={!open ? item.label : undefined}
        >
          <IconComponent
            className={cn("h-4 w-4", item.isActive && "text-white")}
          />
          {open && (
            <span className={cn("text-sm", item.isActive && "font-semibold")}>
              {item.label}
            </span>
          )}
        </Button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarFooterContent() {
  const { open } = useSidebar();
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <SidebarGroup>
      {open && user?.email && (
        <div className="px-3 py-2 text-sm text-white font-medium bg-white/15 rounded mx-2 mb-2 border border-white/20">
          {user.email}
        </div>
      )}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 h-10 px-3 text-sm text-white font-medium hover:text-white hover:bg-red-500/30 cursor-pointer transition-all duration-200 border border-white/20 hover:border-red-400/50",
                !open && "justify-center"
              )}
              onClick={handleLogout}
              title={!open ? "Cerrar Sesión" : undefined}
            >
              <LogOut className="h-4 w-4 text-red-300" />
              {open && <span className="text-sm">Cerrar Sesión</span>}
            </Button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.replace("/signin");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const config = getSidebarConfig(role, pathname, user);

  return (
    <Sidebar
      variant="sidebar"
      className="bg-gradient-to-b from-slate-800 to-slate-700 metallic-animation relative border-r border-slate-600"
      style={{
        background:
          "linear-gradient(to bottom, hsl(var(--primary-metal, 220 13% 18%)), hsl(var(--secondary-metal, 215 25% 27%)))",
      }}
    >
      <SidebarHeader className="py-0.5 px-1 relative z-10">
        <SidebarHeaderContent title={config.title} />
      </SidebarHeader>

      <SidebarContent className="space-y-2 relative z-10 py-2 flex-1 overflow-y-auto min-h-0">
        {config.groups.map((group, index) => {
          console.log(`🔍 [Group ${group.key}] Items:`, group.items.length);
          group.items.forEach((item) =>
            console.log(`🔍 [Item] ${item.label}:`, item)
          );
          return (
            <SidebarGroup key={group.key} className={index > 0 ? "mt-4" : ""}>
              {group.label && (
                <SidebarGroupLabel className="text-white font-bold text-xs mb-2 px-3 py-2 bg-black/30 rounded mx-2 border border-gray-500 uppercase tracking-wider">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent className="space-y-1">
                <div className="text-white text-xs px-3 py-1 bg-red-500">
                  DEBUG: {group.items.length} items
                </div>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => (
                    <div
                      key={item.href}
                      className="bg-yellow-500 text-black text-xs px-2 py-1 mx-2"
                    >
                      TEST: {item.label}
                    </div>
                  ))}
                  {group.items.map((item) => (
                    <SidebarItemComponent
                      key={`item-${item.href}`}
                      item={item}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="py-0.5 px-1 relative z-10">
        <SidebarFooterContent />
      </SidebarFooter>
    </Sidebar>
  );
}
