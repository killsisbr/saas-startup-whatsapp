"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Clock, MapPin, Plus, Trash2, Edit2, AlertCircle, Save, X, Activity } from "lucide-react";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: any[];
  onAddEvent: () => void;
  onUpdate: () => void;
}

export default function DayDetailModal({ isOpen, onClose, date, events, onAddEvent, onUpdate }: DayDetailModalProps) {
  if (!date) return null;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
      if (res.ok) onUpdate();
    } catch (error) {
      console.error("Erro ao deletar:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (event: any) => {
    setEditingId(event.id);
    setEditData({ ...event });
  };

  const handleSaveInline = async () => {
    if (!editData) return;
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        onUpdate();
        setEditingId(null);
        setEditData(null);
      }
    } catch (error) {
      console.error("Erro ao salvar inline:", error);
    }
  };

  const formattedDate = date.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Dia">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white capitalize">{date.getDate()}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{formattedDate}</span>
          </div>
          <Button variant="neon" size="sm" className="gap-2" onClick={onAddEvent}>
            <Plus size={16} />
            Adicionar
          </Button>
        </div>

        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {events.length > 0 ? (
            events.map((event, i) => {
              const isEditing = editingId === event.id;
              
              return (
                <div key={i} className={`group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all flex flex-col gap-3 ${deletingId === event.id ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-2 h-8 rounded-full ${event.color || 'bg-primary'}`} />
                      <div className="flex flex-col flex-1">
                        {isEditing ? (
                          <input 
                            className="bg-zinc-800/50 border border-white/10 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-primary w-full"
                            value={editData.title}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</span>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase mt-1">
                          <Clock size={10} />
                          {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button onClick={handleSaveInline} className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500">
                            <Save size={12} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400">
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(event)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDelete(event.id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500">
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex flex-col gap-3 pl-5">
                      <div className="flex flex-col gap-2">
                         <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Descrição</span>
                         <textarea 
                          className="bg-white/5 border border-white/5 hover:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-primary/50 w-full resize-none transition-all"
                          rows={2}
                          value={editData.description || ""}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder="Detalhes do compromisso..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                             <Clock size={8} /> Início
                           </span>
                           <input 
                            type="datetime-local"
                            className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-primary/50 transition-all custom-datetime-input"
                            value={editData.start ? new Date(editData.start).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setEditData({ ...editData, start: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                             <Clock size={8} /> Fim (Opcional)
                           </span>
                           <input 
                            type="datetime-local"
                            className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-primary/50 transition-all custom-datetime-input"
                            value={editData.end ? new Date(editData.end).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setEditData({ ...editData, end: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                             <Activity size={8} /> Prioridade
                           </span>
                           <select 
                             className="bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase text-zinc-300 focus:outline-none focus:border-primary/50 transition-all"
                             value={editData.priority || "NORMAL"}
                             onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                           >
                             <option value="BAIXA">Baixa</option>
                             <option value="NORMAL">Normal</option>
                             <option value="ALTA">Alta</option>
                             <option value="URGENTE">Urgente</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                           <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                             <MapPin size={8} /> Localização / Link
                           </span>
                           <input 
                              className="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-zinc-700"
                              value={editData.location || ""}
                              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                              placeholder="Endereço ou Meet Link..."
                           />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pl-5">
                      {event.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge 
                          variant={event.priority === "ALTA" || event.priority === "URGENTE" ? "danger" : (event.priority === "NORMAL" ? "info" : "success")} 
                          className="text-[8px] py-0.5 uppercase tracking-tighter shadow-lg shadow-rose-500/10"
                        >
                          {event.priority || "NORMAL"}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase bg-white/5 px-2 py-1 rounded-full border border-white/5">
                            <MapPin size={8} className="text-primary" />
                            {event.location || "Sem local definido"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-600">
              <AlertCircle size={32} strokeWidth={1} />
              <p className="text-xs italic">Nenhum compromisso para este dia.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
