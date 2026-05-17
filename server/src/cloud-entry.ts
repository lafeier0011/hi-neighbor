// 将 Hono.js 后端打包成 CloudBase HTTP 云函数入口
const { Hono } = require('hono')
const { handle } = require('hono/cloudflare') // 不适用于 CloudBase

// CloudBase 云函数使用 Node.js 原生 http adapter
// 需要用 hono 的 node adapter
