import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { representativeSchema } from '@/app/lib/validators';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const data = representativeSchema.partial().parse(await req.json());
  const representative = await prisma.representative.update({ where: { id: params.id }, data });
  return NextResponse.json(representative);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.representative.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
