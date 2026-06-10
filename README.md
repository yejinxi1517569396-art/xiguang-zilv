# 汐光自律 · Web App

> 愿你像汐光一样，温柔而坚定。

汐光自律是一款面向个人成长用户的自律打卡与复盘工具，提供每日计划、习惯打卡、早起觉察、AI 复盘和 AI 制定计划等功能，帮助用户记录成长过程，提升自我管理能力。

---

## ✨ 已实现功能

| 模块 | 功能点 |
|------|--------|
| 🏠 首页 | 今日计划、今日完成率（环形进度）、连续打卡天数、成长语录 |
| ✅ 打卡 | 添加 / 删除任务、勾选完成、推荐任务（早起 / 喝水 / 运动 / 阅读 / 写作…） |
| 📝 复盘 | 早起觉察 / 今日心情 / 今日收获 / 今日不足 / 明日计划，自动保存 + 历史记录 |
| ✨ AI | AI 复盘 + AI 制定计划（前端已完整，预留 OpenAI Key 入口；未配置时使用本地温柔示例） |
| 🌸 我的 | 数据统计（连续打卡、累计天数、本周完成率、复盘篇数、最长连续）、本周柱状图、产品介绍、AI 设置、数据导出、即将推出的"登录 / 云同步 / 会员" |

## 🎨 设计风格

- **配色**：浅蓝色 `#6FB1F0` + 莫兰迪粉 `#F4C9D5` + 薄荷绿 `#BFE4D9` 点缀
- **质感**：柔和渐变背景 + 玻璃态卡片 + 圆润大圆角
- **气质**：干净、温柔、有成长感，适合女生用户
- **响应式**：手机 / 平板 / 桌面端均自适应；底部 Tab 导航

## 🛠 技术栈

- 纯 **HTML + CSS + JavaScript**（零依赖、零构建）
- **localStorage** 本地数据存储（key: `xiguang-zilv-data-v1`）
- **OpenAI Chat API** 已封装好接口，未填 Key 时走本地示例

## 🚀 如何运行

### 方式一：直接打开（最简单）
双击 `index.html` 即可在浏览器中打开使用。

### 方式二：本地静态服务器（推荐，避免某些浏览器跨域限制）

```bash
# 进入项目目录
cd xiguang-zilv

# Python 3
python3 -m http.server 8080

# 或 Node.js
npx serve .
```
然后浏览器访问：`http://localhost:8080`

### 方式三：手机访问
保证电脑和手机在同一 WiFi 下，电脑运行上面的 `python3 -m http.server 8080`，手机访问 `http://<电脑IP>:8080`。

## 🔑 启用真实 AI

1. 打开应用 → 进入【🌸 我的】
2. 点击【🔑 AI 接口设置】
3. 填入 OpenAI API Key（可选填写代理 Base 和模型名）
4. 保存后，AI 复盘 / AI 制定计划将自动调用真实 GPT

> Key 仅保存在浏览器本地 `localStorage`，不会上传任何服务器。

## 📁 项目结构

```
xiguang-zilv/
├── index.html         首页（今日计划 + 今日完成率）
├── checkin.html       打卡页（任务清单）
├── review.html        复盘页（早起觉察 / 今日收获 / 明日计划）
├── ai.html            AI 页（AI 复盘 / AI 制定计划）
├── me.html            我的页（连续打卡 / 数据统计 / 产品介绍）
├── README.md
├── DEPLOYMENT.md      Vercel / GitHub Pages 上线教程
├── package.json       本地预览脚本与静态部署识别
├── vercel.json        Vercel 静态站点配置
├── .nojekyll          GitHub Pages 静态资源兼容
├── .github/workflows/deploy-github-pages.yml
└── assets/
    ├── css/style.css      全部样式
    └── js/
        ├── app.js         核心数据逻辑（任务、复盘、AI、统计、存储）
        └── ui.js          通用 UI 组件（顶部、底部 Tab、进度环）
```

## 🌐 部署上线

项目已经整理成适合 **Vercel / GitHub Pages / Netlify** 的静态站点结构。

最推荐用 Vercel：

1. 把整个项目上传到 GitHub 仓库。
2. 打开 `https://vercel.com`。
3. 导入该仓库。
4. Framework 选择 `Other`。
5. Build Command 留空，Output Directory 填 `.`。
6. 点击 Deploy。

部署完成后，你会得到类似这样的公网网址：

```text
https://xiguang-zilv.vercel.app
```

详细步骤见：`DEPLOYMENT.md`。

## 🔭 后续扩展方向（已预留）

- [ ] 用户登录系统（菜单已占位）
- [ ] 云端数据库（替换 localStorage）
- [ ] 付费会员模式（菜单已占位）
- [ ] PWA 离线安装到手机桌面
- [ ] 更多 AI 模型（Claude / 文心 / 豆包）

## 💡 数据管理

- 在【我的】页可以一键 **导出数据**（JSON）
- 在【我的】页可以 **清空所有数据**
- 切换浏览器 / 清理缓存会丢失数据，请定期导出

---

愿微光，照亮你的每一天 ✨
