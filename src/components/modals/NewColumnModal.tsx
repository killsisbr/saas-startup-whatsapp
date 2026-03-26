"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Form";
import Button from "@/components/ui/Button";

interface NewColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

export default function NewColumnModal({ isOpen, onClose, onSuccess, projectId }: NewColumnModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    
    setLoading(true);

    try {
      const res = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, projectId }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setTitle("");
      }
    } catch (error) {
      console.error("Erro ao criar coluna:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Coluna">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          label="Nome da Coluna"
          placeholder="Ex: Tarefas Pendentes"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <div className="flex gap-3 justify-end mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="neon" disabled={loading || !title.trim()}>
            {loading ? "Criando..." : "Criar Coluna"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
