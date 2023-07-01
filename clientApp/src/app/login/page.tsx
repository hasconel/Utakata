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
import LoadingScreen from "@/contents/loading";

type FormValues = {
  email: string;
  password: string;
};
export default function LoginForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();
  const [LoginError, setLoginError] = useState<string | null>(null);
  const [passwordHidden, setPasswordHidden] = useState(true);
  const router = useRouter();
  const [buttonIsLoading, setButtonIsLoading] = useState(false);
  const onSubmit = async (data: FormValues) => {
    setButtonIsLoading(true);
    try {
      await api.deleteCurrentSession();
    } catch {}
    try {
      await api.createSession(data.email, data.password);
      router.push("/");
    } catch (e: any) {
      if (e?.response?.message) {
        setLoginError(e.response.message);
      } else {
        setLoginError(e.message);
      }
    }
    setButtonIsLoading(false);
  };
  return (
    <>
      <Card className="max-w-lg mx-auto mt-8 gap-6">
        {LoginError && <AlertMessage message={LoginError} />}
        <form onSubmit={handleSubmit(onSubmit)}>
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
          <Button
            type="submit"
            className="max-w-lg mt-4"
            disabled={buttonIsLoading}
          >
            {buttonIsLoading ? (
              <>
                <LoadingScreen />
              </>
            ) : (
              <>ログイン</>
            )}
          </Button>
          <span className="ml-4 place-item-right -translate-y-0 ">
            アカウントを持っていない方は
            <Link href="/auth/signup">新規登録</Link>
          </span>
        </form>
      </Card>
    </>
  );
}
