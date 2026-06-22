import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { representativeSchema } from '@/app/lib/validators';

export async function GET() {
  const representatives = await prisma.representative.findMany({ orderBy: [{ name: 'asc' }] });
  return NextResponse.json(representatives);
}

export async function POST(req: NextRequest) {
  const data = representativeSchema.parse(await req.json());
  const representative = await prisma.representative.create({ data });
  return NextResponse.json(representative, { status: 201 });
}
