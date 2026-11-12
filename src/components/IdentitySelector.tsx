import { COMMITTEE } from '../lib/constants';

interface Props {
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export default function IdentitySelector({ selected, onSelect }: Props) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-gray-700">请点选您的身份（仅三位答辩委员）</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {COMMITTEE.map((member) => {
          const isSelected = selected === member.index;
          return (
            <button
              key={member.index}
              type="button"
              onClick={() => onSelect(isSelected ? null : member.index)}
              aria-pressed={isSelected}
              className={`relative rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
                isSelected ? 'shadow-md' : 'border-gray-200'
              }`}
              style={
                isSelected
                  ? { borderColor: member.color, boxShadow: `0 0 0 2px ${member.color}` }
                  : undefined
              }
            >
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: member.color }}
                aria-hidden="true"
              />
              <span className="mt-2 block text-sm font-semibold text-gray-900">{member.name}</span>
              <span className="mt-0.5 block text-xs text-gray-500">答辩委员</span>
              {isSelected && (
                <span
                  className="absolute right-3 top-3 text-sm font-bold"
                  style={{ color: member.color }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        再次点击已选中的卡片可取消身份、回到只读模式；您的身份会保存在当前浏览器中。
      </p>
    </section>
  );
}
