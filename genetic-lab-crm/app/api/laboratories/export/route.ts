import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { makeLaboratoriesWorkbook } from '@/app/lib/excel';

function whereFromParams(params: URLSearchParams): Prisma.LaboratoryWhereInput {
  const q = params.get('q')?.trim();
  const status = params.get('status') || undefined;
  const state = params.get('state') || undefined;
  const representativeId = params.get('representativeId') || undefined;
  const region = params.get('region')?.trim();
  const where: Prisma.LaboratoryWhereInput = {};
  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { telephone: { contains: q, mode: 'insensitive' } },
      { region: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
      { representative: { name: { contains: q, mode: 'insensitive' } } },
      { representative: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (status) where.status = status as any;
  if (state) where.state = state as any;
  if (representativeId) where.representativeId = representativeId;
  if (region) where.region = { contains: region, mode: 'insensitive' };
  return where;
}

export async function GET(req: NextRequest) {
  const rows = await prisma.laboratory.findMany({
    where: whereFromParams(req.nextUrl.searchParams),
    include: { representative: true },
    orderBy: [{ companyName: 'asc' }],
  });
  const buffer = makeLaboratoriesWorkbook(rows);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laboratory-report-${new Date().toISOString().slice(0,10)}.xlsx"`,
    },
  });
}
