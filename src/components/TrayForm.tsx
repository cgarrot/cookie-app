'use client';
import { useCookieStore } from '../store/useCookieStore';
import { useCallback } from 'react';

export function TrayForm() {
  const {
    addTrayImage,
    currentTrayImages,
    analyzeTray,
    analyzeAllTrays,
    completeSession,
    startNewSession,
    sessionSummary,
    isAnalyzingTrays,
    trayError,
  } = useCookieStore();

  const handleFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      for (const file of files) addTrayImage(file);
    },
    [addTrayImage]
  );

  return (
    <div className="space-y-4">
      <div className="space-x-2">
        <button className="bg-gray-200 px-2 py-1 rounded" onClick={startNewSession}>New Session</button>
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded"
          disabled={currentTrayImages.length === 0 || isAnalyzingTrays}
          onClick={analyzeAllTrays}
        >
          {isAnalyzingTrays ? 'Analyzing...' : 'Analyze All'}
        </button>
        <button
          className="bg-green-500 text-white px-2 py-1 rounded"
          disabled={currentTrayImages.some((i) => !i.result)}
          onClick={completeSession}
        >
          Save Session
        </button>
      </div>

      <input type="file" multiple accept="image/*" onChange={handleFiles} />
      {trayError && <p className="text-red-500">{trayError}</p>}
      <ul>
        {currentTrayImages.map((img, idx) => (
          <li key={idx} className="border p-2 my-2">
            <div className="flex items-center justify-between">
              <span>{img.file.name}</span>
              <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => analyzeTray(idx)}>
                Analyze
              </button>
            </div>
            {Boolean(img.result) && (
              <>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <pre className="bg-gray-100 mt-2 p-2 overflow-auto text-sm max-h-64">{JSON.stringify(img.result as any, null, 2)}</pre>
              </>
            )}
          </li>
        ))}
      </ul>

      {Boolean(sessionSummary) && (
        <div className="bg-green-100 p-4 rounded">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <pre className="text-sm">{JSON.stringify(sessionSummary as any, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
