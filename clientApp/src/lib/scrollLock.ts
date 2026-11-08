/**
 * 後ろのページのスクロールを止める。モーダルが重なっても、最後の1つが閉じるまで止めたままにする。
 * （以前は、上のモーダルを閉じた時点で止めるのをやめてしまっていた）
 */
let count = 0;

export function lockScroll(): () => void {
  if (count++ === 0) {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--count === 0) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  };
}
