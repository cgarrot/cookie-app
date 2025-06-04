import { create } from 'zustand';

const STORAGE_KEYS = {
  MENU_HISTORY: 'cookie-menu-history',
  ALL_SESSIONS: 'cookie-all-sessions',
  CURRENT_MENU: 'cookie-current-menu',
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export interface TrayImage {
  file: File;
  result?: unknown;
}

interface CookieState {
  menuReference: unknown;
  menuImage: File | null;
  isAnalyzingMenu: boolean;
  menuError: string | null;

  currentTrayImages: TrayImage[];
  isAnalyzingTrays: boolean;
  trayError: string | null;

  allSessions: unknown[];
  menuHistory: unknown[];

  sessionSummary: unknown | null;

  startNewSession: () => void;
  analyzeAllTrays: () => Promise<void>;
  completeSession: () => void;

  setMenuImage: (file: File | null) => void;
  analyzeMenu: () => Promise<void>;
  addTrayImage: (file: File) => void;
  analyzeTray: (index: number) => Promise<void>;
}

export const useCookieStore = create<CookieState>((set, get) => ({
  menuReference: load(STORAGE_KEYS.CURRENT_MENU, null),
  menuImage: null,
  isAnalyzingMenu: false,
  menuError: null,

  currentTrayImages: [],
  isAnalyzingTrays: false,
  trayError: null,

  allSessions: load(STORAGE_KEYS.ALL_SESSIONS, []),
  menuHistory: load(STORAGE_KEYS.MENU_HISTORY, []),

  sessionSummary: null,

  setMenuImage: (file) => set({ menuImage: file }),

  analyzeMenu: async () => {
    const { menuImage } = get();
    if (!menuImage) return;
    set({ isAnalyzingMenu: true, menuError: null });
    const body = new FormData();
    body.append('file', menuImage);
    try {
      const res = await fetch('/api/menu/analyze', { method: 'POST', body });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'error');
      }
      const data = await res.json();
      set((state) => {
        const history = [...state.menuHistory, data];
        save(STORAGE_KEYS.MENU_HISTORY, history);
        save(STORAGE_KEYS.CURRENT_MENU, data);
        return { menuReference: data, menuHistory: history };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      set({ menuError: message });
    } finally {
      set({ isAnalyzingMenu: false });
    }
  },

  startNewSession: () =>
    set({ currentTrayImages: [], sessionSummary: null, trayError: null }),

  addTrayImage: (file) =>
    set((state) => ({ currentTrayImages: [...state.currentTrayImages, { file }] })),

  analyzeTray: async (index) => {
    const image = get().currentTrayImages[index];
    if (!image) return;
    const body = new FormData();
    body.append('file', image.file);
    set({ isAnalyzingTrays: true, trayError: null });
    try {
      const res = await fetch('/api/tray/analyze', { method: 'POST', body });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'error');
      }
      const data = await res.json();
      set((state) => {
        const imgs = [...state.currentTrayImages];
        imgs[index] = { ...imgs[index], result: data };
        return { currentTrayImages: imgs };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      set({ trayError: message });
    } finally {
      set({ isAnalyzingTrays: false });
    }
  },

  analyzeAllTrays: async () => {
    const { currentTrayImages } = get();
    set({ isAnalyzingTrays: true, trayError: null });
    for (let i = 0; i < currentTrayImages.length; i++) {
      await get().analyzeTray(i);
    }
    set({ isAnalyzingTrays: false });
  },

  completeSession: () => {
    const { currentTrayImages, menuReference } = get();
      const aggregateSessionResults = (trayImages: TrayImage[]) => {
        const cookieTypeCounts: Record<string, number> = {};
        const totalCookies = trayImages.reduce((sum, img) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result: any = img.result;
          if (result?.cookieTypes) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.cookieTypes.forEach((type: any) => {
              cookieTypeCounts[type.name] = (cookieTypeCounts[type.name] || 0) + type.count;
            });
          }
          return sum + (result?.totalCount || 0);
        }, 0);
      return {
        totalCookies,
        aggregatedTypes: Object.entries(cookieTypeCounts).map(([name, count]) => ({ name, count })),
      };
    };

    const summary = aggregateSessionResults(currentTrayImages);
    const session = {
      id: `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('fr-FR'),
      imagesCount: currentTrayImages.length,
      ...summary,
      images: currentTrayImages.map((img) => ({ name: img.file.name, size: img.file.size, result: img.result })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      menuReferenceId: (menuReference as any)?.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      menuVersion: (menuReference as any)?.version,
    };

    set((state) => {
      const sessions = [...state.allSessions, session];
      save(STORAGE_KEYS.ALL_SESSIONS, sessions);
      return { allSessions: sessions, sessionSummary: summary, currentTrayImages: [] };
    });
  },
}));
