const ReplaceJSX = (
  target: string,
  separator: string | RegExp,
  replaceto: JSX.Element,
  limit?: number
) => {
  const separate = target.split(separator, limit);
  const check = separate.length;
  if (check === 1) {
    return <>{target}</>;
  } else {
    const result0 = separate.shift();
    if (result0 === undefined) {
      return <>{target}</>;
    } else {
      return (
        <>
          {result0}
          {separate.map((d) => (
            <>
              {replaceto}
              {d}
            </>
          ))}
        </>
      );
    }
  }
};

export default ReplaceJSX;
