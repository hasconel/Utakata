"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { Button, TextInput, Card, Flex, Metric } from "@tremor/react";
import { useQstate } from "@/feature/hooks";
import api from "@/feature/api";

type FormValues = {
  username: string;
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
  const loginUser = async () => {
    try {
      return api.getAccount();
    } catch {
      return undefined;
    }
  };
  const [user, setUser] = useQstate(["user"], loginUser);
  const onSubmit = (data: FormValues) => console.log(data.email);
  console.log(errors.username?.type);
  console.log(user.name);

  return (
    <>
      <Card className="max-w-lg mx-auto mt-8 gap-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            type="text"
            placeholder="User ID"
            className="mt-4"
            {...register("username", { required: true, maxLength: 32 })}
          />
          {errors.username?.type && <>{errors.username.type}</>}
          {
            // この一文があるだけでエラーメッセージができるなんて賢いなぁ
          }
          <TextInput
            type="text"
            placeholder="Email"
            error={false}
            errorMessage=""
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
