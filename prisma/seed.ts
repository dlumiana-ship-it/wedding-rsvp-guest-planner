import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const guests = [
  {
    id: 'staff-id-uuid',
    name: 'Equipe Cerimonial',
    side: 'Bride',
    phone: '+258840000000',   // PIN: 0000
    role: 'STAFF',
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: null,
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: null,
    checkIn: false,
    qrCode: null,
  },
  {
    id: randomUUID(),
    name: 'Ana Beatriz Machava',
    side: 'Bride',
    phone: '+258840001111',   // PIN: 1111
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Amor de Mel - Lizha James',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 1,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'Carlos Manuel Cossa',
    side: 'Groom',
    phone: '+258840002222',   // PIN: 2222
    role: 'GUEST',
    diet: 'Vegetariano',
    dietDetails: 'Sem carne vermelha',
    musicRequest: null,
    needsAccommodation: 'Sim',
    accommodationDetails: 'Precisa de quarto duplo',
    tableId: 2,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'Fátima Mutola Sitoe',
    side: 'Bride',
    phone: '+258840003333',   // PIN: 3333
    role: 'GUEST',
    diet: 'Sem Glúten',
    dietDetails: 'Celíaca severa',
    musicRequest: 'Perfect - Ed Sheeran',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 1,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'João Pedro Nhantumbo',
    side: 'Groom',
    phone: '+258840004444',   // PIN: 4444
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Jerusalema - Master KG',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 3,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'Maria da Graça Tembe',
    side: 'Bride',
    phone: '+258840005555',   // PIN: 5555
    role: 'GUEST',
    diet: 'Vegano',
    dietDetails: null,
    musicRequest: null,
    needsAccommodation: 'Sim',
    accommodationDetails: 'Precisa de quarto simples',
    tableId: 2,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'António Bila Machel',
    side: 'Groom',
    phone: '+258840006666',   // PIN: 6666
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Sugarcane - Camila Cabello',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 4,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'Esperança Zita Mondlane',
    side: 'Bride',
    phone: '+258840007777',   // PIN: 7777
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Falling - Trevor Daniel',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 3,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'Rui Alberto Guambe',
    side: 'Groom',
    phone: '+258840008888',   // PIN: 8888
    role: 'GUEST',
    diet: 'Sem Glúten',
    dietDetails: null,
    musicRequest: null,
    needsAccommodation: 'Sim',
    accommodationDetails: null,
    tableId: 4,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'Sónia Lurdes Cune',
    side: 'Bride',
    phone: '+258840009999',   // PIN: 9999
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Ke Star - Focalistic',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 5,
    checkIn: false,
    qrCode: randomUUID(),
  },
  {
    id: randomUUID(),
    name: 'Domingos Valentim Nkosi',
    side: 'Groom',
    phone: '+258840001234',   // PIN: 1234
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Can\'t Help Falling in Love - Elvis',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 5,
    checkIn: false,
    qrCode: randomUUID(),
  },
];

async function main() {
  console.log('🌸 Seeding wedding guest database...\n');

  // Clear existing guests first
  await prisma.guest.deleteMany();
  console.log('🗑  Cleared existing guests.\n');

  for (const guest of guests) {
    await prisma.guest.create({ data: guest });
    const pin = guest.phone.slice(-4);
    console.log(`✅ ${guest.name.padEnd(30)} | Mesa ${guest.tableId} | PIN: ${pin}`);
  }

  console.log(`\n🎉 Seeded ${guests.length} guests successfully!`);
  console.log('\n📋 Test Credentials (last 4 digits of phone):');
  guests.forEach(g => {
    console.log(`   ${g.phone.slice(-4)}  →  ${g.name}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
