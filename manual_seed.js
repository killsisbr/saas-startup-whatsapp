const { PrismaClient } = require('./src/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:D:/VENDA/saas-startup/prisma/dev.db'
    }
  }
});

const ADMIN_ORG_ID = "org_admin_180";
const ADMIN_USER_ID = "user_admin_180";

async function main() {
  console.log("Iniciando Seed Manual...");
  
  await prisma.message.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  
  const org = await prisma.organization.create({
    data: {
      id: ADMIN_ORG_ID,
      name: "Startup 180 Admin",
      slug: "admin",
    }
  });
  console.log("Organizacao criada:", org.id);

  // Hashing 123456
  const rawPass = "123456";
  const adminPassword = await bcrypt.hash(rawPass, 10);
  console.log("HASH GENERATED:", adminPassword);
  console.log("HASH LENGTH:", adminPassword.length);

  const admin = await prisma.user.create({
    data: {
      id: ADMIN_USER_ID,
      email: "admin@startup180.com",
      name: "Admin JARVIS",
      password: adminPassword,
      role: "ADMIN",
      organizationId: org.id,
      consentGiven: true,
    }
  });
  console.log("Usuario Admin criado:", admin.email, "ID:", admin.id);
}

main()
  .catch((e) => {
    console.error("Erro no Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
