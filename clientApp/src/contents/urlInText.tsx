import { log } from "console";

const UrlInText = ({ arg }: { arg: string }) => {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  if (arg == null) {
    return <></>;
  } else {
    const NiconicoURLs = arg.match(
      /https?:\/\/(((\w+\.)?nicovideo\.jp\/watch)|nico\.ms)\/sm[0-9]+/
    );
    if (NiconicoURLs != null) {
      let ResultPath = NiconicoURLs[0].split("/watch/")[1];
      if (ResultPath == null) {
        ResultPath = NiconicoURLs[0].split(".ms/")[1];
      }
      return (
        <>
          <iframe
            className="w-full aspect-video"
            src={`https://embed.nicovideo.jp/watch/${ResultPath}`}
            title="Niconico video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </>
      );
    } else {
      const ResultYouTubeURLs1 = arg.match(/https?:\/\/youtu\.be\/[\w-]+/);
      if (ResultYouTubeURLs1 != null) {
        const ResultPath = new URL(ResultYouTubeURLs1[0]).pathname;
        return (
          <>
            <iframe
              className="w-full aspect-video"
              src={`https://www.youtube.com/embed/${ResultPath}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </>
        );
      } else {
        const ResultYouTubeURLs2 = arg.match(
          /https?:\/\/(?:[/w]+\.youtube\.com|youtube\.com)\/watch\?v=[\w-]+/
        );
        if (ResultYouTubeURLs2 != null) {
          const ResultPath0 = new URL(ResultYouTubeURLs2[0]).searchParams;
          const ResultPath1 = ResultPath0.get("v");
          return (
            <>
              <iframe
                className="w-full  aspect-video"
                src={`https://www.youtube.com/embed/${ResultPath1}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </>
          );
        } else {
          const XURLs = arg.match(
            /https?:\/\/(twitter|x)\.com\/\w+\/status\/[0-9]{6,22}/
          );
          if (XURLs != null) {
            const ResultPath = new URL(XURLs[0]).pathname;
            return (
              <>
                <blockquote
                  data-theme={mql.matches ? "dark" : "light"}
                  className="twitter-tweet w-full"
                >
                  <a href={`https://twitter.com${ResultPath}`}></a>
                </blockquote>
                <script
                  async
                  src="https://platform.twitter.com/widgets.js"
                ></script>
              </>
            );
          } else {
            return <></>;
          }
        }
      }
    }
  }
};
export default UrlInText;
