import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: All gift presenters ordered by position
export async function GET() {
  try {
    const presenters = await prisma.giftPresenter.findMany({
      orderBy: { position: 'asc' },
    });
    return NextResponse.json({ success: true, presenters });
  } catch (error: any) {
    console.error('Error fetching gift presenters:', error);
    return NextResponse.json({ error: 'Erro ao buscar sequência de presentes' }, { status: 500 });
  }
}

// POST: Add a new presenter to the sequence
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestName, guestId, note, group } = body;

    if (!guestName) {
      return NextResponse.json({ error: 'Nome do convidado é obrigatório' }, { status: 400 });
    }

    // Place at end of list
    const maxPos = await prisma.giftPresenter.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const presenter = await prisma.giftPresenter.create({
      data: {
        guestName: guestName.trim(),
        guestId: guestId || null,
        position: (maxPos?.position ?? -1) + 1,
        hasGiven: false,
        note: note?.trim() || null,
        group: group?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, presenter });
  } catch (error: any) {
    console.error('Error creating gift presenter:', error);
    return NextResponse.json({ error: 'Erro ao adicionar apresentador' }, { status: 500 });
  }
}

// PUT: Update presenter (mark given, reorder, edit)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, guestName, note, group, hasGiven, position } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const presenter = await prisma.giftPresenter.update({
      where: { id },
      data: {
        ...(guestName !== undefined && { guestName: guestName.trim() }),
        ...(note !== undefined && { note: note?.trim() || null }),
        ...(group !== undefined && { group: group?.trim() || null }),
        ...(hasGiven !== undefined && { hasGiven }),
        ...(position !== undefined && { position }),
      },
    });

    return NextResponse.json({ success: true, presenter });
  } catch (error: any) {
    console.error('Error updating gift presenter:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

// DELETE: Remove from sequence
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.giftPresenter.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Removido da sequência' });
  } catch (error: any) {
    console.error('Error deleting gift presenter:', error);
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 });
  }
}
