import { NextResponse } from 'next/server';
import { extractScanRows } from '@/lib/imports/scan';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ configured: false, reason: 'missing_file' }, { status: 400 });
  }

  const extraction = await extractScanRows(file);
  if (!extraction.configured) {
    return NextResponse.json(extraction, { status: 503 });
  }

  return NextResponse.json(extraction);
}
