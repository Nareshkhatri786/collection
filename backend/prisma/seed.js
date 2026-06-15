const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ────────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const staffHash = await bcrypt.hash('Staff@123', 12);
  const devHash = await bcrypt.hash('Dev@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@propertysystem.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@propertysystem.com', passwordHash: adminHash, role: 'ADMIN' }
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@propertysystem.com' },
    update: {},
    create: { name: 'Priya Mehta', email: 'staff@propertysystem.com', passwordHash: staffHash, role: 'STAFF' }
  });

  const developer = await prisma.user.upsert({
    where: { email: 'developer@propertysystem.com' },
    update: {},
    create: { name: 'Mehta Constructions', email: 'developer@propertysystem.com', passwordHash: devHash, role: 'DEVELOPER' }
  });

  console.log('✅ Users created');

  // ── Project ───────────────────────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Green Valley Residency',
      developerName: 'Mehta Constructions',
      location: 'Satellite, Ahmedabad',
      status: 'UNDER_CONSTRUCTION',
      maintenanceDeposit: 50000,
      possessionDate: new Date('2026-03-31'),
      developerUserId: developer.id
    }
  });

  // ── Unit Types ────────────────────────────────────────────────────────────────
  const type1bhk = await prisma.unitType.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, projectId: project.id, typeName: '1 BHK', basePrice: 3500000 }
  });

  const type2bhk = await prisma.unitType.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, projectId: project.id, typeName: '2 BHK', basePrice: 4500000 }
  });

  console.log('✅ Project and unit types created');

  // ── Assign Staff & Developer to Project ───────────────────────────────────────
  await prisma.userProjectAccess.upsert({
    where: { userId_projectId: { userId: staff.id, projectId: project.id } },
    update: {},
    create: { userId: staff.id, projectId: project.id }
  });

  console.log('✅ Project access assigned');

  // ── Units ─────────────────────────────────────────────────────────────────────
  const unitData = [
    { unitNumber: 'A-101', unitTypeId: type1bhk.id, floor: 1, carpetArea: 650 },
    { unitNumber: 'A-102', unitTypeId: type1bhk.id, floor: 1, carpetArea: 650 },
    { unitNumber: 'A-201', unitTypeId: type1bhk.id, floor: 2, carpetArea: 650 },
    { unitNumber: 'A-202', unitTypeId: type1bhk.id, floor: 2, carpetArea: 650 },
    { unitNumber: 'B-101', unitTypeId: type2bhk.id, floor: 1, carpetArea: 1100 },
    { unitNumber: 'B-102', unitTypeId: type2bhk.id, floor: 1, carpetArea: 1100 },
    { unitNumber: 'B-201', unitTypeId: type2bhk.id, floor: 2, carpetArea: 1150 },
    { unitNumber: 'B-202', unitTypeId: type2bhk.id, floor: 2, carpetArea: 1150 },
    { unitNumber: 'B-203', unitTypeId: type2bhk.id, floor: 2, carpetArea: 1150 },
    { unitNumber: 'B-204', unitTypeId: type2bhk.id, floor: 2, carpetArea: 1150 }
  ];

  const units = {};
  for (const u of unitData) {
    const unit = await prisma.unit.upsert({
      where: { projectId_unitNumber: { projectId: project.id, unitNumber: u.unitNumber } },
      update: {},
      create: { projectId: project.id, ...u }
    });
    units[u.unitNumber] = unit;
  }

  console.log('✅ Units created');

  // ── Clients ───────────────────────────────────────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, name: 'Ramesh Hasmukh Shah', mobile: '9825012345',
      email: 'ramesh@gmail.com', pan: 'ABCPS1234X',
      aadhar: 'XXXX-XXXX-1234', address: '123, Satellite, Ahmedabad'
    }
  });

  const client2 = await prisma.client.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2, name: 'Priya Rajesh Patel', mobile: '9824056789',
      email: 'priya.patel@gmail.com', pan: 'BCDPT5678Y',
      address: '45, Bodakdev, Ahmedabad'
    }
  });

  console.log('✅ Clients created');

  // ── Deal for B-204 (Ramesh Shah) ──────────────────────────────────────────────
  // Financials: Deal=445000, Stamp=26255, GST=4450 (1%), Maintenance=50000
  // SubTotal = 445000+26255+4450+50000 = 525705
  // OwnMargin = 135705, Loan = 390000 (adjusted so margin+loan=subTotal)
  const existingDeal = await prisma.deal.findUnique({ where: { unitId: units['B-204'].id } });
  if (!existingDeal) {
    const deal = await prisma.deal.create({
      data: {
        projectId: project.id,
        unitId: units['B-204'].id,
        clientId: client1.id,
        dealAmount: 445000,
        stampDuty: 26255,
        gstRate: 1,
        gstAmount: 4450,
        maintenanceDeposit: 50000,
        subTotal: 525705,
        ownMargin: 135705,
        loanAmount: 390000,
        loanBank: 'SBI',
        extraWork: 21500,
        otherCharges: 3000,
        totalCash: 24500,
        possessionDate: new Date('2026-03-31'),
        registryTargetDate: new Date('2026-04-30'),
        createdBy: admin.id,
        marginSchedule: {
          create: [
            { description: 'Booking Amount', dueDate: new Date('2025-06-15'), amount: 10000 },
            { description: 'Agreement Amount', dueDate: new Date('2025-06-30'), amount: 15000 },
            { description: 'Slab 1 — Foundation', dueDate: new Date('2025-08-15'), amount: 10000 },
            { description: 'Slab 2 — 1st Floor', dueDate: new Date('2025-10-15'), amount: 10000 },
            { description: 'Slab 3 — 2nd Floor', dueDate: new Date('2025-12-15'), amount: 10000 },
            { description: 'Maintenance Deposit', dueDate: new Date('2026-03-01'), amount: 50000 },
            { description: 'Stamp & Registration + GST', dueDate: new Date('2026-04-30'), amount: 30705 }
          ]
        },
        loanSchedule: {
          create: [
            { stageDescription: '1st Disbursement', expectedDate: new Date('2025-07-01'), amount: 150000 },
            { stageDescription: '2nd Disbursement', expectedDate: new Date('2025-10-01'), amount: 150000 },
            { stageDescription: '3rd Disbursement', expectedDate: new Date('2026-01-01'), amount: 90000 }
          ]
        },
        cashSchedule: {
          create: [
            { description: 'Advance Payment', dueDate: new Date('2025-06-20'), amount: 8000 },
            { description: 'Mid Stage', dueDate: new Date('2025-11-15'), amount: 8000 },
            { description: 'Final + Other Charges', dueDate: new Date('2026-02-01'), amount: 8500 }
          ]
        }
      }
    });

    // Mark unit as BOOKED
    await prisma.unit.update({ where: { id: units['B-204'].id }, data: { status: 'BOOKED' } });

    // Mark first installment as received
    const firstInstallment = await prisma.marginSchedule.findFirst({ where: { dealId: deal.id }, orderBy: { dueDate: 'asc' } });
    if (firstInstallment) {
      await prisma.marginSchedule.update({
        where: { id: firstInstallment.id },
        data: { status: 'RECEIVED', receivedDate: new Date('2025-06-15'), receivedAmount: 10000, paymentMode: 'CHEQUE', receiptNumber: 'RCP-001' }
      });
    }

    console.log('✅ Sample deal for B-204 created');
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:     admin@propertysystem.com  /  Admin@123');
  console.log('  Staff:     staff@propertysystem.com  /  Staff@123');
  console.log('  Developer: developer@propertysystem.com  /  Dev@123\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
