// 单页面应用路由

const app = {
  currentPage: 'home',
  currentCategory: '',
  currentIssueId: null,
  currentEventId: null,
  searchQuery: '',

  init() {
    this.bindNav();
    this.bindSearch();
    this.handleRoute();
    window.addEventListener('popstate', () => this.handleRoute());
  },

  handleRoute() {
    const hash = window.location.hash.slice(1);
    if (!hash || hash === 'home') {
      this.currentPage = 'home';
      this.renderHome();
    } else if (hash.startsWith('category/')) {
      this.currentPage = 'category';
      this.currentCategory = hash.replace('category/', '');
      this.renderCategory();
    } else if (hash.startsWith('issue/')) {
      this.currentPage = 'issue';
      this.currentIssueId = parseInt(hash.replace('issue/', ''));
      this.renderIssueDetail();
    } else if (hash.startsWith('search/')) {
      this.currentPage = 'search';
      this.searchQuery = decodeURIComponent(hash.replace('search/', ''));
      this.renderSearch();
    }
    this.updateNavState();
    window.scrollTo(0, 0);
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.getAttribute('data-nav');
        if (target === 'home') {
          window.location.hash = 'home';
        } else {
          window.location.hash = 'category/' + target;
        }
      });
    });
  },

  bindSearch() {
    const btn = document.getElementById('searchBtn');
    const input = document.getElementById('searchInput');
    btn.addEventListener('click', () => this.doSearch());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.doSearch();
    });
  },

  doSearch() {
    const val = document.getElementById('searchInput').value.trim();
    if (!val) return;
    window.location.hash = 'search/' + encodeURIComponent(val);
  },

  updateNavState() {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    let activeNav = 'home';
    if (this.currentPage === 'category') {
      activeNav = this.currentCategory;
    } else if (this.currentPage === 'home' || this.currentPage === 'search') {
      activeNav = 'home';
    } else if (this.currentPage === 'issue') {
      activeNav = 'home';
    }
    const activeEl = document.querySelector(`.nav-item[data-nav="${activeNav}"]`);
    if (activeEl) activeEl.classList.add('active');
  },

  // 首页：每期简报列表
  renderHome() {
    const main = document.getElementById('main');
    let html = `
      <div class="section-header">
        <div class="section-title">每周摘编归档</div>
        <div class="section-more">共 ${DATA.issues.length} 期</div>
      </div>
      <div class="issue-list">
    `;
    DATA.issues.forEach(issue => {
      html += `
        <div class="issue-card" onclick="window.location.hash='issue/${issue.id}'">
          <div class="issue-card-top">
            <div class="issue-card-title">${issue.title}</div>
            <div class="issue-card-date">发布于 ${issue.publishDate}</div>
          </div>
          <div class="issue-card-meta">
            <span>📅 ${issue.week}（${issue.dateRange}）</span>
            <span><span class="num">${issue.droneCount}</span> 无人机</span>
            <span><span class="num">${issue.civilCount}</span> 民航安保</span>
            <span><span class="num">${issue.diplomacyCount}</span> 外交高访</span>
          </div>
          <div class="issue-card-summary">${issue.summary}</div>
        </div>
      `;
    });
    html += `</div>`;
    main.innerHTML = html;
  },

  // 分类页：事件列表（按时间倒序）
  renderCategory() {
    const main = document.getElementById('main');
    const catMap = {
      drone: { name: '无人机相关事件', key: 'drone' },
      civil: { name: '民航公安·机场机上安保事件', key: 'civil' },
      diplomacy: { name: '外交高访（涉飞机出行）', key: 'diplomacy' }
    };
    const cat = catMap[this.currentCategory];
    if (!cat) {
      main.innerHTML = '<div class="empty-state">分类不存在</div>';
      return;
    }
    const events = DATA.events[cat.key].slice().sort((a, b) => b.date.localeCompare(a.date));

    let html = `
      <div class="section-header">
        <div class="section-title">${cat.name}</div>
        <div class="section-more">共 ${events.length} 条</div>
      </div>
      <div class="event-list">
    `;
    events.forEach(ev => {
      html += `
        <div class="event-item" onclick="app.showEventDetail('${ev.id}', '${cat.key}')">
          <div class="event-date">${ev.date.slice(5)}</div>
          <div class="event-info">
            <div class="event-title">【${ev.date.slice(5)}】${ev.title}</div>
            <div class="event-desc">${ev.summary}</div>
            <div class="event-source"><span class="event-source-tag">来源</span>${ev.source}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    main.innerHTML = html;
  },

  // 单期详情页
  renderIssueDetail() {
    const main = document.getElementById('main');
    const issue = DATA.issues.find(i => i.id === this.currentIssueId);
    if (!issue || !issue.content) {
      main.innerHTML = `
        <div class="back-btn" onclick="history.back()">← 返回列表</div>
        <div class="detail-container">
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <div>该期详细内容暂未录入</div>
          </div>
        </div>
      `;
      return;
    }
    const c = issue.content;

    // 获取事件列表
    const droneEvents = DATA.events.drone.filter(e => e.issueId === issue.id);
    const civilEvents = DATA.events.civil.filter(e => e.issueId === issue.id);
    const dipEvents = DATA.events.diplomacy.filter(e => e.issueId === issue.id);

    let html = `
      <div class="back-btn" onclick="history.back()">← 返回列表</div>
      <div class="detail-container">
        <div class="detail-header">
          <div class="detail-title">${issue.title}</div>
          <div class="detail-meta">
            <span>期数：总第${issue.id}期</span>
            <span>周期：${issue.week}（${issue.dateRange}）</span>
            <span>发布日期：${issue.publishDate}</span>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">一、周总体态势</div>
          <div class="detail-overview">${c.overview}</div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">二、周重大事件摘要</div>

          <div class="detail-subsection">
            <div class="detail-subsection-title">（一）无人机相关事件</div>
            ${droneEvents.length ? droneEvents.map(e => `
              <div class="detail-event-item">
                <div class="detail-event-title">【${e.date}】${e.title}</div>
                <div class="detail-event-content">${e.summary}</div>
                <div class="detail-event-source">来源：<a href="${e.sourceUrl}" target="_blank">${e.source}</a></div>
              </div>
            `).join('') : '<div style="color:#999;padding:15px 0;">本期无相关公开资讯</div>'}
          </div>

          <div class="detail-subsection">
            <div class="detail-subsection-title">（二）民航公安·机场机上安保事件</div>
            ${civilEvents.length ? civilEvents.map(e => `
              <div class="detail-event-item">
                <div class="detail-event-title">【${e.date}】${e.title}</div>
                <div class="detail-event-content">${e.summary}</div>
                <div class="detail-event-source">来源：<a href="${e.sourceUrl}" target="_blank">${e.source}</a></div>
              </div>
            `).join('') : '<div style="color:#999;padding:15px 0;">本期无相关公开资讯</div>'}
          </div>

          <div class="detail-subsection">
            <div class="detail-subsection-title">（三）外交高访（涉飞机出行）</div>
            ${dipEvents.length ? dipEvents.map(e => `
              <div class="detail-event-item">
                <div class="detail-event-title">【${e.date}】${e.title}</div>
                <div class="detail-event-content">${e.summary}</div>
                <div class="detail-event-source">来源：<a href="${e.sourceUrl}" target="_blank">${e.source}</a></div>
              </div>
            `).join('') : '<div style="color:#999;padding:15px 0;">本期无相关公开资讯</div>'}
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">三、国家安全态势分析</div>
          <div class="detail-subsection">
            <div class="detail-subsection-title">（一）无人机领域</div>
            <div class="detail-analysis">${c.analysis.drone}</div>
          </div>
          <div class="detail-subsection">
            <div class="detail-subsection-title">（二）民航安保</div>
            <div class="detail-analysis">${c.analysis.civil}</div>
          </div>
          <div class="detail-subsection">
            <div class="detail-subsection-title">（三）外交领域</div>
            <div class="detail-analysis">${c.analysis.diplomacy}</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">四、附录</div>
          <div class="detail-subsection">
            <div class="detail-subsection-title">（一）中东局势</div>
            <ul class="detail-appendix-list">
              ${c.appendix.middleEast.map(x => `<li>${x}</li>`).join('')}
            </ul>
          </div>
          <div class="detail-subsection">
            <div class="detail-subsection-title">（二）俄乌冲突</div>
            <ul class="detail-appendix-list">
              ${c.appendix.russiaUkraine.map(x => `<li>${x}</li>`).join('')}
            </ul>
          </div>
          <div class="detail-subsection">
            <div class="detail-subsection-title">（三）其他重大事件</div>
            <ul class="detail-appendix-list">
              ${c.appendix.others.map(x => `<li>${x}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    main.innerHTML = html;
  },

  // 单条事件详情（弹窗）
  showEventDetail(eventId, category) {
    const events = DATA.events[category];
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-title">${ev.title}</div>
          <div class="modal-close">&times;</div>
        </div>
        <div class="modal-body">
          <div class="modal-event-meta">
            <span>📅 ${ev.date}</span>
            <span>📂 ${ev.category}</span>
          </div>
          <div class="modal-event-summary">${ev.summary}</div>
          <div class="modal-source">
            <div class="modal-source-label">信息来源</div>
            <div>${ev.source} &nbsp;|&nbsp; <a href="${ev.sourceUrl}" target="_blank">查看原文</a></div>
          </div>
        </div>
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('modal-close')) {
        overlay.remove();
      }
    });
    document.body.appendChild(overlay);
  },

  // 搜索页
  renderSearch() {
    const main = document.getElementById('main');
    const q = this.searchQuery.toLowerCase();
    const results = [];

    // 搜事件
    Object.keys(DATA.events).forEach(cat => {
      DATA.events[cat].forEach(ev => {
        if (ev.title.toLowerCase().includes(q) || ev.summary.toLowerCase().includes(q)) {
          results.push({ type: 'event', data: ev, category: cat });
        }
      });
    });

    // 搜期数
    DATA.issues.forEach(issue => {
      if (issue.title.toLowerCase().includes(q) || issue.summary.toLowerCase().includes(q)) {
        results.push({ type: 'issue', data: issue });
      }
    });

    let html = `
      <div class="section-header">
        <div class="section-title">搜索结果："${this.searchQuery}"</div>
        <div class="section-more">共找到 ${results.length} 条结果</div>
      </div>
    `;

    if (results.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div>未找到相关内容，请尝试其他关键词</div>
        </div>
      `;
    } else {
      html += `<div class="event-list">`;
      results.forEach(r => {
        if (r.type === 'event') {
          const ev = r.data;
          html += `
            <div class="event-item" onclick="app.showEventDetail('${ev.id}', '${r.category}')">
              <div class="event-date">${ev.date.slice(5)}</div>
              <div class="event-info">
                <div class="event-title">【${ev.date.slice(5)}】${ev.title}</div>
                <div class="event-desc">${ev.summary}</div>
                <div class="event-source"><span class="event-source-tag">${ev.category}</span>${ev.source}</div>
              </div>
            </div>
          `;
        } else {
          const issue = r.data;
          html += `
            <div class="event-item" onclick="window.location.hash='issue/${issue.id}'">
              <div class="event-date">${issue.publishDate.slice(5)}</div>
              <div class="event-info">
                <div class="event-title">${issue.title}</div>
                <div class="event-desc">${issue.summary}</div>
                <div class="event-source"><span class="event-source-tag">每周摘编</span>${issue.week}</div>
              </div>
            </div>
          `;
        }
      });
      html += `</div>`;
    }

    main.innerHTML = html;
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
