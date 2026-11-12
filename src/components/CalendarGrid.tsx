import { COMMITTEE, type CommitteeMember } from '../lib/constants';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  year: number;
  /** 0-indexed month: 11 = December */
  month: number;
  /** availability days per member, indexed by member.index */
  memberDays: Set<number>[];
  myIndex: number | null;
  onToggle: (day: number) => void;
}

export default function CalendarGrid({ year, month, memberDays, myIndex, onToggle }: Props) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          {new Date(year, month, 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <p className="text-xs text-gray-500">
          {myIndex === null ? '只读模式：请先在上方选择您的身份' : '点击日期标记有空，再次点击取消'}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
        {WEEKDAYS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`empty-${i}`} aria-hidden="true" />
          ) : (
            <DayCell
              key={day}
              day={day}
              weekday={new Date(year, month, day).getDay()}
              memberDays={memberDays}
              myIndex={myIndex}
              onToggle={onToggle}
            />
          ),
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="text-gray-400">图例：</span>
        {COMMITTEE.map((member) => (
          <span key={member.index} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: member.color }}
              aria-hidden="true"
            />
            {member.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="rounded border border-green-600 bg-green-50 px-1 font-semibold text-green-700">
            ✓
          </span>
          三人共同空闲
        </span>
      </div>
    </section>
  );
}

interface DayCellProps {
  day: number;
  weekday: number;
  memberDays: Set<number>[];
  myIndex: number | null;
  onToggle: (day: number) => void;
}

function DayCell({ day, weekday, memberDays, myIndex, onToggle }: DayCellProps) {
  const isWeekend = weekday === 0 || weekday === 6;
  const selectedBy: CommitteeMember[] = COMMITTEE.filter((m) =>
    memberDays[m.index]?.has(day),
  );
  const isFull = selectedBy.length === COMMITTEE.length;
  const isMine = myIndex !== null && Boolean(memberDays[myIndex]?.has(day));
  const mineColor = myIndex !== null ? COMMITTEE[myIndex]?.color : undefined;

  let cellClass =
    'relative flex h-14 flex-col items-center justify-center rounded-lg border text-sm sm:h-16 ';
  if (isFull) {
    cellClass += 'border-2 border-green-600 bg-green-50 font-semibold text-green-900 ';
  } else if (isWeekend) {
    cellClass += 'border-transparent bg-gray-100 text-gray-400 ';
  } else {
    cellClass += 'border-gray-200 bg-white text-gray-700 ';
  }
  if (myIndex === null) {
    cellClass += 'cursor-default ';
  } else {
    cellClass += isFull ? 'cursor-pointer hover:border-green-800 ' : 'cursor-pointer hover:border-gray-400 ';
  }

  return (
    <button
      type="button"
      disabled={myIndex === null}
      onClick={() => onToggle(day)}
      className={cellClass}
      aria-label={`Dec ${day}: ${selectedBy.length}/${COMMITTEE.length} available`}
      title={`Dec ${day} — ${selectedBy.map((m) => m.name).join(', ') || '暂无老师标记'}`}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full"
        style={isMine && mineColor ? { boxShadow: `0 0 0 2px ${mineColor}` } : undefined}
      >
        {day}
      </span>
      <span className="mt-1 flex gap-1" aria-hidden="true">
        {COMMITTEE.map((member) => (
          <span
            key={member.index}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: selectedBy.includes(member) ? member.color : '#E5E7EB',
            }}
          />
        ))}
      </span>
      {isFull && (
        <span
          className="absolute right-1 top-0.5 text-xs font-bold text-green-700"
          aria-hidden="true"
        >
          ✓
        </span>
      )}
    </button>
  );
}
