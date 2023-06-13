import React from "react";
import api from "../feature/api";
import { Button } from "@tremor/react";

const LogoutButton = ({
  dispatch,
}: {
  dispatch: React.Dispatch<{
    type: number;
    payload?: any;
  }>;
}) => {
  const navigate = useNavigate();
  const logout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      await api.deleteCurrentSession();
      dispatch({ type: fetchState.success });
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch {}
  };
  return <Button onClick={logout}>ログアウト</Button>;
};

export default LogoutButton;
