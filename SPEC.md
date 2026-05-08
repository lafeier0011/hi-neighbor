# 邻趣集市 (hi-neighbor) 实现文档

## 一、项目概览

| 项 | 值 |
|---|---|
| 项目名称 | 邻趣集市 (hi-neighbor) |
| 项目定位 | 社区二手交易 + 拼团服务 微信小程序 |
| 目标用户 | 小区居民（宝妈/家庭为主） |
| MVP范围 | 二手商品发布/浏览/搜索、微信登录、拼团、社区公告 |
| GitHub | https://github.com/lafeier0011/hi-neighbor |
| UI设计稿 | https://lafeier0011.github.io/hi-neighbor/ |

---

## 二、技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | uni-app (Vue 3) | 跨端小程序框架 |
| 后端 | Hono.js | 轻量Web框架 |
| 云服务 | 腾讯云 CloudBase | Serverless云函数 + 云数据库 |
| 数据库 | CloudBase 云数据库 | NoSQL文档数据库 |
| 登录 | 微信小程序授权登录 | wx.login + getUserProfile |

### CloudBase 配置

| 项 | 值 |
|---|---|
| 项目ID | bp-insight-d8gm1oyz67190a864 |
| 区域 | ap-shanghai |
| 微信小程序 AppID | wx3193f5122d553ff7 |

---

## 三、数据模型

### 3.1 用户 (users)

```json
{
  "_id": "自动生成",
  "openid": "微信openid",
  "unionid": "微信unionid（可选）",
  "nickname": "昵称",
  "avatar": "头像URL",
  "phone": "手机号（可选）",
  "wechat": "微信号（可选）",
  "community": "所属小区",
  "building": "楼栋（可选）",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3.2 商品 (goods)

```json
{
  "_id": "自动生成",
  "publisherId": "发布者openid",
  "publisherInfo": {
    "nickname": "昵称",
    "avatar": "头像",
    "community": "小区",
    "building": "楼栋"
  },
  "title": "商品名称（最长30字）",
  "description": "商品描述（最长300字）",
  "images": ["图片URL数组，最多9张"],
  "category": "分类：母婴/玩具/书籍/家居/服饰/数码/其他",
  "condition": "成色：全新/9成新/7成新/5成新/一般",
  "price": 280,
  "originalPrice": 899,
  "location": "交易地点",
  "contactWechat": "微信号",
  "contactPhone": "手机号",
  "status": "状态：on_sale/sold/offline/deleted",
  "soldAt": "标记已卖出的时间（用于1天后自动下架计时）",
  "viewCount": 0,
  "favCount": 0,
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3.3 拼团 (groupbuys)

```json
{
  "_id": "自动生成",
  "organizerId": "发起人openid",
  "organizerInfo": {
    "nickname": "昵称",
    "avatar": "头像"
  },
  "title": "拼团标题",
  "description": "拼团描述",
  "image": "封面图URL",
  "groupPrice": 39,
  "originalPrice": 68,
  "targetCount": 20,
  "currentCount": 15,
  "participants": ["openid数组"],
  "status": "状态：pending/successful/expired",
  "deadline": "截止时间",
  "createdAt": "创建时间"
}
```

### 3.4 公告 (announcements)

```json
{
  "_id": "自动生成",
  "title": "公告标题",
  "content": "公告内容",
  "type": "类型：urgent/event/notice",
  "author": "发布者",
  "readCount": 0,
  "createdAt": "创建时间"
}
```

### 3.6 推荐地址 (locations)

```json
{
  "_id": "自动生成",
  "name": "地点名称",
  "community": "所属小区",
  "orderBy": 1,
  "createdAt": "创建时间"
}
```

> 管理员在后台录入的推荐交易地点，发布页可快速选择，用户也可自定义输入。

### 3.5 收藏 (favorites)

```json
{
  "_id": "自动生成",
  "userId": "用户openid",
  "goodsId": "商品ID",
  "createdAt": "创建时间"
}
```

---

## 四、页面结构

### 4.1 页面清单

| 编号 | 页面 | 路径 | 说明 |
|---|---|---|---|
| 01 | 首页 | /pages/index/index | 商品浏览、分类、搜索 |
| 02 | 发布 | /pages/publish/publish | 发布二手商品 / 拼团 |
| 03 | 拼团 | /pages/groupbuy/index | 拼团列表、报名 |
| 04 | 公告 | /pages/announce/index | 社区公告列表 |
| 05 | 我的 | /pages/profile/index | 个人中心、登录 |
| 06 | 商品详情 | /pages/detail/index | 商品详情、联系卖家 |

### 4.2 TabBar 配置

```
首页 | 拼团 | [发布] | 公告 | 我的
```

---

## 五、功能详述

### 5.1 首页 — 商品浏览

**功能点：**
- 顶部定位显示当前小区
- 搜索框：关键词搜索商品标题
- 分类筛选：全部/母婴/玩具/书籍/家居/拼团
- 商品瀑布流：双列卡片展示
- 卡片信息：图片、名称、价格（赤陶色）、成色标签、分类
- 下拉刷新 + 上拉加载更多

**接口：**
- `GET /api/goods?page=1&category=母婴&keyword=推车` — 获取商品列表

### 5.1.1 商品状态流转

```
on_sale（在售）
  ├── 标记已卖出 → sold（已卖出，展示"已卖出"标签，仍可见）
  │     └── 1天后系统自动 → offline（已下架，列表不展示）
  ├── 手动删除 → deleted（软删除，不可见）
  └── 编辑 → on_sale（保持不变）
```

**自动下架逻辑：**
- 卖家点击「已卖出」后，商品状态变为 `sold`，记录 `soldAt` 时间
- 已卖出的商品在列表中仍可见，但展示「已卖出」标签，不可购买
- CloudBase定时触发器每小时扫描一次：`sold` 状态且 `soldAt` 超过24小时的商品，自动更新为 `offline`
- `offline` 状态的商品不在列表中展示

### 5.2 发布页 — 发布商品

**功能点：**
- 类型切换：二手好物 / 拼团服务
- 图片上传：最多9张，使用CloudBase存储
- 商品名称：必填，最长30字，实时字数统计
- 商品描述：最长300字，实时字数统计
- 成色选择（必填）：全新/9成新/7成新/5成新/一般
- 分类选择：母婴/玩具/书籍/家居/服饰/数码/其他
- 售价（必填）：数字，>0
- 原价（选填）：数字
- 交易地点：支持两种方式
  - **推荐地址**：从管理员预设的地址列表中选择（展示为下拉/底部弹出选择器）
  - **自定义输入**：用户手动输入交易地点（输入框常驻，选择推荐地址时自动填充，也可直接编辑）
- 联系方式（必填，至少一项）：
  - 微信号：6-20位，字母开头，字母数字下划线
  - 手机号：11位纯数字，1开头，自动过滤非数字

**输入校验规则：**

| 字段 | 规则 | 错误提示 |
|---|---|---|
| 名称 | 必填，≤30字 | 请输入商品名称 |
| 售价 | 必填，>0 | 请输入有效售价 |
| 成色 | 必选 | 请选择成色 |
| 微信号（选填） | 6-20位，字母开头 | 微信号格式不正确 |
| 手机号（选填） | 11位，1开头 | 手机号格式不正确 |
| 联系方式 | 至少填一项 | 请至少填写一种联系方式 |

**接口：**
- `POST /api/goods` — 发布商品
- `POST /api/upload` — 上传图片到CloudBase存储
- `GET /api/locations` — 获取推荐地址列表

### 5.3 商品详情页

**功能点：**
- 商品图片轮播（支持多张）
- 价格展示：售价（赤陶色大字）+ 原价（删除线）
- 商品标题
- 标签：成色（赤陶色背景）、分类、小区
- 商品描述
- 卖家信息卡片：头像、昵称、楼栋
- 联系方式展示：微信 + 手机号（卖家填了哪些就展示哪些）
  - 每个联系方式旁有「复制」按钮，点击一键复制到剪贴板
  - 复制成功后按钮变为「已复制」，1.5秒后恢复
- 交易地点
- 底部栏（买家视角）：收藏按钮 + 「联系卖家」按钮
- 底部栏（卖家视角，查看自己发布的商品）：
  - 「标记已卖出」按钮（状态为on_sale时显示）
  - 「删除商品」按钮（所有状态均可操作）
  - 已卖出的商品显示「已卖出」标签

**接口：**
- `GET /api/goods/:id` — 获取商品详情
- `POST /api/favorites` — 收藏/取消收藏
- `PUT /api/goods/:id/sell` — 标记已卖出
- `DELETE /api/goods/:id` — 删除商品（软删除，status置为deleted）

### 5.4 拼团页

**功能点：**
- 筛选Tab：全部/进行中/即将成团/已完成
- 拼团卡片：标题、描述、团购价/原价、进度条、参与人头像、参团按钮
- 参团：点击参团按钮报名
- 倒计时：显示剩余时间
- 成团状态：进行中（赤陶色标签）、已成团（绿色标签）

**接口：**
- `GET /api/groupbuys?status=pending` — 获取拼团列表
- `POST /api/groupbuys/:id/join` — 参团

### 5.5 公告页

**功能点：**
- 公告列表：标题、摘要、类型标签、日期、已读人数
- 类型：重要通知（红色）、社区活动（赤陶色）、温馨提示（蓝色）
- 点击查看公告详情

**接口：**
- `GET /api/announcements` — 获取公告列表

### 5.6 个人中心

**功能点：**
- 未登录态：显示默认头像 + 微信一键登录按钮
- 已登录态：头像、昵称、小区、统计数据（发布/收藏/参团数）
- 功能菜单：我的发布、我的收藏、我的拼团、收货地址、设置、意见反馈、关于

**接口：**
- `POST /api/auth/login` — 微信登录（wx.login获取code换取openid）
- `GET /api/users/profile` — 获取用户信息
- `GET /api/users/goods` — 我的发布
- `GET /api/users/favorites` — 我的收藏

---

## 六、后端接口总览

### 基础路径

```
云函数URL: https://{env-id}.service.tcloudbase.com/
```

### 接口列表

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | /api/auth/login | 微信登录 | 否 |
| GET | /api/goods | 商品列表（分页、筛选） | 否 |
| GET | /api/goods/:id | 商品详情 | 否 |
| POST | /api/goods | 发布商品 | 是 |
| PUT | /api/goods/:id | 编辑商品 | 是 |
| PUT | /api/goods/:id/sell | 标记已卖出 | 是 |
| DELETE | /api/goods/:id | 删除商品（软删除） | 是 |
| POST | /api/upload | 上传图片 | 是 |
| POST | /api/favorites | 收藏/取消收藏 | 是 |
| GET | /api/favorites | 我的收藏列表 | 是 |
| GET | /api/groupbuys | 拼团列表 | 否 |
| POST | /api/groupbuys | 发起拼团 | 是 |
| POST | /api/groupbuys/:id/join | 参团 | 是 |
| GET | /api/locations | 获取推荐地址列表 | 否 |
| GET | /api/announcements | 公告列表 | 否 |
| GET | /api/users/profile | 用户信息 | 是 |
| PUT | /api/users/profile | 更新用户信息 | 是 |
| GET | /api/users/goods | 我的发布 | 是 |

### 通用响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 分页参数

```
page: 页码（默认1）
pageSize: 每页数量（默认20）
```

---

## 七、UI设计规范

### 色系

| 变量 | 色值 | 用途 |
|---|---|---|
| --accent | #c2703e | 主色/品牌色/按钮/价格/标签 |
| --accent-light | #fdf5ee | 主色浅底/成色标签背景 |
| --text | #2d2a26 | 正文文字 |
| --text-secondary | #6b6b6b | 次要文字 |
| --text-tertiary | #999 | 辅助文字 |
| --bg | #ffffff | 页面背景 |
| --surface | #f8f5f1 | 卡片背景/输入框背景 |
| --border | #ebe4da | 边框/分割线 |
| --success | #3a7d5c | 成功/已成团 |
| --error | #c0392b | 错误/必填标记 |

### 字体

- 主字体：Outfit（Google Fonts）
- 中文回退：PingFang SC, -apple-system

### 圆角

| 场景 | 值 |
|---|---|
| 卡片/按钮/输入框 | 8px |
| 小元素（标签、子组件） | 6px |
| 标签胶囊 | 20px |

### 间距

- 基础单位：4px
- 页面内边距：20px
- 组件间距：8-16px
- 卡片内边距：12-16px

### 设计原则

- 不用emoji做图标，用SVG线条图标
- 不用渐变，按钮和标签用纯色
- 大面积留白，减少视觉噪音
- 约束色彩层次：品牌色只用于强调，不铺满

---

## 八、管理后台（Web端）

### 8.1 技术方案

| 项 | 值 |
|---|---|
| 定位 | 独立Web管理后台，脱离小程序 |
| 前端 | Vue 3 + Vite（SPA） |
| 部署 | CloudBase 静态托管 或 Vercel |
| 认证 | 管理员账号密码登录（JWT） |
| 访问 | admin.hi-neighbor.com 或独立路径 |

### 8.2 权限模型

```json
// users表新增字段
{
  "role": "admin/user",
  "adminStatus": "active/disabled"
}
```

- 首个管理员：通过数据库手动设置 `role: "admin"`
- 后续管理员：由已有管理员在后台添加
- 管理员登录：账号密码（非微信登录），Web端独立认证
- 所有管理操作记录到操作日志

### 8.3 功能模块

#### 8.3.1 仪表盘

| 统计项 | 说明 |
|---|---|
| 在售商品数 | 实时统计 |
| 注册用户数 | 今日新增 + 总数 |
| 进行中拼团 | 活跃拼团数 |
| 今日成交 | 今日标记已卖出的商品数 |

#### 8.3.2 商品管理

| 功能 | 说明 |
|---|---|
| 商品列表 | 分页、搜索、状态筛选（在售/已卖出/已下架/已删除）|
| 查看详情 | 查看完整商品信息 |
| 编辑商品 | 管理员可直接修改任何商品信息 |
| 强制下架 | 违规商品可强制下架（status -> offline）|
| 删除商品 | 软删除（status -> deleted）|
| 恢复商品 | 将已下架商品恢复为在售 |

#### 8.3.3 拼团管理

| 功能 | 说明 |
|---|---|
| 拼团列表 | 查看所有拼团及状态 |
| 手动关闭 | 过期或异常拼团手动关闭 |
| 修改信息 | 编辑拼团标题、描述、价格等 |

#### 8.3.4 公告管理

| 功能 | 说明 |
|---|---|
| 发布公告 | 填写标题、内容、类型（重要通知/社区活动/温馨提示）|
| 编辑公告 | 修改已发布公告 |
| 删除公告 | 软删除 |
| 置顶 | 公告置顶显示 |

#### 8.3.5 推荐地址管理

| 功能 | 说明 |
|---|---|
| 地址列表 | 查看、排序 |
| 新增地址 | 录入推荐交易地点（如：幸福花园·南门、小区广场、东门快递柜）|
| 编辑地址 | 修改地址名称 |
| 删除地址 | 删除不再需要的地址 |
| 排序 | 拖拽调整显示顺序 |

#### 8.3.6 用户管理

| 功能 | 说明 |
|---|---|
| 用户列表 | 分页、搜索、角色筛选 |
| 查看详情 | 用户信息、发布历史、交易记录 |
| 编辑信息 | 修改用户昵称、小区等信息 |
| 设为管理员 | 提升/取消管理员角色 |
| 禁用用户 | 禁止该用户发布和交易 |

#### 8.3.7 管理员设置

| 功能 | 说明 |
|---|---|
| 管理员列表 | 查看所有管理员 |
| 添加管理员 | 输入用户ID或从用户列表选择 |
| 移除管理员 | 取消管理员权限 |
| 修改密码 | 修改自己的登录密码 |

#### 8.3.8 操作日志

记录所有关键操作，不可篡改：

| 日志字段 | 说明 |
|---|---|
| 时间 | 操作时间戳 |
| 操作者 | 谁操作的（用户ID + 昵称）|
| 类型 | 发布/编辑/删除/登录/下架/卖出/管理等 |
| 内容 | 操作描述文本 |
| 目标ID | 被操作的商品/用户/公告ID |
| IP | 操作者IP地址 |

### 8.4 管理端接口（需admin认证）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /admin/auth/login | 管理员登录 |
| GET | /admin/stats | 仪表盘统计数据 |
| GET | /admin/goods | 所有商品列表（含已删除）|
| PUT | /admin/goods/:id | 编辑任意商品 |
| PUT | /admin/goods/:id/status | 强制修改商品状态 |
| DELETE | /admin/goods/:id | 删除商品 |
| GET | /admin/groupbuys | 所有拼团 |
| PUT | /admin/groupbuys/:id | 编辑拼团 |
| POST | /admin/announcements | 发布公告 |
| PUT | /admin/announcements/:id | 编辑公告 |
| DELETE | /admin/announcements/:id | 删除公告 |
| GET | /admin/locations | 推荐地址列表 |
| POST | /admin/locations | 新增推荐地址 |
| PUT | /admin/locations/:id | 编辑推荐地址 |
| DELETE | /admin/locations/:id | 删除推荐地址 |
| GET | /admin/users | 所有用户列表 |
| PUT | /admin/users/:id | 编辑用户信息 |
| PUT | /admin/users/:id/role | 设置用户角色 |
| PUT | /admin/users/:id/status | 禁用/启用用户 |
| GET | /admin/logs | 操作日志（分页+筛选）|

---

## 九、项目目录结构

```
hi-neighbor/
├── miniapp/                   # 小程序端（uni-app）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index/          # 首页
│   │   │   ├── publish/        # 发布页
│   │   │   ├── detail/         # 商品详情
│   │   │   ├── groupbuy/       # 拼团
│   │   │   ├── announce/       # 公告
│   │   │   └── profile/        # 个人中心
│   │   ├── components/
│   │   ├── api/
│   │   ├── utils/
│   │   ├── store/
│   │   └── static/
│   └── package.json
├── admin/                     # 管理后台（Vue 3 SPA）
│   ├── src/
│   │   ├── views/
│   │   │   ├── Dashboard.vue   # 仪表盘
│   │   │   ├── Goods.vue       # 商品管理
│   │   │   ├── Groupbuy.vue    # 拼团管理
│   │   │   ├── Announce.vue    # 公告管理
│   │   │   ├── Location.vue    # 推荐地址
│   │   │   ├── Users.vue       # 用户管理
│   │   │   ├── Admins.vue      # 管理员设置
│   │   │   ├── Logs.vue        # 操作日志
│   │   │   └── Login.vue       # 登录页
│   │   ├── components/
│   │   ├── api/
│   │   ├── router/
│   │   └── utils/
│   └── package.json
├── server/                    # 后端（Hono.js）
│   ├── src/
│   │   ├── index.ts           # 入口
│   │   ├── middleware/
│   │   │   ├── auth.ts        # 用户认证
│   │   │   └── admin.ts       # 管理员认证
│   │   ├── routes/
│   │   │   ├── auth.ts        # 小程序登录
│   │   │   ├── goods.ts       # 商品路由
│   │   │   ├── user.ts        # 用户路由
│   │   │   ├── groupbuy.ts    # 拼团路由
│   │   │   ├── announce.ts    # 公告路由
│   │   │   ├── location.ts    # 推荐地址路由
│   │   │   └── admin.ts       # 管理端路由
│   │   └── utils/
│   │       ├── cloudbase.ts   # CloudBase初始化
│   │       └── logger.ts      # 操作日志记录
│   └── package.json
└── README.md
```

---

## 九、开发排期建议

### Phase 1 — 基础框架（2天）
- [ ] uni-app 项目初始化 + CloudBase SDK集成
- [ ] TabBar + 页面路由搭建
- [ ] 请求封装 + 用户登录流程
- [ ] 后端 Hono.js 云函数部署

### Phase 2 — 核心功能（3天）
- [ ] 首页商品列表（分类筛选 + 搜索 + 瀑布流）
- [ ] 发布页（图片上传 + 表单校验 + 联系方式）
- [ ] 商品详情页（信息展示 + 一键复制联系方式）
- [ ] 后端商品CRUD接口

### Phase 3 — 扩展功能（2天）
- [ ] 拼团功能（发布 + 报名 + 进度）
- [ ] 公告列表
- [ ] 个人中心（我的发布/收藏）
- [ ] 收藏功能
- [ ] 商品状态管理（已卖出/删除/自动下架定时器）
- [ ] 推荐地址管理（管理员录入 + 发布页选择器）

### Phase 4 — 管理后台（3天）
- [ ] Vue 3 + Vite 项目初始化
- [ ] 管理员登录（账号密码 + JWT）
- [ ] 仪表盘统计
- [ ] 商品管理（列表/搜索/编辑/下架/删除）
- [ ] 用户管理（列表/编辑/禁用/角色设置）
- [ ] 公告管理（发布/编辑/删除）
- [ ] 推荐地址管理（增删改排序）
- [ ] 操作日志（自动记录 + 查看）

### Phase 5 — 打磨上线（1天）
- [ ] UI细节调优
- [ ] 边界情况处理
- [ ] 小程序体验版测试
- [ ] 管理后台部署
- [ ] 提交审核

**总计：约11个工作日**
