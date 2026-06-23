import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  const [total, active, archived, byOpportunityStage, byRegion, byRepresentative] = await Promise.all([
    prisma.laboratory.count(),
    prisma.laboratory.count({ where: { state: 'ACTIVE' } }),
    prisma.laboratory.count({ where: { state: 'ARCHIVED' } }),
    prisma.laboratory.groupBy({ by: ['opportunityStage'], _count: { _all: true } }),
    prisma.laboratory.groupBy({ by: ['region'], _count: { _all: true }, where: { region: { not: null } } }),
    prisma.laboratory.groupBy({ by: ['representativeId'], _count: { _all: true }, where: { representativeId: { not: null } } }),
  ]);

  const reps = await prisma.representative.findMany();

  return NextResponse.json({
    total,
    active,
    archived,
    byOpportunityStage,
    byRegion,
    byRepresentative: byRepresentative.map(item => ({
      representative: reps.find(r => r.id === item.representativeId)?.name || 'Unassigned',
      count: item._count._all,
    })),
  });
}
