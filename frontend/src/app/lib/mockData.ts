export type Article = {
  id: string;
  title: string;
  article_url: string;
  source_name: string;
  published_at: string;
  image_url: string | null;
  like_num: number;
};

export const mockData: Article[] = [
  {
    id: "1",
    title:
      "Introducing Llama 3: The Next Generation of Open Large Language Models",
    article_url: "https://ai.meta.com/blog/",
    source_name: "Meta AI Blog",
    published_at: "2025-10-30T10:00:00Z",
    image_url: "https://via.placeholder.com/150", // 画像URL
    like_num: 0,
  },
  {
    id: "2",
    title: "What's New in Google's Gemini 2.5",
    article_url: "https://deepmind.google/discover/blog/",
    source_name: "Google DeepMind Blog",
    published_at: "2025-10-29T14:30:00Z",
    image_url: "https://via.placeholder.com/150", // 画像URL
    like_num: 0,
  },
  {
    id: "3",
    title: "Zenn で学ぶ、RAG システムの構築方法",
    article_url: "https://zenn.dev/",
    source_name: "Zenn",
    published_at: "2025-10-29T09:00:00Z",
    image_url: null, // ★ 画像がないパターン
    like_num: 0,
  },
  // ... (他のデータにも summary を追加してください)
  {
    id: "4",
    title: "大規模言語モデルの論文をarXivで読む",
    article_url: "https://arxiv.org/",
    source_name: "arXiv (cs.CL)",
    published_at: "2025-10-28T18:00:00Z",
    image_url: "https://via.placeholder.com/150", // 画像URL
    like_num: 0,
  },
];

// Add more data for infinite scroll testing
for (let i = 5; i <= 20; i++) {
  mockData.push({
    id: `${i}`,
    title: `サンプル記事 ${i}: AI技術の最新動向`,
    article_url: "#",
    source_name: `Tech News ${i % 5}`,
    published_at: new Date(
      Date.now() - (i - 4) * 24 * 60 * 60 * 1000
    ).toISOString(),
    image_url: i % 3 !== 0 ? "https://via.placeholder.com/150" : null,
    like_num: 0,
  });
}
