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

  // ---------- 数据存储 ----------
  const STORE_KEY = 'xiguang-zilv-data-v1';
  const defaultData = {
    tasks: {},      // { '2026-06-10': [{id, name, emoji, done, createdAt}] }
    reviews: {},    // { '2026-06-10': {wakeup, harvest, mood, weakness, plan} }
    aiPlans: [],    // [{id, goal, plan, createdAt}]
    aiReviews: [],  // [{id, content, createdAt}]
    streak: { last: null, count: 0, max: 0 },
    settings: { aiKey: '', aiBase: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' },
    quoteIndex: 0
  };

  let data = loadData();

  function loadData() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultData));
      const parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(defaultData)), parsed);
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultData));
    }
  }
  function saveData() {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
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

  async function callAI(messages, mockFallback) {
    const key = data.settings.aiKey;
    const base = data.settings.aiBase || 'https://api.openai.com/v1';
    const model = data.settings.model || 'gpt-3.5-turbo';
    if (!key) {
      // 没 key，使用本地模拟
      await new Promise(r => setTimeout(r, 800));
      return { ok: true, mock: true, text: mockFallback };
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
      const text = json?.choices?.[0]?.message?.content || '（AI 暂无返回）';
      return { ok: true, mock: false, text };
    } catch (e) {
      return { ok: false, mock: true, text: mockFallback + '\n\n（提示：网络错误，已使用本地示例返回）' };
    }
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

  // ---------- 公开接口 ----------
  return {
    fmt,
    data,
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
    // ui helpers
    $, $$,
    toast,
    // 重置
    reset() {
      if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
        localStorage.removeItem(STORE_KEY);
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
