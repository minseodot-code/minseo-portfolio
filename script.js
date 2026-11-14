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

function renderPost(p) {
  const head = `<div class="ph"><span class="mini"><span>MC</span></span>` +
    `<div><div class="who">minseo.chung</div><div class="loc">${p.location}</div></div></div>`;
  // Posts without media get extra top padding so the title doesn't touch the header.
  let body = `<div class="body"${p.media ? "" : ' style="padding-top:16px"'}>`;
  body += `<h3 class="t">${p.title}</h3>`;
  body += (p.captions || []).map((c) => `<p class="cap">${c}</p>`).join("");
  if (p.tags) body += `<p class="tags">${p.tags}</p>`;
  if (p.role) body += `<div class="role"><b>My role:</b> ${p.role}</div>`;
  body += (p.insights || []).map(renderInsights).join("");
  if (p.fine) body += `<p class="fine">${p.fine}</p>`;
  body += `</div>`;
  return `<article class="post" id="${p.id}">${head}${renderMedia(p.media)}${body}</article>`;
}

/* ---------- boot ---------- */

fetch("data/posts.json")
  .then((r) => {
    if (!r.ok) throw new Error(`data/posts.json: HTTP ${r.status}`);
    return r.json();
  })
  .then((data) => {
    document.getElementById("grid").innerHTML = data.grid.map(renderTile).join("");
    document.getElementById("feed").insertAdjacentHTML("afterend", data.posts.map(renderPost).join(""));
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
