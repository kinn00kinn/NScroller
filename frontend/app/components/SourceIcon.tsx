import {
  Code2,
  BookOpen,
  BrainCircuit,
  Building,
  Newspaper,
} from "lucide-react";

type Props = {
  sourceName: string;
};

/**
 * source_name に応じて、"棒人間" の代わりとなるアイコンを返す
 */
export default function SourceIcon({ sourceName }: Props) {
  let IconComponent;

  // source_name の文字列でアイコンを分岐
  if (sourceName.includes("arXiv")) {
    IconComponent = BookOpen; // 棒人間が論文を読んでる
  } else if (sourceName.includes("Zenn") || sourceName.includes("Qiita")) {
    IconComponent = Code2; // 棒人間がコーディングしてる
  } else if (sourceName.includes("OpenAI")) {
    IconComponent = BrainCircuit; // AIと話してる
  } else if (sourceName.includes("Meta") || sourceName.includes("Google")) {
    IconComponent = Building; // 巨大企業のビルにいる
  } else {
    IconComponent = Newspaper; // 一般ニュース
  }

  // アイコンを中央揃えの黒い円で囲む
  return (
    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-black flex items-center justify-center bg-white">
      <IconComponent size={24} className="text-black" />
    </div>
  );
}
