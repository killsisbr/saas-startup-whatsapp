"use client";

import React from "react";
import { Search, Bell, Settings, User } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  
  return (
    <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
      <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5 w-96">
        <Search size={18} className="text-zinc-500" />
        <input 
          type="text" 
          placeholder="Buscar no sistema..." 
          className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full placeholder:text-zinc-600"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-zinc-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-neon" />
        </button>
        <button className="text-zinc-400 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-border">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-white uppercase tracking-tighter">
              {session?.user?.name || "Felipe Santos"}
            </span>
            <span className="text-[10px] text-primary font-medium">
              ID: {session?.user?.id ? session.user.id.substring(0, 8) + '...' : "Fundador"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-surface-muted">
             {/* Placeholder para imagem de avatar */}
             <div className="w-full h-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center">
                <User size={20} className="text-primary" />
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
