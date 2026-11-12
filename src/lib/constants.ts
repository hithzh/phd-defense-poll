export const DEFENSE_YEAR = 2026;
/** 0-indexed month: 11 = December */
export const DEFENSE_MONTH = 11;

export interface CommitteeMember {
  index: number;
  name: string;
  color: string;
}

export const COMMITTEE: CommitteeMember[] = [
  { index: 0, name: 'Prof. Zhang Qichun', color: '#A6192E' },
  { index: 1, name: 'Prof. Li Quan', color: '#1565C0' },
  { index: 2, name: 'Prof. YU Wing Chi', color: '#2E7D32' },
];

export const GREETING =
  '各位老师好，我是材料科学与工程系的博士生 HUANG ZHIHAO。麻烦您先点选下方自己的姓名，再在日历上勾选 12 月方便参加答辩的日期。三人共同空闲的日期会自动以绿色高亮标出，也可以在右侧「Best Dates」一栏查看。感谢您拨冗配合！';

export const STORAGE_KEY = 'defense-poll:member-index';
