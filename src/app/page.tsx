"use client";
import TestButton from "@/contents/FileDisplay";
import { AlertMessage } from "@/contents/alert";
import FileUploadPage from "@/contents/upload";
import { useGetUser } from "@/feature/hooks";
import Login from "@/feature/login";
import Image from "next/image";
import { Button, TextInput } from "@tremor/react";
import LoginForm from "@/contents/loginform";

export default function Home() {
  const [{ user, isLoading, isError }, dispatch] = useGetUser();
  console.log(user?.name);
  return (
    <>
      <AlertMessage message="メッセージ" /> <TestButton />
      <FileUploadPage />
      <TextInput />
      <LoginForm />
    </>
  );
}
