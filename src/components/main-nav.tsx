"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  ReceiptText,
  Shapes,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "./i18n/language-provider";

export function MainNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t('dashboard.title') },
    { href: "/dashboard/transactions", icon: ReceiptText, label: t('transactions.title') },
    { href: "/dashboard/cards", icon: CreditCard, label: t('cards.title') },
    { href: "/dashboard/management", icon: Shapes, label: t('management.title') },
    { href: "/dashboard/settings", icon: Settings, label: t('settings.title') },
  ];

  return (
    <nav className="grid items-start gap-2 px-2 text-sm font-medium lg:px-4 sm:py-5">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard");
        return (
            <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>
                <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-primary text-primary-foreground hover:text-primary-foreground",
                    isCollapsed && "h-9 w-9 justify-center"
                )}
                >
                <item.icon className="h-4 w-4" />
                <span className={cn(isCollapsed ? "sr-only" : "")}>
                    {item.label}
                </span>
                </Link>
            </TooltipTrigger>
            {isCollapsed && (
                <TooltipContent side="right">{item.label}</TooltipContent>
            )}
            </Tooltip>
        )
      })}
    </nav>
  );
}
