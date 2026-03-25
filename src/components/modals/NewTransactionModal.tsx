"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTransactionModal({ isOpen, onClose, onSuccess }: NewTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "INCOME",
    category: "Mensalidade",
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({
          description: "",
          amount: "",
          type: "INCOME",
          category: "Mensalidade",
          date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error("Erro ao criar transação:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Descrição"
          placeholder="Ex: Assinatura Enterprise"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <Input
            label="Data"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { label: "Receita", value: "INCOME" },
              { label: "Despesa", value: "EXPENSE" },
            ]}
          />
          <Select
            label="Categoria"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { label: "Mensalidade", value: "Mensalidade" },
              { label: "Consultoria", value: "Consultoria" },
              { label: "Marketing", value: "Marketing" },
              { label: "Infraestrutura", value: "Infraestrutura" },
              { label: "Outros", value: "Outros" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="neon" disabled={loading}>
            {loading ? "Processando..." : "Registrar Transação"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
