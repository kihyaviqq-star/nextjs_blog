import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { updateRSSSourceSchema, validateBodySize, formatZodError, MAX_JSON_BODY_SIZE } from '@/lib/validations';
import { handleApiError } from '@/lib/error-handler';

// PUT - обновить источник (включить/выключить)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = user.role;
    if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    
    // 1. Проверка размера тела запроса
    const contentLength = request.headers.get('content-length');
    const sizeValidation = validateBodySize(contentLength);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
    }

    // 2. Парсинг и валидация тела запроса
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // 3. Проверка реального размера тела запроса
    const bodySize = JSON.stringify(body).length;
    if (bodySize > MAX_JSON_BODY_SIZE) {
      return NextResponse.json(
        { error: `Request body too large. Maximum size is ${MAX_JSON_BODY_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // 4. Валидация через Zod
    const validationResult = updateRSSSourceSchema.safeParse(body);
    if (!validationResult.success) {
      const formattedError = formatZodError(validationResult.error);
      return NextResponse.json(
        formattedError,
        { status: 400 }
      );
    }

    const { enabled, name, url } = validationResult.data;

    const updateData: any = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) {
      updateData.url = url.trim();
    }

    const source = await prisma.rSSSource.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ source });
  } catch (error: any) {
    // Handle Prisma specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }
    
    const { message, status } = handleApiError(error, "API PUT RSS source");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// DELETE - удалить источник
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = user.role;
    if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if source exists
    const source = await prisma.rSSSource.findUnique({
      where: { id }
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    await prisma.rSSSource.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const { message, status } = handleApiError(error, "API DELETE RSS source");
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
