import { Callout } from "@tremor/react";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";

export const AlertMessage = ({ message }: { message: string }) => {
  const TIMEOUT = 10000;
  const [showalert, setShowAlert] = useState(true);
  useEffect(() => {
    let timeout = setTimeout(() => setShowAlert(false), TIMEOUT);
    return () => {
      clearTimeout(timeout);
      setShowAlert(true);
    };
  }, []);

  return (
    <>
      {showalert && (
        <>
          <Callout
            title={message}
            icon={ExclamationCircleIcon}
            color="rose"
          ></Callout>
        </>
      )}
    </>
  );
};
