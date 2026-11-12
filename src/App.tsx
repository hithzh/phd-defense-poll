import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { COMMITTEE, DEFENSE_MONTH, DEFENSE_YEAR, GREETING, STORAGE_KEY } from './lib/constants';
import IdentitySelector from './components/IdentitySelector';
import CalendarGrid from './components/CalendarGrid';
import BestDates from './components/BestDates';

interface AvailabilityRow {
  member_index: number;
  day: number;
}

function readStoredIndex(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return COMMITTEE.some((m) => m.index === value) ? value : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [myIndex, setMyIndex] = useState<number | null>(readStoredIndex);
  const [marks, setMarks] = useState<Set<string>>(new Set());
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const fetchMarks = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('availability').select('member_index, day');
    if (error) {
      setConnectionError(true);
      return;
    }
    setConnectionError(false);
    setInitialLoaded(true);
    setMarks(new Set((data as AvailabilityRow[]).map((row) => `${row.member_index}-${row.day}`)));
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    void fetchMarks();

    // 实时订阅：任何老师勾选/取消，其他人立刻收到
    const channel = client
      .channel('availability-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability' },
        () => void fetchMarks(),
      )
      .subscribe();

    // 5 秒轮询兜底，防止 realtime 偶发断连
    const poll = setInterval(() => void fetchMarks(), 5000);

    return () => {
      void client.removeChannel(channel);
      clearInterval(poll);
    };
  }, [fetchMarks]);

  const handleSelect = useCallback((index: number | null) => {
    setMyIndex(index);
    try {
      if (index === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(index));
    } catch {
      // localStorage 不可用时忽略，仅影响记忆身份
    }
  }, []);

  const toggleDay = useCallback(
    async (day: number) => {
      if (myIndex === null || !supabase || !initialLoaded) return;
      const key = `${myIndex}-${day}`;
      if (marks.has(key)) {
        // 乐观更新：先改本地状态，再同步数据库
        setMarks((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        const { error } = await supabase
          .from('availability')
          .delete()
          .match({ member_index: myIndex, day });
        if (error) void fetchMarks();
      } else {
        setMarks((prev) => new Set(prev).add(key));
        const { error } = await supabase
          .from('availability')
          .insert({ member_index: myIndex, day });
        if (error) void fetchMarks();
      }
    },
    [myIndex, marks, initialLoaded, fetchMarks],
  );

  const memberDays = useMemo(() => {
    const result: Set<number>[] = COMMITTEE.map(() => new Set<number>());
    for (const key of marks) {
      const separator = key.indexOf('-');
      const member = Number(key.slice(0, separator));
      const day = Number(key.slice(separator + 1));
      if (result[member]) result[member].add(day);
    }
    return result;
  }, [marks]);

  const commonDays = useMemo(() => {
    const daysInMonth = new Date(DEFENSE_YEAR, DEFENSE_MONTH + 1, 0).getDate();
    const result: number[] = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (memberDays.every((set) => set.has(day))) result.push(day);
    }
    return result;
  }, [memberDays]);

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">配置缺失</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            尚未配置 Supabase 连接信息。请参考 README：在项目根目录创建 .env 文件，填入
            VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY，然后重新构建或重新部署。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            City University of Hong Kong · Department of Materials Science and Engineering
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            PhD Thesis Defense Date Poll
          </h1>
          <p className="mt-3 text-sm text-gray-700">HUANG ZHIHAO · Student ID 56691391</p>
          <p className="text-sm text-gray-500">PhD Thesis Defense · December 2026</p>
        </header>

        <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm leading-relaxed text-gray-600 shadow-sm">
          {GREETING}
        </div>

        <IdentitySelector selected={myIndex} onSelect={handleSelect} />

        {connectionError && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            数据库连接失败，正在自动重试，当前显示的可能不是最新状态。请检查网络或 Supabase 配置。
          </div>
        )}

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <CalendarGrid
            year={DEFENSE_YEAR}
            month={DEFENSE_MONTH}
            memberDays={memberDays}
            myIndex={myIndex}
            onToggle={(day) => void toggleDay(day)}
          />
          <BestDates days={commonDays} />
        </div>
      </main>
    </div>
  );
}
