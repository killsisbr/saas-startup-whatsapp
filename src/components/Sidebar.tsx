"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  DollarSign, 
  Kanban, 
  Calendar, 
  MessageSquare, 
  Presentation, 
  Users2, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";

const menuItems = [
  { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard, href: "/" },
  { id: "crm", label: "CRM", icon: Target, href: "/crm" },
  { id: "clientes", label: "CLIENTES", icon: Users, href: "/clientes" },
  { id: "financeiro", label: "FINANCEIRO", icon: DollarSign, href: "/financeiro" },
  { id: "kanban", label: "KANBAN", icon: Kanban, href: "/kanban" },
  { id: "agenda", label: "AGENDA", icon: Calendar, href: "/agenda" },
  { id: "whatsapp", label: "WHATSAPP", icon: MessageSquare, href: "/whatsapp" },
  { id: "pitch", label: "PITCH", icon: Presentation, href: "/pitch" },
  { id: "equipe", label: "EQUIPE", icon: Users2, href: "/equipe" },
  { id: "relatorios", label: "RELATÓRIOS", icon: BarChart3, href: "/relatorios" },
  { id: "configuracoes", label: "CONFIGURAÇÕES", icon: Settings, href: "/configuracoes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = session?.user?.name || "Usuário";
  const userEmail = session?.user?.email || "";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const userRole = (session?.user as any)?.role || "MEMBER";

  const sidebarContent = (
    <>
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tighter text-white flex flex-col text-gradient">
          STARTUP 180
          <span className="text-[10px] text-primary font-medium tracking-widest mt-1">THE NEON CURATOR</span>
        </h1>
      </div>

      <nav className="flex-1 mt-4 overflow-y-auto custom-scrollbar px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.id} 
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-glow"
                  className="sidebar-glow"
                />
              )}
              <item.icon size={20} className={isActive ? "text-primary shadow-neon" : "group-hover:text-zinc-200"} />
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border flex flex-col gap-2">
        <button 
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-red-400 text-sm transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
        
        <div className="mt-4 p-3 rounded-2xl bg-white/5 flex items-center gap-3 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center font-bold text-xs">
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">{userName}</span>
            <span className="text-[10px] text-zinc-500 truncate">{userRole}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[60] lg:hidden w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex-col z-50">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-[80] lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

