"use client";
import LoadingScreen from "@/contents/loading";
import ModalWindow from "@/contents/modal";
import api from "@/feature/api";
import { GetLoginUser } from "@/feature/hooks";
import { Metric } from "@tremor/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QueryClientProvider, QueryClient } from "react-query";
const queryClient = new QueryClient();

const Header = () => {
  const [modalBoolean, setModalBoolean] = useState(false);
  const [userStatusMenu, setUserStatusMenu] = useState(false);
  const router = useRouter();
  const Hoge = () => {
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
                <div>
                  <div className="relative">
                    <button
                      className="grid sm:grid-cols-[18px_130px] h-6 bottom-0 mt-3 gap-2 hover:bg-slate-700 overflow-hidden bg-slate-800 rounded-full px-2"
                      onClick={() => setUserStatusMenu(true)}
                    >
                      <Image
                        alt="User"
                        src={HeaderLoginUser.data.data.UserThumbnailURL}
                        height={48}
                        width={48}
                        className="my-auto h-4 w-4 rounded-full aspect-square"
                      />
                      <span className="text-left hidden sm:block">
                        {HeaderLoginUser.data.data.DisplayUID}
                      </span>
                    </button>

                    {userStatusMenu && (
                      <>
                        <div
                          className="absolute -bottom w-40 py-2 rounded-md end-0 z-40 bg-slate-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="hover:bg-slate-600 w-full text-left px-2 border-b border-slate-300"
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
                            className="hover:bg-slate-600 w-full text-left px-2 border-b border-slate-300"
                            onClick={() => {
                              setUserStatusMenu(false);
                              if (HeaderLoginUser.data)
                                router.push(`/settings/account`);
                            }}
                          >
                            アカウント設定
                          </button>
                          <button
                            className="hover:bg-slate-600 w-full text-left px-2 border-b border-slate-300"
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
                    className="w-full m-4 bg-rose-900 hover:bg-rose-600 py-1 px-4 rounded-md"
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
                    className="w-full m-4 bg-slate-700 hover:bg-slate-600 py-1 px-4 rounded-md"
                    onClick={() => setModalBoolean(false)}
                  >
                    Utakataにとどまる
                  </button>
                </div>
              </div>
            </>
          }
        />
        <div className="flex justify-center items-center">
          <div className="grid grid-cols-2 gap-4 p-2 w-screen max-w-7xl">
            <div className="flex justify-start content-center">
              <Link href={"/home"}>
                <Metric>Utakata</Metric>
              </Link>
            </div>
            <div className="flex justify-end content-end">
              {" "}
              <Hoge />
            </div>
          </div>
        </div>
      </QueryClientProvider>
    </>
  );
};
export default Header;
