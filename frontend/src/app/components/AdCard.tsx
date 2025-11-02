/**
 * 広告を表示するためのダミーコンポーネント
 */
export default function AdCard() {
  // 広告カードは props を受け取らない (key のみ Timeline.tsx で渡される)
  return (
    <div className="block w-full p-4 border-b-2 border-black bg-gray-50">
      <div className="flex items-center justify-center h-24">
        <span className="text-sm font-bold text-gray-600">[ 広告 ]</span>
      </div>
    </div>
  );
}
