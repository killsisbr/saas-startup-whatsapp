import { prisma } from "./prisma";

export async function logAudit(userId: string, action: string, entity: string, entityId: string, details?: string) {
  try {
    console.log(`[AUDIT LOG] [${new Date().toISOString()}] User: ${userId} | Action: ${action} | Entity: ${entity} | ID: ${entityId} | Details: ${details || "N/A"}`);
    
    // Persistir no banco quando o model AuditLog estiver disponível
    // Por enquanto, loga no console com formato estruturado
    // TODO: Implementar persistência quando migrar para PostgreSQL
  } catch (error) {
    console.error("[AUDIT LOG ERROR]", error);
  }
}

export function checkRole(session: any, allowedRoles: string[]): boolean {
  if (!session?.user?.role) return false;
  return allowedRoles.includes(session.user.role);
}

export function requireAdmin(session: any): { error: string; status: number } | null {
  if (!session) return { error: "Não autorizado", status: 401 };
  if (session.user.role !== "ADMIN") return { error: "Permissão negada. Somente ADMINs.", status: 403 };
  return null;
}
