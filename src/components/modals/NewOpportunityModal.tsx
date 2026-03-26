"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface NewOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function NewOpportunityModal({ isOpen, onClose, onSuccess, initialData }: NewOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    status: "CONTATO INICIAL",
    priority: "ENTRADA",
  });

  React.useEffect(() => {
    setConfirmDelete(false);
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        value: initialData.value ? initialData.value.toString() : "",
        status: initialData.stage || "CONTATO INICIAL",
        priority: initialData.priority || "ENTRADA",
      });
    } else {
      setFormData({ title: "", value: "", status: "CONTATO INICIAL", priority: "ENTRADA" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/opportunities";
      const method = initialData ? "PATCH" : "POST";
      const bodyParams = initialData 
        ? { id: initialData.id, ...formData, stage: formData.status, value: parseFloat(formData.value) || 0 }
        : { ...formData, value: parseFloat(formData.value) || 0 };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyParams),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        if (!initialData) setFormData({ title: "", value: "", status: "CONTATO INICIAL", priority: "ENTRADA" });
      }
    } catch (error) {
      console.error("Erro ao salvar oportunidade:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch("/api/opportunities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialData.id }),
      });
      onSuccess();
      onClose();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Oportunidade" : "Nova Oportunidade"}>
      {confirmDelete ? (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Trash2 size={28} className="text-rose-500" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-lg font-bold text-white">Excluir Oportunidade?</h3>
            <p className="text-sm text-zinc-400 max-w-xs">
              Tem certeza que deseja excluir <span className="text-white font-semibold">"{initialData?.title}"</span>? Esta ação é irreversível.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDelete(false)}
            >
              Voltar
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-sm hover:bg-rose-500/30 transition-all disabled:opacity-50"
            >
              {loading ? "Excluindo..." : "Confirmar Exclusão"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input
            label="Nome da Empresa / Lead"
            placeholder="Ex: NexGen Solutions"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          
          <Input
            label="Valor Estimado (R$)"
            type="number"
            placeholder="0.00"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Estágio"
              options={[
                { label: "Novos Leads", value: "CONTATO INICIAL" },
                { label: "Em Contato", value: "QUALIFICAÇÃO" },
                { label: "Qualificado", value: "QUALIFICADO" },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
            
            <Select
              label="Prioridade / Badge"
              options={[
                { label: "Entrada (Fria)", value: "ENTRADA" },
                { label: "Proposta Enviada", value: "PROPOSTA ENVIADA" },
                { label: "Quente", value: "QUENTE" },
              ]}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-between mt-4">
            {initialData ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/20 text-rose-400 text-sm font-bold hover:bg-rose-500/10 transition-all"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="neon" disabled={loading}>
                {loading ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Oportunidade")}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
