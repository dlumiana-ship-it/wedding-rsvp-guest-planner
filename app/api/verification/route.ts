import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Wedding chatbot knowledge base
const WEDDING_FAQ: Record<string, string> = {
  local: 'O casamento será realizado na Capela da Polana, situada na Avenida Julius Nyerere, Polana Cimento, Cidade de Maputo.',
  data: 'O grande dia é 29 de Agosto de 2026, a partir das 12:00 horas.',
  horario: 'A cerimónia começa às 12:00 horas. O recibo de casamento (recepção) seguirá imediatamente após.',
  traje: 'O dress code é Formal/Gala. Homens: fato completo ou smoking. Senhoras: vestido longo ou cocktail elegante. Cores sugeridas: tons de azul-marinho, dourado, branco e champagne.',
  presentes: 'O casal tem uma lista de presentes especial — Cotas da Lua de Mel! Cada cota contribui para experiências românticas em Paris. Pode escolher a sua cota directamente no site.',
  hotel: 'Hotéis recomendados próximos da sede: Hotel Polana Serena (5★), VIP Grand Hotel, e Southern Sun Maputo. Reserve com antecedência.',
  confirmacao: 'Para confirmar presença, preencha o formulário de RSVP nesta página com o seu nome, número de telefone e preferências alimentares.',
  estacionamento: 'Há estacionamento disponível nas instalações da Capela da Polana. Recomendamos chegar 30 minutos antes.',
  musica: 'Pode pedir uma música especial para o DJ através do formulário de RSVP. Pedidos serão considerados na playlist do evento.',
  alojamento: 'Se precisar de alojamento, indique no formulário de RSVP. A equipa cerimonial irá ajudá-lo a encontrar opções disponíveis.',
};

function generateWeddingResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('onde') || lower.includes('local') || lower.includes('lugar') || lower.includes('chapel') || lower.includes('polana')) {
    return WEDDING_FAQ.local;
  }
  if (lower.includes('quando') || lower.includes('data') || lower.includes('dia') || lower.includes('agosto')) {
    return WEDDING_FAQ.data;
  }
  if (lower.includes('horario') || lower.includes('horário') || lower.includes('hora') || lower.includes('começa')) {
    return WEDDING_FAQ.horario;
  }
  if (lower.includes('traje') || lower.includes('roupa') || lower.includes('vestir') || lower.includes('dress') || lower.includes('fato') || lower.includes('vestido')) {
    return WEDDING_FAQ.traje;
  }
  if (lower.includes('present') || lower.includes('oferta') || lower.includes('lua de mel') || lower.includes('cota')) {
    return WEDDING_FAQ.presentes;
  }
  if (lower.includes('hotel') || lower.includes('hospedagem') || lower.includes('hospedar') || lower.includes('alojamento')) {
    return WEDDING_FAQ.hotel;
  }
  if (lower.includes('confirm') || lower.includes('rsvp') || lower.includes('presença')) {
    return WEDDING_FAQ.confirmacao;
  }
  if (lower.includes('estacion') || lower.includes('carro') || lower.includes('parking')) {
    return WEDDING_FAQ.estacionamento;
  }
  if (lower.includes('música') || lower.includes('musica') || lower.includes('dj') || lower.includes('playlist')) {
    return WEDDING_FAQ.musica;
  }

  return 'Obrigado pela sua pergunta! 💖 Para informações detalhadas sobre o casamento de Lumiana e Vicente, consulte as secções desta página ou contacte directamente a equipa cerimonial. Estamos aqui para tornar este dia inesquecível para todos!';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, qrData } = body;

    // ── DATABASE RESET BACKUP PATH ──────────────────────────────────────
    if (prompt === 'reset_seed_db') {
      await prisma.companion.deleteMany();
      await prisma.wallMessage.deleteMany();
      await prisma.galleryPhoto.deleteMany();
      await prisma.table.deleteMany();
      await prisma.song.deleteMany();
      await prisma.guest.deleteMany();

      const defaultTables = [
        { id: 1, name: 'Mesa de Honra', capacity: 8, vip: true },
        { id: 2, name: 'Família da Noiva (L&V)', capacity: 6, vip: false },
        { id: 3, name: 'Família do Noivo', capacity: 6, vip: false },
        { id: 4, name: 'Padrinhos & Madrinhas', capacity: 6, vip: true },
        { id: 5, name: 'Amigos de Faculdade', capacity: 6, vip: false },
        { id: 6, name: 'Colegas de Trabalho', capacity: 6, vip: false },
      ];
      for (const t of defaultTables) {
        await prisma.table.create({ data: t });
      }

      const guestsToSeed = [
        {
          id: 'staff-id-uuid',
          name: 'Equipe Cerimonial',
          side: 'Bride',
          phone: '+258840000000',
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
          id: 'guest-1-uuid',
          name: 'Ana Beatriz Machava',
          side: 'Bride',
          phone: '+258840001111',
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
          phone: '+258840002222',
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
          phone: '+258840003333',
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
          phone: '+258840004444',
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
          phone: '+258840005555',
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
          phone: '+258840006666',
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
          phone: '+258840007777',
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
          phone: '+258840008888',
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
      for (const g of guestsToSeed) {
        await prisma.guest.create({ data: g });
      }

      await prisma.companion.create({
        data: {
          name: 'Mateus Machava',
          diet: 'Vegetariano',
          dietDetails: 'Não come peixe nem carne',
          guestId: 'guest-1-uuid',
        }
      });
      await prisma.companion.create({
        data: {
          name: 'Júlio Cossa',
          diet: 'Nenhuma',
          dietDetails: null,
          guestId: 'guest-2-uuid',
        }
      });

      await prisma.song.create({
        data: {
          title: 'Amor de Mel',
          artist: 'Lizha James',
          requestedBy: 'Ana Beatriz Machava',
          justification: 'A música favorita da noiva e das amigas de faculdade.',
          category: 'pista',
          position: 0,
          isPlayed: false,
          status: 'APPROVED',
        }
      });
      await prisma.song.create({
        data: {
          title: 'Perfect',
          artist: 'Ed Sheeran',
          requestedBy: 'Fátima Mutola Sitoe',
          justification: 'Perfeita para a dança dos noivos.',
          category: 'cerimonia',
          position: 0,
          isPlayed: false,
          status: 'APPROVED',
        }
      });

      await prisma.wallMessage.create({
        data: {
          guestName: 'Fátima Mutola Sitoe',
          guestId: 'guest-3-uuid',
          content: 'O vosso casamento será lindo! Desejo-vos amor eterno e cumplicidade.',
          approved: true,
        }
      });
      await prisma.wallMessage.create({
        data: {
          guestName: 'Ana Beatriz Machava',
          guestId: 'guest-1-uuid',
          content: 'Que dia feliz! O meu coração transborda de alegria por vocês dois. Viva os noivos!',
          approved: true,
        }
      });

      return NextResponse.json({ success: true, message: 'Base de dados restaurada com sucesso.' });
    }

    // ── QR CODE CHECK-IN PATH ──────────────────────────────────────────
    if (qrData) {
      const guest = await prisma.guest.findUnique({ where: { id: qrData } });

      if (!guest) {
        return NextResponse.json({
          success: false,
          message: 'Convite não encontrado. Por favor, fale com a equipa de recepção.',
        });
      }

      if (!guest.checkIn) {
        await prisma.guest.update({ where: { id: guest.id }, data: { checkIn: true } });
        const tableInfo = guest.tableId ? `Mesa ${guest.tableId}` : 'Mesa não alocada';
        return NextResponse.json({
          success: true,
          guest,
          message: `Bem-vindo(a), ${guest.name}! O seu check-in foi realizado com sucesso. Está na ${tableInfo}.`,
        });
      } else {
        const tableInfo = guest.tableId ? `${guest.tableId}` : 'Não alocada';
        return NextResponse.json({
          success: true,
          guest,
          message: `${guest.name}, o seu check-in já havia sido realizado. Seja bem-vindo(a) novamente! Mesa: ${tableInfo}`,
        });
      }
    }

    // ── CHATBOT PATH ───────────────────────────────────────────────────
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt ou QR Data é necessário' }, { status: 400 });
    }

    const responseText = generateWeddingResponse(prompt);
    return NextResponse.json({ success: true, message: responseText });

  } catch (error: any) {
    console.error('Error in verification API:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
