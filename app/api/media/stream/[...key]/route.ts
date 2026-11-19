import { NextRequest, NextResponse } from 'next/server';
import { getR2ObjectStream, verifyR2ObjectExists } from '@/lib/r2';
import { isValidR2StreamKey, normalizeHttpRangeHeader } from '@/lib/video-stream';

/**
 * HEAD /api/media/stream/[...key]
 * Allows browser `<video>` elements to probe `Accept-Ranges: bytes` and `Content-Length`
 * before initiating chunked byte-range playback.
 */
export async function HEAD(
  _request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await context.params;
  const objectKey = segments.map((s) => decodeURIComponent(s)).join('/');

  if (!isValidR2StreamKey(objectKey)) {
    return new NextResponse(null, { status: 400 });
  }

  const head = await verifyR2ObjectExists(objectKey);
  if (!head.exists) {
    return new NextResponse(null, { status: 404 });
  }

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Content-Type': head.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  if (head.contentLength !== undefined) {
    headers.set('Content-Length', String(head.contentLength));
  }
  if (head.etag) {
    headers.set('ETag', head.etag);
  }

  return new NextResponse(null, { status: 200, headers });
}

/**
 * GET /api/media/stream/[...key]
 * Streams media (MP4/WebM videos, images, PDFs) from Cloudflare R2 with full
 * HTTP 206 Partial Content (`Range: bytes=start-end`) support for instant video seeking.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await context.params;
  const objectKey = segments.map((s) => decodeURIComponent(s)).join('/');

  if (!isValidR2StreamKey(objectKey)) {
    return NextResponse.json({ error: 'Invalid media key.' }, { status: 400 });
  }

  const rawRange = request.headers.get('range');
  const rangeHeader = normalizeHttpRangeHeader(rawRange);
  if (rawRange && !rangeHeader) {
    return new NextResponse(null, { status: 416 });
  }

  const obj = await getR2ObjectStream(objectKey, rangeHeader);
  if (!obj) {
    return NextResponse.json({ error: 'Media asset not found in R2.' }, { status: 404 });
  }

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Content-Type': obj.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  if (obj.contentLength !== undefined) {
    headers.set('Content-Length', String(obj.contentLength));
  }
  if (obj.contentRange) {
    headers.set('Content-Range', obj.contentRange);
  }
  if (obj.etag) {
    headers.set('ETag', obj.etag);
  }

  return new NextResponse(obj.stream, {
    status: obj.isPartial ? 206 : 200,
    headers,
  });
}
