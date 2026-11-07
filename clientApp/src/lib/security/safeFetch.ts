/**
 * 外部URLを安全に取得するための fetch 代替。
 * ユーザーやリモートサーバーから渡されたURLを取得するときは必ずこれを使う（SSRF対策）。
 *
 * - http / https 以外は拒否
 * - 内部ネットワーク宛て（プライベートIP、ループバック、メタデータサービスなど）は拒否
 * - IPの確認は接続時の名前解決で行うので、DNSリバインディングでもすり抜けられない
 * - リダイレクト先も毎回同じ確認をする
 * - サイズと時間に上限を設ける
 */
import { lookup as dnsLookup, type LookupAllOptions } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

export interface SafeFetchOptions {
  method?: "GET" | "POST";
  body?: string;
  headers?: Record<string, string>;
  /** 本文の上限（バイト） */
  maxBytes?: number;
  /** リダイレクトを含む全体の制限時間（ミリ秒） */
  timeoutMs?: number;
  maxRedirects?: number;
}

export interface SafeFetchResponse {
  ok: boolean;
  status: number;
  contentType: string;
  body: Buffer;
}

const blockedAddresses = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}
// IPv4射影アドレス（::ffff:a.b.c.d）は BlockList が上のIPv4ルールと照合するので、ここには書かない。
// ::ffff:0:0/96 を入れると、すべてのIPv4が一致してしまう。
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96], // NAT64
  ["2001:db8::", 32],
  ["2002::", 16], // 6to4
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) return true;
  return blockedAddresses.check(address, family === 6 ? "ipv6" : "ipv4");
}

/** 自サーバーのオリジン。連合の内部配信で必要なので内部IPでも許可する。 */
function isOwnOrigin(url: URL): boolean {
  const domain = process.env.NEXT_PUBLIC_DOMAIN;
  if (!domain) return false;
  try {
    return new URL(domain).origin === url.origin;
  } catch {
    return false;
  }
}

/** 接続時に呼ばれる名前解決。解決先に内部IPが1つでも含まれていれば接続させない。 */
const safeLookup = (hostname: string, options: any, callback: any) => {
  dnsLookup(hostname, { ...options, all: true } as LookupAllOptions, (err, addresses) => {
    if (err) return callback(err);
    if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
      return callback(new BlockedUrlError(`Blocked address for host: ${hostname}`));
    }
    if (options?.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
};

function requestOnce(
  url: URL,
  options: SafeFetchOptions,
  own: boolean,
  signal: AbortSignal
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  const maxBytes = options.maxBytes ?? 5 * 1024 * 1024;
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: options.method ?? "GET",
        signal,
        // 自動展開しないので、圧縮されないように明示する
        headers: { ...options.headers, "Accept-Encoding": "identity" },
        ...(own ? {} : { lookup: safeLookup }),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        // リダイレクトの本文は読まない
        if (status >= 300 && status < 400) {
          res.destroy();
          return resolve({ status, headers: res.headers, body: Buffer.alloc(0) });
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            res.destroy();
            return reject(new BlockedUrlError("Response too large"));
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.end(options.body);
  });
}

export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResponse> {
  const signal = AbortSignal.timeout(options.timeoutMs ?? 10_000);
  const maxRedirects = options.maxRedirects ?? 3;
  let current = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      throw new BlockedUrlError("Invalid URL");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new BlockedUrlError(`Unsupported protocol: ${url.protocol}`);
    }

    const own = isOwnOrigin(url);
    if (!own) {
      // IPリテラルは名前解決を通らないので、ここで確認する
      const host = url.hostname.replace(/^\[|\]$/g, "");
      if (isIP(host) !== 0 && isBlockedAddress(host)) {
        throw new BlockedUrlError(`Blocked address: ${host}`);
      }
    }

    const res = await requestOnce(url, options, own, signal);
    const location = res.headers.location;
    // POSTのリダイレクトは追わない（署名が宛先に結びついているため）
    if (options.method !== "POST" && res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, url).toString();
      continue;
    }
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      contentType: String(res.headers["content-type"] ?? ""),
      body: res.body,
    };
  }
  throw new BlockedUrlError("Too many redirects");
}
