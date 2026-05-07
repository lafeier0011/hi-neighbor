# 邻趣集市 - 社区二手交易小程序

## 项目结构
```
community-trade/
├── server/                  # 后端 (Hono + CloudBase)
│   ├── src/
│   │   ├── index.ts         # Hono 入口
│   │   ├── routes/
│   │   │   ├── user.ts      # 用户路由
│   │   │   ├── goods.ts     # 商品路由
│   │   │   └── social.ts    # 社交路由（点赞/评论/关注/私信）
│   │   └── utils/
│   │       └── cloudbase.ts # CloudBase SDK
│   └── package.json
├── mini-program/            # 小程序前端
│   ├── pages/
│   │   ├── index/           # 首页（商品列表）
│   │   ├── publish/         # 发布商品
│   │   ├── detail/          # 商品详情
│   │   ├── profile/         # 个人中心
│   │   ├── chat/            # 私信
│   │   └── search/          # 搜索
│   ├── styles/              # 公共样式
│   ├── utils/               # 工具函数
│   └── app.json
└── README.md
```

## 技术栈
- **前端**: 微信小程序原生开发
- **后端**: Hono.js (运行在 CloudBase 云函数)
- **数据库**: CloudBase 云数据库
- **存储**: CloudBase 云存储
- **部署**: CloudBase CLI

## CloudBase 配置
- 项目 ID: `bp-insight-d8gm1oyz67190a864`
- 区域: `ap-shanghai`

## 数据库集合
- `users` - 用户信息
- `goods` - 商品信息
- `likes` - 点赞记录
- `comments` - 评论
- `follows` - 关注关系
- `messages` - 私信

## 开发步骤
1. 安装依赖: `cd server && npm install`
2. 创建数据库集合（CloudBase 控制台）
3. 部署云函数: `tcb fn deploy app`
4. 用微信开发者工具打开 mini-program 目录
5. 在 project.config.json 填入 AppID

test
