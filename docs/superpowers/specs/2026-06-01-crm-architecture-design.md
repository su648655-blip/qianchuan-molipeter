# 千川CRM 系统诊断 & 架构设计方案

> 日期：2026-06-01
> 状态：设计草案

---

## 一、现状诊断报告

### 1.1 核心问题：God Context 反模式

**问题文件：** `src/store/AppContext.jsx`（516 行）

该文件**同时承担了以下所有职责**，严重违反了单一职责原则：

| 职责 | 行数 | 说明 |
|------|------|------|
| 认证管理 | ~40 行 | login/logout、session 恢复 |
| 用户管理 | ~30 行 | 增删改查 + 权限判断 |
| 客户(Lead)管理 | ~60 行 | 增删改查 + 分配 + 重复检查 |
| 合作客户(Advertiser)管理 | ~50 行 | 增删改查 + 指标管理 |
| 跟进记录管理 | ~30 行 | 增删改查 |
| API Key 管理 | ~20 行 | 保存/读取 |
| API 调用层 | ~80 行 | fetch + snake_case/camelCase 转换 |
| 数据持久化 | ~30 行 | localStorage 读写 |
| 种子数据初始化 | ~40 行 | generateSeedLeads/Advertisers 调用 |
| 数据加载 | ~60 行 | 首次 mount 时从 API 加载所有数据 |
| 值暴露 (Provider value) | ~20 行 | 组装 context value |

**后果：**
- 任何一个 `useState` 的变更可能触发多个 `useEffect`
- 数据一致性全靠手动在每个 callback 里补同步代码（上次的 Bug 就源于此）
- 测试几乎不可能
- 新人理解成本高

### 1.2 数据流问题：无单向数据流

当前数据流：

```
AppContext (516行)
  ├── useState → leads
  ├── useState → advertisers
  ├── useState → followups
  ├── useState → users
  ├── useState → apiKeys
  │
  ├── addLead() → setLeads + (手动) 不自动同步 advertisers
  ├── editLead() → setLeads + (手动) 现在会同步 advertisers
  ├── assignLead() → setLeads + (手动) 现在会同步 advertisers
  │
  ├── addAdvertiser() → setAdvertisers
  ├── editAdvertiser() → setAdvertisers + (手动) 同步 leads
  │
  ├── addFollowup() → setFollowups + (手动) 更新 lead 的 lastContactAt
  └── deleteLead() → setLeads + setFollowups + setAdvertisers（三处更新）
```

**问题：** 数据同步逻辑散落在各个 callback 里，没有统一的机制保证一致性。

### 1.3 类型安全问题

- 所有数据都是纯 JavaScript 对象，没有 TypeScript 或运行时校验
- API 返回数据通过手动写的 `fromSnakeLead/fromSnakeAdvertiser/fromSnakeFollowup` 转换，容易遗漏字段
- 数字字段（dailyBudget, currentConsumption, unitPrice, rebate）在表单中可能变成字符串

### 1.4 当前文件职责清单

```
src/
├── store/
│   └── AppContext.jsx         516行  ←  God Context（核心问题）
│
├── components/
│   ├── crm/
│   │   ├── CRMPage.jsx        363行  ← 客户列表 + 过滤 + 导入导出
│   │   ├── LeadModal.jsx       83行  ← 新增/编辑客户表单
│   │   ├── LeadDetail.jsx     106行  ← 客户详情 + 跟进时间轴
│   │   ├── AdvertiserPage.jsx 189行  ← 合作客户列表
│   │   ├── AdvertiserModal.jsx 83行  ← 新增/编辑合作客户表单
│   │   ├── AdvertiserDetail.jsx99行  ← 合作客户详情 + 投放数据
│   │   ├── Dashboard.jsx      253行  ← 工作台统计面板
│   │   ├── StatCards.jsx       44行  ← 快捷统计卡片
│   │   └── FollowupModal.jsx   51行  ← 跟进记录表单
│   ├── admin/
│   │   └── UserManagePage.jsx 124行  ← 员工管理
│   ├── ai/                    3个文件 ← AI 功能（独立，暂不纳入）
│   ├── auth/
│   │   └── LoginPage.jsx       70行  ← 登录页
│   └── layout/
│       ├── Navbar.jsx         119行  ← 顶部导航
│       └── MobileBottomBar.jsx 28行  ← 移动端底部导航
│
├── data/
│   ├── constants.js            71行  ← 枚举/常量/元数据
│   └── seed.js                 63行  ← 种子数据生成
│
├── lib/
│   └── utils.js                26行  ← 工具函数
│
├── App.jsx                     69行  ← 路由/布局
└── main.jsx                    10行  ← 入口

functions/
└── api/[[path]].js            266行  ← Cloudflare Functions API
```

### 1.5 已发现 Bug 清单（已修复）

| Bug | 根因 | 修复方式 |
|-----|------|----------|
| 客户改归属人→合作客户不同步 | 手动同步逻辑缺失 | 在 assignLead/editLead 中补 sync |
| 合作客户改归属人→客户不同步 | 手动同步逻辑缺失 | 在 editAdvertiser 中补 sync |
| editAdvertiser 未发送 lead_id 到后端 | API adapter 遗漏字段 | 补了 lead_id 映射 |
| 合作客户管理无负责人列/筛选 | 功能缺失 | 新增列和筛选 |
| 编辑合作客户时不能改关联客户 | 条件渲染限制 | 放开编辑模式的 leadId 下拉 |
| dailyBudget=0 被吞掉 | `|| ""` 吞 falsy | 改为 `!= null` 判断 |

---

## 二、目标架构设计

### 2.1 设计原则

1. **单向数据流** — 数据变更走统一通道，副作用自动触发
2. **分层清晰** — 每层只做一件事，通过接口通信
3. **数据一致性自动化** — 关联数据的同步由框架/中间件完成，不依赖手动写 sync
4. **可测试性** — 业务逻辑与 UI 解耦，可单独测试
5. **渐进式** — 不要求一次性重写，可以按模块逐步替换

### 2.2 分层架构

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  CRMPage / LeadModal / AdvertiserPage / Dashboard   │
│  只关心：渲染、用户交互、调用 action                  │
│  不关心：数据怎么来、怎么存、怎么同步                  │
└──────────────────────┬──────────────────────────────┘
                       │ 调用 action / 订阅 state
┌──────────────────────▼──────────────────────────────┐
│               State Layer (Zustand)                  │
│                                                      │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ useLeadStore │ │ useAdStore   │ │ useFollowStore│ │
│  │  leads       │ │  advertisers │ │  followups    │ │
│  │  CRUD actions│ │  CRUD actions│ │  CRUD actions │ │
│  └──────┬───────┘ └──────┬───────┘ └───────┬───────┘ │
│         │                 │                  │         │
│  ┌──────▼─────────────────▼──────────────────▼───────┐ │
│  │           Sync Middleware (自动同步层)             │ │
│  │  监听特定数据变更 → 自动更新关联实体               │ │
│  │  例: leads.assignedTo 变 → 自动同步 advertisers  │ │
│  └──────────────────────┬───────────────────────────┘ │
└─────────────────────────┼────────────────────────────┘
                          │ 调用 persist / api
┌─────────────────────────▼────────────────────────────┐
│            Persistence Layer                          │
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │ localStorage    │  │ API Adapter               │   │
│  │ 本地缓存/回退    │  │ snake_case ↔ camelCase   │   │
│  └─────────────────┘  │ fetch() 封装              │   │
│                        └──────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 2.3 具体模块划分

#### Store 层（替换 AppContext）

| Store 名称 | 职责 | 状态数据 |
|-----------|------|---------|
| `useAuthStore` | 认证、当前用户、权限判断 | currentUser, isAdmin |
| `useLeadStore` | 客户 CRUD、分配、重复检查 | leads[] |
| `useAdvertiserStore` | 合作客户 CRUD、指标管理 | advertisers[] |
| `useFollowupStore` | 跟进记录 CRUD | followups[] |
| `useUserStore` | 用户管理（管理员） | users[] |
| `useAppStore` | API Key、全局 UI 状态 | apiKey, editingKey |

#### Service 层（数据一致性）

| Service | 职责 |
|---------|------|
| `syncService` | 监听跨实体变更，自动执行同步（如 lead.assignedTo → advertiser） |
| `apiService` | 统一 HTTP 调用、错误处理、snake_case ↔ camelCase |
| `validationService` | 表单校验、重复检查、必填检查 |
| `persistService` | localStorage 读写，API fallback 逻辑 |

#### UI 层（保持不变，只调整数据源）

| 组件 | 调整 |
|------|------|
| CRMPage | `useApp().leads` → `useLeadStore()` |
| AdvertiserPage | `useApp().advertisers` → `useAdvertiserStore()` |
| LeadModal | 表单校验抽到 validationService |
| 其余 UI 组件 | 最小改动，只换数据源引用 |

### 2.4 数据一致性机制（核心设计）

**问题：** 目前数据同步是手动在每个 callback 里写的，容易遗漏。

**方案：** 使用 Zustand 的 `subscribe` 机制实现**声明式同步规则**：

```
// 示例：syncService 中的一条同步规则
SYNC_RULES = [
  {
    source: 'leads',
    field: 'assignedTo',
    target: 'advertisers',
    matchBy: (leadId, advertiser) => advertiser.leadId === leadId,
    apply: (newValue) => ({ assignedTo: newValue }),
  },
  {
    source: 'advertisers',
    field: 'assignedTo',
    target: 'leads',
    matchBy: (advertiserId, lead) => lead.id === data.leadId,
    apply: (newValue) => ({ assignedTo: newValue }),
  },
  {
    source: 'followups',
    event: 'added',
    target: 'leads',
    matchBy: (followup, lead) => lead.id === followup.leadId,
    apply: (followup) => ({
      lastContactAt: followup.contactAt || followup.createdAt,
      ...(followup.nextContactAt ? { nextContactAt: followup.nextContactAt } : {}),
    }),
  },
]
```

这样当 `leads.assignedTo` 变更时，系统**自动**更新关联的 `advertisers`，不需要在每个 action 里手动写 sync。

### 2.5 API 层设计

```
src/
└── api/
    ├── client.js          ← 统一 fetch 封装，错误处理
    ├── adapters.js        ← snake_case ↔ camelCase 转换
    ├── leads.js           ← /api/leads CRUD
    ├── advertisers.js     ← /api/advertisers CRUD
    ├── followups.js       ← /api/followups CRUD
    ├── users.js           ← /api/users CRUD
    ├── auth.js            ← /api/auth/login
    └── metrics.js         ← /api/metrics CRUD
```

### 2.6 迁移路径（渐进式，分 4 阶段）

```
阶段1：基础设施
  ├── 安装 zustand
  ├── 创建 api/ 目录和 api/client.js（统一 fetch）
  ├── 创建 api/adapters.js（snake_case 转换）
  └── 验证：现有功能不受影响

阶段2：拆分 Store
  ├── 创建 useAuthStore（从 AppContext 拆出认证）
  ├── 创建 useLeadStore（从 AppContext 拆出客户管理）
  ├── 创建 useAdvertiserStore（从 AppContext 拆出合作客户）
  ├── 创建 useFollowupStore（从 AppContext 拆出跟进记录）
  ├── 创建 useUserStore（从 AppContext 拆出用户管理）
  ├── AppContext 改为组合这些 Store 并提供给旧组件
  └── 验证：所有页面功能正常

阶段3：引入数据一致性机制
  ├── 创建 syncService（声明式同步规则）
  ├── 创建 validationService
  ├── 将 syncService 接入 Store
  └── 验证：跨实体变更自动同步，测试一致性场景

阶段4：UI 组件直连 Store（可选优化）
  ├── 逐步替换 useApp() 为 useLeadStore() 等
  ├── 移除 AppContext（使命完成）
  └── 验证：功能正常，无回归
```

---

## 三、技术选型

### 3.1 状态管理：Zustand

**为什么不是：**
- **Redux** — 太重，模板代码多，不适合这个规模的项目
- **Context API** — 当前就在用，性能问题（全部组件共享一个 context），且不适合拆分
- **Jotai/Recoil** — 原子化状态，但同步逻辑需要额外机制

**为什么是 Zustand：**
- 极简 API，学习成本几乎为 0
- 天然支持 Store 拆分
- 内置 `subscribe` 机制，适合实现数据同步中间件
- 与 React 无关的部分（如 syncService）也能访问 store
- 大小 ~1KB

### 3.2 不需要引入的

- ❌ **TypeScript** — 当前项目是纯 JS，引入 TS 需要改所有文件 + 配构建，收益/成本比不高。可以用 JSDoc + `@ts-check` 做轻量类型提示
- ❌ **React Query / SWR** — 当前数据模型是本地优先（localStorage + API 双向同步），不是纯服务端状态
- ❌ **React Router** — 当前用 tab 切换足够，不需要路由

---

## 四、风险与注意事项

### 4.1 迁移风险

| 风险 | 缓解措施 |
|------|----------|
| 拆分 Store 时漏掉某个状态 | 每个阶段都做完整的功能回归测试 |
| 旧组件同时依赖多个 Store | AppContext 保留作为兼容层，逐步替换 |
| 数据一致性规则写错导致死循环 | syncService 加变更来源标记，避免循环触发 |
| localStorage 数据格式变更 | persistService 加版本号和迁移逻辑 |

### 4.2 不改的部分

- `functions/api/[[path]].js` — 后端 API 不需要动
- `src/data/constants.js` — 常量定义没问题
- `src/data/seed.js` — 种子数据没问题
- `src/lib/utils.js` — 工具函数没问题
- AI 相关组件 — 独立模块，暂不纳入

---

## 五、文件结构（迁移后目标）

```
src/
├── api/                          ← 新增：API 层
│   ├── client.js
│   ├── adapters.js
│   ├── leads.js
│   ├── advertisers.js
│   ├── followups.js
│   ├── users.js
│   ├── auth.js
│   └── metrics.js
│
├── stores/                       ← 新增：状态管理层（替换 AppContext）
│   ├── authStore.js
│   ├── leadStore.js
│   ├── advertiserStore.js
│   ├── followupStore.js
│   ├── userStore.js
│   └── appStore.js
│
├── services/                     ← 新增：服务层
│   ├── syncService.js            ← 数据一致性同步
│   ├── validationService.js      ← 校验逻辑
│   └── persistService.js         ← 持久化逻辑
│
├── store/
│   └── AppContext.jsx            ← 逐步精简，最终移除
│
├── components/                   ← 不变，只换数据源引用
│   ├── crm/
│   ├── admin/
│   ├── ai/
│   ├── auth/
│   └── layout/
│
├── data/                         ← 不变
│   ├── constants.js
│   └── seed.js
│
├── lib/                          ← 不变
│   └── utils.js
│
├── App.jsx                       ← 微调（替换 Provider）
└── main.jsx                      ← 不变
```

---

## 六、设计原则总结

1. **每个文件只关心一件事**
2. **数据变更自动传播，不需要手动同步**
3. **API 调用与状态管理分离**
4. **UI 组件只消费数据，不管理数据**
5. **渐进式迁移，每一步都可验证**
6. **不改后端，不改数据库，不改已有组件接口**
