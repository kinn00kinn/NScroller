// frontend/src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントを初期化（環境変数はVercel側にも設定が必要）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ★ サービスキーが必要
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://n-scroller.vercel.app'; // ★ あなたのサイトのURLに変更

  // 1. 静的なページのルートを追加
  const staticRoutes = [
    '/',
    '/links',
    '/links/about',
    '/links/ads',
    '/links/contact',
    '/links/creator',
    '/links/credits',
    '/links/help',
    '/links/news',
    '/links/policy',
    '/links/terms',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as 'monthly', // 月次で更新
    priority: route === '/' ? 1 : 0.8,
  }));

  // 2. 動的な記事ページのルートを追加 (DBから取得)
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, published_at') // 必要なカラムのみ取得
    .order('published_at', { ascending: false })
    .limit(500); // 最新500件など（サイトマップのサイズ制限を考慮）

  if (error) {
    console.error('Sitemap fetch error:', error);
    return staticRoutes; // エラー時は静的ルートのみ返す
  }

  const dynamicRoutes = articles.map((article) => ({
    url: `${siteUrl}/article/${article.id}`,
    lastModified: new Date(article.published_at),
    changeFrequency: 'weekly' as 'weekly', // 週次（記事による）
    priority: 0.7,
  }));

  // 3. 静的と動的ルートを結合して返す
  return [...staticRoutes, ...dynamicRoutes];
}