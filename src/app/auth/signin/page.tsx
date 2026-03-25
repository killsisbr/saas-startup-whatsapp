"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Lock, Mail } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
    });

    if (result?.error) {
      setError("Credenciais inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 flex flex-col gap-8" glow>
         <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Startup 180</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Painel de Acesso</p>
         </div>

         <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">E-mail Profissional</label>
               <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex@startup180.com"
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                  />
               </div>
            </div>

            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
               <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-primary/50 transition-all"
                  />
               </div>
            </div>

            {error && <p className="text-xs text-rose-500 font-bold text-center">{error}</p>}

            <Button variant="neon" size="lg" className="w-full py-4 uppercase font-black tracking-widest">
               Entrar no Sistema
            </Button>
         </form>

         <p className="text-[10px] text-zinc-600 text-center uppercase tracking-tighter font-bold">
            Uso restrito a funcionários autorizados da Startup 180 S.A.
         </p>
      </Card>
    </div>
  );
}
