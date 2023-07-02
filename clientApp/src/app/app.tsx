import LoadingScreen from "@/contents/loading";
import { GetLoginUser } from "@/feature/hooks";
import Link from "next/link";
import { Button, Metric } from "@tremor/react";
import { useRouter } from "next/navigation";
const App = () => {
  const user = GetLoginUser();
  const router = useRouter();

  return (
    <div className="mx-auto mt-4">
      {user.isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {user.data ? (
            <>
              welcome!{" "}
              <button
                className="p-2 m-1 bg-slate-700 hover:bg-slate-500"
                onClick={() => router.push("/home")}
              >
                ホームへ移動する
              </button>
            </>
          ) : (
            <>
              <p>
                <Metric>Utakata</Metric>
              </p>
              <Link href="/login">
                <Button>ログイン</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>新規登録</Button>
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
