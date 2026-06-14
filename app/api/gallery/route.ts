import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all photos
export async function GET(req: NextRequest) {
  try {
    const photos = await prisma.galleryPhoto.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, photos });
  } catch (error: any) {
    console.error('Error fetching gallery photos:', error);
    return NextResponse.json({ error: 'Erro ao buscar fotos da galeria' }, { status: 500 });
  }
}

// POST: Add a new photo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, uploadedBy, uploadedById } = body;

    if (!url || !uploadedBy) {
      return NextResponse.json({ error: 'URL da imagem e nome de quem enviou são obrigatórios' }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.create({
      data: {
        url,
        uploadedBy: uploadedBy.trim(),
        uploadedById: uploadedById || null,
        approved: false, // Must be approved by Bride & Groom
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (error: any) {
    console.error('Error uploading gallery photo:', error);
    return NextResponse.json({ error: 'Erro ao enviar foto' }, { status: 500 });
  }
}

// PUT: Approve / Reject gallery photo (Admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, approved } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da foto é obrigatório' }, { status: 400 });
    }

    const photo = await prisma.galleryPhoto.update({
      where: { id },
      data: { approved },
    });

    return NextResponse.json({ success: true, photo });
  } catch (error: any) {
    console.error('Error moderating photo:', error);
    return NextResponse.json({ error: 'Erro ao moderar foto' }, { status: 500 });
  }
}

// DELETE: Remove photo (Admin)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da foto é obrigatório' }, { status: 400 });
    }

    await prisma.galleryPhoto.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Foto removida com sucesso' });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Erro ao remover foto' }, { status: 500 });
  }
}
