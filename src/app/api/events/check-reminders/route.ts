import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/events/check-reminders
 * 
 * Cron-like endpoint: verifica eventos nas próximas 1 hora
 * que ainda não tiveram lembrete enviado. Envia mensagem
 * de confirmação para o lead associado e marca como enviado.
 */
export async function GET() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Buscar eventos que acontecem na próxima 1h sem reminder
    const upcomingEvents = await (prisma as any).event.findMany({
      where: {
        start: { gte: now, lte: oneHourFromNow },
        reminderSent: false,
      },
      include: { organization: true }
    });

    const results: any[] = [];

    for (const event of upcomingEvents) {
      // Extrair telefone do lead da descrição (padrão salesAiService)
      const phoneMatch = event.description?.match(/Fone:\s*(\S+)/);
      const leadPhone = phoneMatch ? phoneMatch[1] : null;

      if (leadPhone) {
        const lead = await (prisma as any).lead.findFirst({
          where: { phone: leadPhone }
        });

        if (lead) {
          const eventTime = new Date(event.start);
          const timeStr = `${eventTime.getHours()}:${String(eventTime.getMinutes()).padStart(2, '0')}`;
          const dateStr = `${eventTime.getDate()}/${eventTime.getMonth() + 1}`;

          const confirmationMessage = `Olá ${lead.name}! 👋 Passando para confirmar sua visita/reunião agendada para hoje (${dateStr}) às ${timeStr}. Podemos contar com sua presença? Responda SIM para confirmar ou entre em contato caso precise reagendar. 🚀`;

          await (prisma as any).message.create({
            data: {
              text: confirmationMessage,
              sender: "me",
              leadId: lead.id,
              organizationId: event.organizationId,
            }
          });

          await (prisma as any).event.update({
            where: { id: event.id },
            data: { reminderSent: true }
          });

          results.push({
            eventId: event.id,
            eventTitle: event.title,
            leadName: lead.name,
            leadPhone: lead.phone,
            scheduledTime: timeStr,
            status: "REMINDER_SENT"
          });

          console.log(`[Auto-Confirm] Lembrete enviado para ${lead.name} (${lead.phone}) - ${event.title} às ${timeStr}`);
        }
      } else {
        await (prisma as any).event.update({
          where: { id: event.id },
          data: { reminderSent: true }
        });
        results.push({ eventId: event.id, eventTitle: event.title, status: "NO_PHONE_SKIPPED" });
      }
    }

    return NextResponse.json({
      checked: upcomingEvents.length,
      sent: results.filter((r: any) => r.status === "REMINDER_SENT").length,
      skipped: results.filter((r: any) => r.status === "NO_PHONE_SKIPPED").length,
      results
    });

  } catch (error) {
    console.error("[Auto-Confirm] Erro ao verificar lembretes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
