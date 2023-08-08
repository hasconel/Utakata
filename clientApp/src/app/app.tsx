import LoadingScreen from "@/contents/loading";
import { GetLoginUser } from "@/feature/hooks";
import Link from "next/link";
import { Button, Metric } from "@tremor/react";
import { useRouter } from "next/navigation";
const App = () => {
  const user = GetLoginUser();
  const router = useRouter();

  return (
    <div className="flex justify-center items-center">
      {user.isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {user.data ? (
            <>
              welcome to Utakata!
              <button
                className="p-2 m-1 bg-slate-700 hover:bg-slate-500 text-slate-100"
                onClick={() => router.push("/home")}
              >
                ホームへ移動する
              </button>
            </>
          ) : (
            <>
              <div>Utakataにようこそ！</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Link href="/login">
                    <Button>ログイン</Button>
                  </Link>
                </div>
                <div>
                  <Link href="/auth/signup">
                    <Button>新規登録</Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
