// Renders the post grid and the feed from data/posts.json.
// Text fields are inserted as HTML, so captions can use <b> and <br>.
// Content is our own, checked into the repo; do not load untrusted data here.

const attr = (name, value) => (value == null || value === "" ? "" : ` ${name}="${value}"`);
const img = (i) => `<img${attr("style", i.style)} src="${i.src}" alt="${i.alt || ""}">`;

/* ---------- grid ---------- */

function renderTile(t) {
  if (t.text) {
    return `<a class="tile text t-${t.text.color}" href="${t.href}">` +
      `<span class="k">${t.text.kicker}</span>` +
      `<span class="h">${t.text.headline}</span>` +
      `<span class="s">${t.text.sub}</span></a>`;
  }
  const media = t.split
    ? `<span class="split">${t.split.map(img).join("")}</span>`
    : img(t.image);
  const numClass = t.overlay.isNumber === false ? "" : ' class="num"';
  return `<a class="tile" href="${t.href}"${attr("style", t.style)}>` +
    media +
    (t.badge ? `<span class="badge">${t.badge}</span>` : "") +
    `<span class="ov"><b${numClass}>${t.overlay.value}</b><span>${t.overlay.label}</span></span></a>`;
}

/* ---------- feed ---------- */

function renderMedia(m) {
  if (!m) return "";
  if (m.type === "single") {
    return `<div class="media light"><img src="${m.src}" alt="${m.alt}"></div>`;
  }
  if (m.type === "carousel") {
    const figs = m.items.map((f) =>
      `<figure${f.winner ? ' class="win"' : ""}><img src="${f.src}" alt="${f.alt}"><figcaption>${f.caption}</figcaption></figure>`
    ).join("");
    return `<div class="media">${figs}</div>`;
  }
  if (m.type === "guide") {
    return `<div class="guide">` +
      `<div class="gt">${m.title}</div>` +
      `<div class="gq">${m.quote}</div>` +
      `<div class="chips">${m.chips.map((c) => `<span>${c}</span>`).join("")}</div>` +
      `<div class="story">${m.story}</div></div>`;
  }
  return "";
}

function renderBar(b) {
  const muted = b.muted ? ' style="color:var(--muted)"' : "";
  const value = b.bold ? `<b>${b.value}</b>` : b.value;
  return `<div class="bar"><div class="lb"><span${muted}>${b.label}</span><span class="num"${muted}>${value}</span></div>` +
    `<div class="tr"><div class="fl${b.gray ? " b" : ""}" style="width:${b.width}%"></div></div></div>`;
}

function renderInsights(ins) {
  let h = `<div class="ins"><div class="ins-h"><b>${ins.title}</b><span>${ins.meta}</span></div>`;
  if (ins.intro) h += `<p class="cap" style="margin-top:8px">${ins.intro}</p>`;
  if (ins.kpis) {
    const cols = ins.kpiColumns ? ` style="grid-template-columns:repeat(${ins.kpiColumns},1fr)"` : "";
    h += `<div class="kpis num"${cols}>` +
      ins.kpis.map((k) => `<div class="kpi"><div class="v">${k.value}</div><div class="l">${k.label}</div></div>`).join("") +
      `</div>`;
  }
  if (ins.table) {
    const head = `<tr>${ins.table.head.map((c) => `<th>${c}</th>`).join("")}</tr>`;
    const rows = ins.table.rows.map((r) =>
      `<tr><td>${r.metric}</td><td>${r.a}</td><td>${r.b}</td><td class="up">${r.change}</td></tr>`
    ).join("");
    h += `<table class="num"><tbody>${head}${rows}</tbody></table>`;
  }
  if (ins.bars) h += ins.bars.map(renderBar).join("");
  if (ins.outro) h += `<p class="cap" style="margin-top:10px">${ins.outro}</p>`;
  if (ins.fine) h += `<p class="fine">${ins.fine}</p>`;
  return h + `</div>`;
}

const postHead = (p) => `<div class="ph"><span class="mini"><span>MC</span></span>` +
  `<div><div class="who">minseo.chung</div><div class="loc">${p.location}</div></div></div>`;

// Title, captions, tags and role: shared by the feed and the popup.
function renderStory(p) {
  let h = `<h3 class="t">${p.title}</h3>`;
  h += (p.captions || []).map((c) => `<p class="cap">${c}</p>`).join("");
  if (p.tags) h += `<p class="tags">${p.tags}</p>`;
  if (p.role) h += `<div class="role"><b>My role:</b> ${p.role}</div>`;
  return h;
}

function renderPost(p) {
  // Posts without media get extra top padding so the title doesn't touch the header.
  let body = `<div class="body"${p.media ? "" : ' style="padding-top:16px"'}>`;
  body += renderStory(p);
  body += (p.insights || []).map(renderInsights).join("");
  if (p.fine) body += `<p class="fine">${p.fine}</p>`;
  body += `</div>`;
  return `<article class="post" id="${p.id}">${postHead(p)}${renderMedia(p.media)}${body}</article>`;
}

/* ---------- popup (opened from the grid) ---------- */

const modal = {
  el: null, track: null, dots: null, prev: null, next: null, opener: null,

  build() {
    document.body.insertAdjacentHTML("beforeend",
      `<dialog class="pm" id="pm" aria-labelledby="pm-title">` +
        `<button class="pm-x" type="button" aria-label="Close">` +
          `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>` +
        `</button>` +
        `<div class="pm-box">` +
          `<div class="pm-media">` +
            `<div class="pm-track" tabindex="-1"></div>` +
            `<button class="pm-nav pm-prev" type="button" aria-label="Previous image">‹</button>` +
            `<button class="pm-nav pm-next" type="button" aria-label="Next image">›</button>` +
            `<div class="pm-dots" aria-hidden="true"></div>` +
          `</div>` +
          `<div class="pm-side"></div>` +
        `</div>` +
      `</dialog>`);
    this.el = document.getElementById("pm");
    this.track = this.el.querySelector(".pm-track");
    this.dots = this.el.querySelector(".pm-dots");
    this.prev = this.el.querySelector(".pm-prev");
    this.next = this.el.querySelector(".pm-next");

    this.el.querySelector(".pm-x").addEventListener("click", () => this.el.close());
    // A click that lands on the <dialog> itself (not its content) is a click on the backdrop.
    this.el.addEventListener("click", (e) => { if (e.target === this.el) this.el.close(); });
    this.el.addEventListener("close", () => {
      document.documentElement.classList.remove("pm-open");
      if (this.opener) this.opener.focus({ preventScroll: true });
    });
    this.prev.addEventListener("click", () => this.go(this.index() - 1));
    this.next.addEventListener("click", () => this.go(this.index() + 1));
    this.el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); this.go(this.index() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); this.go(this.index() + 1); }
    });
    let raf = 0;
    this.track.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => this.sync());
    });
    this.el.addEventListener("click", (e) => {
      const btn = e.target.closest(".pm-ins-btn");
      if (!btn) return;
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector("span").textContent = open ? "Hide insights" : "View insights";
      panel.hidden = !open;
      if (open) panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  },

  count() { return this.track.children.length; },
  index() { return Math.round(this.track.scrollLeft / (this.track.clientWidth || 1)); },
  go(i, instant) {
    const n = Math.max(0, Math.min(this.count() - 1, i));
    this.track.scrollTo({ left: n * this.track.clientWidth, behavior: instant ? "auto" : "smooth" });
    if (instant) this.sync(n);
  },
  sync(i = this.index()) {
    const n = this.count();
    this.prev.hidden = i <= 0;
    this.next.hidden = i >= n - 1;
    [...this.dots.children].forEach((d, k) => d.classList.toggle("on", k === i));
  },

  // Left side: the post's images, or the guide excerpt, or the tile's text card.
  slides(p, tile) {
    const m = p.media;
    if (m && m.type === "carousel") {
      return m.items.map((f) =>
        `<figure class="pm-slide${f.winner ? " win" : ""}"><img src="${f.src}" alt="${f.alt}"><figcaption>${f.caption}</figcaption></figure>`);
    }
    if (m && m.type === "single") {
      return [`<figure class="pm-slide light"><img src="${m.src}" alt="${m.alt}"></figure>`];
    }
    if (m && m.type === "guide") {
      return [`<div class="pm-slide light pm-scrollable">${renderMedia(m)}</div>`];
    }
    const t = tile.text || {};
    return [`<div class="pm-slide pm-card t-${t.color || "navy"}"><span class="k">${t.kicker || ""}</span>` +
      `<span class="h">${t.headline || p.title}</span><span class="s">${t.sub || ""}</span></div>`];
  },

  open(p, tile, opener) {
    if (!this.el) this.build();
    this.opener = opener;
    const slides = this.slides(p, tile);
    this.track.innerHTML = slides.join("");
    this.dots.innerHTML = slides.length > 1 ? slides.map(() => "<i></i>").join("") : "";
    this.el.classList.toggle("single", slides.length < 2);

    const insId = `pm-ins-${p.id}`;
    let side = postHead(p) + `<div class="pm-body body">` +
      renderStory(p).replace('<h3 class="t">', '<h3 class="t" id="pm-title">');
    if (p.fine) side += `<p class="fine">${p.fine}</p>`;
    if (p.insights && p.insights.length) {
      side += `<button class="pm-ins-btn" type="button" aria-expanded="false" aria-controls="${insId}">` +
        `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>` +
        `<span>View insights</span></button>` +
        `<div class="pm-ins" id="${insId}" hidden>${p.insights.map(renderInsights).join("")}</div>`;
    }
    side += `</div>`;
    const sideEl = this.el.querySelector(".pm-side");
    sideEl.innerHTML = side;

    document.documentElement.classList.add("pm-open");
    this.el.showModal();
    sideEl.scrollTop = 0;
    this.el.querySelector(".pm-box").scrollTop = 0;

    // Open on the image the tile showed, when the post has several.
    const src = tile.image && tile.image.src;
    const start = src && p.media && p.media.items ? Math.max(0, p.media.items.findIndex((f) => f.src === src)) : 0;
    this.go(start, true);
  },
};

function wireGrid(grid, data) {
  const byId = Object.fromEntries(data.posts.map((p) => [p.id, p]));
  grid.addEventListener("click", (e) => {
    const a = e.target.closest("a.tile");
    // Let modified clicks (new tab etc.) behave like normal links to the feed.
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const i = [...grid.children].indexOf(a);
    const post = byId[a.getAttribute("href").slice(1)];
    if (!post) return;
    e.preventDefault();
    modal.open(post, data.grid[i], a);
  });
}

/* ---------- boot ---------- */

fetch("data/posts.json")
  .then((r) => {
    if (!r.ok) throw new Error(`data/posts.json: HTTP ${r.status}`);
    return r.json();
  })
  .then((data) => {
    const grid = document.getElementById("grid");
    grid.innerHTML = data.grid.map(renderTile).join("");
    document.getElementById("feed").insertAdjacentHTML("afterend", data.posts.map(renderPost).join(""));
    wireGrid(grid, data);
    // Posts are added after load, so a link like /#midori-ab needs a manual jump.
    if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  })
  .catch((err) => {
    console.error(err);
    document.getElementById("grid").insertAdjacentHTML("afterend",
      '<p class="fine" style="text-align:center">Posts could not be loaded. Open this page through a web server, not as a local file.</p>');
  });
