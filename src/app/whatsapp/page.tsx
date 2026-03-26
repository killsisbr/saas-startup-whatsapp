"use client";

import React, { useState, useEffect, useMemo } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Search, Plus, Phone, Video, MoreVertical, Paperclip, Smile, Mic, Send, FileText, Download, CheckCheck, Star, Clock, MessageSquare, Users, QrCode, LogOut, Loader2, Play, RefreshCw, BarChart3, TrendingUp, CheckCircle2, Calendar } from "lucide-react";
import CampaignManager from "@/components/whatsapp/CampaignManager";
import { useToast } from "@/context/ToastContext";

export default function WhatsAppPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Estado de busca
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Estados de Conexão WhatsApp
  const [waStatus, setWaStatus] = useState<string>('DISCONNECTED');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('WHATSAPP');

  // AGENDAMENTO PREMIUM
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleBody, setScheduleBody] = useState("");
  const [createAgendaEvent, setCreateAgendaEvent] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data.status || 'DISCONNECTED');
        setQrCode(data.qrCode || null);
      }
    } catch (err) {
      console.error("Erro ao buscar status do WhatsApp:", err);
    }
  };

  const connectWhatsApp = async () => {
    setWaStatus('INITIALIZING');
    try {
      const res = await fetch("/api/whatsapp/status", { method: "POST" });
      const data = await res.json();
      setWaStatus(data.status);
      setQrCode(data.qrCode);
    } catch (err) {
      console.error("Erro ao conectar:", err);
      setWaStatus('DISCONNECTED');
    }
  };

  const disconnectWhatsApp = async () => {
    if (!confirm("Deseja realmente desconectar o WhatsApp?")) return;
    try {
      await fetch("/api/whatsapp/status", { method: "DELETE" });
      setWaStatus('DISCONNECTED');
      setQrCode(null);
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data || []);
      if (data && data.length > 0 && !activeLead && !leads.length) setActiveLead(data[0]);
    } catch (error) {
      console.error("Erro ao buscar leads para whatsapp:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/whatsapp/sync/full", { method: "POST" });
      if (res.ok) {
        await fetchLeads();
        toast.success("Sincronização concluída!");
      } else {
        const data = await res.json();
        toast.error("Erro na sincronização: " + data.error);
      }
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    } finally {
      setSyncing(false);
    }
  };

  const fetchMessages = async (leadId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/messages?leadId=${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens do lead:", err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 5000);
    const leadsInterval = setInterval(fetchLeads, 10000); // Pesquisar novos leads a cada 10s
    return () => {
      clearInterval(statusInterval);
      clearInterval(leadsInterval);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!activeLead) return;
    fetchMessages(activeLead.id);
    
    const interval = setInterval(() => {
      fetchMessages(activeLead.id);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeLead]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    return leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (l.phone && l.phone.includes(searchQuery))
    );
  }, [leads, searchQuery]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeLead || sending) return;

    setSending(true);
    const tempText = messageText;
    setMessageText("");
    
    const optimisticMsg = {
      id: "temp-" + Date.now(),
      text: tempText,
      sender: "me",
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: activeLead.phone,
          message: tempText,
          leadId: activeLead.id
        }),
      });

      if (res.ok) {
        fetchMessages(activeLead.id);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao enviar mensagem");
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleScheduleMessage = async () => {
    if (!activeLead || !scheduleDate || !scheduleTime || !scheduleBody.trim()) {
      toast.error("Preencha todos os campos e a mensagem do agendamento.");
      return;
    }

    const sendAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (sendAt <= new Date()) {
      toast.error("A data deve ser no futuro.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/whatsapp/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: scheduleBody,
          sendAt,
          leadId: activeLead.id,
          createEvent: createAgendaEvent
        })
      });

      if (res.ok) {
        toast.success("Mensagem agendada com sucesso!");
        setShowScheduleModal(false);
        setScheduleBody("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao agendar.");
      }
    } catch (err) {
      console.error("Erro ao agendar:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !leads.length) return <div className="text-white p-8 animate-pulse text-xs font-bold uppercase tracking-widest">Carregando CRM Messenger...</div>;

  if (waStatus === 'DISCONNECTED' || waStatus === 'QR_CODE' || waStatus === 'INITIALIZING') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] -m-8 bg-background">
        <Card className="max-w-md w-full flex flex-col items-center text-center gap-8 py-12 px-8 shadow-neon border-primary/20">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            {waStatus === 'INITIALIZING' ? <Loader2 className="animate-spin" size={40} /> : <QrCode size={40} />}
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Conectar WhatsApp</h1>
            <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Vincule sua conta para iniciar os disparos</p>
          </div>

          {waStatus === 'QR_CODE' && qrCode ? (
            <div className="bg-white p-4 rounded-3xl shadow-neon">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
            </div>
          ) : (
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 w-full italic text-zinc-500 text-xs text-center">
              {waStatus === 'INITIALIZING' ? "Iniciando motor do WhatsApp... isso pode levar até 30 segundos." : "Clique no botão abaixo para gerar o código de pareamento."}
            </div>
          )}

          {waStatus === 'DISCONNECTED' && (
            <Button onClick={connectWhatsApp} variant="neon" className="w-full">
              Iniciar Conexão
            </Button>
          )}

          <div className="flex flex-col gap-4 text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
            <p>1. Abra o WhatsApp no seu celular</p>
            <p>2. Toque em Aparelhos Conectados</p>
            <p>3. Aponte a câmera para esta tela</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)] -m-8 overflow-hidden bg-background">
      {/* Sidebar de Conversas */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-surface/30">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">CRM Messenger</h1>
            <div className="flex items-center gap-2">
               <button 
                  onClick={handleSync} 
                  disabled={syncing}
                  className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 transition-all ${syncing ? 'animate-spin text-primary' : 'hover:text-white'}`}
                  title="Sincronizar Histórico"
                >
                  <RefreshCw size={14} />
               </button>
               <button onClick={disconnectWhatsApp} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-rose-500 transition-all" title="Desconectar WhatsApp">
                  <LogOut size={14} />
               </button>
            </div>
          </div>
          
          <div className="flex gap-4 border-b border-white/5">
             {["Dashboard", "WhatsApp", "Campanhas"].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t.toUpperCase())}
                  className={`text-[10px] font-bold pb-2 transition-all ${activeTab === t.toUpperCase() ? 'text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {t.toUpperCase()}
                </button>
             ))}
          </div>

          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
             <input 
                type="text" 
                placeholder="Buscar conversas..." 
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-zinc-300 outline-none focus:border-primary/50 transition-all" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </div>

        {activeTab === 'WHATSAPP' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredLeads.map((lead) => {
               let previewText = lead.phone || "Novo lead no pipeline";
               if (activeLead && activeLead.id === lead.id && messages.length > 0) {
                 previewText = messages[messages.length - 1].text;
               }
               return (
                <ChatItem 
                  key={lead.id}
                  name={lead.name} 
                  message={previewText} 
                  time={new Date(lead.createdAt).toLocaleDateString()} 
                  active={activeLead?.id === lead.id}
                  onClick={() => setActiveLead(lead)}
                  badge={lead.status}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Janela Principal */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {activeTab === 'CAMPANHAS' ? (
          <div className="p-8 overflow-y-auto custom-scrollbar h-full">
            <CampaignManager />
          </div>
        ) : activeTab === 'DASHBOARD' ? (
          <DashboardView />
        ) : activeLead ? (
          <>
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-surface/10 backdrop-blur-xl shrink-0">
               <div className="flex items-center gap-4">
                  <div className="relative">
                     <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {activeLead.name.substring(0, 1)}
                     </div>
                     <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-[0_0_8px_#10B981]" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-white">{activeLead.name}</span>
                     <span className="text-[10px] text-emerald-500 font-bold tracking-tighter uppercase font-oswald">● Online</span>
                  </div>
               </div>
               <div className="flex items-center gap-6 text-zinc-500">
                  <Phone size={18} className="hover:text-white cursor-pointer transition-colors" />
                  <Video size={18} className="hover:text-white cursor-pointer transition-colors" />
                  <MoreVertical size={18} className="hover:text-white cursor-pointer transition-colors" />
               </div>
            </header>

            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
               <div className="flex justify-center">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-zinc-500 uppercase tracking-widest">HOJE</span>
               </div>
               
               {messages.map((msg) => {
                 const isMe = msg.sender === "me";
                 const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 flex flex-col gap-1 ${isMe ? 'bg-primary/20 border border-primary/20 rounded-2xl rounded-tr-none shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/5 border border-white/5 rounded-2xl rounded-tl-none'}`}>
                         <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                         <span className="text-[9px] text-zinc-500 self-end font-bold opacity-50">{timeFormatted}</span>
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-8 bg-surface/10 border-t border-white/5 shrink-0 backdrop-blur-lg">
               <div className="flex items-center gap-4">
                  <button onClick={() => setShowScheduleModal(true)} className="text-zinc-500 hover:text-primary transition-colors flex flex-col items-center">
                    <Clock size={20} />
                    <span className="text-[8px] font-black uppercase mt-1">Agendar</span>
                  </button>
                  <button className="text-zinc-500 hover:text-white transition-colors"><Smile size={20} /></button>
                  <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 px-6 py-3 flex items-center gap-4 focus-within:border-primary/30 transition-all">
                     <input 
                        type="text" 
                        placeholder="Escreva sua mensagem..." 
                        className="w-full bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-600" 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                     />
                  </div>
                  <button 
                    onClick={handleSendMessage}
                    disabled={sending || !messageText.trim()}
                    className="w-12 h-12 rounded-2xl bg-primary shadow-neon flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                     {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-zinc-600">
             <MessageSquare size={48} className="opacity-20" />
             <p className="text-sm font-bold uppercase tracking-widest">Selecione uma conversa</p>
          </div>
        )}

        {/* Modal de Agendamento Premium */}
        {showScheduleModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
             <Card className="w-full max-w-sm flex flex-col gap-6 shadow-neon border-primary/20 p-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                     <Calendar size={18} className="text-primary" />
                     Agendar Mensagem
                   </h3>
                   <button onClick={() => setShowScheduleModal(false)} className="text-zinc-500 hover:text-white">✕</button>
                </div>
                
                <div className="flex flex-col gap-4">
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data do Envio</label>
                      <input 
                        type="date" 
                        className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Horário</label>
                      <input 
                        type="time" 
                        className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Corpo da Mensagem</label>
                      <textarea 
                        rows={3}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-primary outline-none resize-none"
                        placeholder="Digite o conteúdo aqui..."
                        value={scheduleBody}
                        onChange={(e) => setScheduleBody(e.target.value)}
                      />
                   </div>
                   <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="agenda-event"
                        checked={createAgendaEvent}
                        onChange={(e) => setCreateAgendaEvent(e.target.checked)}
                        className="accent-primary"
                      />
                      <label htmlFor="agenda-event" className="text-[10px] font-bold text-zinc-400 uppercase">Criar Evento na Agenda</label>
                   </div>
                </div>

                <Button variant="neon" className="w-full gap-2" onClick={handleScheduleMessage}>
                   <Clock size={16} /> Confirmar Agendamento
                </Button>
             </Card>
          </div>
        )}
      </div>

      {/* Info Panel Right */}
      {activeLead && activeTab === 'WHATSAPP' && (
        <div className="w-80 border-l border-white/5 flex flex-col p-8 bg-surface/30 gap-8 overflow-y-auto">
           {/* ... (Lead Info) */}
           <div className="flex flex-col items-center text-center gap-4">
              <div className="w-24 h-24 rounded-3xl bg-zinc-800 border border-white/10 flex items-center justify-center text-2xl font-black text-primary overflow-hidden">
                 {activeLead.name.substring(0, 1)}
              </div>
              <div className="flex flex-col gap-1">
                 <h2 className="text-lg font-bold text-white tracking-tight">{activeLead.name}</h2>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{activeLead.phone}</span>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status do Funil</span>
                 <Badge variant="purple" className="w-fit">{activeLead.status}</Badge>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function ChatItem({ name, message, time, active, onClick, badge }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-6 border-b border-white/5 cursor-pointer transition-all flex items-center gap-4 relative overflow-hidden ${active ? 'bg-primary/10' : 'hover:bg-white/[0.02]'}`}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-neon" />}
      <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 shrink-0 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
         {name.substring(0, 1)}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
         <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-zinc-300'}`}>{name}</span>
            <span className="text-[9px] font-bold text-zinc-600 whitespace-nowrap">{time}</span>
         </div>
         <p className="text-[11px] text-zinc-500 truncate leading-relaxed">{message}</p>
         {badge && (
           <div className="flex mt-1">
             <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold px-2 py-0.5 rounded uppercase">{badge}</span>
           </div>
         )}
      </div>
    </div>
  );
}

function DashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/whatsapp/dashboard/stats");
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error("Erro ao buscar stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-12 text-center text-zinc-600 animate-pulse uppercase font-bold text-xs tracking-widest">Carregando métricas...</div>;

  return (
    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar flex flex-col gap-12 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Dashboard WhatsApp</h2>
        <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Performance e métricas de interação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Mensagens Totais" value={stats?.totalMessages || 0} icon={MessageSquare} color="primary" />
        <StatCard title="Recebidas" value={stats?.receivedMessages || 0} icon={TrendingUp} color="emerald" />
        <StatCard title="Leads Ativos (24h)" value={stats?.recentLeads || 0} icon={Users} color="amber" />
        <StatCard title="Campanhas OK" value={stats?.completedCampaigns || 0} icon={CheckCircle2} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col gap-6 border-white/5">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Comparativo de Engajamento</span>
              <BarChart3 size={16} className="text-primary" />
           </div>
           <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-primary">Enviadas</span>
                    <span className="text-white">{stats?.sentMessages || 0}</span>
                 </div>
                 <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary shadow-neon" style={{ width: `${stats?.totalMessages > 0 ? (stats.sentMessages / stats.totalMessages) * 100 : 0}%` }} />
                 </div>
              </div>
           </div>
        </Card>

        <Card className="flex flex-col gap-6 border-white/5 bg-primary/[0.02]">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Star size={20} /></div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-white uppercase tracking-tight">Status do Motor</span>
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Processamento Ativo</span>
              </div>
           </div>
           <p className="text-xs text-zinc-500 leading-relaxed italic">"O sistema está monitorando mensagens e campanhas em tempo real. A sincronização de histórico está disponível na barra lateral para novos contatos."</p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <Card className={`border-none ${colors[color]} p-6 flex flex-col gap-4 group hover:scale-[1.02] transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{title}</span>
        <Icon size={18} className="opacity-40 group-hover:opacity-100 transition-all" />
      </div>
      <span className="text-3xl font-black text-white group-hover:shadow-neon transition-all">{value}</span>
    </Card>
  );
}
