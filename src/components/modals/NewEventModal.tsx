"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, TextArea, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function NewEventModal({ isOpen, onClose, onSuccess, editData }: NewEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editData?.title || "",
    description: editData?.description || "",
    start: editData?.start ? new Date(editData.start).toISOString().slice(0, 16) : "",
    end: editData?.end ? new Date(editData.end).toISOString().slice(0, 16) : "",
    priority: editData?.priority || "NORMAL",
    location: editData?.location || "",
    color: editData?.color || "bg-primary",
  });

  // Sincronizar estado se editData mudar (quando abre para um novo item)
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: editData?.title || "",
        description: editData?.description || "",
        start: editData?.start ? new Date(editData.start).toISOString().slice(0, 16) : "",
        end: editData?.end ? new Date(editData.end).toISOString().slice(0, 16) : "",
        priority: editData?.priority || "NORMAL",
        location: editData?.location || "",
        color: editData?.color || "bg-primary",
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editData ? "PATCH" : "POST";
      const body = editData ? { ...formData, id: editData.id } : formData;

      const res = await fetch("/api/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSuccess();
        onClose();
        if (!editData) setFormData({ title: "", description: "", start: "", end: "", color: "bg-primary", priority: "NORMAL", location: "" });
      }
    } catch (error) {
      console.error("Erro ao processar evento:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? "Editar Compromisso" : "Novo Compromisso"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* ... existing fields ... */}
        <Input
          label="Título"
          placeholder="Ex: Reunião de Pitch"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <TextArea
          label="Descrição"
          placeholder="Detalhes do compromisso..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Início"
            type="datetime-local"
            required
            value={formData.start}
            onChange={(e) => setFormData({ ...formData, start: e.target.value })}
          />
          <Input
            label="Fim (Opcional)"
            type="datetime-local"
            value={formData.end}
            onChange={(e) => setFormData({ ...formData, end: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Prioridade"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            options={[
              { label: "Baixa", value: "BAIXA" },
              { label: "Normal", value: "NORMAL" },
              { label: "Alta", value: "ALTA" },
              { label: "Urgente", value: "URGENTE" },
            ]}
          />
          <Input
            label="Local / Link"
            placeholder="Ex: Google Meet"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <Select
          label="Cor/Categoria"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          options={[
            { label: "Primário", value: "bg-primary" },
            { label: "Sucesso", value: "bg-emerald-500" },
            { label: "Aviso", value: "bg-amber-500" },
            { label: "Erro", value: "bg-rose-500" },
          ]}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="neon" disabled={loading}>
            {loading ? "Processando..." : editData ? "Salvar Alterações" : "Agendar Evento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
