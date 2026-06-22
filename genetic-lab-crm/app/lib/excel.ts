import * as XLSX from 'xlsx';
import { displayStatus } from './validators';

export type ImportRepresentative = { name: string; email?: string; region?: string };
export type ImportLaboratory = { companyName: string; contactName?: string; email?: string; telephone?: string; region?: string; status?: any; state?: any; notes?: string; representativeEmail?: string };

function cell(v: unknown) { return String(v ?? '').trim(); }

function normalizeStatus(value: string) {
  const v = value.toLowerCase().replace(/[^a-z]/g, '');
  if (v.includes('contract')) return 'CONTRACT_SIGNED';
  if (v.includes('nda')) return 'NDA_SIGNED';
  return 'IN_COMMUNICATION';
}

export function parseWorkbook(buffer: Buffer): { representatives: ImportRepresentative[]; laboratories: ImportLaboratory[] } {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const representatives: ImportRepresentative[] = [];
  const laboratories: ImportLaboratory[] = [];
  let mode: 'representatives' | 'laboratories' | null = null;

  for (const row of rows) {
    const a = cell(row[0]);
    const b = cell(row[1]);
    const c = cell(row[2]);
    const d = cell(row[3]);
    const e = cell(row[4]);
    const f = cell(row[5]);
    const joined = [a, b, c, d, e, f].join(' ').toLowerCase();

    if (joined.includes('representatives')) { mode = 'representatives'; continue; }
    if (joined.includes('laboratories') || joined.includes('independent labs')) { mode = 'laboratories'; continue; }
    if (!a && !b && !c && !d && !e && !f) continue;
    if (a.toLowerCase() === 'category' || a.toLowerCase().includes('thermo fisher')) continue;

    if (mode === 'representatives' && b && c) {
      representatives.push({ region: b, name: c, email: d || undefined });
    }
    if (mode === 'laboratories' && a && b) {
      laboratories.push({
        region: a,
        companyName: b,
        contactName: c || undefined,
        email: d || undefined,
        status: normalizeStatus(e),
        notes: f || undefined,
      });
    }
  }
  return { representatives, laboratories };
}

export function makeLaboratoriesWorkbook(rows: any[]) {
  const data = rows.map(row => ({
    'Laboratory/Company': row.companyName,
    'Contact Name': row.contactName ?? '',
    'Email': row.email ?? '',
    'Telephone': row.telephone ?? '',
    'Region / World Area': row.region ?? '',
    'Assigned Representative': row.representative?.name ?? '',
    'Representative Email': row.representative?.email ?? '',
    'Status': displayStatus(row.status),
    'Record State': row.state,
    'Details / Notes': row.notes ?? '',
    'Created': row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '',
    'Updated': row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '',
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laboratories');
  ws['!cols'] = [
    { wch: 28 }, { wch: 24 }, { wch: 32 }, { wch: 18 }, { wch: 22 }, { wch: 24 },
    { wch: 32 }, { wch: 20 }, { wch: 14 }, { wch: 45 }, { wch: 14 }, { wch: 14 }
  ];
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
