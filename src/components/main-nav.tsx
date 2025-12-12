"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  ReceiptText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/transactions", icon: ReceiptText, label: "Transactions" },
  { href: "/dashboard/cards", icon: CreditCard, label: "Cards" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function MainNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col items-center gap-2 px-2 sm:py-5">
      {navItems.map((item) => (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                pathname === item.href && "bg-accent text-accent-foreground",
                isCollapsed && "h-9 w-9",
                !isCollapsed && "w-full justify-start px-3"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className={cn("sr-only", !isCollapsed && "not-sr-only ml-3")}>
                {item.label}
              </span>
            </Link>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">{item.label}</TooltipContent>
          )}
        </Tooltip>
      ))}
    </nav>
  );
}
