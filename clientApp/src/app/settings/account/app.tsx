import { GetLoginUser } from "@/feature/hooks";
import LoadingScreen from "@/contents/loading";
import { redirect, useRouter } from "next/navigation";
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
  const [accountDeletModal, setAccountDeletModal] = useState<boolean>(false);
  const [passwordModal, setPasswordModal] = useState<boolean>(false);
  const [emailVerificationModal, setEmailVerificationModal] =
    useState<boolean>(false);
  const [SuccessMessage, setSuccesMessage] = useState("");
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string>("");
  const [accountErrorMessage, setAccountErrorMessage] = useState<string>("");
  const [emailVerificationErrorMessage, setEmailVerificationErrorMessage] =
    useState<string>("");
  type FormValues = {
    email: string;
    password: string;
    newPassword: string;
  };
  const setModal = (
    target?:
      | "emailModal"
      | "passwordModal"
      | "emailVerificationModal"
      | "accountDelete"
  ) => {
    setEmailModal(false);
    setEmailVerificationModal(false);
    setPasswordModal(false);
    if (target != undefined) {
      switch (target) {
        case "emailModal":
          setEmailModal(true);
          break;
        case "passwordModal":
          setPasswordModal(true);
          break;
        case "emailVerificationModal":
          setEmailVerificationModal(true);
          break;
        case "accountDelete":
          setAccountDeletModal(true);
        default:
          break;
      }
    }
  };
  const DeleteAccount = useForm<{ password: string }>();

  const UpdateEmail = useForm<{ email: string; password: string }>();
  const PasswordUpdateForm = useForm<{
    newPassword: string;
    password: string;
  }>();
  const router = useRouter();
  const EmailUpdate = () => {
    const handleEmailUpdate = async (formdata: {
      email: string;
      password: string;
    }) => {
      try {
        await api
          .provider()
          .account.updateEmail(formdata.email, formdata.password);
        await api.eMailVerification();
        setSuccesMessage(
          `\"${formdata.email}\"に認証メールを送信しました。メールに記載されたリンクをクリックし、認証を完了させてください。`
        );
        UpdateEmail.resetField("email");
        UpdateEmail.resetField("password");
        setModal();
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
        <form onSubmit={UpdateEmail.handleSubmit(handleEmailUpdate)}>
          新しいメールアドレスを入力してください
          <TextInput
            type="text"
            placeholder="Email"
            error={UpdateEmail.formState.errors.email?.type !== undefined}
            errorMessage={UpdateEmail.formState.errors.email?.message}
            className="mb-2"
            {...UpdateEmail.register("email", {
              required: true,
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
              error={
                typeof UpdateEmail.formState.errors.password?.type == "string"
              }
              errorMessage={UpdateEmail.formState.errors.password?.message}
              {...UpdateEmail.register("password", {
                required: true,
                maxLength: { value: 100, message: "文字数オーバー" },
                minLength: { value: 7, message: "パスワードが短すぎます" },
              })}
            />{" "}
            <i
              onClick={() => setPasswordHidden(!passwordHidden)}
              aria-hidden="true"
              className="absolute top-2 right-10 z-10 h-14 grid -translate-y-0 w-5 place-items-left"
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
    const handlePasswordUpdate = async (data: {
      newPassword: string;
      password: string;
    }) => {
      try {
        await api
          .provider()
          .account.updatePassword(data.newPassword, data.password);
        PasswordUpdateForm.resetField("newPassword");
        PasswordUpdateForm.resetField("password");
        setModal();
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
        <form onSubmit={PasswordUpdateForm.handleSubmit(handlePasswordUpdate)}>
          新しいパスワードを入力してください
          <div className="relative">
            <TextInput
              type={passwordHidden ? "password" : "text"}
              placeholder="新しいパスワード"
              className="mb-2"
              error={
                typeof PasswordUpdateForm.formState.errors.newPassword?.type ==
                "string"
              }
              errorMessage={
                PasswordUpdateForm.formState.errors.newPassword?.message
                  ? PasswordUpdateForm.formState.errors.newPassword?.message
                  : PasswordUpdateForm.formState.errors.newPassword?.type
              }
              {...PasswordUpdateForm.register("newPassword", {
                required: true,
                minLength: { value: 8, message: "パスワードが短すぎます" },
                maxLength: { value: 200, message: "文字数オーバー" },
              })}
            />{" "}
            <i
              onClick={() => setPasswordHidden(!passwordHidden)}
              aria-hidden="true"
              className="absolute top-2 right-10 z-10 h-14 grid -translate-y-0 w-5 place-items-left"
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
              error={
                typeof PasswordUpdateForm.formState.errors.password?.type ==
                "string"
              }
              errorMessage={PasswordUpdateForm.formState.errors.password?.type}
              {...PasswordUpdateForm.register("password", {
                required: true,
                maxLength: 100,
              })}
            />{" "}
            <i
              onClick={() => setPasswordHidden(!passwordHidden)}
              aria-hidden="true"
              className="absolute top-2 right-10 z-10 h-14 grid -translate-y-0 w-5 place-items-left"
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

  const EmailVerification = () => {
    const HandleEmailVerification = async () => {
      try {
        await api.eMailVerification();
        if (data) {
          setSuccesMessage(
            `\"${data.user.email}\"に認証メールを送信しました。メールに記載されたリンクをクリックし、認証を完了させてください。`
          );
        }
        setModal();
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
              setEmailVerificationErrorMessage(e.response.message);
            }
          }
        }
      }
    };
    return (
      <>
        {emailVerificationErrorMessage && (
          <AlertMessage message={emailVerificationErrorMessage} />
        )}
        {!data?.user.emailVerification ? (
          <>
            <div>
              {`\"${data?.user.email}\"`}
              を認証するためには下のボタンをクリックしてください
            </div>
            <button
              type="submit"
              className="bg-sky-800 rounded px-2 py-1 hover:bg-sky-400"
              onClick={HandleEmailVerification}
            >
              認証メールを送信する
            </button>
          </>
        ) : (
          <>メールアドレスはすでに認証されています</>
        )}
      </>
    );
  };
  const AccountDelete = () => {
    accountErrorMessage;
    const HandleAccountDelete = async (data: { password: string }) => {
      try {
        await api
          .provider()
          .account.updateEmail("deleted@deleted.dsdfasdf", data.password)
          .then(() => {
            api.provider().account.updateStatus();
          });
        setModal();
        router.push("/");
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
              setAccountErrorMessage(e.response.message);
            }
          }
        }
      }
    };
    return (
      <>
        {" "}
        {accountErrorMessage && <AlertMessage message={accountErrorMessage} />}
        アカウントを削除します。この動作は取り消せません。{" "}
        <form onSubmit={DeleteAccount.handleSubmit(HandleAccountDelete)}>
          <div className="relative">
            <TextInput
              type={passwordHidden ? "password" : "text"}
              placeholder="パスワード"
              className="mb-2"
              error={
                typeof DeleteAccount.formState.errors.password?.type == "string"
              }
              errorMessage={DeleteAccount.formState.errors.password?.type}
              {...DeleteAccount.register("password", {
                required: true,
                maxLength: 100,
              })}
            />{" "}
            <i
              onClick={() => setPasswordHidden(!passwordHidden)}
              aria-hidden="true"
              className="absolute top-2 right-10 z-10 h-14 grid -translate-y-0 w-5 place-items-left"
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
          <div className="grid grid-cols-2 gap-6">
            <input
              type="submit"
              value="削除する"
              className="bg-rose-400 dark:bg-rose-700 hover:bg-rose-500"
            />
            <button
              type="button"
              onClick={() => setModal()}
              className="bg-slate-400 dark:bg-slate-600 hover:bg-slate-500"
            >
              削除しない
            </button>
          </div>
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
                        setModal("emailModal");
                      }}
                    >
                      <span className="pl-2">メールアドレスを変更する</span>
                    </button>
                  </div>
                  <div>
                    <button
                      className="w-full px-4 py-2 rounded hover:bg-sky-900"
                      onClick={() => {
                        setModal("passwordModal");
                      }}
                    >
                      パスワードを変更する
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="w-full px-4 py-2 rounded hover:bg-sky-900"
                      onClick={() => {
                        setModal("emailVerificationModal");
                      }}
                      disabled={data.user.emailVerification}
                    >
                      eメール認証
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="w-full px-4 py-2 rounded hover:bg-sky-900"
                      onClick={() => {
                        setModal("accountDelete");
                      }}
                    >
                      アカウント削除
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
                <ModalWindow
                  Boolean={emailVerificationModal}
                  SetBoolean={setEmailVerificationModal}
                  contents={EmailVerification()}
                />
                <ModalWindow
                  Boolean={accountDeletModal}
                  SetBoolean={setAccountDeletModal}
                  contents={AccountDelete()}
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
