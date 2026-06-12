import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// GET: Fetch all guests
export async function GET(req: NextRequest) {
  try {
    const guests = await prisma.guest.findMany({
      orderBy: { timestamp: 'desc' }
    });
    return NextResponse.json({ success: true, guests });
  } catch (error: any) {
    console.error('Error fetching guests:', error);
    return NextResponse.json({ error: 'Erro ao buscar convidados' }, { status: 500 });
  }
}

// POST: Add a new guest manually (e.g. from organizer panel)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, side, diet, dietDetails, musicRequest, needsAccommodation, accommodationDetails, role } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 });
    }

    // Verify phone uniqueness
    const existing = await prisma.guest.findUnique({
      where: { phone }
    });

    if (existing) {
      return NextResponse.json({ error: 'Este número de telefone já está cadastrado' }, { status: 400 });
    }

    const guestId = `g-${Date.now()}`;
    const qrCode = randomUUID();

    const newGuest = await prisma.guest.create({
      data: {
        id: guestId,
        name,
        phone,
        side: side || 'Bride',
        role: role || 'GUEST',
        diet: diet || 'Nenhuma',
        dietDetails: dietDetails || null,
        musicRequest: musicRequest || null,
        needsAccommodation: needsAccommodation || 'No',
        accommodationDetails: accommodationDetails || null,
        tableId: null,
        checkIn: false,
        qrCode,
      }
    });

    return NextResponse.json({ success: true, guest: newGuest });
  } catch (error: any) {
    console.error('Error creating guest:', error);
    return NextResponse.json({ error: 'Erro ao criar convidado no banco' }, { status: 500 });
  }
}

// PUT: Update a guest (table assignment, RSVP confirm, check-in, etc.)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phone, side, diet, dietDetails, musicRequest, needsAccommodation, accommodationDetails, tableId, checkIn, role } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do convidado é obrigatório' }, { status: 400 });
    }

    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: {
        name,
        phone,
        side,
        role,
        diet,
        dietDetails,
        musicRequest,
        needsAccommodation,
        accommodationDetails,
        tableId: tableId !== undefined ? tableId : undefined,
        checkIn: checkIn !== undefined ? checkIn : undefined,
      }
    });

    return NextResponse.json({ success: true, guest: updatedGuest });
  } catch (error: any) {
    console.error('Error updating guest:', error);
    return NextResponse.json({ error: 'Erro ao atualizar convidado' }, { status: 500 });
  }
}

// DELETE: Delete a guest
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do convidado é obrigatório' }, { status: 400 });
    }

    await prisma.guest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Convidado removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting guest:', error);
    return NextResponse.json({ error: 'Erro ao remover convidado' }, { status: 500 });
  }
}
