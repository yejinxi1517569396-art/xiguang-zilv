/* =========================================================
 * 汐光自律 · 共享 UI 组件（顶部品牌、底部 Tab、SVG 渐变）
 * ======================================================= */
const UI = (() => {
  function brandHeader() {
    return `
      <div class="brand-header">
        <div class="brand-title">
          <div class="brand-mark">汐</div>
          <div>
            <div class="brand-name">汐光自律</div>
            <div class="brand-tag">温柔地坚持，慢慢变好</div>
          </div>
        </div>
        <div class="date-chip">${App.fmt.dateLabel()}</div>
      </div>`;
  }

  function tabBar(active) {
    const tabs = [
      { key: 'home',      label: '首页',   icon: '🏠', href: 'index.html' },
      { key: 'checkin',   label: '打卡',   icon: '✅', href: 'checkin.html' },
      { key: 'community', label: '社区',   icon: '🌷', href: 'community.html' },
      { key: 'coach',     label: '锦汐AI', icon: '✨', href: 'coach.html' },
      { key: 'me',        label: '我的',   icon: '🌸', href: 'me.html' }
    ];
    return `
      <nav class="tab-bar">
        <div class="tab-bar-inner">
          ${tabs.map(t => `
            <a class="tab-item ${active === t.key ? 'active' : ''}" href="${t.href}">
              <span class="tab-icon">${t.icon}</span>
              <span>${t.label}</span>
            </a>
          `).join('')}
        </div>
      </nav>`;
  }

  function ringDef() {
    // SVG defs：用于环形进度的渐变色
    return `
      <svg width="0" height="0" style="position:absolute">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6FB1F0"/>
            <stop offset="100%" stop-color="#A8C8EC"/>
          </linearGradient>
        </defs>
      </svg>`;
  }

  /** 渲染环形进度
   * @param {number} percent 0-100
   * @param {string} centerLabel 主文字（如 "65%"）
   * @param {string} subLabel 副文字
   */
  function progressRing(percent, centerLabel, subLabel) {
    const r = 38;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return `
      <div class="progress-ring">
        <svg width="96" height="96">
          <circle class="ring-bg" cx="48" cy="48" r="${r}" stroke-width="8"></circle>
          <circle class="ring-fg" cx="48" cy="48" r="${r}" stroke-width="8"
                  stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="progress-ring-text">
          <div class="progress-ring-num">${centerLabel}</div>
          <div class="progress-ring-lbl">${subLabel}</div>
        </div>
      </div>`;
  }

  function injectShared(activeTab) {
    document.body.insertAdjacentHTML('afterbegin', ringDef());
    const shell = document.querySelector('.app-shell');
    if (shell) shell.insertAdjacentHTML('afterbegin', brandHeader());
    document.body.insertAdjacentHTML('beforeend', tabBar(activeTab));
    registerServiceWorker();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // 静默失败：部分本地 file:// 打开方式不支持 Service Worker。
      });
    });
  }

  return { brandHeader, tabBar, ringDef, progressRing, injectShared };
})();
