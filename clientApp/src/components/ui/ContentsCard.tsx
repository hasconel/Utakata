"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import LinkCard from "./LinkCard";

/** 1つの投稿に出すカード・埋め込みの数 */
const MAX_CARDS = 2;
const URL_PATTERN = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/g;
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/;

type Embed =
  | { kind: "youtube"; id: string }
  | { kind: "niconico"; id: string }
  | { kind: "x"; path: string }
  | { kind: "link"; url: string };

/** URLから、埋め込めるもの（YouTube / ニコニコ / X）か、ふつうのリンクかを判定する */
function toEmbed(raw: string): Embed {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "link", url: raw };
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (/^[\w-]{6,}$/.test(id)) return { kind: "youtube", id };
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && /^[\w-]{6,}$/.test(v)) return { kind: "youtube", id: v };
    const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
    if (m) return { kind: "youtube", id: m[1] };
  }
  if (host === "nicovideo.jp" || host === "sp.nicovideo.jp" || host === "nico.ms") {
    const m = url.pathname.match(/((?:sm|so|nm)\d+)/);
    if (m) return { kind: "niconico", id: m[1] };
  }
  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
    const m = url.pathname.match(/^\/\w+\/status\/\d{6,22}/);
    if (m) return { kind: "x", path: m[0] };
  }
  return { kind: "link", url: raw };
}

const frame = "aspect-video w-full rounded-xl border-0";
const allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

/** X の埋め込み。widgets.js は1回だけ読み込み、読み込み済みなら描き直してもらう */
function XEmbed({ path }: { path: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const render = () => (window as any).twttr?.widgets?.load(ref.current);
    if ((window as any).twttr?.widgets) return render();
    let script = document.getElementById("x-widgets") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "x-widgets";
      script.async = true;
      script.src = "https://platform.twitter.com/widgets.js";
      document.body.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => script?.removeEventListener("load", render);
  }, [path, resolvedTheme]);
  return (
    <div ref={ref} key={resolvedTheme} onClick={(e) => e.stopPropagation()}>
      <blockquote className="twitter-tweet" data-theme={resolvedTheme === "dark" ? "dark" : "light"} data-dnt="true">
        <a href={`https://twitter.com${path}`}>{`https://x.com${path}`}</a>
      </blockquote>
    </div>
  );
}

function EmbedView({ embed }: { embed: Embed }) {
  switch (embed.kind) {
    case "youtube":
      return (
        <iframe className={frame} src={`https://www.youtube-nocookie.com/embed/${embed.id}`} title="YouTube" allow={allow} allowFullScreen loading="lazy" />
      );
    case "niconico":
      return <iframe className={frame} src={`https://embed.nicovideo.jp/watch/${embed.id}`} title="ニコニコ動画" allow={allow} allowFullScreen loading="lazy" />;
    case "x":
      return <XEmbed path={embed.path} />;
    default:
      return <LinkCard url={embed.url} />;
  }
}

/**
 * 本文のURLを、埋め込みやリンクカードにする🫧（最初の2つまで）
 */
export default function ContentsCard({ arg }: { arg?: string | null }) {
  if (!arg) return null;
  const urls = [...new Set([...arg.matchAll(URL_PATTERN)].map((m) => m[0].replace(TRAILING_PUNCTUATION, "")))].slice(0, MAX_CARDS);
  if (urls.length === 0) return null;
  return (
    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
      {urls.map((url) => (
        <EmbedView key={url} embed={toEmbed(url)} />
      ))}
    </div>
  );
}
