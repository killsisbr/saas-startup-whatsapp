"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}

