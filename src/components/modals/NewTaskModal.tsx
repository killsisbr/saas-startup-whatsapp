"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, TextArea, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    columnId: "todo",
    priority: "MÉDIA",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ title: "", description: "", columnId: "todo", priority: "MÉDIA" });
      }
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Tarefa">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          label="Título da Tarefa"
          placeholder="Ex: Refatorar Dashboard"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        
        <TextArea
          label="Descrição"
          placeholder="Descreva os detalhes da tarefa..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Coluna"
            options={[
              { label: "A Fazer", value: "todo" },
              { label: "Em Andamento", value: "doing" },
              { label: "Em Revisão", value: "review" },
              { label: "Concluído", value: "done" },
            ]}
            value={formData.columnId}
            onChange={(e) => setFormData({ ...formData, columnId: e.target.value })}
          />
          
          <Select
            label="Prioridade"
            options={[
              { label: "Baixa", value: "BAIXA" },
              { label: "Média", value: "MÉDIA" },
              { label: "Urgente", value: "URGENTE" },
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
            {loading ? "Criando..." : "Criar Tarefa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
