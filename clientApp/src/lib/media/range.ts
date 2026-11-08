/**
 * Range（ファイルの一部だけ）の要求に応える。
 * 動画は、途中から再生したり、iPhone の Safari で再生したりするのに必要。
 */
export function rangeResponse(body: Uint8Array, request: Request, headers: Record<string, string>): Response {
  const size = body.byteLength;
  const range = request.headers.get("range");
  const base = { ...headers, "Accept-Ranges": "bytes" };
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) {
    return new Response(body as BodyInit, { status: 200, headers: { ...base, "Content-Length": String(size) } });
  }
  let start = match[1] ? Number(match[1]) : size - Number(match[2]);
  let end = match[1] && match[2] ? Number(match[2]) : size - 1;
  start = Math.max(0, start);
  end = Math.min(end, size - 1);
  if (start > end || start >= size) {
    return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
  }
  return new Response(body.subarray(start, end + 1) as BodyInit, {
    status: 206,
    headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
  });
}
