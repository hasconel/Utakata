"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button, TextInput, Card, Flex, Metric } from "@tremor/react";
import api from "@/feature/api";
import { AlertMessage } from "@/contents/alert";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createHash } from "crypto";
import LoadingScreen from "@/contents/loading";
import { Server } from "@/feature/config";
import ModalWindow from "@/contents/modal";
import RulesPage from "@/contents/rules";
type FormValues = {
  uname: string;
  email: string;
  password: string;
  Rules: boolean;
};
export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();
  const [isModal, setIsModal] = useState<boolean>(false);
  const [ModalWindowContents, setModalWindowContents] = useState(<></>);
  const router = useRouter();
  const [LoginError, setLoginError] = useState<string | null>(null);
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [succesMessage, setSuccesMessage] = useState("");
  const [buttonIsLoading, setButtonIsLoading] = useState(false);
  const onSubmit = async (data: FormValues) => {
    setButtonIsLoading(true);
    if (data.Rules) {
      try {
        console.log(Server.deployPont);
        await api.createAccount(data.email, data.password, data.uname);
        await api
          .provider()
          .account.createVerification(
            `${Server.deployPont}/auth/emailverification/`
          );
        setSuccesMessage(
          `\"${data.email}\"に認証メールを送信しました。メールに記載されたリンクをクリックし、認証を完了させてください。`
        );
        setTimeout(() => setButtonIsLoading(false), 2000);
      } catch (e: any) {
        // console.log(e.message);
        setLoginError(e.message);
        setButtonIsLoading(false);
      }
    }
  };
  return (
    <>
      <ModalWindow
        contents={ModalWindowContents}
        Boolean={isModal}
        SetBoolean={setIsModal}
      />
      <Card className="max-w-lg mx-auto mt-8 gap-6">
        {LoginError && <AlertMessage message={LoginError} />}
        {succesMessage && (
          <>
            <div className="w-full  rounded bg-blue-500">{succesMessage}</div>
          </>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            type="text"
            placeholder="ユーザーID"
            error={errors.uname?.type !== undefined}
            errorMessage={errors.uname?.type}
            className="mt-4"
            {...register("uname", {
              required: true,
              pattern: /^[a-z0-9]{1}\w{4,31}$/i,
            })}
          />{" "}
          <TextInput
            type="text"
            placeholder="Email"
            error={errors.email?.type !== undefined}
            errorMessage={errors.email?.type}
            className="mt-4"
            {...register("email", {
              required: true,
              pattern: /^\S+@\S+$/i,
            })}
          />
          <div className="relative">
            <TextInput
              type={passwordHidden ? "password" : "text"}
              placeholder="パスワード"
              className="mt-4"
              error={typeof errors.password?.type == "string"}
              errorMessage={errors.password?.type}
              {...register("password", { required: true, maxLength: 100 })}
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
          <div>
            <button
              type="button"
              onClick={() => {
                setModalWindowContents(
                  <>
                    <div className=" w-full max-h-[60vh] overflow-y-scroll">
                      {" "}
                      <RulesPage />
                    </div>
                  </>
                );
                setIsModal(true);
              }}
            >
              利用規約
            </button>
            に同意します{" "}
            <input type="checkbox" {...register("Rules", { required: true })} />
          </div>
          <input
            type="submit"
            className="mt-4 p-2 rounded-md w-28 bg-sky-300 hover:bg-sky-500 dark:bg-sky-700 disabled:bg-gray-500"
            disabled={buttonIsLoading}
            value={buttonIsLoading ? "登録中…" : "登録"}
          ></input>
          <span className="ml-4 place-item-right -translate-y-0 ">
            アカウントを持っている方は<Link href="/login">ログイン</Link>
          </span>
        </form>
      </Card>
    </>
  );
}
