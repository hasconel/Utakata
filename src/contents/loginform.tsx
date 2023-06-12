import React from "react";
import { useForm } from "react-hook-form";
import { Button, TextInput, Card, Flex, Metric } from "@tremor/react";

type FormValues = {
  username: string;
  email: string;
  password: string;
};
export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const onSubmit = (data: FormValues) => console.log(data.email);
  console.log(errors);

  return (
    <>
      <Card className="max-w-lg mx-auto gap-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            type="text"
            placeholder="User ID"
            {...register("username", { required: true, maxLength: 32 })}
          />
          <TextInput
            type="text"
            placeholder="Email"
            error={false}
            errorMessage=""
            {...register("email", {
              required: true,
              pattern: /^\S+@\S+$/i,
            })}
          />
          <TextInput
            type="password"
            placeholder="Password"
            {...register("password", { required: true, maxLength: 100 })}
          />
          <Button type="submit">ログイン</Button>
        </form>
      </Card>
    </>
  );
}
