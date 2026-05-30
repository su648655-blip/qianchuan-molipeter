# 千川CRM 部署指南（5分钟完成）

本指南面向无技术背景的团队管理员，只需在网页上点几下即可完成部署。

---

## 你需要准备

1. **一个手机号或邮箱** — 注册用
2. **大约 5 分钟时间**

---

## 第一步：注册 Supabase（免费数据库）

1. 打开 https://supabase.com 点击右上角 **"Start your project"**
2. 用 GitHub 账号登录（没有就点 "Sign up with email"）
3. 登录后点 **"New project"**
4. 填写：
   - **Name**: `qianchuan-crm`
   - **Database Password**: 设置一个密码，记下来
   - **Region**: 选 `Singapore`（离中国最近，速度最快）
5. 点 **"Create new project"**，等待 1-2 分钟

### 配置数据库表

6. 项目创建后，左侧菜单找到 **"SQL Editor"** → 点 **"New query"**
7. 把以下文件内容全部复制粘贴进去：`/Users/peter/Documents/千川CRM/supabase/schema.sql`
8. 点击 **"Run"** 执行，等显示绿色成功
9. ✅ 数据库就绪

### 获取配置密钥

10. 左侧菜单点 **"Project Settings"** → **"API"**
11. 把下面两个值记下来（后面要用）：
    - **Project URL** → 这就是 `VITE_SUPABASE_URL`
    - **anon public** → 这就是 `VITE_SUPABASE_ANON_KEY`
12. 左侧菜单点 **"Settings"** → **"API"** → 往下翻到 **"Service Role Key"** → 点 **"Copy"** → 这就是 `SUPABASE_SERVICE_ROLE_KEY`

---

## 第二步：部署到 Vercel（免费托管）

1. 打开 https://vercel.com 用 GitHub 账号登录
2. 点 **"Add New..."** → **"Project"**
3. 点 **"Import Third-Party Git Repository"** 或者直接上传项目文件夹
   - 最简单的方法：选 **"Deploy without Git"**，然后上传 `/Users/peter/Documents/千川CRM/` 整个文件夹
4. 在 **"Environment Variables"** 区域，添加以下三个变量：

| 名称 | 值 |
|------|-----|
| `VITE_SUPABASE_URL` | 第一步记下的 Project URL |
| `VITE_SUPABASE_ANON_KEY` | 第一步记下的 anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | 第一步记下的 Service Role Key |

5. **Framework Preset** 选 **"Vite"**
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`
8. 点 **"Deploy"**，等待 1 分钟
9. ✅ 部署完成！你会看到一个 `https://xxx.vercel.app` 的链接，点进去即可使用

---

## 第三步：初始化种子数据

1. 部署成功后，在浏览器地址栏输入 `https://你的域名/api/seed`（按回车）
2. 页面显示 `{"ok":true,"count":10}` 就说明成功了
3. 现在用以下账号登录：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 销售员 | zhangwei | qw123 |

---

## 日常管理数据

- **查看数据库**：登录 supabase.com → 你的项目 → **Table Editor** → 可以看到所有表，直接增删改查
- **导出数据**：在 Table Editor 中点表格右上角的 **"Export to CSV"**
- **管理用户**：登录 CRM 后点 **员工管理** 即可创建/禁用/重置密码

---

## 升级注意事项

以后你修改了代码，只需要重新把项目文件夹上传到 Vercel 重新部署即可，数据保留在 Supabase 中不会丢失。
