// frontend/src/app/lib/types/next-auth.d.ts
// (このファイルを新しく作成してください)

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

/**
 * NextAuth の Session と User の型を拡張します。
 * SupabaseAdapter を使用すると、セッションの user オブジェクトに
 * 'id' (Supabaseのauth.usersテーブルのID) が自動的に追加されます。
 */

declare module "next-auth" {
  /**
   * 'session.user' に 'id' プロパティを追加
   */
  interface Session {
    user: {
      id: string; // <-- SupabaseのユーザーID (uuid)
    } & DefaultSession["user"]; // (name, email, image を継承)
  }

  /**
   * 'user' オブジェクト (adapterが返す) に 'id' を追加
   */
  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * JWTコールバックが返すトークンに 'id' を追加
   * (session: "database" 戦略では必須ではありませんが、念のため)
   */
  interface JWT {
    id?: string;
  }
}