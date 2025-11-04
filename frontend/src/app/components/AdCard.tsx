import { Coffee } from "lucide-react"; // ★ Coffee アイコンをインポート

/**
 * 広告を表示するためのダミーコンポーネント
 */
export default function AdCard() {
  // 広告カードは props を受け取らない (key のみ Timeline.tsx で渡される)
  return (
    // ★ relative を追加して、[広告募集]を右上に配置
    <div className="relative block w-full p-4 border-b-2 border-black bg-gray-50">
      {/* ★ [広告募集] ラベルを右上に配置 */}
      <span className="absolute top-2 right-2 text-xs font-bold text-gray-500" >
        
        <a href="/ads">[広告募集]</a>
      </span>
      

      {/* ★ h-24 を削除し、padding で高さを確保 (py-8) */}
      <div className="flex items-center justify-center py-8">
        {/* ★ コーヒーアイコンとリンクを一つの <a> タグでグループ化 */}
        <a
          href="https://buymeacoffee.com/haruki10093" // リンクを更新
          target="_blank"
          rel="noopener noreferrer"
          // ★ グループ全体にホバーエフェクトを適用
          className="flex items-center space-x-2 text-sm font-bold text-purple-700 hover:text-purple-900 transition-colors"
        >
          <Coffee size={18} />
          <span>Buy Me a Coffee</span>
        </a>
      </div>
    </div>
  );
}

