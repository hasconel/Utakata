"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button, TextInput, Card, Flex, Metric } from "@tremor/react";
import api from "@/feature/api";
import { getLoginUser } from "@/feature/hooks";
import { AlertMessage } from "@/contents/alert";
import { useState } from "react";

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
  console.log(errors.password?.type);
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
          <TextInput
            type="password"
            placeholder="Password"
            className="mt-4"
            error={errors.password?.message !== undefined}
            errorMessage={errors.password?.type}
            {...register("password", { required: true, maxLength: 100 })}
          />
          <Button type="submit" className="max-w-lg mt-4">
            ログイン
          </Button>
        </form>
      </Card>
    </>
  );
}
