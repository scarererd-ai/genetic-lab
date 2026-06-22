import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { laboratorySchema } from '@/app/lib/validators';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await req.json();
  const data = laboratorySchema.partial().parse(payload);
  const laboratory = await prisma.laboratory.update({
    where: { id: params.id },
    data: data as any,
    include: { representative: true },
  });
  return NextResponse.json(laboratory);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.laboratory.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
