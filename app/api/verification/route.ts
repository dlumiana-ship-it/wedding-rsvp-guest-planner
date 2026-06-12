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
