import { Card } from "@tremor/react";
import { Dispatch, SetStateAction } from "react";

type Modal = {
  Boolean: boolean;
  SetBoolean: Dispatch<SetStateAction<boolean>>;
  contents: JSX.Element;
  fullContents?: boolean;
};
const ModalWindow = (modal: Modal) => {
  return (
    <>
      {modal.Boolean && (
        <>
          <div
            className="fixed left-0 top-0 flex bg-slate-400/70 w-full h-[100vh] z-30 justify-center items-center overscroll-contain overflow-y-scroll"
            onClick={() => modal.SetBoolean(false)}
          >
            {modal.fullContents === true ? (
              <div
                className="fixed flex content-center justify-center  items-center  min-h-5 overflow-hidden overscroll-none mix-blend-normal z-40 "
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {modal.contents}
              </div>
            ) : (
              <Card
                className="fixed max-w-xl mx-auto mt-5 px-4 py-4 rounded mix-blend-normal dark:bg-slate-700 z-40 "
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {modal.contents}
              </Card>
            )}
            <div className="w-20  bg-transparent		  h-[calc(100vh+1px)] "></div>
          </div>
        </>
      )}
    </>
  );
};
export default ModalWindow;
