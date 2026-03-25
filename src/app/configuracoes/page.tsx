"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Settings, User, Building2, Lock, Save, CheckCircle2, AlertCircle, Palette } from "lucide-react";
import { SkeletonPage } from "@/components/ui/Skeleton";
import { signOut } from "next-auth/react";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("perfil");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgCreatedAt, setOrgCreatedAt] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/settings");
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
           setError("Sessão inválida. Faça login novamente.");
           setTimeout(() => signOut({ callbackUrl: '/auth/signin' }), 2000);
           return;
        }
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Erro ao carregar os dados.");
        return;
      }
      
      const data = await res.json();
      setUserName(data.user?.name || "");
      setUserEmail(data.user?.email || "");
      setUserRole(data.user?.role || "");
      setOrgName(data.organization?.name || "");
      setOrgSlug(data.organization?.slug || "");
      setOrgCreatedAt(data.organization?.createdAt ? new Date(data.organization.createdAt).toLocaleDateString() : "");
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
      setError("Erro de rede ao buscar configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveProfile = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, orgName }),
      });
      if (res.ok) setSuccess("Perfil atualizado com sucesso!");
      else { const d = await res.json(); setError(d.error || "Erro ao salvar"); }
    } catch { setError("Erro de conexão"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { setError("As senhas não coincidem"); return; }
    if (newPassword.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setSuccess("Senha alterada com sucesso!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else { const d = await res.json(); setError(d.error || "Erro ao alterar senha"); }
    } catch { setError("Erro de conexão"); }
    finally { setSaving(false); }
  };

  if (loading) return <SkeletonPage />;

  const tabs = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "organizacao", label: "Organização", icon: Building2 },
    { id: "seguranca", label: "Segurança", icon: Lock },
    { id: "aparencia", label: "Aparência", icon: Palette },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Configurações</h1>
          <p className="text-zinc-500 text-sm">Gerencie seu perfil, organização e preferências do sistema.</p>
        </div>
      </div>

      {(success || error) && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
          {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold">{success || error}</span>
        </div>
      )}

      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSuccess(""); setError(""); }}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === t.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "perfil" && (
        <Card className="flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white">Informações Pessoais</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome Completo</label>
              <input value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</label>
              <input value={userEmail} disabled className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-zinc-600 outline-none cursor-not-allowed" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nível de Acesso</label>
              <div className="flex items-center gap-2">
                <Badge variant="purple">{userRole}</Badge>
              </div>
            </div>
          </div>
          <Button variant="neon" className="w-fit gap-2" onClick={handleSaveProfile} disabled={saving}>
            <Save size={16} /> {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </Card>
      )}

      {activeTab === "organizacao" && (
        <Card className="flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white">Dados da Organização</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome da Organização</label>
              <input value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Slug</label>
              <input value={orgSlug} disabled className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-zinc-600 outline-none cursor-not-allowed" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Criada em</label>
              <span className="text-sm text-zinc-400">{orgCreatedAt}</span>
            </div>
          </div>
          <Button variant="neon" className="w-fit gap-2" onClick={handleSaveProfile} disabled={saving || userRole !== "ADMIN"}>
            <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
          </Button>
          {userRole !== "ADMIN" && <p className="text-[10px] text-zinc-600 italic">Apenas administradores podem alterar dados da organização.</p>}
        </Card>
      )}

      {activeTab === "seguranca" && (
        <Card className="flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white">Alterar Senha</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Senha Atual</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nova Senha</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirmar Nova Senha</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-primary/50 transition-all" />
            </div>
          </div>
          <Button variant="neon" className="w-fit gap-2" onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword}>
            <Lock size={16} /> {saving ? "Alterando..." : "Alterar Senha"}
          </Button>
        </Card>
      )}

      {activeTab === "aparencia" && (
        <Card className="flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white">Aparência</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tema</label>
              <div className="flex gap-4">
                <div className="p-4 rounded-xl bg-white/10 border-2 border-primary flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-12 h-8 rounded bg-zinc-900 border border-zinc-700" />
                  <span className="text-[10px] font-bold text-white">Dark</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 cursor-not-allowed opacity-40">
                  <div className="w-12 h-8 rounded bg-white border border-zinc-200" />
                  <span className="text-[10px] font-bold text-zinc-500">Light (Em breve)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
