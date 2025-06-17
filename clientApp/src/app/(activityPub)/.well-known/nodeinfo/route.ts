import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    "links": [
      {
        "rel": "http://nodeinfo.diaspora.software/ns/schema/2.1",
        "href": "https://utakata.hasconel.com/nodeinfo/2.1"
      }
    ]
  });
}