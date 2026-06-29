const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all sample data...');

  // Delete in reverse dependency order to avoid FK constraint errors
  await prisma.auditLog.deleteMany({});
  await prisma.marginSchedule.deleteMany({});
  await prisma.loanSchedule.deleteMany({});
  await prisma.cashSchedule.deleteMany({});
  await prisma.labourPayment.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.unitType.deleteMany({});
  await prisma.userProjectAccess.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});

  // Remove demo users (staff, developer) – keep only admin
  await prisma.user.deleteMany({ where: { email: { not: 'admin' } } });

  console.log('✅ All sample data cleared');

  // ── Ensure Admin user exists ──────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin12341234', 12);
  await prisma.user.upsert({
    where: { email: 'admin' },
    update: { passwordHash: adminHash },
    create: { name: 'Admin User', email: 'admin', passwordHash: adminHash, role: 'ADMIN' }
  });

  console.log('\n🎉 Database is fresh and ready!\n');
  console.log('Login credentials:');
  console.log('  Admin email: admin');
  console.log('  Admin password: Admin12341234\n');
  console.log('You can now:');
  console.log('  1. Login and go to Projects → Add New Mandate');
  console.log('  2. Open the project → Add Unit or Bulk Generate');
  console.log('  3. Or go to Units → Import CSV to import inventory in bulk\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
