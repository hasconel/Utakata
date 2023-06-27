import LoadingScreen from "@/contents/loading";
import { GetLoginUser } from "@/feature/hooks";
import Link from "next/link";
import { Button } from "@tremor/react";
const App = () => {
  const user = GetLoginUser();
  //  const router = useRouter();

  return (
    <div className="mx-auto mt-4">
      {user.isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {user.data ? (
            <>welcome!</>
          ) : (
            <>
              <p>すごいカスのSNS</p>
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
