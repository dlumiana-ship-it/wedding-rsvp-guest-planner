const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'file:./dev.db' } } });

const INITIAL_GUESTS = [
  {
    id: 'g-1',
    name: 'Mariana Silva Santos',
    side: 'Bride',
    phone: '+5511999991234',
    role: 'GUEST',
    diet: 'Vegano',
    dietDetails: 'Alergia severa a amendoim',
    musicRequest: 'Marry You - Bruno Mars',
    needsAccommodation: 'Yes',
    accommodationDetails: 'Preciso de quarto duplo, irei com meu noivo.',
    tableId: 1,
    checkIn: false,
  },
  {
    id: 'g-2',
    name: 'Roberto de Souza',
    side: 'Groom',
    phone: '+5511988884321',
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: 'Dusk Till Dawn - Sia',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: 1,
    checkIn: false,
  },
  {
    id: 'g-3',
    name: 'Ana Beatriz Oliveira',
    side: 'Bride',
    phone: '+5511977775678',
    role: 'GUEST',
    diet: 'Sem Glúten',
    dietDetails: 'Intolerância celíaca',
    musicRequest: 'Love Story - Taylor Swift',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: 2,
    checkIn: false,
  },
  {
    id: 'g-4',
    name: 'Carlos Eduardo Nogueira',
    side: 'Groom',
    phone: '+5511966668765',
    role: 'GUEST',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: 'Sua Música Predileta - Amado Batista',
    needsAccommodation: 'Yes',
    accommodationDetails: 'Quarto individual simples.',
    tableId: 2,
    checkIn: false,
  },
  // Equipe de Organização
  {
    id: 'staff-1',
    name: 'Assessoria de Casamento',
    side: 'Bride',
    phone: '+5511900000000',
    role: 'STAFF',
    diet: 'Nenhuma',
    dietDetails: '',
    musicRequest: '',
    needsAccommodation: 'No',
    accommodationDetails: '',
    tableId: null,
    checkIn: true,
  }
];

async function main() {
  console.log('Start seeding...');
  await prisma.guest.deleteMany({});
  
  for (const g of INITIAL_GUESTS) {
    const guest = await prisma.guest.create({
      data: {
        id: g.id,
        name: g.name,
        side: g.side,
        phone: g.phone,
        role: g.role,
        diet: g.diet,
        dietDetails: g.dietDetails,
        musicRequest: g.musicRequest,
        needsAccommodation: g.needsAccommodation,
        accommodationDetails: g.accommodationDetails,
        tableId: g.tableId,
        checkIn: g.checkIn,
      }
    });
    console.log(`Created \${g.role} with id: \${guest.id} and phone ends in \${guest.phone.slice(-4)}`);
  }
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
