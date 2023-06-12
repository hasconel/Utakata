"use client";
import { Callout } from "@tremor/react";
import { useEffect, useState } from "react";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";

export const AlertMessage = ({ message }: { message: string }) => {
  const TIMEOUT = 5000;
  const [showalert, setShowAlert] = useState(true);
  useEffect(() => {
    let timeout = setTimeout(() => setShowAlert(false), TIMEOUT);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {showalert && (
        <>
          <Callout title={message} icon={ExclamationCircleIcon} color="rose">
            {message}
          </Callout>
        </>
      )}
    </>
  );
};
