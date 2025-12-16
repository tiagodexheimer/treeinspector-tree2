import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // ignore if exists
    }

    // Generate unique name
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    // Return URL relative to public
    // Important: Android Emulator (10.0.2.2) needs an absolute URL to display it?
    // Actually, the Web Browser needs it.
    // We return a relative path or full URL. Ideally full URL if we know host.
    // For simple usage: return `/uploads/${uniqueName}`.
    // Page.tsx will display it.

    return NextResponse.json({ url: `/uploads/${uniqueName}` });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
