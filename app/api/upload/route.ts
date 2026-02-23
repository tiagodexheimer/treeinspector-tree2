import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Get metadata from headers for folder organization
    const treeTag = request.headers.get('x-tree-tag');
    const osId = request.headers.get('x-os-id');

    let path = 'uploads/';
    if (treeTag) {
      path = `trees/${treeTag}/`;
    } else if (osId) {
      path = `os/${osId}/`;
    }

    // Upload to Vercel Blob with path prefix
    const blob = await put(`${path}${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
