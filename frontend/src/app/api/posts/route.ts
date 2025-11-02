
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Supabaseクライアントを初期化
// 環境変数はVercelの管理画面で設定することを想定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // pageとlimitが数値で、かつ1以上であることを確認
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
        return NextResponse.json({ error: 'Invalid page or limit parameter.' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Supabaseからデータを取得
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, article_url, published_at, source_name, image_url')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }

    // レスポンスを返す
    return NextResponse.json({ articles: data });

  } catch (error) {
    console.error('API route error:', error);
    // エラーレスポンスを返す
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
