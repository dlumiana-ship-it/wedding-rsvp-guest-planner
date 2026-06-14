import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all messages
export async function GET(req: NextRequest) {
  try {
    const messages = await prisma.wallMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Error fetching wall messages:', error);
    return NextResponse.json({ error: 'Erro ao buscar mensagens do mural' }, { status: 500 });
  }
}

// POST: Add a message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestName, guestId, content } = body;

    if (!guestName || !content) {
      return NextResponse.json({ error: 'Nome e mensagem são obrigatórios' }, { status: 400 });
    }

    const message = await prisma.wallMessage.create({
      data: {
        guestName: guestName.trim(),
        guestId: guestId || null,
        content: content.trim(),
        approved: true, // Approved by default, noivos can hide/delete
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error creating wall message:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem para o mural' }, { status: 500 });
  }
}

// PUT: Approve / Reject / Hide message (Admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, approved } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da mensagem é obrigatório' }, { status: 400 });
    }

    const message = await prisma.wallMessage.update({
      where: { id },
      data: { approved },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error updating wall message:', error);
    return NextResponse.json({ error: 'Erro ao moderar mensagem' }, { status: 500 });
  }
}

// DELETE: Delete a message (Admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da mensagem é obrigatório' }, { status: 400 });
    }

    await prisma.wallMessage.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Mensagem removida com sucesso' });
  } catch (error: any) {
    console.error('Error deleting wall message:', error);
    return NextResponse.json({ error: 'Erro ao remover mensagem' }, { status: 500 });
  }
}
