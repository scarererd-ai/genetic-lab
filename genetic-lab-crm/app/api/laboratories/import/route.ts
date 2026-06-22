import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { parseWorkbook } from '@/app/lib/excel';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No Excel file uploaded.' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseWorkbook(buffer);

  let repCount = 0;
  let labCount = 0;
  for (const rep of parsed.representatives) {
    const existing = await prisma.representative.findFirst({
      where: { name: rep.name, email: rep.email || null, region: rep.region || null },
    });
    if (!existing) {
      await prisma.representative.create({ data: rep });
      repCount++;
    }
  }

  const reps = await prisma.representative.findMany();
  for (const lab of parsed.laboratories) {
    const matchingRep = reps.find(r => r.region && lab.region && lab.region.toLowerCase().includes(r.region.toLowerCase())) || null;
    await prisma.laboratory.create({
      data: {
        companyName: lab.companyName,
        contactName: lab.contactName,
        email: lab.email,
        telephone: lab.telephone,
        region: lab.region,
        status: lab.status || 'IN_COMMUNICATION',
        notes: lab.notes,
        representativeId: matchingRep?.id,
      },
    });
    labCount++;
  }

  return NextResponse.json({ importedRepresentatives: repCount, importedLaboratories: labCount });
}
