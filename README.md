# PhD Thesis Defense Date Poll — HUANG ZHIHAO

一个类似 Doodle 的多人实时日期协调页面，用于收集三位答辩委员在 **2026 年 12 月** 方便参加博士答辩的日期。

## 功能特性

- **无需登录**：老师打开页面后点选自己的身份卡片，浏览器（localStorage）会记住身份
- **日历勾选**：2026 年 12 月日历上点击日期 = 标记自己那天有空，再次点击 = 取消
- **实时同步**：Supabase Realtime 订阅 + 5 秒轮询双保险，任何老师勾选/取消，其他人立刻看到
- **状态圆点**：每个日期显示三个彩色圆点（红 / 蓝 / 绿），亮 = 该老师选了这天
- **智能高亮**：三人共同空闲的日期 → 绿色背景 + 绿色边框 + 右上角 ✓；周末浅灰背景
- **Best Dates 侧栏**：汇总所有三人共同空闲日期（如 `Dec 15 (Tue)`），按日期排序
- **只读模式**：未选身份时只能查看，不能修改
- **响应式**：桌面端日历与侧栏并排，移动端日历在上、Best Dates 在下

## 技术栈

- 前端：React 18 + Vite 5 + TypeScript + Tailwind CSS 3
- 数据库：Supabase（Postgres + Realtime，免费层即可）
- 部署：Vercel（静态托管）

---

## 第一步：创建 Supabase 数据库

1. 注册 / 登录 [supabase.com](https://supabase.com)，点击 **New project** 创建一个免费项目（区域建议选 Singapore，数据库密码自行保存）。
2. 项目就绪后，左侧菜单打开 **SQL Editor**，新建查询，把 [`supabase/schema.sql`](supabase/schema.sql) 的全部内容粘贴进去并点击 **Run**。脚本会自动完成：
   - 创建 `availability` 表（初始为空）
   - 启用 RLS 并放行匿名 select / insert / delete
   - 把表加入 `supabase_realtime` 发布（实时同步必需）
3. 打开 **Project Settings → API**，记下两个值：
   - **Project URL**：形如 `https://xxxxx.supabase.co`
   - **anon public key**：一长串 `eyJ...` 开头的字符串

> 安全说明：anon key 本来就是设计为公开使用的前端密钥，真正的安全边界是 RLS。本应用没有用户体系和敏感数据，放行匿名读写是合理的。

## 第二步：本地运行

前置要求：Node.js ≥ 18。

```bash
npm install

# Windows PowerShell:
Copy-Item .env.example .env
# macOS / Linux:
cp .env.example .env
```

编辑 `.env`，填入第一步拿到的两个值：

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

启动开发服务器：

```bash
npm run dev
```

打开终端显示的地址（默认 <http://localhost:5173>）即可使用。

## 第三步：部署到 Vercel

### 方式 A：通过 GitHub（推荐）

1. 把本项目推送到一个 GitHub 仓库（注意 `.env` 已被 gitignore，不会被提交）。
2. 登录 [vercel.com](https://vercel.com) → **Add New → Project** → 导入该仓库。
3. Framework Preset 会自动识别为 **Vite**，构建命令与输出目录保持默认（`npm run build` / `dist`）。
4. 展开 **Environment Variables**，添加两条（Production / Preview 都勾选）：

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | 你的 Project URL |
   | `VITE_SUPABASE_ANON_KEY` | 你的 anon key |

5. 点击 **Deploy**。部署完成后，把 Vercel 分配的链接发给三位老师即可。

### 方式 B：Vercel CLI

```bash
npm i -g vercel
vercel                    # 首次会引导登录与项目初始化
vercel env add VITE_SUPABASE_URL production        # 按提示粘贴值
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod
```

> 注意：Vite 的环境变量在**构建时**注入。在 Vercel 后台修改环境变量后，需要 **Redeploy** 一次才生效。

---

## 数据模型

表 `availability`（初始为空）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键，自动生成 |
| `member_index` | int | 0 / 1 / 2，对应 Zhang Qichun / Li Quan / YU Wing Chi |
| `day` | int | 1–31，2026 年 12 月的某一天 |
| `created_at` | timestamptz | 创建时间 |

约束：`(member_index, day)` 唯一。前端勾选即插入、取消即删除，不存在更新操作。

## 常用运维 SQL

清空所有标记（重新开始协调）：

```sql
truncate table public.availability;
```

确认 realtime 已启用（应返回一行）：

```sql
select * from pg_publication_tables
where pubname = 'supabase_realtime' and tablename = 'availability';
```

> 如果你在 Dashboard 里删除并重建了表，需要重新执行 schema.sql 中的
> `alter publication supabase_realtime add table public.availability;`。

## 项目结构

```
├── index.html
├── supabase/
│   └── schema.sql            # 数据库初始化脚本（在 Supabase SQL Editor 运行）
├── src/
│   ├── App.tsx               # 主逻辑：状态管理、实时订阅、5 秒轮询
│   ├── components/
│   │   ├── IdentitySelector.tsx   # 三位老师身份卡片
│   │   ├── CalendarGrid.tsx       # 2026 年 12 月日历 + 日期格子
│   │   └── BestDates.tsx          # 三人共同空闲日期侧栏
│   └── lib/
│       ├── constants.ts      # 委员姓名 / 颜色 / 年月 / 问候语
│       └── supabase.ts       # Supabase 客户端
├── .env.example
└── package.json
```

## 本地构建产物预览

```bash
npm run build     # 产物输出到 dist/
npm run preview   # 本地静态预览构建结果
```

部署到 Vercel 后即为生产可用状态，直接把链接发给三位老师使用。
