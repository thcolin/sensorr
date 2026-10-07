// Capture hook: English titles from TMDB, guests renamed with initial avatars, indexers renamed ALPHA, BRAVO… in every response and SSE message.
(() => {
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  Object.defineProperty(navigator, 'language', { get: () => 'en-US' });
  const f = window.fetch.bind(window);
  let K = null;
  const Z = { thcolin: 'Alex' };
  let ZR = null;
  const ALIASES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima'];
  const scrub = (node) => { if (Array.isArray(node)) { node.forEach((v, i) => { if (typeof v === 'string' && Z[v]) node[i] = Z[v]; else scrub(v); }); return; } if (!node || typeof node !== 'object') return; for (const k of Object.keys(node)) { const v = node[k]; if (typeof v === 'string') { if (Z[v]) node[k] = Z[v]; else if (ZR) { const r = v.replace(ZR, (m) => Z[m] || Z[m.toUpperCase()] || m); if (r !== v) node[k] = r; } } else scrub(v); } };
  const cache = new Map();
  const tmdb = (kind, id) => {
    const key = kind + id;
    if (!cache.has(key)) cache.set(key, f(`https://api.themoviedb.org/3/${kind}/${id}?api_key=${K}&language=en-US`).then((r) => r.ok ? r.json() : null).catch(() => null));
    return cache.get(key);
  };
  const NAMES = ['Alex', 'Sam', 'Charlie', 'Jamie', 'Robin', 'Morgan', 'Casey', 'Taylor', 'Jordan', 'Riley', 'Avery', 'Quinn'];
  const fix = (node, jobs) => {
    if (Array.isArray(node)) { node.forEach((n) => fix(n, jobs)); return; }
    if (!node || typeof node !== 'object') return;
    if (node.id && 'title' in node && ('original_title' in node || ('poster_path' in node && /^\d+$/.test(String(node.id))))) {
      jobs.push(tmdb('movie', node.id).then((m) => { if (!m) return; node.title = m.title; node.genres = m.genres; node.overview = m.overview; node.tagline = m.tagline; if (m.poster_path) node.poster_path = m.poster_path; delete node.plex_artworks; }));
    }
    if (node.id && 'original_name' in node && 'name' in node && !('episode_number' in node)) {
      jobs.push(tmdb('tv', node.id).then((s) => { if (!s) return; node.name = s.name; node.genres = s.genres; node.overview = s.overview; node.tagline = s.tagline; if (s.poster_path) node.poster_path = s.poster_path; delete node.plex_artworks; }));
    }
    for (const k of Object.keys(node)) if (node[k] && typeof node[k] === 'object') fix(node[k], jobs);
  };
  const json = (body, res) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  const ES = window.EventSource;
  const rewrite = async (data) => { if (!K) return data; try { const body = JSON.parse(data); const jobs = []; fix(body, jobs); await Promise.all(jobs); scrub(body); return JSON.stringify(body); } catch (e) { return data; } };
  let chain = Promise.resolve();
  const wrap = (fn) => fn && ((e) => { const done = rewrite(e.data); chain = chain.then(() => done).then((data) => fn(new MessageEvent(e.type, { data, lastEventId: e.lastEventId, origin: e.origin }))); });
  window.EventSource = class extends ES {
    addEventListener(type, fn, opts) { return super.addEventListener(type, typeof fn === 'function' && type !== 'open' && type !== 'error' ? wrap(fn) : fn, opts); }
    set onmessage(fn) { super.onmessage = wrap(fn); }
    get onmessage() { return super.onmessage; }
  };
  window.__go = (path) => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); };
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init && init.method) || 'GET';
    const res = await f(input, init);
    if (method !== 'GET' || !res.ok || !/\/api\//.test(url)) return res;
    try {
      if (/\/api\/config(\?|$)/.test(url)) {
        const body = await res.clone().json();
        K = body.tmdb; body.language = 'en'; body.region = 'en-US';
        (body.znabs || []).forEach((z, i) => { if (z.name) { Z[z.name] = ALIASES[i % ALIASES.length]; Z[z.name.toUpperCase()] = ALIASES[i % ALIASES.length].toUpperCase(); Z[z.name.toLowerCase()] = ALIASES[i % ALIASES.length].toLowerCase(); } });
        ZR = new RegExp('\\b(' + Object.keys(Z).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'g');
        scrub(body);
        return json(body, res);
      }
      if (/\/api\/movies\/artworks/.test(url)) return json({}, res);
      if (/\/api\/guests/.test(url)) {
        const body = await res.clone().json();
        const list = Array.isArray(body) ? body : body.results || body.guests || [];
        const COLORS = ['#e8a33d', '#4fb3bf', '#c75c8a', '#7a9e4f', '#8a6fd1', '#d0664a'];
        list.forEach((g, i) => { if (g && typeof g === 'object') { const n = NAMES[i % NAMES.length]; g.name = n; g.avatar = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS[i % COLORS.length]}"/><text x="32" y="43" font-family="Helvetica,Arial" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">${n[0]}</text></svg>`); } });
        return json(body, res);
      }
      const ep = url.match(/\/api\/shows\/(\d+)\/episodes/);
      if (ep && K) {
        const body = await res.clone().json();
        const seasons = [...new Set(body.map((e) => e.season_number))];
        const names = {};
        await Promise.all(seasons.map((n) => tmdb('tv', ep[1] + '/season/' + n).then((s) => (s && s.episodes || []).forEach((e) => { names[n + 'x' + e.episode_number] = e.name; }))));
        body.forEach((e) => { const n = names[e.season_number + 'x' + e.episode_number]; if (n) e.name = n; });
        return json(body, res);
      }
      if (/\/api\/(movies|shows|persons)/.test(url) && !/metadata|changes|statistics/.test(url) && K) {
        const body = await res.clone().json();
        const jobs = []; fix(body, jobs); await Promise.all(jobs); scrub(body);
        return json(body, res);
      }
      if (/json/.test(res.headers.get('content-type') || '') && Object.keys(Z).length) { const body = await res.clone().json(); scrub(body); return json(body, res); }
    } catch (e) { return res; }
    return res;
  };
})();
