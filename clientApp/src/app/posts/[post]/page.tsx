import PostPageClient from "./PostPageClient";

export default async function PostPage({ params }: { params: Promise<{ post: string }> }) {
  const { post } = await params;
  
  return <PostPageClient postId={post} />;
}