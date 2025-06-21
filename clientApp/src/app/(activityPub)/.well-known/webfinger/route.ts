import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // リクエストヘッダーはacct:user@hostの形式
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");
    const acct = resource?.split(":")[1];
    const host = resource?.split(":")[2];
    const protocol = headers().get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;

    if (!resource) {
        return NextResponse.json({ error: "Resource parameter is required" }, { status: 400 });
    }
  return NextResponse.json({
    "subject": resource,
    "links": [
      {
        "rel": "self",
        "type": "application/activity+json",
        "href": `${baseUrl}/users/${acct}`
      }
    ]
  },{headers: {
    'Content-Type': 'application/jrd+json; charset=utf-8',
  }});
}