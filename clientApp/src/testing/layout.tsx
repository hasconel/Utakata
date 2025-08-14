import { redirect } from 'next/navigation';

export default function TestingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 本番環境ではテストディレクトリ全体にアクセス不可
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  return (
    <div>
      {children}
    </div>
  );
}
