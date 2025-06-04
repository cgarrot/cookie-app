"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [cookies, setCookies] = useState(0);

  const addCookie = () => {
    setCookies(cookies + 1);
  };

  const resetCookies = () => {
    setCookies(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍪 Cookie Counter
          </h1>
          <p className="text-gray-600">Click to collect cookies!</p>
        </div>

        <div className="mb-8">
          <div className="text-8xl mb-4">🍪</div>
          <div className="text-6xl font-bold text-orange-600 mb-2">
            {cookies}
          </div>
          <p className="text-gray-500">
            {cookies === 0 && "No cookies yet!"}
            {cookies === 1 && "You have 1 cookie!"}
            {cookies > 1 && `You have ${cookies} cookies!`}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={addCookie}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 text-xl"
          >
            Get Cookie! 🍪
          </button>

          {cookies > 0 && (
            <button
              onClick={resetCookies}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-6 rounded-xl transition-colors duration-200"
            >
              Reset Cookies
            </button>
          )}
        </div>

        <div className="mt-8 space-y-2 text-sm text-gray-600">
          <p>
            <Link className="text-blue-600 underline" href="/menu">Analyze Menu</Link>
            {" | "}
            <Link className="text-blue-600 underline" href="/tray">Analyze Trays</Link>
            {" | "}
            <Link className="text-blue-600 underline" href="/analytics">Analytics</Link>
          </p>
          <p className="text-gray-400">Made with Next.js & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
