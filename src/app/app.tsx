import LoadingScreen from "@/contents/loading";
import { getLoginUser } from "@/feature/hooks";
import Link from "next/link";
import { Button } from "@tremor/react";
const App = () => {
  const user = getLoginUser();
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
                <Button>Log In</Button>
              </Link>

              <Button>Sign Up</Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;
