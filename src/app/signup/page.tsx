"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button, TextInput, Card, Flex, Metric } from "@tremor/react";
import api from "@/feature/api";
import { getLoginUser } from "@/feature/hooks";
import { AlertMessage } from "@/contents/alert";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { redirect } from "next/navigation";
type FormValues = {
  uname: string;
  email: string;
  password: string;
};
export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();
  const [LoginError, setLoginError] = useState<string | null>(null);
  const [passwordHidden, setPasswordHidden] = useState(true);
  const onSubmit = async (data: FormValues) => {
    console.log(data.email);
    try {
      await api.createAccount(data.email, data.password, data.uname);
      getLoginUser();
      redirect("/");
    } catch (e: any) {
      //  console.log(e.message);
      setLoginError(e.message);
    }
  };
  return (
    <>
      <Card className="max-w-lg mx-auto mt-8 gap-6">
        {LoginError && <AlertMessage message={LoginError} />}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            type="text"
            placeholder="ユーザーID"
            error={errors.uname?.type !== undefined}
            errorMessage={errors.uname?.type}
            className="mt-4"
            {...register("uname", {
              required: true,
              pattern: /^[a-z0-9]{1}\w{6,31}$/i,
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
          <Button type="submit" className="max-w-lg mt-4">
            登録
          </Button>
          <span className="ml-4 place-item-right -translate-y-0 ">
            アカウントを持っている方は<Link href="/login">ログイン</Link>
          </span>
        </form>
      </Card>
    </>
  );
}
