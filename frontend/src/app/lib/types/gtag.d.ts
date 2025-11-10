/**
 * Google Analytics (gtag.js) のためのグローバル型定義
 */
declare global {
  interface Window {
    // window.gtag が存在しうることをTypeScriptに伝えます
    // ? をつけてオプショナル（存在しなくてもよい）にします
    gtag?: (
      command: 'config' | 'js', 
      payload: string | Date, 
      options?: { page_path?: string }
    ) => void;
    
    // dataLayer も同様に定義します
    dataLayer?: any[];
  }
}

// このファイルがグローバルな型定義であることを示しつつ、
// モジュールとして正しく認識させるためのおまじない
export {};