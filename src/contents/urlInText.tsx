const UrlInText = ({ arg }: { arg: string }) => {
  if (arg == null) {
    console.log("null");
    return <></>;
  } else {
    let ResultArg = arg;
    const ResultURLs = arg.match(/https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/g);
    console.log(ResultURLs);
    if (ResultURLs === null) {
      console.log(ResultURLs);
      return <>{arg}</>;
    } else {
      ResultURLs.map((urlstring) => {
        ResultArg = ResultArg.replaceAll(
          urlstring,
          '<Link href="' + urlstring + '">' + urlstring + "</Link>"
        );
        console.log(ResultArg);
      });
      return <>{ResultArg}</>;
    }
  }
};
export default UrlInText;
