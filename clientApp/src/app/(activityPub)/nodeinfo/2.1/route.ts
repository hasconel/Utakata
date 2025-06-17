import {  NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({    // 最低限のnodeinfo
    
      "openRegistrations": false,
      "protocols": [
          "activitypub"
      ],
      "software": {
          "name": "utakata", // [a-z0-9-] のみ使用可能
          "version": "0.1.0"
      },
      "usage": {
          "users": {
              "total": 12 // 合計ユーザ数面倒だからマジックナンバー。後で正しい数字を取得する関数を作成する
          }
      },
      "services": {
          "inbound": [],
          "outbound": []
      },
      "metadata": {},
      "version": "2.1"
    
  });
}