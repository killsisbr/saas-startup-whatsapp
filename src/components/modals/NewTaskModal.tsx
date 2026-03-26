"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, TextArea, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function NewTaskModal({ isOpen, onClose, onSuccess, initialData }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    columnId: "todo",
    priority: "MÉDIA",
  });

  React.useEffect(() => {
    setConfirmDelete(false);
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        columnId: initialData.columnId || "todo",
        priority: initialData.priority || "MÉDIA",
      });
    } else {
      setFormData({ title: "", description: "", columnId: "todo", priority: "MÉDIA" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/tasks";
      const method = initialData ? "PATCH" : "POST";
      const bodyParams = initialData ? { id: initialData.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyParams),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        if (!initialData) setFormData({ title: "", description: "", columnId: "todo", priority: "MÉDIA" });
      }
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch("/api/tasks", {
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
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Tarefa" : "Nova Tarefa"}>
      {confirmDelete ? (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Trash2 size={28} className="text-rose-500" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-lg font-bold text-white">Excluir Tarefa?</h3>
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
                {loading ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Tarefa")}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
