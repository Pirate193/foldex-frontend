"use client";

import { Search, type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  const searchParams = useSearchParams();
  const currentView = searchParams?.get("view") || "home";
  return (
      <SidebarMenu>
        {items.map((item) => {
        const isActive = item.url.includes(`view=${currentView}`);
        return(
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} 
            tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
            className="px-2.5 md:px-2"
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )})}
      </SidebarMenu>
  );
}