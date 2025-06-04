'use client';
import { useEffect, useState } from 'react';

interface Analytics {
  todayStats: Record<string, unknown>;
  weeklyStats: Record<string, unknown>;
  topCookieTypes: { name: string; count: number }[];
  menuHistoryCount: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!data) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div>
        <h2 className="font-semibold">Today</h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <pre className="bg-gray-100 p-2 text-sm">{JSON.stringify(data.todayStats as any, null, 2)}</pre>
      </div>
      <div>
        <h2 className="font-semibold">This Week</h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <pre className="bg-gray-100 p-2 text-sm">{JSON.stringify(data.weeklyStats as any, null, 2)}</pre>
      </div>
      <div>
        <h2 className="font-semibold">Top Cookie Types</h2>
        <ul className="list-disc pl-4">
          {data.topCookieTypes.map((t) => (
            <li key={t.name}>{t.name}: {t.count}</li>
          ))}
        </ul>
      </div>
      <p>Total menus analyzed: {data.menuHistoryCount}</p>
    </div>
  );
}
