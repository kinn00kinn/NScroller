/**
 * 広告を表示するためのダミーコンポーネント
 */
export default function AdCard() {
  // 広告カードは props を受け取らない (key のみ Timeline.tsx で渡される)
  return (
    <div className="block w-full p-4 border-b-2 border-black bg-gray-50">
      <div className="flex items-center justify-center h-24">
        {/* ★ 「Buy Me a Coffee」のリンクを追加 */}
        <a
          href="https://buymeacoffee.com/haruki10093" // あなたのBuy Me a CoffeeのURLに置き換えてください
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-purple-700 hover:underline"
        >
          Buy Me a Coffee
        </a>
      </div>
    </div>
  );
}
