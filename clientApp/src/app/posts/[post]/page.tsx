import PostPageClient from "./PostPageClient";
import { postMetadata } from "@/lib/pageMetadata";

type Props = { params: Promise<{ post: string }> };

export async function generateMetadata({ params }: Props) {
  return postMetadata((await params).post);
}

export default async function PostPage({ params }: Props) {
  const { post } = await params;
  return <PostPageClient postId={post} />;
}
