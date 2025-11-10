"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ページ遷移後もスクロール位置が保持されるのを防ぐ
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <motion.div
      ref={mainRef}
      // pathname を key に設定することで、ページ遷移を検知します
      key={pathname}
      // 初期状態（透明）
      initial={{ opacity: 0 }}
      // 表示状態（不透明）
      animate={{ opacity: 1 }}
      // 終了状態（透明）
      exit={{ opacity: 0 }}
      // アニメーションの詳細（0.25秒のイーズインアウト）
      transition={{ type: "tween", ease: "easeInOut", duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
