export type Article = {
  id: string;
  title: string;
  article_url: string;
  source_name: string;
  published_at: string;
  image_url: string | null;
  like_num: number;
  // --- ★ ここから追加 ---
  summary?: string | null; // (これはArticleCard.tsxで使われていたので残します)

  // ログイン中のユーザーがいいねしたか (RPCから取得)
  is_liked: boolean;

  // 上位3件のコメント (RPCから取得)
  comments: Comment[];
};

// ユーザー情報の型
export type CommentUser = {
  name: string | null;
  image: string | null;
};

// コメントの型
export type Comment = {
  id: string;
  created_at: string;
  text: string;
  user_id: string;
  user: CommentUser;
};
