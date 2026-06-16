import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const defaultTables = [
  { id: 1, name: 'Mesa de Honra', capacity: 8, vip: true },
  { id: 2, name: 'Família da Noiva (L&V)', capacity: 6, vip: false },
  { id: 3, name: 'Família do Noivo', capacity: 6, vip: false },
  { id: 4, name: 'Padrinhos & Madrinhas', capacity: 6, vip: true },
  { id: 5, name: 'Amigos de Faculdade', capacity: 6, vip: false },
  { id: 6, name: 'Colegas de Trabalho', capacity: 6, vip: false },
];

const guests = [
  {
    id: 'staff-id-uuid',
    name: 'Equipe Cerimonial',
    side: 'Bride',
    phone: '+258840000120',   // PIN: 0120
    role: 'STAFF',
    status: 'CONFIRMED',
    vip: true,
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: null,
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: null,
    checkIn: false,
    qrCode: null,
  }
];

const initialSongs: any[] = [];
const initialCompanions: any[] = [];
const initialMessages: any[] = [];

async function main() {
  console.log('🌸 Seeding wedding guest database...\n');

  // Clear existing data in reverse dependency order
  await prisma.companion.deleteMany();
  await prisma.wallMessage.deleteMany();
  await prisma.galleryPhoto.deleteMany();
  await prisma.table.deleteMany();
  await prisma.song.deleteMany();
  await prisma.guest.deleteMany();
  console.log('🗑  Cleared all existing wedding database records.\n');

  // Seed Tables
  console.log('📋 Seeding Tables...');
  for (const table of defaultTables) {
    await prisma.table.create({ data: table });
    console.log(`   Table created: ${table.name} (Capacidade: ${table.capacity})`);
  }

  // Seed Guests
  console.log('\n👥 Seeding Guests...');
  for (const guest of guests) {
    await prisma.guest.create({ data: guest });
    const pin = guest.phone.slice(-4);
    console.log(`   Guest created: ${guest.name.padEnd(25)} | PIN: ${pin} | VIP: ${guest.vip}`);
  }

  // Seed Companions
  console.log('\n👫 Seeding Companions...');
  for (const comp of initialCompanions) {
    await prisma.companion.create({ data: comp });
    console.log(`   Companion created: ${comp.name} para o convidado ID: ${comp.guestId}`);
  }

  // Seed Songs
  console.log('\n🎵 Seeding Songs...');
  for (const song of initialSongs) {
    await prisma.song.create({ data: song });
    console.log(`   Song created: ${song.title} - ${song.artist}`);
  }

  // Seed Wall Messages
  console.log('\n💬 Seeding Wall Messages...');
  for (const msg of initialMessages) {
    await prisma.wallMessage.create({ data: msg });
    console.log(`   Message from ${msg.guestName} seeded`);
  }

  console.log(`\n🎉 Seeded successfully! Database is now World Class ready.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
