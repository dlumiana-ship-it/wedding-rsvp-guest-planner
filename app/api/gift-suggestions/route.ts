import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SUGGESTIONS = [
  { name: 'Micro-ondas', icon: '♨️', desc: 'Para facilitar o dia a dia.' },
  { name: 'Liquidificador', icon: '🍹', desc: 'Ideal para prepararmos sumos.' },
  { name: 'Faqueiro Completo', icon: '🍴', desc: 'Para servirmos os convidados com elegância.' },
  { name: 'Aparelho de Jantar', icon: '🍽️', desc: 'Conjunto de pratos e louça para as refeições.' },
  { name: 'Jogo de Panelas', icon: '🍲', desc: 'Essencial para começarmos a cozinhar juntos.' },
  { name: 'Ferro de Engomar', icon: '👔', desc: 'Um clássico indispensável para a nova casa.' },
  { name: 'Máquina de Café', icon: '☕', desc: 'Para começar as manhãs com muita energia.' },
  { name: 'Aspirador de Pó', icon: '🧹', desc: 'Para nos ajudar nas limpezas do lar.' },
  { name: 'Jogo de Toalhas', icon: '🛁', desc: 'Toalhas macias para uso diário.' },
];

// GET: Ler todas as sugestões (auto-seed se vazio)
export async function GET() {
  try {
    let suggestions = await prisma.giftSuggestion.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // Auto-seed: se a tabela estiver vazia, popular com os itens default
    if (suggestions.length === 0) {
      await prisma.giftSuggestion.createMany({
        data: DEFAULT_SUGGESTIONS,
      });
      suggestions = await prisma.giftSuggestion.findMany({
        orderBy: { createdAt: 'asc' }
      });
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching gift suggestions:', error);
    return NextResponse.json({ error: 'Erro ao buscar sugestões' }, { status: 500 });
  }
}

// POST: Criar uma nova sugestão
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, icon, desc } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do presente é obrigatório' }, { status: 400 });
    }

    const newSuggestion = await prisma.giftSuggestion.create({
      data: {
        name,
        icon: icon || '🎁',
        desc: desc || null,
      }
    });

    return NextResponse.json({ success: true, suggestion: newSuggestion });
  } catch (error) {
    console.error('Error creating gift suggestion:', error);
    return NextResponse.json({ error: 'Erro ao criar sugestão' }, { status: 500 });
  }
}

// DELETE: Remover uma sugestão
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da sugestão é obrigatório' }, { status: 400 });
    }

    await prisma.giftSuggestion.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Sugestão removida com sucesso' });
  } catch (error) {
    console.error('Error deleting gift suggestion:', error);
    return NextResponse.json({ error: 'Erro ao remover sugestão' }, { status: 500 });
  }
}
