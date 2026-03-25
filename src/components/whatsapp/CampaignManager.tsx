"use client";

import React, { useState, useEffect, useRef } from 'react';
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Play, Pause, Square, Plus, Send, AlertCircle, CheckCircle2, Clock, Loader2, Upload, Users, ListFilter, X, FileText } from "lucide-react";

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [newCampaign, setNewCampaign] = useState({ name: '', message: '', targetTags: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'tags'>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/whatsapp/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error("Erro ao buscar campanhas:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/leads/tags');
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data);
      }
    } catch (err) {
      console.error("Erro ao buscar tags:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchTags();
    const interval = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message) return;
    setSubmitting(true);
    
    // Concatena tags se o tipo for 'tags'
    const campaignData = {
      ...newCampaign,
      targetTags: targetType === 'tags' ? selectedTags.join(',') : ''
    };

    try {
      const res = await fetch('/api/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });
      if (res.ok) {
        setNewCampaign({ name: '', message: '', targetTags: '' });
        setSelectedTags([]);
        setTargetType('all');
        fetchCampaigns();
      }
    } catch (err) {
      console.error("Erro ao criar campanha:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      await fetch('/api/whatsapp/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      fetchCampaigns();
    } catch (err) {
      console.error("Erro ao realizar ação na campanha:", err);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto w-full overflow-y-auto custom-scrollbar h-full relative">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Gestão de Campanhas</h2>
          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Crie e monitore seus disparos em massa</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowImportModal(true)}
          className="bg-white/5 border-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest gap-2"
        >
          <Upload size={14} className="text-primary" />
          Importar Leads
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Criação */}
        <Card className="lg:col-span-1 flex flex-col gap-6 h-fit sticky top-0">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
            <Plus size={16} />
            Nova Campanha
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Nome */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome da Campanha</label>
              <input 
                type="text" 
                placeholder="Ex: Promoção de Verão" 
                className="bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-all"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>

            {/* Seleção de Alvos */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Público Alvo</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setTargetType('all')}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${targetType === 'all' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                >
                  <Users size={12} />
                  Todos
                </button>
                <button 
                  onClick={() => setTargetType('tags')}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${targetType === 'tags' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-zinc-500'}`}
                >
                  <ListFilter size={12} />
                  Por Tag
                </button>
              </div>

              {targetType === 'tags' && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 bg-black/20 rounded-xl border border-white/5 min-h-[60px]">
                  {availableTags.length === 0 ? (
                    <span className="text-[9px] text-zinc-600 italic">Nenhuma tag disponível</span>
                  ) : availableTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${selectedTags.includes(tag) ? 'bg-primary border-primary text-white shadow-neon-sm' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Mensagem */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mensagem</label>
              <textarea 
                placeholder="Olá @nome, veja nossa oferta..." 
                className="bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-all min-h-[120px] resize-none"
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
              />
              <p className="text-[9px] text-zinc-600 font-medium">Use <span className="text-primary">@nome</span> para personalizar.</p>
            </div>

            <Button 
              onClick={handleCreateCampaign} 
              disabled={submitting || !newCampaign.name || !newCampaign.message || (targetType === 'tags' && selectedTags.length === 0)}
              className="w-full shadow-neon"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : "Iniciar Disparo"}
            </Button>
          </div>
        </Card>

        {/* Lista de Campanhas */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Histórico Recente</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{campaigns.length} Campanhas</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-600 animate-pulse uppercase font-bold text-xs tracking-widest">Carregando histórico...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-zinc-600 flex flex-col items-center gap-4">
              <Send size={32} className="opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhuma campanha realizada</p>
            </div>
          ) : campaigns.map((campaign) => (
            <Card key={campaign.id} className="relative overflow-hidden group border-white/5 hover:border-primary/20 transition-all">
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                <div 
                  className={`h-full transition-all duration-500 ${
                    campaign.status === 'COMPLETED' ? 'bg-emerald-500' : 
                    campaign.status === 'FAILED' ? 'bg-rose-500' : 
                    'bg-primary shadow-neon'
                  }`}
                  style={{ width: `${campaign.totalContacts > 0 ? (campaign.processedCount / campaign.totalContacts) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-start justify-between gap-4 mt-2">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">{campaign.name}</h3>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">{campaign.message}</p>
                  {campaign.targetTags && (
                    <div className="flex gap-1 mt-1">
                      {campaign.targetTags.split(',').map((t: string) => (
                        <span key={t} className="text-[8px] bg-white/5 px-1 rounded text-zinc-500 border border-white/5">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {campaign.status === 'PROCESSING' && (
                    <button onClick={() => handleAction(campaign.id, 'pause')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                      <Pause size={14} />
                    </button>
                  )}
                  {campaign.status === 'PAUSED' && (
                    <button onClick={() => handleAction(campaign.id, 'resume')} className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all">
                      <Play size={14} />
                    </button>
                  )}
                  {(campaign.status === 'PROCESSING' || campaign.status === 'PAUSED') && (
                    <button onClick={() => handleAction(campaign.id, 'stop')} className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all">
                      <Square size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Alvos</span>
                  <span className="text-sm font-black text-white">{campaign.totalContacts}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-widest">Sucesso</span>
                  <span className="text-sm font-black text-emerald-500">{campaign.successCount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-rose-600/50 uppercase tracking-widest">Falha</span>
                  <span className="text-sm font-black text-rose-500">{campaign.failedCount}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showImportModal && (
        <ImportLeadsModal 
          onClose={() => setShowImportModal(false)} 
          onSuccess={() => {
            setShowImportModal(false);
            fetchTags();
          }} 
        />
      )}
    </div>
  );
}

function ImportLeadsModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (tag) formData.append('tag', tag);

    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao importar');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col gap-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-all">
          <X size={20} />
        </button>

        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Importar Lista</h3>
          <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase">Envie sua planilha Excel (.xlsx)</p>
        </div>

        {!result ? (
          <div className="flex flex-col gap-5">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 transition-all cursor-pointer ${file ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-white/10 bg-white/5'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              {file ? (
                <>
                  <FileText size={32} className="text-primary" />
                  <span className="text-sm font-bold text-white truncate max-w-full px-4">{file.name}</span>
                  <span className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-zinc-700" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Clique para selecionar</span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome da Etiqueta (Tag)</label>
              <input 
                type="text" 
                placeholder="Ex: Leads-Facebook-Marco" 
                className="bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-all"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] font-bold uppercase">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={loading || !file}
              className="w-full shadow-neon"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Iniciar Importação"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 size={32} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 text-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sucesso</span>
                <span className="text-2xl font-black text-emerald-500">{result.imported}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 text-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-white">{result.total}</span>
              </div>
            </div>

            <Button onClick={onSuccess} className="w-full">Concluir</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    'PENDING': { icon: Clock, color: 'text-zinc-500 bg-white/5', label: 'Pendente' },
    'PROCESSING': { icon: Loader2, color: 'text-primary bg-primary/10 animate-pulse-slow', label: 'Enviando' },
    'PAUSED': { icon: Pause, color: 'text-amber-500 bg-amber-500/10', label: 'Pausada' },
    'COMPLETED': { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10', label: 'Finalizada' },
    'FAILED': { icon: AlertCircle, color: 'text-rose-500 bg-rose-500/10', label: 'Erro' },
  };

  const config = configs[status] || configs['PENDING'];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${config.color}`}>
      <Icon size={10} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {config.label}
    </div>
  );
}
