import "linkify-plugin-mention";
import Linkify from "linkify-react";
import Link from "next/link";

const ReplaceJSX = (
  target: string,
  separator: string | RegExp,
  replaceto: JSX.Element,
  limit?: number
) => {
  const renderLink = ({
    attributes,
    content,
  }: {
    attributes: any;
    content: string;
  }) => {
    const { href, ...props } = attributes;
    return (
      <Link href={href} {...props}>
        {content}
      </Link>
    );
  };

  const options = {
    render: { mention: renderLink },
    formatHref: {
      mention: (href: string) => "/users/" + href,
    },
  };
  const separate = target.split(separator);
  const check = separate.length;
  if (check === 1) {
    return (
      <>
        <Linkify options={options}>{target}</Linkify>
      </>
    );
  } else {
    const result0 = separate.shift();
    if (result0 === undefined) {
      return <>{target}</>;
    } else {
      return (
        <div className="max-w-full break-all sm:break-words">
          <Linkify options={options}>{result0}</Linkify>
          {separate.map((d, index) => {
            return (
              <span key={index}>
                {limit ? (
                  <>{index < limit && <>{replaceto}</>}</>
                ) : (
                  <>{replaceto}</>
                )}
                <Linkify options={options}>{d}</Linkify>
              </span>
            );
          })}
        </div>
      );
    }
  }
};

export default ReplaceJSX;
