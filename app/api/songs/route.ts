import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all songs ordered by position
export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      orderBy: [{ category: 'asc' }, { position: 'asc' }],
    });
    return NextResponse.json({ success: true, songs });
  } catch (error: any) {
    console.error('Error fetching songs:', error);
    return NextResponse.json({ error: 'Erro ao buscar músicas' }, { status: 500 });
  }
}

// POST: Add a new song
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, artist, requestedBy, category, duration, notes } = body;

    if (!title || !artist) {
      return NextResponse.json({ error: 'Título e artista são obrigatórios' }, { status: 400 });
    }

    // Get max position for this category
    const maxPos = await prisma.song.findFirst({
      where: { category: category || 'recepcao' },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const song = await prisma.song.create({
      data: {
        title: title.trim(),
        artist: artist.trim(),
        requestedBy: requestedBy?.trim() || null,
        category: category || 'recepcao',
        position: (maxPos?.position ?? -1) + 1,
        duration: duration?.trim() || null,
        notes: notes?.trim() || null,
        isPlayed: false,
      },
    });

    return NextResponse.json({ success: true, song });
  } catch (error: any) {
    console.error('Error creating song:', error);
    return NextResponse.json({ error: 'Erro ao adicionar música' }, { status: 500 });
  }
}

// PUT: Update a song (mark played, edit, reorder)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, artist, requestedBy, category, duration, notes, isPlayed, position } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da música é obrigatório' }, { status: 400 });
    }

    const song = await prisma.song.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(artist !== undefined && { artist: artist.trim() }),
        ...(requestedBy !== undefined && { requestedBy: requestedBy?.trim() || null }),
        ...(category !== undefined && { category }),
        ...(duration !== undefined && { duration: duration?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isPlayed !== undefined && { isPlayed }),
        ...(position !== undefined && { position }),
      },
    });

    return NextResponse.json({ success: true, song });
  } catch (error: any) {
    console.error('Error updating song:', error);
    return NextResponse.json({ error: 'Erro ao atualizar música' }, { status: 500 });
  }
}

// DELETE: Remove a song
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da música é obrigatório' }, { status: 400 });
    }

    await prisma.song.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Música removida' });
  } catch (error: any) {
    console.error('Error deleting song:', error);
    return NextResponse.json({ error: 'Erro ao remover música' }, { status: 500 });
  }
}
