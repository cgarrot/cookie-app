'use client';
import { useCookieStore } from '../store/useCookieStore';
import { useCallback } from 'react';

export function MenuForm() {
  const { menuImage, setMenuImage, analyzeMenu, isAnalyzingMenu, menuReference, menuError } = useCookieStore();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setMenuImage(file);
  }, [setMenuImage]);

  return (
    <div className="space-y-4">
      <input type="file" accept="image/*" onChange={handleFile} />
      <button disabled={!menuImage || isAnalyzingMenu} onClick={analyzeMenu} className="bg-orange-500 text-white px-4 py-2 rounded">
        {isAnalyzingMenu ? 'Analyzing...' : 'Analyze Menu'}
      </button>
      {menuError && <p className="text-red-500">{menuError}</p>}
      {Boolean(menuReference) && (
        <>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <pre className="bg-gray-100 p-2 overflow-auto text-sm max-h-64">{JSON.stringify(menuReference as any, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
