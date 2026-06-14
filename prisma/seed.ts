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
    phone: '+258840000000',   // PIN: 0000
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
  },
  {
    id: 'dj-id-uuid',
    name: 'DJ Oficial',
    side: 'Bride',
    phone: '+258840008080',   // PIN: 8080
    role: 'DJ',
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
  },
  {
    id: 'mc-id-uuid',
    name: 'Mestre de Cerimónias',
    side: 'Bride',
    phone: '+258840009090',   // PIN: 9090
    role: 'MC',
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
  },
  {
    id: 'photo-id-uuid',
    name: 'Equipa de Fotografia',
    side: 'Bride',
    phone: '+258840007070',   // PIN: 7070
    role: 'PHOTOGRAPHER',
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
  },
  {
    id: 'guest-1-uuid',
    name: 'Ana Beatriz Machava',
    side: 'Bride',
    phone: '+258840001111',   // PIN: 1111
    role: 'GUEST',
    status: 'CONFIRMED',
    vip: true,
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Amor de Mel - Lizha James',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 1,
    checkIn: false,
    qrCode: 'qr-guest-1',
    rsvpMessage: 'Mal posso esperar para ver a noiva mais linda entrar na igreja! Contem comigo!',
  },
  {
    id: 'guest-2-uuid',
    name: 'Carlos Manuel Cossa',
    side: 'Groom',
    phone: '+258840002222',   // PIN: 2222
    role: 'GUEST',
    status: 'CONFIRMED',
    vip: false,
    diet: 'Vegetariano',
    dietDetails: 'Sem carne vermelha',
    musicRequest: 'Dusk Till Dawn - Sia',
    needsAccommodation: 'Sim',
    accommodationDetails: 'Precisa de quarto duplo perto do local',
    tableId: 3,
    checkIn: false,
    qrCode: 'qr-guest-2',
    rsvpMessage: 'Felicidades aos noivos! Será uma honra celebrar este dia incrível convosco.',
  },
  {
    id: 'guest-3-uuid',
    name: 'Fátima Mutola Sitoe',
    side: 'Bride',
    phone: '+258840003333',   // PIN: 3333
    role: 'GUEST',
    status: 'CONFIRMED',
    vip: true,
    diet: 'Sem Glúten',
    dietDetails: 'Celíaca severa',
    musicRequest: 'Perfect - Ed Sheeran',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 1,
    checkIn: false,
    qrCode: 'qr-guest-3',
    rsvpMessage: 'Que alegria ver a minha querida Lumiana casar! Que Deus abençoe este lar.',
  },
  {
    id: 'guest-4-uuid',
    name: 'João Pedro Nhantumbo',
    side: 'Groom',
    phone: '+258840004444',   // PIN: 4444
    role: 'GUEST',
    status: 'CONFIRMED',
    vip: false,
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Jerusalema - Master KG',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 3,
    checkIn: false,
    qrCode: 'qr-guest-4',
  },
  {
    id: 'guest-5-uuid',
    name: 'Maria da Graça Tembe',
    side: 'Bride',
    phone: '+258840005555',   // PIN: 5555
    role: 'GUEST',
    status: 'CONFIRMED',
    vip: false,
    diet: 'Vegano',
    dietDetails: null,
    musicRequest: 'A Thousand Years - Christina Perri',
    needsAccommodation: 'Sim',
    accommodationDetails: 'Procura quarto simples para 1 pessoa',
    tableId: 2,
    checkIn: false,
    qrCode: 'qr-guest-5',
    rsvpMessage: 'O amor é paciente, o amor é bondoso. Que felicidade partilhar deste dia!',
  },
  {
    id: 'guest-6-uuid',
    name: 'António Bila Machel',
    side: 'Groom',
    phone: '+258840006666',   // PIN: 6666
    role: 'GUEST',
    status: 'CONFIRMED',
    vip: true,
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: 'Sugarcane - Camidoh',
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: 4,
    checkIn: false,
    qrCode: 'qr-guest-6',
  },
  {
    id: 'guest-7-uuid',
    name: 'Esperança Zita Mondlane',
    side: 'Bride',
    phone: '+258840007777',   // PIN: 7777
    role: 'GUEST',
    status: 'PENDING',
    vip: false,
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: null,
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: null,
    checkIn: false,
    qrCode: 'qr-guest-7',
  },
  {
    id: 'guest-8-uuid',
    name: 'Rui Alberto Guambe',
    side: 'Groom',
    phone: '+258840008888',   // PIN: 8888
    role: 'GUEST',
    status: 'DECLINED',
    vip: false,
    diet: 'Nenhuma',
    dietDetails: null,
    musicRequest: null,
    needsAccommodation: 'Não',
    accommodationDetails: null,
    tableId: null,
    checkIn: false,
    qrCode: 'qr-guest-8',
    rsvpMessage: 'Infelizmente estarei fora de Moçambique nesta data em trabalho, mas desejo-vos toda a felicidade do mundo!',
  }
];

const initialSongs = [
  {
    title: 'Amor de Mel',
    artist: 'Lizha James',
    requestedBy: 'Ana Beatriz Machava',
    justification: 'A música favorita da noiva e das amigas de faculdade.',
    category: 'pista',
    position: 0,
    isPlayed: false,
    status: 'APPROVED',
  },
  {
    title: 'Perfect',
    artist: 'Ed Sheeran',
    requestedBy: 'Fátima Mutola Sitoe',
    justification: 'Perfeita para a dança dos noivos.',
    category: 'cerimonia',
    position: 0,
    isPlayed: false,
    status: 'APPROVED',
  },
  {
    title: 'Jerusalema',
    artist: 'Master KG',
    requestedBy: 'João Pedro Nhantumbo',
    justification: 'Música para animar a pista e fazer toda a gente dançar.',
    category: 'pista',
    position: 1,
    isPlayed: false,
    status: 'APPROVED',
  },
];

const initialCompanions = [
  {
    name: 'Mateus Machava',
    diet: 'Vegetariano',
    dietDetails: 'Não come peixe nem carne',
    guestId: 'guest-1-uuid',
  },
  {
    name: 'Júlio Cossa',
    diet: 'Nenhuma',
    dietDetails: null,
    guestId: 'guest-2-uuid',
  }
];

const initialMessages = [
  {
    guestName: 'Fátima Mutola Sitoe',
    guestId: 'guest-3-uuid',
    content: 'O vosso casamento será lindo! Desejo-vos amor eterno e cumplicidade.',
    approved: true,
  },
  {
    guestName: 'Ana Beatriz Machava',
    guestId: 'guest-1-uuid',
    content: 'Que dia feliz! O meu coração transborda de alegria por vocês dois. Viva os noivos!',
    approved: true,
  },
];

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
