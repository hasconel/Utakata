import { AlertMessage } from "@/contents/alert";
import LoadingScreen from "@/contents/loading";
import api from "@/feature/api";
import { GetLoginUser } from "@/feature/hooks";
import { Button, Card } from "@tremor/react";
import { redirect, useSearchParams } from "next/navigation";
import { useState } from "react";

const EmailVerify = () => {
  const { data, isLoading, isError, error } = GetLoginUser();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [succesMessage, setSuccesMessage] = useState<string>("");
  const params = useSearchParams();
  const userID = params.get("userId");
  const secret = params.get("secret");

  const handleEmailVerificationComfirm = async () => {
    if (!data?.user.emailVerification) {
      try {
        if (userID === data?.user.$id && typeof secret === "string") {
          await api.provider().account.updateVerification(userID, secret);
          setSuccesMessage("認証に成功しました");
        } else {
          setErrorMessage("パラメーターが不正です");
        }
      } catch {
        (e: any) => {
          if (e.response?.message) {
            setErrorMessage(e.response.message);
          } else {
            setErrorMessage("Error");
          }
        };
      }
    } else {
      setErrorMessage("認証済みユーザー");
    }
  };

  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {data ? (
            <Card className="max-w-4xl mx-auto mt-8 gap-6">
              {succesMessage && (
                <div className="w-full  rounded bg-blue-500">
                  {succesMessage}
                </div>
              )}
              {errorMessage && <AlertMessage message={errorMessage} />}
              {!data.user.emailVerification ? (
                <Button onClick={handleEmailVerificationComfirm}>認証</Button>
              ) : (
                <>すでに認証されています。</>
              )}
            </Card>
          ) : (
            <>未ログインのためリダイレクトします {redirect("/")} </>
          )}
        </>
      )}
    </>
  );
};

export default EmailVerify;
