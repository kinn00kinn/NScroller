
// lib/api.ts

/**
 * APIリクエストでエラーが発生した際にスローされるカスタムエラー
 */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(response: Response) {
    super(`API Error: ${response.status} ${response.statusText}`);
    this.name = "ApiError";
    this.status = response.status;
    this.statusText = response.statusText;
  }
}

/**
 * SWRに渡すための汎用フェッチャー関数
 * @param url - 取得先のURL
 * @returns - 成功した場合はJSONパースされたレスポンス、失敗した場合はApiErrorをスロー
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);

  // レスポンスが成功でない場合 (ステータスコードが 200-299 の範囲外)
  if (!res.ok) {
    throw new ApiError(res);
  }

  return res.json();
};

