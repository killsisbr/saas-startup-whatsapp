"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewCustomerModal({ isOpen, onClose, onSuccess }: NewCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    mrr: "",
    ltv: "",
    status: "ATIVO",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ name: "", domain: "", mrr: "", ltv: "", status: "ATIVO" });
      }
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Cliente">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome da Empresa"
          placeholder="Ex: Stellar Tech"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          label="Domínio/Site"
          placeholder="exemplo.com"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="MRR (R$)"
            type="number"
            placeholder="0.00"
            value={formData.mrr}
            onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
          />
          <Input
            label="LTV (R$)"
            type="number"
            placeholder="0.00"
            value={formData.ltv}
            onChange={(e) => setFormData({ ...formData, ltv: e.target.value })}
          />
        </div>
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { label: "Ativo", value: "ATIVO" },
            { label: "Em Pausa", value: "PAUSADO" },
            { label: "Churn", value: "CANCELADO" },
          ]}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="neon" disabled={loading}>
            {loading ? "Salvando..." : "Cadastrar Cliente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
