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
          "text-sm font-bold text-white px-3 py-1 rounded",
          !open && "hidden"
        )}
      >
        {title}
      </h2>
      <SidebarTrigger />
    </div>
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
    } catch (error) {}
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
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 h-10 px-3 text-sm text-gray-800 font-medium hover:text-gray-100 hover:bg-orange-600 cursor-pointer transition-all duration-200 border border-white/20 hover:border-orange-400/50",
              !open && "justify-center"
            )}
            onClick={handleLogout}
            title={!open ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="h-4 w-4 text-gray-600" />
            {open && <span className="text-sm">Cerrar Sesión</span>}
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen, isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (!user) {
      router.replace("/signin");
    }
  }, [user, router]);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile && setOpenMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  if (!user) {
    return null;
  }

  const config = getSidebarConfig(role, pathname, user);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <Sidebar variant="sidebar" className="relative">
      <SidebarHeader className="py-0.5 px-1 relative z-10 bg-orange-500">
        <SidebarHeaderContent title={config.title} />
      </SidebarHeader>

      <SidebarContent className="space-y-2 relative z-10 py-2 flex-1 overflow-y-auto min-h-0">
        {config.groups.map((group, index) => (
          <SidebarGroup key={group.key} className={index > 0 ? "mt-4" : ""}>
            {group.label && (
              <SidebarGroupLabel className="text-white font-bold text-xs mb-2 px-3 py-2 rounded mx-2 uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent className="space-y-1">
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href} className="relative">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 h-10 px-3 text-sm text-gray-800 hover:text-gray-900 hover:bg-orange-500 cursor-pointer transition-all duration-200 font-medium",
                        item.isActive &&
                          " text-gray-800 font-bold shadow-lg border"
                      )}
                      onClick={() => handleNavigation(item.href)}
                      title={!open ? item.label : undefined}
                    >
                      <item.icon
                        className={cn("h-4 w-4", item.isActive && "text-white")}
                      />
                      {open && (
                        <span
                          className={cn(
                            "truncate",
                            item.isActive && "font-bold"
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </Button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="py-0.5 px-1 relative z-10">
        <SidebarFooterContent />
      </SidebarFooter>
    </Sidebar>
  );
}
