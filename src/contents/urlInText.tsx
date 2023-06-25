const UrlInText = async ({ arg }: { arg: string }) => {
  if (arg == null) {
    console.log("null");
    return <></>;
  } else {
    const ResultURLs = arg.match(
      /https?:\/\/youtu\.be\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/
    );
    if (ResultURLs != null) {
      const ResultPath = new URL(ResultURLs[0]).pathname;
      return (
        <>
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${ResultPath}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </>
      );
    } else {
      const ResultURLs2 = arg.match(
        /https?:\/\/(?:www\.youtube\.com\/|youtube\.com\/)[\w!?/+\-_~;.,*=&@#$%()'[\]]+/
      );
      if (ResultURLs2 != null) {
        console.log(ResultURLs2);
        const ResultPath0 = new URL(ResultURLs2[0]).searchParams;
        console.log(ResultPath0);
        const ResultPath1 = ResultPath0.get("v");
        return (
          <>
            <iframe
              width="560"
              height="315"
              src={`https://www.youtube.com/embed/${ResultPath1}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </>
        );
      } else {
        try {
          console.log(arg);
          const TwitURLs = arg.match(
            /https?:\/\/twitter.com\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/
          );
          console.log(TwitURLs);
          if (TwitURLs != null) {
            const EncodeURI = encodeURIComponent(TwitURLs[0]);
            console.log(`https://publish.twitter.com/oembed?url=${EncodeURI}`);

            const result = await fetch(
              `https://publish.twitter.com/oembed?url=${EncodeURI}`,
              { mode: "cors" }
            ).then((res) => res.json());
            console.log(result);
            console.log(`https://publish.twitter.com/oembed?url=${EncodeURI}`);
            const htmlres = result.html.replace(
              /\\u[0-9A-Fa-f]{4}/g,
              (x: string, y: string) => {
                return String.fromCharCode(parseInt(y, 16));
              }
            );

            const resJson = {
              url: result.url,
              title: result.title,
              html: htmlres,
              width: result.width,
              height: result.height,
              type: result.type,
              cache_age: result.cache_age,
              provider_name: result.provider_name,
              provider_url: result.provider_url,
              version: result.version,
            };
            const div = document.createElement("div");
            div.innerHTML = resJson.html;
            return <>{div}</>;
          }
        } catch {}
      }
    }
  }
};
export default UrlInText;
