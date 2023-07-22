import Link from "next/link";

export const Footer = () => {
  return (
    <div className="text-right mx-auto text-gray-500">
      <Link href={"/rules"}>利用規約</Link>
    </div>
  );
};
