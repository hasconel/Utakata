const ReplaceJSX = (
  target: string,
  separator: string | RegExp,
  replaceto: JSX.Element,
  limit?: number
) => {
  const separate = target.split(separator);
  const check = separate.length;
  if (check === 1) {
    return <>{target}</>;
  } else {
    const result0 = separate.shift();
    if (result0 === undefined) {
      return <>{target}</>;
    } else {
      let count = 0;
      return (
        <>
          {result0}
          {separate.map((d) => {
            count += 1;
            return (
              <span key={count}>
                {limit ? (
                  <>{count < limit && <>{replaceto}</>}</>
                ) : (
                  <>{replaceto}</>
                )}
                {d}
              </span>
            );
          })}
        </>
      );
    }
  }
};

export default ReplaceJSX;
