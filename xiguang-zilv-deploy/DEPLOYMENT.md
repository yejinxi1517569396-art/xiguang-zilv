# 汐光自律 · 上线部署教程

这个项目是纯静态网页项目，不需要后端、不需要数据库、不需要构建。你可以直接部署到 **Vercel**、**GitHub Pages** 或 **Netlify**。

推荐优先级：

1. **Vercel**：最简单，适合快速拿到公网网址。
2. **GitHub Pages**：完全免费，适合长期托管。
3. **Netlify**：也很简单，适合拖拽上传。

---

## 方式一：部署到 Vercel

### 第一步：准备 GitHub 仓库

1. 登录 GitHub。
2. 新建仓库，例如：`xiguang-zilv`。
3. 把本项目所有文件上传到仓库根目录。

如果你会用命令行，可以在项目目录执行：

```bash
git init
git add .
git commit -m "init xiguang zilv"
git branch -M main
git remote add origin https://github.com/你的用户名/xiguang-zilv.git
git push -u origin main
```

### 第二步：导入到 Vercel

1. 打开 `https://vercel.com`。
2. 使用 GitHub 账号登录。
3. 点击 `Add New...` → `Project`。
4. 选择刚才的 `xiguang-zilv` 仓库。
5. Framework Preset 选择 `Other`。
6. Build Command 留空，Output Directory 填 `.`。
7. 点击 `Deploy`。

部署完成后，Vercel 会给你一个网址，例如：

```text
https://xiguang-zilv.vercel.app
```

别人打开这个网址就能使用。

### Vercel 注意事项

- 这个项目已经包含 `vercel.json`，Vercel 会按静态站点方式部署。
- 页面数据保存在每个用户自己的浏览器 `localStorage` 中。
- 如果别人访问你的网页，他们看到的是自己的本地数据，不会看到你的数据。

---

## 方式二：部署到 GitHub Pages

### 第一步：上传代码到 GitHub

创建仓库并上传项目文件。仓库根目录需要包含：

```text
index.html
checkin.html
review.html
ai.html
me.html
assets/
package.json
.nojekyll
.github/workflows/deploy-github-pages.yml
```

### 第二步：开启 GitHub Pages

1. 进入 GitHub 仓库。
2. 点击 `Settings`。
3. 左侧点击 `Pages`。
4. Source 选择 `GitHub Actions`。
5. 回到仓库首页，点击 `Actions`。
6. 等待 `部署到 GitHub Pages` 工作流运行完成。

完成后，你会得到类似这样的地址：

```text
https://你的用户名.github.io/xiguang-zilv/
```

### 如果 GitHub Pages 没有自动运行

可以手动触发：

1. 打开仓库的 `Actions`。
2. 选择 `部署到 GitHub Pages`。
3. 点击 `Run workflow`。
4. 等待完成。

---

## 方式三：部署到 Netlify

### 拖拽上传

1. 打开 `https://app.netlify.com/drop`。
2. 登录 Netlify。
3. 把整个 `xiguang-zilv` 文件夹拖进去。
4. 等待上传完成。

Netlify 会给你一个临时网址，例如：

```text
https://gentle-xiguang.netlify.app
```

你也可以在 Netlify 后台修改站点名称。

---

## 本地预览

### 方式一：直接打开

双击 `index.html`。

### 方式二：用本地服务器打开

```bash
npm install
npm run dev
```

或者：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

---

## 常见问题

### 别人访问网页后，能看到我的打卡数据吗？

不能。现在的数据保存在浏览器本地，每个用户的数据互相独立。

### 别人换手机或清理浏览器缓存后，数据还在吗？

不一定。因为当前版本使用 `localStorage`，如果清理浏览器数据，记录可能丢失。后续可以接入用户登录和数据库解决。

### AI Key 会不会暴露？

如果用户在【我的】页填写 AI Key，它只保存在用户自己的浏览器 `localStorage` 中。当前版本适合个人使用或测试，不建议公开要求用户填写自己的敏感 Key。

如果未来做商业化版本，建议把 AI 调用放到后端接口，由服务器安全保存 Key。

### 以后要改成登录 + 数据库难吗？

不难。当前核心逻辑都集中在 `assets/js/app.js`，后续可以把里面的 `localStorage` 读写替换为 API 请求。

---

## 推荐上线方案

如果你只是想马上把网页发给别人用，建议使用：

```text
Vercel
```

原因是流程最短，部署成功后马上就能拿到公网链接。
