"use client";

import Timeline from "@/app/components/Timeline";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, X } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside of the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Function to scroll to the top of the page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex justify-center bg-white text-black">
      <div className="w-full max-w-xl bg-white">
        {/* Header: Sticky GIF banner */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
          <div
            onClick={scrollToTop}
            className="border-b-2 border-black flex justify-center cursor-pointer"
          >
            <Image
              src="/Pando_banner_1000.gif"
              alt="NScroller Banner"
              width={1000}
              height={100}
              className="w-10/12 h-auto"
              unoptimized
            />
          </div>
        </header>

        {/* Main timeline content */}
        <main className="border-x-2 border-b-2 border-black">
          <Timeline />
        </main>

        {/* Floating Action Button and Menu */}
        <div ref={menuRef} className="fixed bottom-4 right-4 z-20 flex flex-col items-end sm:right-8">
          {/* Menu Panel */}
          {isMenuOpen && (
            <div className="bg-white border-2 border-black rounded-lg shadow-lg mb-2 w-64 overflow-hidden">
              <div className="p-3 border-b-2 border-black">
                {status === "loading" ? (
                  <p className="text-sm animate-pulse">Loading...</p>
                ) : session ? (
                  <div className="flex items-center gap-3">
                    <Image
                      src={session.user.image!}
                      alt={session.user.name!}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="text-sm font-bold truncate">{session.user.name}</span>
                  </div>
                ) : (
                  <p className="text-sm font-bold">Not signed in</p>
                )}
              </div>
              <div className="flex flex-col text-sm">
                {session ? (
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left w-full px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signIn("google");
                      setIsMenuOpen(false);
                    }}
                    className="text-left w-full px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    Sign in with Google
                  </button>
                )}
                <Link
                  href="/links"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  インフォメーション
                </Link>
              </div>
            </div>
          )}

          {/* FAB */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-black text-white w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shadow-lg hover:bg-gray-800 transition-transform active:scale-95"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={30} />
            ) : session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="User Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={30} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}