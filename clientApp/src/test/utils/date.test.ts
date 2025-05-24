import { formatDate } from "@/lib/utils/date";

describe("formatDate", () => {
  it("1分前の日付を正しくフォーマットする", () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - 1);
    expect(formatDate(date)).toBe("1分前");
  });

  it("1時間前の日付を正しくフォーマットする", () => {
    const date = new Date();
    date.setHours(date.getHours() - 1);
    expect(formatDate(date)).toBe("1時間前");
  });

  it("1日前の日付を正しくフォーマットする", () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    expect(formatDate(date)).toBe("1日前");
  });

  it("1週間前の日付を正しくフォーマットする", () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    expect(formatDate(date)).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
  });
}); 