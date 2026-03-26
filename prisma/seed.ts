import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando Seed JARVIS 4.1...");
  
  // Limpar dados anteriores (opcional, mas bom para debug)
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  
  const org = await prisma.organization.create({
    data: {
      name: "Startup 180 Admin",
      slug: "admin",
    }
  });
  console.log("Organizacao criada:", org.id);

  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@startup180.com",
      name: "Admin JARVIS",
      password: adminPassword,
      role: "ADMIN",
      organizationId: org.id,
      consentGiven: true,
    }
  });
  console.log("Usuario Admin criado:", admin.email);

  const count = await prisma.user.count();
  console.log("Total de usuarios no banco:", count);
}

main()
  .catch((e) => {
    console.error("Erro no Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
