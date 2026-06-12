import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { digits } = await req.json();

    if (!digits || digits.length !== 4) {
      return NextResponse.json({ error: 'Forneça exatamente 4 dígitos numéricos' }, { status: 400 });
    }

    const guest = await prisma.guest.findFirst({
      where: {
        phone: {
          endsWith: digits,
        }
      }
    });

    if (guest) {
      return NextResponse.json({ success: true, user: guest });
    } else {
      return NextResponse.json({ error: 'Nenhum registro encontrado com este final de número' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Erro interno ao autenticar' }, { status: 500 });
  }
}
