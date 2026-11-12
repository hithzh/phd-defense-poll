import { DEFENSE_MONTH, DEFENSE_YEAR } from '../lib/constants';

interface Props {
  days: number[];
}

export default function BestDates({ days }: Props) {
  return (
    <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">Best Dates</h2>
      <p className="mt-1 text-xs text-gray-500">三位答辩委员共同空闲的日期（实时更新）</p>

      {days.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
          暂无三人共同空闲的日期
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {days.map((day) => {
            const date = new Date(DEFENSE_YEAR, DEFENSE_MONTH, day);
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <li
                key={day}
                className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                {monthDay} ({weekday})
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
