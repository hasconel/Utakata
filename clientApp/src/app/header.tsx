"use client";
import LoadingScreen from "@/contents/loading";
import ModalWindow from "@/contents/modal";
import api from "@/feature/api";
import { GetLoginUser } from "@/feature/hooks";
import { FireIcon } from "@heroicons/react/20/solid";
import { Metric } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QueryClientProvider, QueryClient } from "react-query";
const queryClient = new QueryClient();

const Header = () => {
  const [modalBoolean, setModalBoolean] = useState(false);
  const [userStatusMenu, setUserStatusMenu] = useState(false);
  const router = useRouter();
  const MainManu = () => {
    return (
      <Link href={"/ranking"}>
        <button className="grid md:grid-cols-[24px_70px] mx-3 h-8 bottom-0 mt-1 gap-2 hover:bg-slate-500 overflow-hidden dark:bg-slate-800 bg-slate-300 rounded-full px-2">
          <FireIcon className="my-auto h-6" />
          <span className="text-left hidden my-auto md:block">Ranking</span>
        </button>
      </Link>
    );
  };
  const AccountIcon = () => {
    const HeaderLoginUser = GetLoginUser();
    return (
      <>
        {HeaderLoginUser.isLoading ? (
          <>
            <LoadingScreen />
          </>
        ) : (
          <>
            {HeaderLoginUser.data ? (
              <>
                <MainManu />
                <div>
                  <div className="relative">
                    <button
                      className="grid sm:grid-cols-[36px_130px] h-8 bottom-0 mt-1 gap-2 hover:bg-slate-500 overflow-hidden dark:bg-slate-800 bg-slate-300 rounded-full px-2"
                      onClick={() => setUserStatusMenu(true)}
                    >
                      <img
                        alt="User"
                        src={HeaderLoginUser.data.data.UserThumbnailURL}
                        height={48}
                        width={48}
                        className="my-auto h-8 w-8 rounded-full aspect-square"
                      />
                      <span className="text-left hidden my-auto sm:block text-xl">
                        {HeaderLoginUser.data.data.DisplayUID}
                      </span>
                    </button>

                    {userStatusMenu && (
                      <>
                        <div
                          className="absolute -bottom w-40 py-2 mt-1 rounded-md end-2 z-40 bg-slate-300 dark:bg-slate-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="hover:bg-slate-500 w-full text-left px-4 py-2 border-b border-slate-400"
                            onClick={() => {
                              setUserStatusMenu(false);
                              if (HeaderLoginUser.data)
                                router.push(
                                  `/users/${HeaderLoginUser.data.data.DisplayUID}`
                                );
                            }}
                          >
                            プロフィール
                          </button>
                          <button
                            className="hover:bg-slate-500 w-full text-left px-4 py-2 border-b border-slate-400"
                            onClick={() => {
                              setUserStatusMenu(false);
                              if (HeaderLoginUser.data)
                                router.push(`/settings/account`);
                            }}
                          >
                            アカウント設定
                          </button>
                          <button
                            className="hover:bg-slate-500 w-full text-left px-4 py-2 border-b border-slate-400"
                            onClick={() => {
                              setUserStatusMenu(false);
                              if (HeaderLoginUser.data)
                                router.push(`/settings/mute`);
                            }}
                          >
                            ミュート設定
                          </button>
                          <button
                            className="hover:bg-slate-500 w-full text-left px-4 py-2 border-slate-400"
                            onClick={() => {
                              setUserStatusMenu(false);
                              setModalBoolean(true);
                            }}
                          >
                            ログアウト
                          </button>
                        </div>
                        <div
                          className="fixed left-0 top-0 flex bg-slate-400/0 w-full h-[100vh] z-30 justify-center items-center overscroll-contain overflow-y-scroll"
                          onClick={() => setUserStatusMenu(false)}
                        ></div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>{HeaderLoginUser.isError && <>error</>}</>
            )}
          </>
        )}
      </>
    );
  };
  return (
    <>
      {" "}
      <QueryClientProvider client={queryClient}>
        <ModalWindow
          Boolean={modalBoolean}
          SetBoolean={setModalBoolean}
          contents={
            <>
              <div>Utakataからログアウトしますか？</div>
              <div className="grid grid-cols-2 gap-6 pr-8">
                <div>
                  <button
                    className="w-full m-4 bg-rose-900 hover:bg-rose-600 text-white py-1 px-4 rounded-md"
                    onClick={() => {
                      api.deleteCurrentSession();
                      setModalBoolean(false);
                      router.push("/");
                    }}
                  >
                    ログアウトする
                  </button>
                </div>
                <div>
                  <button
                    className="w-full m-4 bg-slate-700 hover:bg-slate-600 py-1 text-white px-4 rounded-md"
                    onClick={() => setModalBoolean(false)}
                  >
                    Utakataにとどまる
                  </button>
                </div>
              </div>
            </>
          }
        />
        <div className="flex justify-center items-center bg-gradient-to-r from-slate-800 to-sky-900">
          <div className="grid grid-cols-2 gap-4 p-2 w-screen max-w-7xl">
            <div className="flex justify-start content-center">
              <Link href={"/home"}>
                <Metric className="text-neutral-100">Utakata</Metric>
              </Link>
            </div>
            <div className="flex justify-end content-end">
              {" "}
              <AccountIcon />
            </div>
          </div>
        </div>
      </QueryClientProvider>
    </>
  );
};
export default Header;
