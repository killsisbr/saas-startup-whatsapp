"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, AlertCircle, CheckCircle2, BarChart, Bell } from "lucide-react";

import NewEventModal from "@/components/modals/NewEventModal";
import DayDetailModal from "@/components/modals/DayDetailModal";

export default function AgendaPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState("Mês");
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchData = async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Falha ao carregar eventos");
      const data = await res.json();
      // Ordenar por data
      const sorted = (data || []).sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setEvents(sorted);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Polling: verificar lembretes de confirmação a cada 5 minutos
    const reminderInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/events/check-reminders');
        const data = await res.json();
        if (data.sent > 0) {
          console.log(`[Auto-Confirm] ${data.sent} lembrete(s) enviado(s).`);
          fetchData(); // Recarregar eventos para atualizar badges
        }
      } catch (err) {
        console.warn('[Auto-Confirm] Falha no polling:', err);
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Verificar imediatamente ao carregar
    fetch('/api/events/check-reminders').then(r => r.json()).then(d => {
      if (d.sent > 0) fetchData();
    }).catch(() => {});

    return () => clearInterval(reminderInterval);
  }, []);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();
  
  // Lógica de Painel Lateral
  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.start) >= now)
    .slice(0, 3);

  const urgentReminders = events
    .filter(e => e.priority === "URGENTE" || e.priority === "ALTA")
    .slice(0, 2);

  // Atividade Semanal (contagem por dia da semana atual)
  const getWeeklyActivity = () => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const curr = new Date();
    const first = curr.getDate() - curr.getDay();
    
    events.forEach(e => {
        const d = new Date(e.start);
        const diff = d.getDate() - first;
        if (diff >= 0 && diff < 7 && d.getMonth() === curr.getMonth() && d.getFullYear() === curr.getFullYear()) {
            counts[d.getDay()]++;
        }
    });
    return counts;
  };

  const activityData = getWeeklyActivity();
  const maxActivity = Math.max(...activityData, 1);

  if (loading) return <div className="text-white p-8">Carregando Agenda...</div>;

  const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const calendarCells = [];
  
  // Empty cells for first week
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  return (
    <div className="flex gap-8 h-[calc(100vh-140px)]">
      <NewEventModal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setEventToEdit(null);
        }} 
        onSuccess={fetchData}
        editData={eventToEdit}
      />
      <DayDetailModal 
        isOpen={isDayDetailOpen} 
        onClose={() => setIsDayDetailOpen(false)} 
        date={selectedDate} 
        events={selectedDate ? events.filter(e => new Date(e.start).toDateString() === selectedDate.toDateString()) : []}
        onAddEvent={() => {
            setIsDayDetailOpen(false);
            setEventToEdit(null);
            setIsModalOpen(true);
        }}
        onUpdate={fetchData}
      />
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <h1 className="text-3xl font-bold text-white tracking-tight">Agenda</h1>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                 {["Mês", "Semana", "Dia", "Lista"].map((t) => (
                    <button 
                      key={t} 
                      onClick={() => setFilter(t)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                       {t}
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                 <CalendarIcon size={16} className="text-primary" />
                 <span className="text-sm font-bold text-white tracking-tighter capitalize">{monthName} {year}</span>
                 <div className="flex items-center gap-2 ml-4">
                    <ChevronLeft size={16} className="text-zinc-600 hover:text-white cursor-pointer" onClick={prevMonth} />
                    <ChevronRight size={16} className="text-zinc-600 hover:text-white cursor-pointer" onClick={nextMonth} />
                 </div>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>Hoje</Button>
              <Button variant="neon" className="gap-2" onClick={() => setIsModalOpen(true)}>
                 <Plus size={18} />
                 Novo Compromisso
              </Button>
           </div>
        </div>

        <div className="flex-1 glass-card overflow-hidden flex flex-col">
            <div className={`grid ${filter === "Dia" ? "grid-cols-1" : "grid-cols-7"} border-b border-white/5 bg-white/[0.02]`}>
               {filter === "Dia" ? (
                 <div className="py-3 text-center text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
               ) : (
                 days.map(d => (
                   <div key={d} className="py-3 text-center text-[10px] font-bold text-zinc-500 tracking-widest">{d}</div>
                 ))
               )}
            </div>
            <div className={`grid ${filter === "Dia" || filter === "Lista" ? "grid-cols-1" : "grid-cols-7"} h-full overflow-y-auto`}>
               {filter === "Dia" || filter === "Lista" ? (
                  <div className="p-8 flex flex-col gap-6">
                     <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <span className="text-4xl font-black text-white">{filter === "Dia" ? currentDate.getDate() : "Lista de Eventos"}</span>
                         <Badge variant="purple">{filter === "Dia" ? "Compromissos do Dia" : "Todos os Eventos"}</Badge>
                     </div>
                     <div className="flex flex-col gap-4">
                        {(filter === "Dia" ? events.filter(e => new Date(e.start).toDateString() === currentDate.toDateString()) : events).length > 0 ? (
                           (filter === "Dia" ? events.filter(e => new Date(e.start).toDateString() === currentDate.toDateString()) : events).map((event, i) => (
                              <div key={i} className="p-4 rounded-xl bg-white/5 border border-primary/20 flex flex-col gap-2">
                                 <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                       <span className="text-lg font-bold text-white">{event.title}</span>
                                       <span className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(event.start).toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-xs font-bold text-primary">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 </div>
                                 <p className="text-sm text-zinc-400">{event.description || "Nenhuma descrição."}</p>
                              </div>
                           ))
                        ) : (
                           <p className="text-zinc-500 italic">Nenhum compromisso encontrado.</p>
                        )}
                     </div>
                  </div>
               ) : filter === "Semana" ? (
                  // Implementação simplificada de semana (7 dias a partir do dia 25)
                  Array.from({ length: 7 }).map((_, i) => {
                     const date = new Date(currentDate);
                     date.setDate(currentDate.getDate() + i - currentDate.getDay());
                     const dailyEvents = events.filter(e => new Date(e.start).toDateString() === date.toDateString());
                     
                     return (
                        <div key={i} className="border-r border-b border-white/5 p-4 min-h-[400px] flex flex-col gap-4 hover:bg-white/[0.01]">
                           <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-zinc-500">{days[date.getDay()]}</span>
                              <span className={`text-xl font-bold ${date.toDateString() === new Date().toDateString() ? "text-primary shadow-neon-text" : "text-white"}`}>{date.getDate()}</span>
                           </div>
                           <div className="flex flex-col gap-2">
                              {dailyEvents.map((event, idx) => (
                                 <div key={idx} className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                                    {event.title}
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })
               ) : (
                 calendarCells.map((d, i) => {
                   if (d === null) return <div key={`empty-${i}`} className="border-r border-b border-white/5 bg-white/[0.01]" />;
                   
                   const dayValue = d;
                   const dailyEvents = events.filter(e => {
                       const eventDate = new Date(e.start);
                       return eventDate.getDate() === dayValue && 
                              eventDate.getMonth() === currentDate.getMonth() &&
                              eventDate.getFullYear() === currentDate.getFullYear();
                   });
                   const isToday = dayValue === 25 && currentDate.getMonth() === 2;
                    
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayValue);
                            setSelectedDate(d);
                            setIsDayDetailOpen(true);
                        }}
                        className={`border-r border-b border-white/5 p-3 flex flex-col gap-1.5 min-h-[120px] hover:bg-white/[0.02] transition-colors relative cursor-pointer group`}
                      >
                        <span className={`text-xs font-bold ${isToday ? "text-primary shadow-neon-text" : "text-zinc-600 transition-colors group-hover:text-zinc-300"}`}>
                          {dayValue.toString().padStart(2, '0')}
                        </span>
                        <div className="flex flex-col gap-1 max-h-[80px] overflow-hidden">
                          {dailyEvents.slice(0, 3).map((event, idx) => (
                            <div key={idx} className={`px-2 py-1 rounded-md bg-white/5 border-l-2 ${event.color || 'border-primary'} text-[9px] font-bold text-zinc-300 truncate flex items-center gap-1`}>
                              {event.reminderSent && <Bell size={8} className="text-emerald-400 shrink-0" />}
                              {event.title}
                            </div>
                          ))}
                          {dailyEvents.length > 3 && <span className="text-[8px] text-zinc-500 font-bold px-1">+{dailyEvents.length - 3} mais</span>}
                        </div>
                      </div>
                    )
                  })
               )}
            </div>
        </div>
      </div>

      {/* PAINEL LATERAL ELITE */}
      <div className="w-96 flex flex-col gap-6">
         <Card className="flex flex-col gap-8 h-full bg-surface-muted/30 border-white/5" glow>
            {/* PRÓXIMOS */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white tracking-tight">Próximos</h3>
                    <Badge variant="purple" className="text-[10px] py-0.5">Hoje</Badge>
                </div>
                
                <div className="flex flex-col gap-4">
                    {upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                              setEventToEdit(event);
                              setIsModalOpen(true);
                          }}
                          className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform"
                        >
                            <div className={`w-1.5 h-12 rounded-full ${event.color?.replace('bg-', 'bg-') || 'bg-primary'} shadow-neon mt-1`} />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-zinc-500">
                                  {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {event.end && ` - ${new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </span>
                                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-zinc-500 font-medium">{event.location || "Sem local"}</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-zinc-600 text-[10px] italic">Sem próximos compromissos.</p>
                    )}
                </div>
            </div>

            {/* LEMBRETES */}
            <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Lembretes</h3>
                <div className="flex flex-col gap-3">
                    {urgentReminders.length > 0 ? urgentReminders.map((event, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                              setSelectedDate(new Date(event.start));
                              setIsDayDetailOpen(true);
                          }}
                          className={`p-3 rounded-xl border flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors ${event.priority === "URGENTE" ? "bg-rose-500/5 border-rose-500/10" : "bg-amber-500/5 border-amber-500/10"}`}
                        >
                            <AlertCircle size={20} className={event.priority === "URGENTE" ? "text-rose-500" : "text-amber-500"} />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{event.title}</span>
                                <span className="text-[9px] text-zinc-500">{new Date(event.start).toLocaleDateString()} às {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                            <CheckCircle2 size={20} className="text-emerald-500" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">Tudo em dia</span>
                                <span className="text-[9px] text-zinc-500">Sem pendências críticas</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ATIVIDADE SEMANAL */}
            <div className="flex flex-col gap-6 mt-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Atividade Semanal</h3>
                    <BarChart size={14} className="text-zinc-600" />
                </div>
                <div className="flex items-end justify-between h-20 gap-2 mb-4">
                    {activityData.map((v, i) => (
                        <div key={i} className="flex-1 bg-white/5 rounded-t-sm relative group cursor-pointer" style={{ height: `${(v / maxActivity) * 100}%` }}>
                            <div className={`absolute inset-0 ${i === new Date().getDay() ? 'bg-primary shadow-neon' : 'bg-zinc-700/50 group-hover:bg-zinc-600'}`} />
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-[8px] px-1 py-0.5 rounded border border-white/10 text-white pointer-events-none">
                                {v}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </Card>
      </div>
    </div>
  );
}

function TimelineItem({ time, title, location, color }: { time: string, title: string, location: string, color: string }) {
  return (
    <div className="flex gap-4 group cursor-pointer border-l-2 border-transparent hover:border-primary pl-2 transition-all">
       <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-600">{time}</span>
          <span className="text-[12px] font-bold text-white tracking-tight group-hover:text-primary transition-colors">{title}</span>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-medium">
             <Clock size={8} />
             {location}
          </div>
       </div>
    </div>
  );
}
