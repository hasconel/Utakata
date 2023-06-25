import { GetLoginUser } from "@/feature/hooks";
import LoadingScreen from "@/contents/loading";
import { redirect } from "next/navigation";
import { Button, Card, Metric, TextInput } from "@tremor/react";
import { useState } from "react";
import ModalWindow from "@/contents/modal";
import { useForm } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import api from "@/feature/api";
import { AlertMessage } from "@/contents/alert";

const AccountSetting = () => {
  const [passwordHidden, setPasswordHidden] = useState(true);

  const { data, isLoading, isError, error } = GetLoginUser();
  const [emailModal, setEmailModal] = useState<boolean>(false);
  const [passwordModal, setPasswordModal] = useState<boolean>(false);
  const [SuccessMessage, setSuccesMessage] = useState("");

  type FormValues = {
    email: string;
    password: string;
    newPassword: string;
  };
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<FormValues>();

  const [emailErrorMessage, setEmailErrorMessage] = useState<string>("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string>("");
  const EmailUpdate = () => {
    const handleEmailUpdate = async (data: FormValues) => {
      try {
        await api.provider().account.updateEmail(data.email, data.password);
        await api
          .provider()
          .account.createVerification(
            "http://localhost:3000/auth/emailverification/"
          );
        setSuccesMessage(
          `\"${data.email}\"に認証メールを送信しました。メールに記載されたリンクをクリックし、認証を完了させてください。`
        );
        resetField("email");
        resetField("password");
        setEmailModal(false);
        setPasswordHidden(false);
      } catch (e) {
        if (typeof e === "object" && e != null) {
          if (
            "response" in e &&
            typeof e.response === "object" &&
            e.response != null
          ) {
            if (
              "message" in e.response &&
              e.response.message != null &&
              typeof e.response.message === "string"
            ) {
              setEmailErrorMessage(e.response.message);
            }
          }
        }
      }
    };

    return (
      <>
        {emailErrorMessage && <AlertMessage message={emailErrorMessage} />}
        <form onSubmit={handleSubmit(handleEmailUpdate)}>
          新しいメールアドレスを入力してください
          <TextInput
            type="text"
            placeholder="Email"
            error={errors.email?.type !== undefined}
            errorMessage={errors.email?.message}
            className="mb-2"
            {...register("email", {
              required: false,
              pattern: {
                value: /^\S+@\S+$/i,
                message: "メールアドレスの形式で入力してください",
              },
            })}
          />
          パスワードを入力してください
          <div className="relative">
            <TextInput
              type={passwordHidden ? "password" : "text"}
              placeholder="パスワード"
              className="mb-2"
              error={typeof errors.password?.type == "string"}
              errorMessage={errors.password?.message}
              {...register("password", {
                required: false,
                maxLength: { value: 100, message: "文字数オーバー" },
                minLength: { value: 7, message: "パスワードが短すぎます" },
              })}
            />{" "}
            <i
              onClick={() => setPasswordHidden(!passwordHidden)}
              aria-hidden="true"
              className="absolute top-2 right-10 z-10 h-14 grid -translate-y-0 h-5 w-5 place-items-left"
            >
              {passwordHidden ? (
                <>
                  <EyeSlashIcon />
                </>
              ) : (
                <EyeIcon />
              )}
            </i>
          </div>
          <button
            type="submit"
            className="bg-sky-800 rounded px-2 py-1 hover:bg-sky-400"
          >
            メールアドレスを変更する
          </button>
        </form>
      </>
    );
  };
  const PasswordUpdate = () => {
    const handlePasswordUpdate = async (data: FormValues) => {
      try {
        await api
          .provider()
          .account.updatePassword(data.newPassword, data.password);
        resetField("newPassword");
        resetField("password");
        setEmailModal(false);
        setPasswordModal(false);
      } catch (e) {
        if (typeof e === "object" && e != null) {
          if (
            "response" in e &&
            typeof e.response === "object" &&
            e.response != null
          ) {
            if (
              "message" in e.response &&
              e.response.message != null &&
              typeof e.response.message === "string"
            ) {
              setPasswordErrorMessage(e.response.message);
            }
          }
        }
      }
    };

    return (
      <>
        {passwordErrorMessage && (
          <AlertMessage message={passwordErrorMessage} />
        )}
        <form onSubmit={handleSubmit(handlePasswordUpdate)}>
          新しいパスワードを入力してください
          <div className="relative">
            <TextInput
              type={passwordHidden ? "password" : "text"}
              placeholder="新しいパスワード"
              className="mb-2"
              error={typeof errors.newPassword?.type == "string"}
              errorMessage={
                errors.newPassword?.message
                  ? errors.newPassword?.message
                  : errors.newPassword?.type
              }
              {...register("newPassword", {
                required: false,
                minLength: { value: 8, message: "パスワードが短すぎます" },
                maxLength: { value: 200, message: "文字数オーバー" },
              })}
            />{" "}
            <i
              onClick={() => setPasswordHidden(!passwordHidden)}
              aria-hidden="true"
              className="absolute top-2 right-10 z-10 h-14 grid -translate-y-0 h-5 w-5 place-items-left"
            >
              {passwordHidden ? (
                <>
                  <EyeSlashIcon />
                </>
              ) : (
                <EyeIcon />
              )}
            </i>
          </div>
          今までのパスワードを入力してください
          <div className="relative">
            <TextInput
              type={passwordHidden ? "password" : "text"}
              placeholder="パスワード"
              className="mb-2"
              error={typeof errors.password?.type == "string"}
              errorMessage={errors.password?.type}
              {...register("password", { required: false, maxLength: 100 })}
            />{" "}
            <i
              onClick={() => setPasswordHidden(!passwordHidden)}
              aria-hidden="true"
              className="absolute top-2 right-10 z-10 h-14 grid -translate-y-0 h-5 w-5 place-items-left"
            >
              {passwordHidden ? (
                <>
                  <EyeSlashIcon />
                </>
              ) : (
                <EyeIcon />
              )}
            </i>
          </div>
          <button
            type="submit"
            className="bg-sky-800 rounded px-2 py-1 hover:bg-sky-400"
          >
            パスワードを変更する
          </button>
        </form>
      </>
    );
  };

  return (
    <>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {data ? (
            <>
              {" "}
              <Card className="max-w-4xl mx-auto mt-8 gap-6">
                <Metric className="mx-2 text-center	 my-2">
                  アカウント情報の編集
                </Metric>
                {SuccessMessage && (
                  <>
                    <div className="bg-sky-600 rounded p-2">
                      {SuccessMessage}
                    </div>
                  </>
                )}
                <div className="grid gap-0">
                  <div>
                    <button
                      className="w-full pl-4 py-2 rounded hover:bg-sky-900"
                      onClick={() => {
                        setEmailModal(true);
                        setPasswordModal(false);
                      }}
                    >
                      <span className="pl-2">メールアドレスを変更する</span>
                    </button>
                  </div>
                  <div>
                    <button
                      className="w-full px-4 py-2 rounded hover:bg-sky-900"
                      onClick={() => {
                        setEmailModal(false);
                        setPasswordModal(true);
                      }}
                    >
                      パスワードを変更する
                    </button>
                  </div>
                </div>
                <ModalWindow
                  Boolean={emailModal}
                  SetBoolean={setEmailModal}
                  contents={EmailUpdate()}
                />
                <ModalWindow
                  Boolean={passwordModal}
                  SetBoolean={setPasswordModal}
                  contents={PasswordUpdate()}
                />
              </Card>
            </>
          ) : (
            <>{redirect("/")} </>
          )}
        </>
      )}
    </>
  );
};
export default AccountSetting;
