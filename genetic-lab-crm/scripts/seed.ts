import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseWorkbook } from '../app/lib/excel';

const prisma = new PrismaClient();

async function main() {
  const file = path.join(process.cwd(), 'sample', 'Laboratory Summary.xlsx');
  const parsed = parseWorkbook(fs.readFileSync(file));
  for (const rep of parsed.representatives) {
    const existing = await prisma.representative.findFirst({ where: { name: rep.name, email: rep.email || null, region: rep.region || null } });
    if (!existing) await prisma.representative.create({ data: rep });
  }
  const reps = await prisma.representative.findMany();
  for (const lab of parsed.laboratories) {
    const matchingRep = reps.find(r => r.region && lab.region && lab.region.toLowerCase().includes(r.region.toLowerCase())) || null;
    await prisma.laboratory.create({ data: { ...lab, representativeId: matchingRep?.id } as any });
  }
}

main().finally(() => prisma.$disconnect());
