/* =========================================================
 * 汐光自律 · 核心应用逻辑
 * 数据存储：localStorage（后续可替换为数据库）
 * AI 接口：已预留 callAI() 方法，可在 settings 中填入 OpenAI Key
 * ======================================================= */

const App = (() => {
  // ---------- 工具方法 ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const fmt = {
    today() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    dateLabel() {
      const d = new Date();
      const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${d.getMonth() + 1}月${d.getDate()}日 · ${week[d.getDay()]}`;
    },
    greet() {
      const h = new Date().getHours();
      if (h < 6) return '夜深了，注意休息';
      if (h < 11) return '早安，新的一天';
      if (h < 14) return '中午好，记得吃饭';
      if (h < 18) return '下午好，继续加油';
      if (h < 22) return '晚上好，今天辛苦啦';
      return '夜深了，早点休息';
    },
    daysBetween(d1, d2) {
      const a = new Date(d1), b = new Date(d2);
      return Math.round((b - a) / 86400000);
    },
    yesterday(date) {
      const d = new Date(date);
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  };

  // ---------- 本地账号 ----------
  // 说明：这是静态网页可用的前端登录注册，用 localStorage 保存账号。
  // 它适合 MVP 演示和个人使用；正式商业化请接入后端、数据库与加密认证。
  const AUTH_KEY = 'xiguang-zilv-auth-v1';
  const BASE_STORE_KEY = 'xiguang-zilv-data-v1';

  function loadAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return { users: [], currentUserId: null };
      const parsed = JSON.parse(raw);
      return Object.assign({ users: [], currentUserId: null }, parsed);
    } catch (e) {
      return { users: [], currentUserId: null };
    }
  }

  let authState = loadAuth();

  function saveAuth() {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
  }

  function normalizeAccount(account) {
    return String(account || '').trim().toLowerCase();
  }

  function encodeText(text) {
    return btoa(unescape(encodeURIComponent(String(text))));
  }

  function simpleHash(text) {
    // 前端演示用的轻量混淆，不等同于安全加密。
    return encodeText(`xiguang:${text}:zilv`);
  }

  function getCurrentUser() {
    if (!authState.currentUserId) return null;
    return authState.users.find(u => u.id === authState.currentUserId) || null;
  }

  function currentStoreKey() {
    const user = getCurrentUser();
    return user ? `${BASE_STORE_KEY}:user:${user.id}` : BASE_STORE_KEY;
  }

  // ---------- 数据存储 ----------
  const defaultData = {
    tasks: {},      // { '2026-06-10': [{id, name, emoji, done, createdAt}] }
    reviews: {},    // { '2026-06-10': {wakeup, harvest, mood, weakness, plan} }
    aiPlans: [],    // [{id, goal, plan, createdAt}]
    aiReviews: [],  // [{id, content, createdAt}]
    streak: { last: null, count: 0, max: 0 },

    // 自定义打卡模板 [{id, name, emoji, color, freq:'daily'|'weekly', weekdays:[1..7]}]
    customHabits: [],

    // 周复盘 / 月复盘自动生成结果 { 'W2026-23': {...}, 'M2026-06': {...} }
    weekReviews: {},
    monthReviews: {},

    // 社区帖子（本地）
    posts: [],            // [{id, author, avatar, content, mood, createdAt, likes:[uid], comments:[{uid, name, content, createdAt}]}]

    // 搭子 / 情侣 / 排行榜 数据
    buddies: [],          // [{id, name, avatar, code, type:'friend'|'couple', linkedAt, todayDone, streak}]
    coachSessions: [],    // 锦汐AI教练对话记录 [{id, role:'user'|'coach', content, createdAt}]
    coachSettings: {
      strictness: 'gentle',  // 'gentle' | 'normal' | 'strict'
      remindTime: '08:00',
      goalDesc: ''
    },

    settings: {
      aiMode: 'auto',           // 'auto' | 'server' | 'client' | 'mock'
      aiKey: '',                // 仅 client 模式使用
      aiBase: 'https://api.openai.com/v1',
      aiServerUrl: '',          // 后端代理地址, 例如 https://your-app.vercel.app/api/ai
      model: 'gpt-3.5-turbo'
    },
    quoteIndex: 0
  };

  let data = loadData();

  function loadData() {
    try {
      const raw = localStorage.getItem(currentStoreKey());
      if (!raw) return JSON.parse(JSON.stringify(defaultData));
      const parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(defaultData)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultData));
    }
  }
  function saveData() {
    localStorage.setItem(currentStoreKey(), JSON.stringify(data));
  }

  function registerUser({ name, account, password }) {
    const displayName = String(name || '').trim() || '汐光用户';
    const normalized = normalizeAccount(account);
    if (!normalized) return { ok: false, message: '请输入账号' };
    if (!password || String(password).length < 6) return { ok: false, message: '密码至少需要 6 位' };
    if (authState.users.some(u => u.account === normalized)) {
      return { ok: false, message: '这个账号已经注册过啦' };
    }
    const user = {
      id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: displayName,
      account: normalized,
      passwordHash: simpleHash(password),
      createdAt: Date.now()
    };
    authState.users.push(user);
    authState.currentUserId = user.id;
    saveAuth();
    return { ok: true, message: '注册成功', user };
  }

  function loginUser({ account, password }) {
    const normalized = normalizeAccount(account);
    const user = authState.users.find(u => u.account === normalized);
    if (!user) return { ok: false, message: '账号不存在，请先注册' };
    if (user.passwordHash !== simpleHash(password)) {
      return { ok: false, message: '密码不正确' };
    }
    authState.currentUserId = user.id;
    saveAuth();
    return { ok: true, message: '登录成功', user };
  }

  function logoutUser() {
    authState.currentUserId = null;
    saveAuth();
  }

  // ---------- 成长语录 ----------
  const QUOTES = [
    '微光会变成星河，自律会变成习惯。',
    '种一棵树最好的时间，是十年前，其次是现在。',
    '每天进步一点点，时间会偏爱努力的人。',
    '你不需要很厉害才能开始，但需要开始才会很厉害。',
    '温柔的坚持，比用力的努力更有力量。',
    '愿你成为自己喜欢的样子，慢慢来比较快。',
    '清晨的第一缕光，是最温柔的鼓励。',
    '把每个小目标都完成，大目标自然会到来。',
    '你今天种下的因，会开出未来的花。',
    '专注当下，就是对未来最好的回应。'
  ];

  function todayQuote() {
    const dayIndex = Math.floor(new Date().getTime() / 86400000);
    return QUOTES[dayIndex % QUOTES.length];
  }

  // ---------- 任务相关 ----------
  function getTodayTasks() {
    const t = fmt.today();
    if (!data.tasks[t]) {
      data.tasks[t] = inheritTasks();
      saveData();
    }
    return data.tasks[t];
  }
  function inheritTasks() {
    // 从最近一次有任务的日期继承未完成的任务模板（仅复用名称）
    const dates = Object.keys(data.tasks).sort().reverse();
    if (!dates.length) return [];
    const lastTasks = data.tasks[dates[0]] || [];
    return lastTasks.map(t => ({
      id: 'tk_' + Math.random().toString(36).slice(2, 9),
      name: t.name,
      emoji: t.emoji,
      done: false,
      createdAt: Date.now()
    }));
  }

  function addTask(name, emoji = '✨') {
    if (!name.trim()) return;
    const tasks = getTodayTasks();
    tasks.push({
      id: 'tk_' + Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      emoji,
      done: false,
      createdAt: Date.now()
    });
    saveData();
  }
  function toggleTask(id) {
    const tasks = getTodayTasks();
    const t = tasks.find(x => x.id === id);
    if (t) {
      t.done = !t.done;
      saveData();
      updateStreak();
    }
  }
  function deleteTask(id) {
    const t = fmt.today();
    data.tasks[t] = (data.tasks[t] || []).filter(x => x.id !== id);
    saveData();
  }

  // ---------- 连续打卡 ----------
  function updateStreak() {
    const tasks = getTodayTasks();
    const today = fmt.today();
    const hasDone = tasks.some(t => t.done);

    if (!hasDone) {
      // 今天没完成任务，不更新（保持原状）
      return;
    }
    // 今天已经至少完成 1 个任务
    if (data.streak.last === today) return;
    if (data.streak.last === fmt.yesterday(today)) {
      data.streak.count += 1;
    } else {
      data.streak.count = 1;
    }
    data.streak.last = today;
    if (data.streak.count > data.streak.max) data.streak.max = data.streak.count;
    saveData();
  }

  function getStreak() {
    // 若 last 日期非今天且非昨天，连续中断（仅显示）
    if (!data.streak.last) return 0;
    const today = fmt.today();
    if (data.streak.last === today) return data.streak.count;
    if (data.streak.last === fmt.yesterday(today)) return data.streak.count;
    return 0;
  }

  // ---------- 完成率 ----------
  function todayRate() {
    const tasks = getTodayTasks();
    if (!tasks.length) return { done: 0, total: 0, rate: 0 };
    const done = tasks.filter(t => t.done).length;
    return { done, total: tasks.length, rate: Math.round((done / tasks.length) * 100) };
  }

  function weekStats() {
    // 最近 7 天（含今天）
    const arr = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const tasks = data.tasks[key] || [];
      const total = tasks.length;
      const done = tasks.filter(t => t.done).length;
      const rate = total ? Math.round(done / total * 100) : 0;
      arr.push({
        date: key,
        dayLabel: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
        done, total, rate,
        isToday: i === 0
      });
    }
    return arr;
  }

  function weekAvgRate() {
    const days = weekStats().filter(d => d.total > 0);
    if (!days.length) return 0;
    return Math.round(days.reduce((sum, d) => sum + d.rate, 0) / days.length);
  }

  function totalCheckinDays() {
    return Object.keys(data.tasks).filter(k => (data.tasks[k] || []).some(t => t.done)).length;
  }

  // ---------- 复盘 ----------
  function getTodayReview() {
    const t = fmt.today();
    return data.reviews[t] || { wakeup: '', harvest: '', mood: '', weakness: '', plan: '' };
  }
  function saveReview(review) {
    const t = fmt.today();
    data.reviews[t] = review;
    saveData();
  }

  // ---------- AI 模拟（前端） ----------
  function mockAIReview(reviewData) {
    const tasks = getTodayTasks();
    const r = todayRate();
    const moodMap = {
      '😊': '愉悦', '😌': '平静', '🙂': '尚可', '😔': '低落', '🥰': '充满爱意'
    };
    const moodLabel = moodMap[reviewData.mood] || '平和';
    return `亲爱的，今天你完成了 ${r.done}/${r.total} 项任务，完成率 ${r.rate}%${r.rate >= 70 ? '，非常棒～' : '，已经很努力啦。'}

📌 关于今天的觉察
你提到的早起感受："${reviewData.wakeup || '今天没有特别记录'}"。早起后的状态会决定一天的节奏，建议保持规律作息。

🌱 今日收获
"${reviewData.harvest || '即使没有特别记录，平凡的一天也值得肯定'}"。这些细微的进步在长期看来都是非常宝贵的积累。

💭 关于不足
"${reviewData.weakness || '今天没有特别困扰的地方'}"。建议明天先解决最重要的那 1 件事，不必苛求完美。

🎯 给明天的建议
1. 把"${reviewData.plan || '明日计划'}"拆成 2-3 个小步骤
2. 早起后的第一个小时给最重要的事情
3. 当前心情：${moodLabel}，建议保持/调整节奏

请记住：温柔地对待自己，比严格地要求自己更重要。你今天已经很棒了 🌸`;
  }

  function mockAIPlan(goal) {
    return `针对你的目标"${goal}"，为你定制每日计划如下：

🌅 晨间（07:00 - 09:00）
• 起床后喝 300ml 温水，做 5 分钟拉伸
• 进行 25 分钟深度学习/阅读，与目标直接相关
• 写下今日要达成的 1 个核心结果

📚 上午（09:00 - 12:00）
• 90 分钟专注工作（番茄钟 25/5 节奏）
• 处理目标相关的最重要任务
• 中途起身走动 2 次

🍵 午后（14:00 - 18:00）
• 50 分钟技能学习/练习（与目标强相关）
• 复盘上午进度，调整下午策略
• 完成 30 分钟运动（散步/瑜伽/跑步）

🌙 晚间（19:00 - 22:00）
• 20 分钟阅读，扩展认知边界
• 10 分钟反思日记，记录今日收获
• 22:30 前准备休息，保证 7-8 小时睡眠

🎯 每周复盘
每周日花 30 分钟回顾本周进展，调整下周节奏。

记得：可持续的节奏 > 短期的爆发。${goal.length > 4 ? '相信你能慢慢靠近 "' + goal + '" 这个方向 🌷' : '一起加油 🌷'}`;
  }

  // 自动探测当前页面是否运行在自带后端的环境 (Vercel 部署带 /api/ai)
  let _serverProbeCache = null;
  async function probeServer() {
    if (_serverProbeCache !== null) return _serverProbeCache;
    try {
      // 用 OPTIONS 探测, 不消耗 token
      const url = (data.settings.aiServerUrl || '/api/ai');
      const res = await fetch(url, { method: 'OPTIONS' });
      _serverProbeCache = res.ok;
    } catch (e) {
      _serverProbeCache = false;
    }
    return _serverProbeCache;
  }

  // 调用 AI:
  //   mode = 'server' -> 走 Vercel 后端代理 (推荐, 不暴露 Key)
  //   mode = 'client' -> 浏览器直连 OpenAI (需要用户填 Key, 仅本人电脑安全)
  //   mode = 'mock'   -> 强制使用本地模拟示例
  //   mode = 'auto'   -> 优先 server, 没有则 client, 否则 mock
  async function callAI(messages, mockFallback) {
    const s = data.settings;
    const mode = s.aiMode || 'auto';
    const model = s.model || 'gpt-3.5-turbo';

    // 决策实际使用哪种模式
    let actual = mode;
    if (mode === 'auto') {
      const hasServer = await probeServer();
      if (hasServer) actual = 'server';
      else if (s.aiKey) actual = 'client';
      else actual = 'mock';
    }

    if (actual === 'mock') {
      await new Promise(r => setTimeout(r, 600));
      return { ok: true, mode: 'mock', text: mockFallback };
    }

    if (actual === 'server') {
      try {
        const url = s.aiServerUrl || '/api/ai';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, model, temperature: 0.7 })
        });
        const json = await res.json();
        if (!res.ok) {
          return {
            ok: false,
            mode: 'mock',
            text: mockFallback + '\n\n（后端返回错误：' + (json.error || res.status) + '，已回退到本地示例）'
          };
        }
        return { ok: true, mode: 'server', text: json.text || '（AI 暂无返回）' };
      } catch (e) {
        return {
          ok: false,
          mode: 'mock',
          text: mockFallback + '\n\n（提示：未连上后端代理，已使用本地示例返回）'
        };
      }
    }

    if (actual === 'client') {
      const key = s.aiKey;
      const base = s.aiBase || 'https://api.openai.com/v1';
      if (!key) {
        return { ok: true, mode: 'mock', text: mockFallback };
      }
      try {
        const res = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({ model, messages, temperature: 0.7 })
        });
        const json = await res.json();
        if (!res.ok) {
          return {
            ok: false,
            mode: 'mock',
            text: mockFallback + '\n\n（OpenAI 返回错误：' + (json?.error?.message || res.status) + '）'
          };
        }
        const text = json?.choices?.[0]?.message?.content || '（AI 暂无返回）';
        return { ok: true, mode: 'client', text };
      } catch (e) {
        return {
          ok: false,
          mode: 'mock',
          text: mockFallback + '\n\n（提示：网络错误，已使用本地示例返回）'
        };
      }
    }

    // 兜底
    return { ok: true, mode: 'mock', text: mockFallback };
  }

  // ---------- Toast ----------
  function toast(msg) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ============================================================
  // 自定义打卡（Custom Habits）
  // ============================================================
  function addCustomHabit({ name, emoji, color, freq = 'daily', weekdays = [1,2,3,4,5,6,7] }) {
    if (!name) return null;
    const habit = {
      id: 'h_' + Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      emoji: emoji || '✨',
      color: color || '#6FB1F0',
      freq,
      weekdays,
      createdAt: Date.now()
    };
    data.customHabits.push(habit);
    saveData();
    return habit;
  }
  function deleteCustomHabit(id) {
    data.customHabits = data.customHabits.filter(h => h.id !== id);
    saveData();
  }
  function listCustomHabits() {
    return data.customHabits || [];
  }
  /** 把符合今天的自定义习惯加到今日任务清单（如果还没加过） */
  function applyHabitsToToday() {
    const today = fmt.today();
    const dow = ((new Date().getDay() + 6) % 7) + 1; // 1=周一 .. 7=周日
    const todayTasks = getTodayTasks();
    const exists = new Set(todayTasks.map(t => t.name));
    let added = 0;
    (data.customHabits || []).forEach(h => {
      if (h.freq === 'weekly' && !(h.weekdays || []).includes(dow)) return;
      if (exists.has(h.name)) return;
      todayTasks.push({
        id: 'tk_' + Math.random().toString(36).slice(2, 9),
        name: h.name,
        emoji: h.emoji,
        habitId: h.id,
        done: false,
        createdAt: Date.now()
      });
      added++;
    });
    saveData();
    return added;
  }

  // ============================================================
  // 周复盘 / 月复盘 自动生成
  // ============================================================
  function isoWeekKey(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `W${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
  }
  function monthKey(date) {
    return `M${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function statsForRange(daysBack) {
    const today = new Date();
    const tasksList = [];
    const reviewsList = [];
    let totalDone = 0, totalAll = 0, daysWithDone = 0;
    const moodCount = {};
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const ts = data.tasks[key] || [];
      const done = ts.filter(t => t.done);
      totalAll += ts.length;
      totalDone += done.length;
      if (done.length) daysWithDone++;
      tasksList.push(...ts);
      const r = data.reviews[key];
      if (r) {
        reviewsList.push({ date: key, ...r });
        if (r.mood) moodCount[r.mood] = (moodCount[r.mood] || 0) + 1;
      }
    }
    // 高频任务 Top
    const freq = {};
    tasksList.forEach(t => { if (t.done) freq[t.name] = (freq[t.name] || 0) + 1; });
    const topTasks = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 5);
    const topMood = Object.entries(moodCount).sort((a,b) => b[1]-a[1])[0];
    return {
      totalDone, totalAll,
      rate: totalAll ? Math.round(totalDone / totalAll * 100) : 0,
      daysWithDone, daysBack,
      reviewCount: reviewsList.length,
      topTasks,
      topMood: topMood ? topMood[0] : '',
      reviewsList
    };
  }

  /** 生成本周复盘（自动汇总 + AI 文案） */
  async function generateWeekReview() {
    const key = isoWeekKey(new Date());
    const s = statsForRange(7);
    const messages = [
      { role: 'system', content: '你是温柔的成长教练锦汐AI，请用温柔、共情、鼓励的语气帮用户做周复盘。' },
      { role: 'user', content: `请帮我生成本周（最近 7 天）的复盘报告，要求 4 段：1. 数据总结 2. 亮点 3. 待改善 4. 下周建议。
本周完成率 ${s.rate}% (${s.totalDone}/${s.totalAll})
打卡天数 ${s.daysWithDone}/7
高频完成任务：${s.topTasks.map(t=>t[0]+'×'+t[1]).join('，') || '无'}
高频心情：${s.topMood || '未记录'}
复盘记录数：${s.reviewCount}
` }
    ];
    const mockText = `🌷 本周复盘（${key}）

📊 数据总结
本周共完成任务 ${s.totalDone}/${s.totalAll}（完成率 ${s.rate}%），共有 ${s.daysWithDone} 天打了卡，${s.reviewCount} 天写了复盘。

✨ 本周亮点
${s.topTasks.length ? '高频完成任务：' + s.topTasks.map(t=>t[0]).join('、') : '虽然没有特别突出的项，但每一份坚持都很珍贵。'}

💭 待改善
${s.rate < 60 ? '本周完成率偏低，可以试着把任务拆得更小，先专注 1-2 件最重要的事。' : '已经做得很棒，可以继续保持。'}

🎯 下周建议
1) 把"最重要的 3 件事"放到清晨完成
2) 至少写 5 天复盘，记录心情变化
3) 给自己留一天"休息日"，温柔比用力更重要 🌸`;

    const r = await callAI(messages, mockText);
    data.weekReviews[key] = {
      key, generatedAt: Date.now(),
      content: r.text, stats: s, mode: r.mode
    };
    saveData();
    return data.weekReviews[key];
  }

  async function generateMonthReview() {
    const key = monthKey(new Date());
    const s = statsForRange(30);
    const messages = [
      { role: 'system', content: '你是温柔的成长教练锦汐AI，请用温柔、共情、鼓励的语气帮用户做月复盘。' },
      { role: 'user', content: `请帮我生成本月（最近 30 天）的复盘报告。
完成率 ${s.rate}% (${s.totalDone}/${s.totalAll})
打卡天数 ${s.daysWithDone}/30
高频完成任务：${s.topTasks.map(t=>t[0]+'×'+t[1]).join('，') || '无'}
要求 5 段：本月总览 / 高光时刻 / 成长曲线 / 需要关注 / 下月小目标。` }
    ];
    const mockText = `🌙 本月复盘（${key}）

🌅 本月总览
本月共完成 ${s.totalDone} 项任务，完成率 ${s.rate}%，打卡 ${s.daysWithDone} 天，复盘 ${s.reviewCount} 篇。

✨ 高光时刻
你最常完成的事是「${s.topTasks[0] ? s.topTasks[0][0] : '日常打卡'}」——这就是属于你的"复利"。

📈 成长曲线
${s.daysWithDone >= 20 ? '坚持度非常高，已经形成稳定节奏 🌷' : '坚持度有上升空间，下月可以从更小的目标开始。'}

💡 需要关注
${s.rate < 60 ? '完成率偏低，建议精简清单，每天 3 件核心事即可。' : '继续保持，避免任务清单变得太长。'}

🌸 下月小目标
1) 选 1 件最重要的事，每天必做
2) 每周至少写 5 天复盘
3) 给自己安排 1 次温柔的奖励`;

    const r = await callAI(messages, mockText);
    data.monthReviews[key] = {
      key, generatedAt: Date.now(),
      content: r.text, stats: s, mode: r.mode
    };
    saveData();
    return data.monthReviews[key];
  }

  function listWeekReviews() {
    return Object.values(data.weekReviews || {}).sort((a,b) => b.generatedAt - a.generatedAt);
  }
  function listMonthReviews() {
    return Object.values(data.monthReviews || {}).sort((a,b) => b.generatedAt - a.generatedAt);
  }

  // ============================================================
  // 社区（本地模拟，未来可换成数据库）
  // ============================================================
  // 内置一些温柔的示例帖子（仅初始化时插入）
  function ensureSeedPosts() {
    if ((data.posts || []).length > 0) return;
    const seed = [
      { author: '小满', avatar: '🌷', content: '今天连续早起第 21 天啦！每天清晨真的好治愈～愿你也能拥有温柔的清晨。', mood: '🥰' },
      { author: '柚子', avatar: '🍋', content: '坚持运动一个月，不是为了瘦，是为了开始喜欢自己。', mood: '😊' },
      { author: '阿星', avatar: '🌟', content: '复盘真的很重要，写下来才发现今天其实做了很多事～', mood: '😌' },
      { author: '云朵', avatar: '☁️', content: '今天做得不太好，但允许自己有不那么完美的一天。', mood: '🙂' }
    ];
    seed.forEach(s => {
      data.posts.push({
        id: 'p_' + Math.random().toString(36).slice(2, 9),
        author: s.author, avatar: s.avatar,
        content: s.content, mood: s.mood,
        createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 3),
        likes: [],
        comments: [
          { uid: 'sys', name: '汐光小助手', content: '你已经很棒啦 🌷', createdAt: Date.now() - 3600000 }
        ]
      });
    });
    saveData();
  }

  function listPosts() {
    ensureSeedPosts();
    return (data.posts || []).slice().sort((a,b) => b.createdAt - a.createdAt);
  }
  function createPost({ content, mood }) {
    if (!content || !content.trim()) return null;
    const me = getCurrentUser();
    const post = {
      id: 'p_' + Math.random().toString(36).slice(2, 9),
      author: me ? me.name : '汐光访客',
      avatar: '🌸',
      content: content.trim(),
      mood: mood || '',
      createdAt: Date.now(),
      likes: [],
      comments: []
    };
    data.posts.unshift(post);
    saveData();
    return post;
  }
  function toggleLike(postId) {
    const p = (data.posts || []).find(x => x.id === postId);
    if (!p) return;
    const me = getCurrentUser();
    const uid = me ? me.id : 'guest';
    const idx = p.likes.indexOf(uid);
    if (idx >= 0) p.likes.splice(idx, 1);
    else p.likes.push(uid);
    saveData();
    return p.likes.length;
  }
  function commentPost(postId, content) {
    if (!content || !content.trim()) return null;
    const p = (data.posts || []).find(x => x.id === postId);
    if (!p) return null;
    const me = getCurrentUser();
    p.comments.push({
      uid: me ? me.id : 'guest',
      name: me ? me.name : '访客',
      content: content.trim(),
      createdAt: Date.now()
    });
    saveData();
    return p;
  }

  // ============================================================
  // 排行榜（本地：当前用户 + 内置示例 + 搭子/情侣）
  // ============================================================
  function buildLeaderboard() {
    const me = getCurrentUser();
    const myStreak = getStreak();
    const myRate = todayRate().rate;
    const myEntry = {
      id: 'me',
      name: me ? me.name : '我',
      avatar: '🌸',
      streak: myStreak,
      todayRate: myRate,
      score: myStreak * 10 + myRate,
      isMe: true
    };
    const seed = [
      { id: 's1', name: '小满', avatar: '🌷', streak: 21, todayRate: 100, score: 21*10 + 100 },
      { id: 's2', name: '柚子', avatar: '🍋', streak: 15, todayRate: 90, score: 15*10 + 90 },
      { id: 's3', name: '阿星', avatar: '🌟', streak: 12, todayRate: 80, score: 12*10 + 80 },
      { id: 's4', name: '云朵', avatar: '☁️', streak: 8, todayRate: 60, score: 8*10 + 60 },
      { id: 's5', name: '小桃', avatar: '🍑', streak: 5, todayRate: 50, score: 5*10 + 50 }
    ];
    const buddies = (data.buddies || []).map(b => ({
      id: b.id, name: b.name + (b.type === 'couple' ? ' 💑' : ' 🤝'),
      avatar: b.avatar || '🌼',
      streak: b.streak || 0,
      todayRate: b.todayDone ? 80 : 30,
      score: (b.streak || 0) * 10 + (b.todayDone ? 80 : 30)
    }));
    return [myEntry, ...seed, ...buddies].sort((a,b) => b.score - a.score);
  }

  // ============================================================
  // 搭子 / 情侣
  // ============================================================
  function generateInviteCode() {
    return 'XG' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  function addBuddy({ name, type = 'friend', avatar }) {
    const b = {
      id: 'b_' + Math.random().toString(36).slice(2, 9),
      name: name || (type === 'couple' ? 'TA' : '搭子'),
      avatar: avatar || (type === 'couple' ? '💑' : '🤝'),
      code: generateInviteCode(),
      type,
      linkedAt: Date.now(),
      todayDone: false,
      streak: Math.floor(Math.random() * 10) // 模拟
    };
    data.buddies.push(b);
    saveData();
    return b;
  }
  function bindBuddyByCode(code, name = 'TA', type = 'friend') {
    if (!code || !/^XG[A-Z0-9]{6}$/.test(code.trim().toUpperCase())) {
      return { ok: false, message: '邀请码格式不对，应为 XG 开头的 8 位字符' };
    }
    const b = {
      id: 'b_' + Math.random().toString(36).slice(2, 9),
      name, type,
      avatar: type === 'couple' ? '💑' : '🤝',
      code: code.trim().toUpperCase(),
      linkedAt: Date.now(),
      todayDone: Math.random() > 0.4,
      streak: 1 + Math.floor(Math.random() * 8)
    };
    data.buddies.push(b);
    saveData();
    return { ok: true, buddy: b };
  }
  function removeBuddy(id) {
    data.buddies = data.buddies.filter(b => b.id !== id);
    saveData();
  }
  function poke(id) {
    const b = (data.buddies || []).find(x => x.id === id);
    if (!b) return null;
    b._lastPoke = Date.now();
    saveData();
    return b;
  }

  // ============================================================
  // 锦汐 AI 教练
  // ============================================================
  function coachToneByStrictness() {
    const map = {
      gentle: '请用极其温柔、共情、不批评的语气回答，多给鼓励与心理支持。',
      normal: '请用温柔但务实的语气，既鼓励，也指出可改进点，给具体行动建议。',
      strict: '请用直接、坚定但不刻薄的语气，像一位严格但深爱用户的教练，必要时直言不讳地指出懒惰与借口，并给行动方案。'
    };
    return map[data.coachSettings.strictness || 'gentle'];
  }

  async function askCoach(userText) {
    if (!userText || !userText.trim()) return null;
    const r = todayRate();
    const tasks = getTodayTasks();
    const ctx = `用户今日任务 ${r.done}/${r.total}（${r.rate}%）。任务清单：${tasks.map(t=>(t.done?'✓':'○')+t.name).join('、') || '空'}。用户连续打卡 ${getStreak()} 天。用户的目标：${data.coachSettings.goalDesc || '未填写'}.`;
    const messages = [
      { role: 'system', content: `你是"锦汐AI教练"，专属个人成长监督教练。${coachToneByStrictness()} 不要超过 200 字，可以用 emoji。` },
      { role: 'system', content: '当前用户上下文：' + ctx },
      { role: 'user', content: userText.trim() }
    ];
    const mockText = `锦汐AI教练 🌸：
我看到你今天完成了 ${r.done}/${r.total} 项（${r.rate}%）${r.rate >= 70 ? '，节奏很好！' : '，还有发力空间。'}
${data.coachSettings.strictness === 'strict' ? '别给自己太多"明天再做"的借口——把最重要的那 1 件事，10 分钟内开始。' : '今天先选 1 件最重要的事，把它完成，就值得为自己骄傲。'}
明日建议：① 早起 30 分钟 ② 完成核心任务 ③ 写下 3 行复盘。我在这里陪你。`;

    data.coachSessions.push({ id: 'c_' + Date.now() + '_u', role: 'user', content: userText.trim(), createdAt: Date.now() });
    saveData();
    const result = await callAI(messages, mockText);
    data.coachSessions.push({ id: 'c_' + Date.now() + '_a', role: 'coach', content: result.text, createdAt: Date.now(), mode: result.mode });
    if (data.coachSessions.length > 100) data.coachSessions = data.coachSessions.slice(-100);
    saveData();
    return result;
  }
  function clearCoachSessions() {
    data.coachSessions = [];
    saveData();
  }

  // ---------- 公开接口 ----------
  return {
    fmt,
    data,
    auth: {
      get currentUser() { return getCurrentUser(); },
      get users() { return authState.users; },
      register: registerUser,
      login: loginUser,
      logout: logoutUser,
      isLoggedIn() { return !!getCurrentUser(); }
    },
    saveData,
    todayQuote,
    QUOTES,
    // tasks
    getTodayTasks,
    addTask,
    toggleTask,
    deleteTask,
    // streak / stats
    updateStreak,
    getStreak,
    todayRate,
    weekStats,
    weekAvgRate,
    totalCheckinDays,
    // review
    getTodayReview,
    saveReview,
    // ai
    callAI,
    mockAIReview,
    mockAIPlan,
    // 自定义打卡
    addCustomHabit,
    deleteCustomHabit,
    listCustomHabits,
    applyHabitsToToday,
    // 周/月复盘
    isoWeekKey,
    monthKey,
    statsForRange,
    generateWeekReview,
    generateMonthReview,
    listWeekReviews,
    listMonthReviews,
    // 社区
    listPosts,
    createPost,
    toggleLike,
    commentPost,
    // 排行榜
    buildLeaderboard,
    // 搭子 / 情侣
    addBuddy,
    bindBuddyByCode,
    removeBuddy,
    poke,
    // 锦汐 AI 教练
    askCoach,
    clearCoachSessions,
    // ui helpers
    $, $$,
    toast,
    // 重置
    reset() {
      if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
        localStorage.removeItem(currentStoreKey());
        data = loadData();
        location.reload();
      }
    },
    // 导出/导入
    exportJson() {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xiguang-zilv-${fmt.today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
})();
