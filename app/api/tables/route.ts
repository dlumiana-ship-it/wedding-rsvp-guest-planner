import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all tables
export async function GET(req: NextRequest) {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ success: true, tables });
  } catch (error: any) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: 'Erro ao buscar mesas' }, { status: 500 });
  }
}

// POST: Add a new table
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, capacity, vip } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome da mesa é obrigatório' }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        name: name.trim(),
        capacity: Number(capacity) || 6,
        vip: vip || false,
      },
    });

    return NextResponse.json({ success: true, table });
  } catch (error: any) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Erro ao criar mesa' }, { status: 500 });
  }
}

// PUT: Update table details
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, capacity, vip } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da mesa é obrigatório' }, { status: 400 });
    }

    const table = await prisma.table.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(vip !== undefined && { vip }),
      },
    });

    return NextResponse.json({ success: true, table });
  } catch (error: any) {
    console.error('Error updating table:', error);
    return NextResponse.json({ error: 'Erro ao atualizar mesa' }, { status: 500 });
  }
}

// DELETE: Remove table
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da mesa é obrigatório' }, { status: 400 });
    }

    await prisma.table.delete({
      where: { id: Number(id) },
    });

    // Optional: Unassign guests from this table
    await prisma.guest.updateMany({
      where: { tableId: Number(id) },
      data: { tableId: null },
    });

    return NextResponse.json({ success: true, message: 'Mesa removida com sucesso' });
  } catch (error: any) {
    console.error('Error deleting table:', error);
    return NextResponse.json({ error: 'Erro ao remover mesa' }, { status: 500 });
  }
}
