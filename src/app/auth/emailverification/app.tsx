import { AlertMessage } from "@/contents/alert";
import LoadingScreen from "@/contents/loading";
import { getLoginUser } from "@/feature/hooks";
import { Button, Card } from "@tremor/react";
import { redirect } from "next/navigation";
import { useState } from "react";

const EmailVerify = () => {
  const { data, isLoading, isError, error } = getLoginUser();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const params =(new URL(window.location.search)).searchParams
  
  }
  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {data ? (
            <Card className="max-w-4xl mx-auto mt-8 gap-6">
              {errorMessage && <AlertMessage message={errorMessage} />}
              You are {data.user.name},<br />
              Your Param is <br />
              {/*<>
                {resultarg()?.user && (
                  <>
                    <Button onClick={(e) => handleConfirm(e)}>認証</Button>
                  </>
                )}
                </>*/}
            </Card>
          ) : (
            <>{redirect("/")} </>
          )}
        </>
      )}
    </>
  );
};

export default EmailVerify;
