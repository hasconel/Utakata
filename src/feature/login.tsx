"use client";
import { useState } from "react";
import api from "./api";
import { fetchState } from "./hooks";
import { Link, useNavigate } from "react-router-dom";
//import { useLocation } from "react-router-dom";
import { AlertMessage } from "../contents/alert";
import { Models } from "appwrite";
import { Button, Card, TextInput, Title } from "@tremor/react";
let M: string | null;
const Login = ({
  dispatch,
}: {
  dispatch: React.Dispatch<{
    type: number;
    payload?: Models.User<Models.Preferences>;
  }>;
}) => {
  const [error, setError] = useState<string | null>(M);
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  //  let navigate = useNavigate();
  //  let location = useLocation();
  //  let from = location.state?.from?.pathname || "/";
  const HandleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    setError(null);
    e.preventDefault();
    dispatch({ type: fetchState.init });
    try {
      await api.createSession(email, password);
      const data = await api.getAccount();
      dispatch({ type: fetchState.success, payload: data });
      //      navigate(from, { replace: true });
    } catch (err: any) {
      dispatch({ type: fetchState.failure });
      M = err.response.message;
      console.log(err.response.type);
    }
  };

  return (
    <>
      <Card>
        <Title>すごいカスのSNS</Title>
        {error && <AlertMessage message={error} />}
        <form
          onSubmit={(e) => {
            HandleLogin(e);
          }}
        >
          <TextInput
            type="text"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextInput
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" color="slate">
            ログイン
          </Button>
        </form>
      </Card>
      アカウントを持っていない？ <Link to="/signup">新規登録</Link>
    </>
  );
};

export default Login;
