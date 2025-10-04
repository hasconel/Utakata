import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
    //application/xrd+xmlで返す
  return new NextResponse(
    `<?xml version="1.0"?>
   <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
       <Link rel="lrdd" type="application/xrd+xml" template="https://utakata.hasconel.com/.well-known/webfinger?resource={uri}" />
    </XRD>`,
    {
      headers: {
        'Content-Type': 'application/xrd+xml',
      },
    }
  );
}