(async function () {
  const app = document.getElementById('app');
  const data = await (await fetch('data.json')).json();
  const artistBy = Object.fromEntries(data.artists.map(a => [a.slug, a]));
  const workBy = Object.fromEntries(data.works.map(w => [w.id, w]));
  const INQUIRY = 'shlee@printbakery.com';
  const WHATSAPP = 'https://wa.me/821050138072';
  const PDF = 'PBG_ART_TPE26_Factsheet.pdf';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bline = a => [a.born && `b. ${a.born}`, a.country].filter(Boolean).join(', ');
  const ig = a => a.instagram ? `<a href="https://www.instagram.com/${esc(a.instagram)}/" target="_blank" rel="noopener">@${esc(a.instagram)}</a>` : '';

  // intro language: remembered per viewer; Chinese-language phones start in 繁體中文
  let lang = 'en';
  try { lang = localStorage.getItem('pbg-lang') || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'); } catch (e) {}
  const paras = t => (t || '').split(/\n+/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');

  // filters persist while browsing
  const state = { artist: 'all', price: 'all', sort: 'featured' };
  const PRICE = {
    all: ['All prices', () => true],
    lt5: ['Under USD 5,000', v => v < 5000],
    '5to20': ['USD 5,000 – 20,000', v => v >= 5000 && v <= 20000],
    gt20: ['Over USD 20,000', v => v > 20000],
  };

  function card(w) {
    const a = artistBy[w.artist];
    return `<a class="card" href="#/work/${w.id}">
      <div class="ph"><img src="${w.image.thumb}" alt="${esc(w.title)}" loading="lazy"></div>
      <div class="meta"><div class="a">${esc(a.name)}</div>
        <div class="t">${esc(w.title)}${w.year ? `, <span style="font-style:normal">${esc(w.year)}</span>` : ''}</div>
        <div class="p">USD ${esc(w.usd)}<small>TWD ${esc(w.twd)}</small></div></div></a>`;
  }

  function viewWorks() {
    let list = data.works.filter(w => (state.artist === 'all' || w.artist === state.artist) && PRICE[state.price][1](w.usdValue));
    if (state.sort === 'low') list = [...list].sort((a, b) => a.usdValue - b.usdValue);
    if (state.sort === 'high') list = [...list].sort((a, b) => b.usdValue - a.usdValue);
    const chips = [`<button class="chip ${state.artist === 'all' ? 'on' : ''}" data-artist="all">All artists</button>`]
      .concat(data.artists.map(a => `<button class="chip ${state.artist === a.slug ? 'on' : ''}" data-artist="${a.slug}">${esc(a.name)}</button>`)).join('');
    app.innerHTML = `
      <section class="hero"><img src="${data.cover.src}" alt="">
        <div class="hero-txt"><h1>ART TAIPEI 2026</h1>
          <p>PBG · Booth ${esc(data.fair.booth)} · ${esc(data.fair.dates)} · ${esc(data.fair.venue)}</p></div></section>
      <div class="sec-h"><h2>Works</h2><span class="count">${list.length} of ${data.works.length}</span></div>
      <div class="controls">
        <div class="chips">${chips}</div>
        <select id="price">${Object.entries(PRICE).map(([k, v]) => `<option value="${k}" ${state.price === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
        <select id="sort">
          <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Sort: Featured</option>
          <option value="low" ${state.sort === 'low' ? 'selected' : ''}>Price: Low to high</option>
          <option value="high" ${state.sort === 'high' ? 'selected' : ''}>Price: High to low</option>
        </select>
      </div>
      <div class="grid">${list.map(card).join('') || '<p class="empty">No works match these filters.</p>'}</div>`;
    app.querySelectorAll('[data-artist]').forEach(b => b.onclick = () => { state.artist = b.dataset.artist; keepScroll(viewWorks); });
    app.querySelector('#price').onchange = e => { state.price = e.target.value; keepScroll(viewWorks); };
    app.querySelector('#sort').onchange = e => { state.sort = e.target.value; keepScroll(viewWorks); };
  }

  function keepScroll(fn) { const y = scrollY; fn(); scrollTo(0, y); }

  function viewArtists() {
    app.innerHTML = `<div class="sec-h"><h2>Artists</h2><span class="count">${data.artists.length} artists</span></div>
      <div class="artists">${data.artists.map(a => `
        <a class="acard" href="#/artist/${a.slug}">
          <div class="ph">${a.portrait ? `<img src="${a.portrait.src}" alt="${esc(a.name)}" loading="lazy">` : ''}</div>
          <div class="n">${esc(a.name)}</div>
          <div class="s">${esc(a.nameCn)}${a.born ? ` · b. ${esc(a.born)}` : ''}</div></a>`).join('')}</div>`;
  }

  function viewArtist(slug) {
    const a = artistBy[slug];
    if (!a) return notFound();
    const cur = a.introZh ? lang : 'en';
    const works = a.works.map(id => workBy[id]);
    app.innerHTML = `<a class="back" href="#/artists">← All artists</a>
      <section class="artist-head">
        ${a.portrait ? `<div class="por"><img src="${a.portrait.src}" alt="${esc(a.name)}"></div>` : ''}
        <div><h1>${esc(a.name)}</h1><div class="cn">${esc(a.nameCn)}</div>
          <div class="bl">${esc(bline(a))}${a.instagram ? ' · ' + ig(a) : ''}</div>
          ${a.introZh ? `<div class="lang"><button data-lang="en" class="${cur === 'en' ? 'on' : ''}">English</button><button data-lang="zh" class="${cur === 'zh' ? 'on' : ''}">中文</button></div>` : ''}
          <div class="intro" id="intro" lang="${cur === 'zh' ? 'zh-Hant-TW' : 'en'}">${paras(cur === 'zh' ? a.introZh : a.intro)}</div></div>
      </section>
      <div class="sec-h"><h2>Works at Booth ${esc(data.fair.booth)}</h2><span class="count">${works.length}</span></div>
      <div class="grid">${works.map(card).join('')}</div>
      ${a.cv && a.cv.length ? `<div class="sec-h"><h2>CV</h2></div><div class="cv">${a.cv.map((s, i) => `
        <details ${i === 0 ? 'open' : ''}><summary>${esc(s.heading)}</summary>
          <ul>${s.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></details>`).join('')}</div>` : ''}`;
    app.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => {
      lang = b.dataset.lang;
      try { localStorage.setItem('pbg-lang', lang); } catch (e) {}
      app.querySelectorAll('[data-lang]').forEach(x => x.classList.toggle('on', x === b));
      const box = app.querySelector('#intro');
      box.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';
      box.innerHTML = paras(lang === 'zh' ? a.introZh : a.intro);
    });
  }

  function viewWork(id) {
    const w = workBy[id];
    if (!w) return notFound();
    const a = artistBy[w.artist];
    const imgs = [w.image, ...w.extras];
    const i = data.works.indexOf(w);
    const prev = data.works[(i - 1 + data.works.length) % data.works.length];
    const next = data.works[(i + 1) % data.works.length];
    const subject = encodeURIComponent(`[ART TAIPEI 2026] Inquiry: ${a.name} – ${w.title}`);
    const body = encodeURIComponent(`Hello PBG,\n\nI am interested in the following work:\n${a.name}, ${w.title}${w.year ? ', ' + w.year : ''}\n${w.medium}\n${w.dimensions}\nUSD ${w.usd}\n\nName:\nPhone:\n`);
    const waText = encodeURIComponent(`Hello PBG, I am interested in ${a.name}, "${w.title}"${w.year ? " (" + w.year + ")" : ""} – USD ${w.usd} (ART TAIPEI 2026, Booth ${data.fair.booth}).`);
    const rows = [['Year', w.year], ['Medium', w.medium], ['Size', w.dimensions], ['Frame', w.frame]]
      .filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join('');
    app.innerHTML = `<a class="back" href="#/">← All works</a>
      <section class="work">
        <div><div class="stage" id="stage"><img src="${w.image.src}" alt="${esc(w.title)}"></div>
          ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((im, k) => `<button data-k="${k}" class="${k ? '' : 'on'}"><img src="${im.thumb || im.src}" alt=""></button>`).join('')}</div>` : ''}</div>
        <div class="info">
          <h1><a href="#/artist/${a.slug}" style="text-decoration:none">${esc(a.name)}</a></h1>
          <div class="cn">${esc(a.nameCn)}</div>
          <div class="bl">${esc(bline(a))}${a.instagram ? ' · ' + ig(a) : ''}</div>
          <h2>${esc(w.title)}</h2>
          <dl>${rows}</dl>
          <div class="price"><div class="usd">USD ${esc(w.usd)}</div><div class="twd">TWD ${esc(w.twd)}</div></div>
          <div class="actions">
            <a class="btn" href="mailto:${INQUIRY}?subject=${subject}&body=${body}">Inquire about this work</a>
            <a class="btn wa" href="${WHATSAPP}?text=${waText}" target="_blank" rel="noopener">Inquire on WhatsApp</a>
            <a class="btn ghost" href="#/artist/${a.slug}">About the artist</a>
          </div>
        </div>
      </section>
      <div class="pn"><a href="#/work/${prev.id}">← Previous<b>${esc(artistBy[prev.artist].name)}, ${esc(prev.title)}</b></a>
        <a href="#/work/${next.id}" style="text-align:right">Next →<b>${esc(artistBy[next.artist].name)}, ${esc(next.title)}</b></a></div>`;
    let cur = 0;
    const stageImg = app.querySelector('#stage img');
    const show = k => { cur = k; stageImg.src = imgs[k].src; app.querySelectorAll('.thumbs button').forEach(b => b.classList.toggle('on', +b.dataset.k === k)); };
    app.querySelectorAll('.thumbs button').forEach(b => b.onclick = () => show(+b.dataset.k));
    app.querySelector('#stage').onclick = () => openLb(imgs, cur);
  }

  function viewInfo() {
    app.innerHTML = `<div class="fairbox"><h2>ART TAIPEI 2026 · Booth ${esc(data.fair.booth)}</h2>
        <p>${esc(data.fair.dates)} · ${esc(data.fair.venue)}</p>
        <div class="actions"><a class="btn" href="${PDF}" download>Download factsheet (PDF)</a>
          <a class="btn ghost" href="mailto:${INQUIRY}">Contact ${INQUIRY}</a>
          <a class="btn wa" href="${WHATSAPP}?text=${encodeURIComponent(`Hello PBG, I have a question about your ART TAIPEI 2026 booth (${data.fair.booth}).`)}" target="_blank" rel="noopener">WhatsApp</a></div></div>
      <div class="sec-h"><h2>Gallery Information</h2></div>
      <div class="locs">${data.gallery.map(g => `<div><h3>${esc(g.name)}</h3><p>${g.lines.map(l =>
        /@/.test(l) && !/\s/.test(l) ? `<a href="mailto:${esc(l)}">${esc(l)}</a>` : esc(l)).join('<br>')}</p></div>`).join('')}</div>`;
  }

  function notFound() { app.innerHTML = `<p class="empty">Page not found. <a href="#/">Back to works</a></p>`; }

  // lightbox
  const lb = document.getElementById('lightbox'), lbImg = lb.querySelector('img');
  let lbList = [], lbI = 0;
  const lbShow = () => { lbImg.src = lbList[lbI].src; lb.querySelector('.lb-prev').hidden = lb.querySelector('.lb-next').hidden = lbList.length < 2; };
  function openLb(list, i) { lbList = list; lbI = i; lbShow(); lb.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  lb.querySelector('.lb-x').onclick = closeLb;
  lb.onclick = e => { if (e.target === lb) closeLb(); };
  lb.querySelector('.lb-prev').onclick = () => { lbI = (lbI - 1 + lbList.length) % lbList.length; lbShow(); };
  lb.querySelector('.lb-next').onclick = () => { lbI = (lbI + 1) % lbList.length; lbShow(); };
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') lb.querySelector('.lb-prev').click();
    if (e.key === 'ArrowRight') lb.querySelector('.lb-next').click();
  });

  function route() {
    const [, page, arg] = (location.hash || '#/').split('/');
    const nav = page === 'artists' || page === 'artist' ? 'artists' : page === 'info' ? 'info' : 'works';
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === nav));
    if (page === 'work') viewWork(arg);
    else if (page === 'artist') viewArtist(arg);
    else if (page === 'artists') viewArtists();
    else if (page === 'info') viewInfo();
    else viewWorks();
    if (page !== '' && page !== undefined) scrollTo(0, 0);
    document.title = 'PBG | ART TAIPEI 2026';
  }
  addEventListener('hashchange', route);
  route();
})();
