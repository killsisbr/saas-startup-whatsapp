"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";

interface NewOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewOpportunityModal({ isOpen, onClose, onSuccess }: NewOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    status: "CONTATO",
    priority: "MÉDIA",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value) || 0,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ title: "", value: "", status: "OPEN", priority: "MÉDIA" });
      }
    } catch (error) {
      console.error("Erro ao criar oportunidade:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Oportunidade">
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
            label="Status"
            options={[
              { label: "Novo Lead", value: "CONTATO" },
              { label: "Em Negociação", value: "NEGOCIACAO" },
              { label: "Qualificado", value: "QUALIFICADO" },
              { label: "Ganho", value: "WON" },
              { label: "Perdido", value: "LOST" },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />
          
          <Select
            label="Prioridade"
            options={[
              { label: "Fria", value: "BAIXA" },
              { label: "Média", value: "MÉDIA" },
              { label: "Quente", value: "URGENTE" },
            ]}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          />
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="neon" disabled={loading}>
            {loading ? "Criando..." : "Criar Oportunidade"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
