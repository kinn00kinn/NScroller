import NextAuth from "next-auth";
// lib/auth.ts から v4 の設定をインポート
import { authOptions } from "@/app/lib/auth";

// v4 の方法でハンドラを初期化
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };