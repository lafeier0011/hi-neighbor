# 邻趣集市 (hi-neighbor) 实现文档

## 一、项目概览

| 项 | 值 |
|---|---|
| 项目名称 | 邻趣集市 (hi-neighbor) |
| 项目定位 | 社区二手交易 + 拼团服务 微信小程序 |
| 目标用户 | 小区居民（宝妈/家庭为主） |
| MVP范围 | 二手商品发布/浏览/搜索、微信登录、拼团、社区公告 |
| GitHub | https://github.com/lafeier0011/hi-neighbor |
| 管理后台 | http://150.158.141.184 |
| API地址 | http://150.158.141.184 |
| 状态 | ✅ 全栈开发完成 + 部署上线 |

---

## 二、技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 小程序前端 | uni-app (Vue 3) | 跨端小程序框架 |
| 管理后台 | Vue 3 + Vite | 独立 Web SPA |
| 后端 | Hono.js + Node.js | 轻量 Web 框架，部署在腾讯云服务器 |
| 数据库 | 腾讯云 CloudBase 云数据库 | NoSQL 文档数据库 |
| 登录 | 微信小程序授权登录 | wx.login + getUserProfile |
| 部署 | 腾讯云 CVM + pm2 + Nginx | 后端服务 + 静态文件托管 |

### 服务器配置

| 项 | 值 |
|---|---|
| 服务器 | 腾讯云 CVM Ubuntu 24.04 |
| 公网 IP | 150.158.141.184 |
| 后端端口 | 3000（pm2 守护） |
| Nginx | 反代 80 → 3000 + 托管管理后台静态文件 |
| CloudBase 环境ID | bp-insight-d8gm1oyz67190a864 |
| CloudBase 区域 | ap-shanghai |
| 微信小程序 AppID | wx3193f5122d553ff7 |

### 管理员账号

| 项 | 值 |
|---|---|
| 登录地址 | http://150.158.141.184 |
| 账号 | admin |
| 密码 | hi-neighbor-admin-2026 |

---

## 三、数据模型

### 3.1 管理员账号 (admin_accounts)

```json
{
  "_id": "自动生成",
  "username": "admin",
  "password": "密码明文（生产环境应改为bcrypt）",
  "role": "admin",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3.2 用户 (users)

```json
{
  "_id": "自动生成",
  "openid": "微信openid",
  "nickname": "昵称",
  "avatar": "头像URL",
  "phone": "手机号（可选）",
  "wechat": "微信号（可选）",
  "community": "所属小区",
  "building": "楼栋（可选）",
  "role": "user",
  "disabled": false,
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3.3 商品 (goods)

```json
{
  "_id": "自动生成",
  "publisherId": "发布者openid",
  "publisherInfo": { "nickname": "昵称", "community": "小区" },
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
  "soldAt": "标记已卖出的时间",
  "deletedAt": "删除时间",
  "viewCount": 0,
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3.4 拼团 (groupbuys)

```json
{
  "_id": "自动生成",
  "title": "拼团标题",
  "description": "拼团描述",
  "groupPrice": 39,
  "originalPrice": 68,
  "targetCount": 20,
  "currentCount": 15,
  "participants": ["openid数组"],
  "status": "状态：pending/successful/expired",
  "deadline": "截止时间",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3.5 公告 (announcements)

```json
{
  "_id": "自动生成",
  "title": "公告标题",
  "content": "公告内容",
  "type": "类型：urgent/event/notice",
  "author": "发布者",
  "pinned": false,
  "readCount": 0,
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3.6 推荐地址 (locations)

```json
{
  "_id": "自动生成",
  "name": "地点名称",
  "sort": 0,
  "createdAt": "创建时间"
}
```

### 3.7 收藏 (favorites)

```json
{
  "_id": "自动生成",
  "userId": "用户openid",
  "goodsId": "商品ID",
  "createdAt": "创建时间"
}
```

### 3.8 操作日志 (admin_logs)

```json
{
  "_id": "自动生成",
  "adminId": "操作者ID",
  "module": "模块：goods/user/announce/location",
  "action": "操作描述",
  "detail": "详情",
  "targetId": "目标ID",
  "createdAt": "操作时间"
}
```

---

## 四、项目目录结构

```
hi-neighbor/
├── miniapp/                       # 小程序端（uni-app Vue 3）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index/              # 首页（商品浏览）
│   │   │   ├── publish/            # 发布页
│   │   │   ├── detail/             # 商品详情
│   │   │   ├── groupbuy/           # 拼团
│   │   │   ├── announce/           # 公告
│   │   │   └── profile/            # 个人中心
│   │   ├── api/index.ts            # API 接口层
│   │   ├── utils/
│   │   │   ├── config.ts           # 环境配置（API地址）
│   │   │   ├── request.ts          # 请求封装
│   │   │   └── validate.ts         # 表单校验
│   │   ├── store/user.ts           # Pinia 用户状态
│   │   ├── main.ts                 # 入口
│   │   ├── App.vue
│   │   └── pages.json              # 页面路由 + TabBar 配置
│   ├── project.config.json         # 微信开发者工具配置
│   ├── vite.config.ts
│   └── package.json
├── admin/                         # 管理后台（Vue 3 SPA）
│   ├── src/
│   │   ├── views/
│   │   │   ├── Login.vue           # 登录页
│   │   │   ├── Layout.vue          # 布局（深色侧边栏）
│   │   │   ├── Dashboard.vue       # 仪表盘
│   │   │   ├── Goods.vue           # 商品管理
│   │   │   ├── Users.vue           # 用户管理
│   │   │   ├── Announcements.vue   # 公告管理
│   │   │   ├── Locations.vue       # 推荐地址
│   │   │   └── Logs.vue            # 操作日志
│   │   ├── router/index.ts         # Vue Router
│   │   ├── utils/api.ts            # Axios 封装
│   │   ├── style.scss              # 全局样式 + 设计系统
│   │   ├── main.ts
│   │   └── App.vue
│   ├── dist/                       # 构建产物（nginx 托管）
│   ├── vite.config.ts
│   └── package.json
├── server/                        # 后端（Hono.js + Node.js）
│   ├── src/
│   │   ├── index.ts               # 入口（Hono + Node serve）
│   │   ├── types.ts               # TypeScript 类型
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT 认证中间件
│   │   ├── routes/
│   │   │   ├── auth.ts            # 用户登录/注册
│   │   │   ├── goods.ts           # 商品 CRUD
│   │   │   ├── favorites.ts       # 收藏
│   │   │   ├── location.ts        # 推荐地址
│   │   │   ├── groupbuy.ts        # 拼团
│   │   │   ├── announce.ts        # 公告
│   │   │   └── admin.ts           # 管理端（含登录）
│   │   └── utils/
│   │       ├── cloudbase.ts       # CloudBase SDK 初始化
│   │       ├── jwt-simple.ts      # 简易 JWT 工具
│   │       ├── logger.ts          # 操作日志
│   │       └── cron.ts            # 定时任务
│   ├── scripts/
│   │   ├── create-collections.js  # 创建数据库集合
│   │   └── seed-data.js           # 灌入测试数据
│   ├── dist/                      # 编译产物（pm2 运行）
│   ├── .env                       # 环境变量（不入库）
│   └── package.json
├── functions/                     # CloudBase 云函数版本（备用）
│   └── api/index.js               # 纯 CloudBase 云函数入口
├── design/                        # UI 设计稿
│   ├── index.html                 # 首页
│   ├── publish.html               # 发布页
│   ├── detail.html                # 商品详情
│   ├── groupbuy.html              # 拼团页
│   ├── announce-profile.html      # 公告+个人中心
│   ├── admin.html                 # 管理后台
│   └── showcase.html              # 展示页
├── cloudbaserc.json               # CloudBase CLI 配置
├── vercel.json                    # Vercel 配置（备用）
├── wrangler.toml                  # Cloudflare Worker 配置（备用）
├── SPEC.md                        # 本文档
└── README.md
```

---

## 五、后端接口总览

### 基础路径

```
API: http://150.158.141.184
管理后台: http://150.158.141.184
```

### 5.1 公开接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | / | 健康检查 |
| POST | /api/auth/login | 微信登录 |
| GET | /api/goods | 商品列表（分页、筛选、搜索） |
| GET | /api/goods/:id | 商品详情（含浏览量自增） |
| GET | /api/locations | 推荐地址列表 |
| GET | /api/groupbuys | 拼团列表 |
| GET | /api/announcements | 公告列表 |

### 5.2 用户接口（需 JWT 认证）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/goods | 发布商品 |
| POST | /api/goods/sell | 标记已卖出 |
| POST | /api/goods/delete | 删除商品（软删除） |
| POST | /api/favorites/toggle | 收藏/取消收藏 |
| GET | /api/favorites | 我的收藏列表 |
| POST | /api/groupbuys/join | 参团 |

### 5.3 管理端接口（需 admin JWT 认证）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /admin/login | 管理员登录（无需认证） |
| GET | /admin/dashboard | 仪表盘统计 + 最近商品 |
| GET | /admin/stats | 统计数据 |
| GET | /admin/goods | 商品列表（全部状态） |
| PUT | /admin/goods/:id/status | 修改商品状态 |
| GET | /admin/users | 用户列表 |
| PUT | /admin/users/:id/role | 设置用户角色 |
| PUT | /admin/users/:id/disable | 禁用/解禁用户 |
| GET | /admin/announcements | 公告列表 |
| POST | /admin/announcements | 发布公告 |
| PUT | /admin/announcements/:id | 编辑公告 |
| PUT | /admin/announcements/:id/pin | 置顶/取消置顶 |
| DELETE | /admin/announcements/:id | 删除公告 |
| GET | /admin/locations | 推荐地址列表 |
| POST | /admin/locations | 新增推荐地址 |
| PUT | /admin/locations/:id | 编辑推荐地址 |
| DELETE | /admin/locations/:id | 删除推荐地址 |
| GET | /admin/logs | 操作日志（分页+筛选） |

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

## 六、UI设计规范

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

## 七、部署架构

```
用户浏览器 ──HTTP:80──► Nginx (150.158.141.184)
                           ├── /assets/*    → 静态文件（管理后台）
                           ├── /*.html      → SPA 兜底 index.html
                           ├── /api/*       → proxy_pass 127.0.0.1:3000
                           └── /admin/*     → proxy_pass 127.0.0.1:3000
                                                    │
                                           Hono.js (pm2 守护)
                                                    │
                                           CloudBase SDK ──► 云数据库
                                                              ├── users
                                                              ├── goods
                                                              ├── groupbuys
                                                              ├── announcements
                                                              ├── favorites
                                                              ├── locations
                                                              ├── admin_logs
                                                              └── admin_accounts

微信小程序 ──HTTP:80──► Nginx → Hono.js → CloudBase
```

---

## 八、已完成功能清单

### 后端 ✅
- [x] Hono.js + Node.js 服务（pm2 守护，端口 3000）
- [x] CloudBase SDK 集成（云数据库读写）
- [x] JWT 认证（用户端 + 管理端）
- [x] 商品 CRUD + 状态管理（在售/已卖出/已下架/已删除）
- [x] 收藏 toggle + 收藏列表
- [x] 拼团列表 + 参团
- [x] 公告列表
- [x] 推荐地址列表
- [x] 管理端全套接口（仪表盘/商品/用户/公告/地址/日志）
- [x] Nginx 反代 + 静态文件托管

### 管理后台 ✅
- [x] 登录页（管理员账号密码）
- [x] 仪表盘（统计卡片 + 最近商品表格）
- [x] 商品管理（搜索/筛选/下架/恢复/删除）
- [x] 用户管理（搜索/设管理员/禁用/解禁）
- [x] 公告管理（发布/编辑/置顶/删除）
- [x] 推荐地址（增删改排序）
- [x] 操作日志（按类型筛选/搜索/分页）
- [x] 统一设计系统（赤陶暖橙品牌色）

### 小程序前端 ✅（代码已完成，待本地编译测试）
- [x] uni-app 项目结构 + TabBar 配置
- [x] 请求封装 + 表单校验工具
- [x] Pinia 用户状态管理
- [x] 首页（商品列表 + 分类筛选 + 搜索 + 下拉刷新 + 上拉加载）
- [x] 发布页（图片上传 + 完整表单 + 成色选择 + 双联系方式 + 推荐地址选择器）
- [x] 商品详情页（图片轮播 + 价格 + 联系方式一键复制 + 卖家操作）
- [x] 拼团页（筛选 + 进度条 + 参团按钮）
- [x] 公告页（列表 + 详情弹窗）
- [x] 个人中心（登录 + 统计 + 功能菜单）

### 数据库 ✅
- [x] 8个集合已创建
- [x] 管理员账号已初始化
- [x] 测试数据已灌入（8商品/3用户/3拼团/3公告/5地址）

---

## 九、待完成事项

### 小程序上线前
- [ ] 本地 clone + npm install + 编译
- [ ] 微信开发者工具导入测试
- [ ] 真机调试（登录、发布、图片上传）
- [ ] TabBar 图标替换（目前是占位符）
- [ ] 提交体验版 → 正式版审核

### 功能优化
- [ ] 图片上传到 CloudBase 存储（目前图片为空）
- [ ] 微信登录对接真实 wx.login 流程
- [ ] 商品自动下架定时器（sold 24h → offline）
- [ ] HTTPS 配置（目前为 HTTP，生产环境需要）
- [ ] 管理员密码改为 bcrypt 加密

### 运维
- [ ] pm2 开机自启：`pm2 startup && pm2 save`
- [ ] Nginx 日志配置
- [ ] 后端日志持久化
- [ ] 监控告警
