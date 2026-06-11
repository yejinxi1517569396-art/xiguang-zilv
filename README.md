# 汐光自律 · Web App

> 愿你像汐光一样，温柔而坚定。

汐光自律是一款面向个人成长用户的自律打卡与复盘工具，提供每日计划、习惯打卡、早起觉察、AI 复盘和 AI 制定计划等功能，帮助用户记录成长过程，提升自我管理能力。

---

## ✨ 已实现功能

| 模块 | 功能点 |
|------|--------|
| 🏠 首页 | 今日计划、今日完成率（环形进度）、连续打卡天数、成长语录、锦汐 AI 教练快速入口 |
| ✅ 打卡 | 添加 / 删除任务、勾选完成、推荐任务、**自定义打卡习惯**（自定义图标 / 颜色 / 频率 / 周几） |
| 📝 复盘 | 每日复盘 + **周复盘 / 月复盘自动生成**（基于打卡数据 + 心情记录，由 AI 生成温柔报告） |
| ✨ AI | AI 复盘 + AI 制定计划（支持后端代理 / 浏览器直连 / 本地示例 三种模式） |
| 🎀 锦汐 AI 教练 | 专属成长教练，3 档严格度（温柔陪伴 / 务实鼓励 / 严格监督），结合你的目标和打卡数据陪你聊天、监督执行 |
| 🌷 社区 | 帖子广场（点赞 / 评论 / 心情）、**排行榜**（按连续天数 + 完成率）、**搭子**互相监督打卡、**情侣**打卡空间（邀请码绑定） |
| 👤 登录注册 | 本地账号注册 / 登录 / 退出，按账号隔离 localStorage 数据 |
| 🌸 我的 | 账号中心、数据统计、本周柱状图、产品介绍、AI 设置、数据导出、云同步 / 会员入口预留 |

## 🎨 设计风格

- **配色**：浅蓝色 `#6FB1F0` + 莫兰迪粉 `#F4C9D5` + 薄荷绿 `#BFE4D9` 点缀
- **质感**：柔和渐变背景 + 玻璃态卡片 + 圆润大圆角
- **气质**：干净、温柔、有成长感，适合女生用户
- **响应式**：手机 / 平板 / 桌面端均自适应；底部 App 胶囊 Tab 导航
- **App 风格**：窄屏手机容器、沉浸式顶部栏、PWA 安装清单、桌面端手机外壳预览

## 🛠 技术栈

- 纯 **HTML + CSS + JavaScript**（零依赖、零构建）
- **localStorage** 本地数据存储（访客 key: `xiguang-zilv-data-v1`；登录后按用户 ID 独立存储）
- **本地账号系统**（适合静态部署和 MVP 演示；正式多人版建议接入后端认证）
- **OpenAI Chat API** 已封装好接口，未填 Key 时走本地示例
- **PWA 支持**：包含 `manifest.webmanifest`、`sw.js` 和应用图标，可添加到手机桌面

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

## 🔑 启用真实 AI（三种模式任选）

### 模式 A：后端代理（推荐，最安全，部署到 Vercel）

把项目部署到 Vercel 后，自带 `/api/ai` 这个 Serverless Function 会自动生效。Key 只存在服务端环境变量，前端永远拿不到。

操作步骤：

1. 把项目部署到 Vercel（参考 `DEPLOYMENT.md`）。
2. 进入 Vercel 项目 → `Settings` → `Environment Variables`。
3. 添加：
   - `OPENAI_API_KEY` = 你的 OpenAI API Key（必填）
   - `OPENAI_BASE_URL` = `https://api.openai.com/v1` （可选，国内中转可改）
   - `OPENAI_MODEL` = `gpt-3.5-turbo`（可选）
4. 重新部署一次。
5. 打开网站 → 我的 → AI 接口设置 → 模式选 `自动` 或 `仅使用后端代理`。
6. 点【测试连通】，看到"已成功调用真实 AI"即代表接入成功。

### 模式 B：浏览器直连 OpenAI（适合 GitHub Pages 用户）

1. 进入【我的】→【🔑 AI 接口设置】
2. 模式选 `浏览器直连 OpenAI`
3. 填入你自己的 OpenAI API Key
4. 保存后即可调用真实 AI

> ⚠️ 此模式下 Key 仅保存在你自己浏览器，但若分享给他人使用，他们不会自动得到你的 Key。注意不要把 Key 写到代码里上传。

### 模式 C：本地示例（默认）

不配置任何东西，AI 复盘 / 计划会用本地温柔示例文案，体验依然完整。

## 📁 项目结构

```
xiguang-zilv/
├── index.html         首页（今日计划 + 今日完成率）
├── checkin.html       打卡页（任务清单）
├── review.html        复盘页（早起觉察 / 今日收获 / 明日计划）
├── ai.html            AI 页（AI 复盘 / AI 制定计划）
├── auth.html          登录注册页（本地账号系统）
├── me.html            我的页（连续打卡 / 数据统计 / 产品介绍）
├── manifest.webmanifest  PWA 应用清单
├── sw.js              离线缓存 Service Worker
├── README.md
├── DEPLOYMENT.md      Vercel / GitHub Pages 上线教程
├── package.json       本地预览脚本与静态部署识别
├── vercel.json        Vercel 静态站点配置
├── .nojekyll          GitHub Pages 静态资源兼容
├── .github/workflows/deploy-github-pages.yml
└── assets/
    ├── css/style.css      全部样式
    ├── icons/icon.svg     App 图标
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

## 🔐 登录注册说明

当前版本已经支持登录 / 注册 / 退出登录。由于项目是纯静态网页，账号和密码会保存在当前浏览器的 `localStorage` 中，适合个人使用、作品展示和 MVP 测试。

注意：

- 每个账号的数据会独立保存。
- 不同设备之间不会自动同步。
- 清理浏览器缓存可能导致账号和数据丢失。
- 正式商业化版本建议接入 Supabase、Firebase 或自建后端认证系统。

## 📱 手机 App 风格

当前版本已加入 PWA 与移动 App 风格：

- 手机端使用沉浸式顶部栏和底部胶囊导航。
- 电脑端预览时会显示类似手机外壳的窄屏容器。
- 支持通过浏览器“添加到主屏幕”生成类似 App 的入口。
- `sw.js` 会缓存核心静态资源，提升二次打开速度。

添加到手机桌面：

1. 用手机浏览器打开网站。
2. iPhone：点击 Safari 分享按钮 → 添加到主屏幕。
3. Android：点击浏览器菜单 → 添加到主屏幕 / 安装应用。

## 🔭 后续扩展方向（已预留）

- [x] 本地登录注册系统
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
