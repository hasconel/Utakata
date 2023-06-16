"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button, TextInput, Card, Flex, Metric } from "@tremor/react";
import api from "@/feature/api";
import { getLoginUser } from "@/feature/hooks";
import { AlertMessage } from "./alert";
import { useState } from "react";
<TextInput error={true} errorMessage="Wrong username" />;

type FormValues = {
  username: string;
  email: string;
  password: string;
};
export default function LoginForm2() {
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
      await api.createSession(data.email, data.password);
      getLoginUser();
    } catch (e: any) {
      if (e.response.message) {
        setLoginError(e.response.message);
      } else {
        setLoginError("error occurred!");
      }
    }
  };
  return (
    <>
      <Card className="max-w-lg mx-auto mt-8 gap-6">
        {LoginError && <AlertMessage message="" />}{" "}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            type="text"
            placeholder="Email"
            error={typeof errors.email != undefined}
            errorMessage={errors.email?.message}
            className="mt-4"
            {...register("email", {
              required: true,
              pattern: /^\S+@\S+$/i,
            })}
          />
          <TextInput
            type="password"
            placeholder="Password"
            className="mt-4"
            error={typeof errors.password != undefined}
            errorMessage={errors.password?.message}
            {...register("password", { required: true, maxLength: 100 })}
          />{" "}
          <button
            className="!absolute right-1 top-1 z-10 select-none rounded bg-pink-500 py-2 px-4 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none peer-placeholder-shown:pointer-events-none peer-placeholder-shown:bg-blue-gray-500 peer-placeholder-shown:opacity-50 peer-placeholder-shown:shadow-none"
            type="button"
            data-ripple-light="true"
          >
            Invite
          </button>
          <Button type="submit" className="max-w-lg mt-4">
            ログイン
          </Button>
        </form>
      </Card>
    </>
  );
}
