const UrlInText = ({ arg }: { arg: string }) => {
  if (arg == null) {
    console.log("null");
    return <></>;
  } else {
    const NiconicoURLs = arg.match(
      /https?:\/\/*nicovideo\.jp\/watch\/sm[0-9]+/
    );
    if (NiconicoURLs != null) {
      const ResultPath = NiconicoURLs[0].split("/watch/")[1];
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
      const ResultYouTubeURLs1 = arg.match(/https?:\/\/youtu\.be\/[\w]+/);
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
          /https?:\/\/(?:*\.youtube\.com|youtube\.com)\/watch?v=[\w]+/
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
          const TwitURLs = arg.match(
            /https?:\/\/twitter\.com\/\w+\/status\/[1-9]{6,22}/
          );
          console.log(TwitURLs);
          if (TwitURLs != null) {
            return (
              <>
                <blockquote className="twitter-tweet w-full">
                  <a href={TwitURLs[0]}></a>
                </blockquote>
                <script
                  async
                  src="https://platform.twitter.com/widgets.js"
                ></script>
              </>
            );
          }
        }
      }
    }
  }
};
export default UrlInText;
