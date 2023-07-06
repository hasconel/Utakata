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
          {modal.fullContents === true ? (
            <div
              className="fixed mx-12 mt-5 rounded content-center mix-blend-normal  bg-slate-700 z-40 "
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {modal.contents}
            </div>
          ) : (
            <Card
              className="fixed max-w-xl mx-12 mt-5 px-4 py-4 rounded mix-blend-normal bg-slate-700 z-40 "
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {modal.contents}
            </Card>
          )}
          <div
            className="fixed left-0 top-0 opacity-75 bg-slate-400 w-full h-screen z-30"
            onClick={() => modal.SetBoolean(false)}
          ></div>
        </>
      )}
    </>
  );
};
export default ModalWindow;
