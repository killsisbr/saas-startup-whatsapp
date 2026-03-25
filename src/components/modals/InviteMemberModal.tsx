"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Form";
import Button from "@/components/ui/Button";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteMemberModal({ isOpen, onClose, onSuccess }: InviteMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "MEMBER",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Usaremos o endpoint /api/team que já criamos (ou vamos expandir para suportar POST)
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ name: "", email: "", role: "MEMBER" });
      }
    } catch (error) {
      console.error("Erro ao convidar membro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convidar Membro">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome Completo"
          placeholder="Ex: Roberto Silva"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          label="E-mail"
          type="email"
          placeholder="roberto@empresa.com"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Select
          label="Cargo / Permissão"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          options={[
            { label: "Membro", value: "MEMBER" },
            { label: "Administrador", value: "ADMIN" },
            { label: "Visualizador", value: "VIEWER" },
          ]}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="neon" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Convite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
