"use client";

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Send, Users, Target, Zap, Clock, AlertCircle, Plus, Upload, Trash2, Search, Filter } from 'lucide-react';
import { useToast } from "@/context/ToastContext";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalContacts: number;
  processedCount: number;
  successCount: number;
}

interface Rule {
  id: string;
  trigger: string;
  response: string;
  matchType: string;
  isActive: boolean;
}

export default function CampaignManager() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'auto-reply'>('campaigns');
  
  // Campaigns State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [targetTags, setTargetTags] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-Reply State
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState({ trigger: '', response: '', matchType: 'KEYWORD' });

  const fetchData = async () => {
    try {
      const [campRes, ruleRes] = await Promise.all([
        fetch('/api/whatsapp/campaigns'),
        fetch('/api/whatsapp/rules')
      ]);
      const [campData, ruleData] = await Promise.all([campRes.json(), ruleRes.json()]);
      setCampaigns(campData || []);
      setRules(ruleData || []);
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async () => {
    if (!name || !message) return;
    setLoading(true);
    try {
      await fetch('/api/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, targetTags })
      });
      setName('');
      setMessage('');
      setTargetTags('');
      toast.success("Campanha criada com sucesso!");
      fetchData();
    } catch (e) {
      console.error('Erro ao criar campanha:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImportLeads = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success('Leads importados com sucesso!');
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao importar:', err);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.trigger || !newRule.response) return;
    try {
      await fetch('/api/whatsapp/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      setNewRule({ trigger: '', response: '', matchType: 'KEYWORD' });
      toast.success("Regra de auto-resposta ativada!");
      fetchData();
    } catch (e) {
      console.error('Erro ao adicionar regra:', e);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch('/api/whatsapp/rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      toast.info("Regra excluída.");
      fetchData();
    } catch (e) {
      console.error('Erro ao excluir regra:', e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* TABS ELITE */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-4">
        <button 
          onClick={() => setActiveTab('campaigns')}
          className={`px-6 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'campaigns' ? "bg-primary text-white shadow-neon" : "text-zinc-500 hover:text-white"}`}
        >
          <Zap size={16} />
          Campanhas em Massa
        </button>
        <button 
          onClick={() => setActiveTab('auto-reply')}
          className={`px-6 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'auto-reply' ? "bg-primary text-white shadow-neon" : "text-zinc-500 hover:text-white"}`}
        >
          <Clock size={16} />
          Auto-Atendimento
        </button>
      </div>

      {activeTab === 'campaigns' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <Card className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Broadcast Center</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => (document.getElementById('file-import') as HTMLInputElement).click()}>
                  <Upload size={14} /> Importar Base (Excel/CSV)
                </Button>
                <input id="file-import" type="file" className="hidden" accept=".csv,.xlsx" onChange={(e) => e.target.files?.[0] && handleImportLeads(e.target.files[0])} />
              </div>
            </div>

            <div className="flex flex-col gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={80} className="text-primary" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identificação do Disparo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Promoção VIP Páscoa" 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Alvos (Tags)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: premium, leads-antigos" 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all"
                    value={targetTags}
                    onChange={(e) => setTargetTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mensagem do Campanha</label>
                <textarea 
                  rows={4} 
                  placeholder="Olá {nome}! Temos uma oferta exclusiva..." 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <div className="flex items-center justify-between">
                   <span className="text-[9px] text-zinc-600 font-medium">Variáveis: {"{nome}"}, {"{email}"}</span>
                   <span className="text-[9px] text-zinc-600 font-medium">{message.length} caracteres</span>
                </div>
              </div>

              <Button variant="neon" className="w-full gap-2 py-4 shadow-neon" onClick={handleCreateCampaign} disabled={loading}>
                <Send size={18} />
                {loading ? "Processando Disparo..." : "Iniciar Campanha Agora"}
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12} /> Histórico de Execução
              </h3>
              <div className="flex flex-col gap-3">
                {campaigns.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-white">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <Badge variant={c.status === 'COMPLETED' ? 'purple' : 'warning'} className="text-[9px] py-0">{c.status}</Badge>
                        <span className="text-[10px] text-zinc-600 font-bold">{c.processedCount}/{c.totalContacts} envios</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-bold text-emerald-500">{c.successCount} OK</span>
                        <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-500 shadow-neon" style={{ width: `${(c.successCount / (c.totalContacts || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && <p className="text-zinc-600 italic text-center py-8 border border-dashed border-white/5 rounded-2xl">Nenhuma campanha registrada.</p>}
              </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-8 bg-surface-muted/30 border-white/5">
             <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Atividade em Tempo Real</h2>
                <p className="text-xs text-zinc-500">Métricas de entrega do servidor JARVIS.</p>
             </div>
             
             <div className="flex flex-col gap-6">
                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col gap-2 relative overflow-hidden">
                   <div className="absolute top-2 right-2 flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   </div>
                   <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Sucesso Médio</span>
                   <span className="text-4xl font-black text-white">98.4%</span>
                   <p className="text-[9px] text-zinc-500">Otimizado para evitar bloqueios.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Abertura</span>
                      <span className="text-xl font-bold text-white">1.2k</span>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Respostas</span>
                      <span className="text-xl font-bold text-white">452</span>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Configurações de Anti-Spam</h4>
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                         <span className="text-xs text-zinc-400">Delay Randômico</span>
                         <Badge variant="purple" className="text-[9px]">Ativo</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                         <span className="text-xs text-zinc-400">Rotação de IP</span>
                         <Badge variant="purple" className="text-[9px]">Proxy</Badge>
                      </div>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <Card className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Auto-Atendimento Inteligente</h2>
              <p className="text-sm text-zinc-500">Defina regras de resposta instantânea para gatilhos comuns.</p>
            </div>

            <div className="flex flex-col gap-6 p-6 rounded-2xl bg-white/[0.02] border border-primary/20 shadow-neon-soft relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Palavra-Chave ou Gatilho</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                    <input 
                      type="text" 
                      placeholder="Ex: preço, como funciona, oi" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:border-primary outline-none transition-all"
                      value={newRule.trigger}
                      onChange={(e) => setNewRule({...newRule, trigger: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tipo de Comparação</label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:border-primary outline-none transition-all appearance-none"
                      value={newRule.matchType}
                      onChange={(e) => setNewRule({...newRule, matchType: e.target.value})}
                    >
                      <option value="KEYWORD">Palavra Exata</option>
                      <option value="CONTAINS">Contém o texto</option>
                      <option value="REGEX">Expressão Regular (REGEX)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Resposta Automática do Robô</label>
                <textarea 
                  rows={3} 
                  placeholder="Olá! Nossos planos começam em R$ 99 mensais. Deseja saber mais?" 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none transition-all resize-none"
                  value={newRule.response}
                  onChange={(e) => setNewRule({...newRule, response: e.target.value})}
                ></textarea>
              </div>

              <Button variant="neon" className="gap-2 py-4" onClick={handleAddRule}>
                <Plus size={18} /> Ativar Novo Robô de Resposta
              </Button>
            </div>

            <div className="flex flex-col gap-4">
               <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Regras de Resposta Ativas</h3>
               <div className="flex flex-col gap-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-all">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-white/10 text-primary border border-primary/20">{rule.matchType}</span>
                          <span className="text-sm font-bold text-white tracking-tight">"{rule.trigger}"</span>
                        </div>
                        <p className="text-xs text-zinc-500 max-w-lg line-clamp-1 italic">"{rule.response}"</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-3 rounded-xl bg-rose-500/5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {rules.length === 0 && <p className="text-zinc-600 italic text-center py-12 border border-dashed border-white/10 rounded-2xl">Nenhum robô configurado ainda.</p>}
               </div>
            </div>
          </Card>

          <Card className="flex flex-col gap-8">
             <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-white">Escalabilidade</h2>
                <Badge variant="purple" className="w-fit">Automação Ativa</Badge>
             </div>

             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                   <Zap size={20} className="text-emerald-500" />
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Funil Autônomo</span>
                      <span className="text-[10px] text-zinc-500">Leads movem para "Contato" em tempo real.</span>
                   </div>
                </div>

                <div className="flex flex-col gap-4">
                   <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Como funciona?</h4>
                   <div className="space-y-4">
                      <Step title="1. Gatilho detectado" desc="O JARVIS intercepta a mensagem recebida." />
                      <Step title="2. Match inteligente" desc="As regras são processadas em milissegundos." />
                      <Step title="3. Resposta enviada" desc="O cliente recebe o texto via WhatsApp." />
                      <Step title="4. CRM Atualizado" desc="O lead é movido no Kanban automaticamente." />
                   </div>
                </div>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Step({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3">
       <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shadow-neon" />
       <div className="flex flex-col">
          <span className="text-xs font-bold text-white">{title}</span>
          <span className="text-[10px] text-zinc-500">{desc}</span>
       </div>
    </div>
  );
}
