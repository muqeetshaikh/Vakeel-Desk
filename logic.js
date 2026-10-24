/* Vakeel Desk - built-in demo logic (no AI needed).
   These functions are the "fallback" used when no backend is connected.
   The real backend (Gemma 4) replaces them via the API endpoints. */
(function (root) {
  "use strict";

  const STOP = new Set([
    "the", "and", "can", "what", "why", "how", "who", "does", "did", "are", "was", "for", "not",
    "you", "your", "any", "about", "tell", "explain", "get", "give", "right", "with", "without",
    "that", "this", "have", "has", "from", "into", "when", "which", "there", "their", "they",
    "will", "would", "should", "could", "been", "being", "than", "then", "also", "read"
  ]);

  function baseNumber(label) {
    return String(label).replace(/\(.*$/, "").trim();
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function titleCaseIfShouting(s) {
    if (s && s === s.toUpperCase()) {
      return s.toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    }
    return s;
  }

  /* ---------- Search ---------- */
  function search(query) {
    const D = root.VD_DATA;
    const q = String(query || "").toLowerCase();
    const words = q.replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter(function (w) { return w.length > 2 && !STOP.has(w); });

    const asked = {};
    const re = /article\s+(\d+[a-z]?)/g;
    let m;
    while ((m = re.exec(q))) { asked[m[1].toUpperCase()] = true; }

    const scored = D.articles.map(function (a) {
      let s = 0;
      const hay = (a.title + " " + a.plain).toLowerCase();
      words.forEach(function (w) {
        if (a.keywords.some(function (k) { return k === w || (k.length > 3 && (w.includes(k) || k.includes(w))); })) s += 3;
        if (hay.indexOf(w) !== -1) s += 1;
      });
      if (asked[a.number.toUpperCase()]) s += 10;
      return { a: a, s: s };
    }).filter(function (x) { return x.s > 0; })
      .sort(function (x, y) { return y.s - x.s; });

    if (!scored.length) return null;
    const top = scored[0].s;
    const picked = scored.filter(function (x) { return x.s >= Math.max(2, top / 3); }).slice(0, 3);
    const articles = picked.map(function (x) { return x.a; });

    const nums = {};
    articles.forEach(function (a) { nums[a.number] = true; });
    const cases = D.cases.map(function (c) {
      const overlap = c.articles.filter(function (n) { return nums[n]; }).length;
      return { c: c, overlap: overlap };
    }).filter(function (x) { return x.overlap > 0; })
      .sort(function (x, y) { return y.overlap - x.overlap || y.c.year - x.c.year; })
      .slice(0, 4)
      .map(function (x) { return x.c; });

    const answer = articles.map(function (a) {
      return "Article " + a.number + " (" + a.title + "): " + a.plain;
    }).join("\n\n");

    return { answer: answer, articles: articles, cases: cases };
  }

  function casesForArticles(list) {
    const D = root.VD_DATA;
    const nums = {};
    (list || []).forEach(function (l) { nums[baseNumber(l)] = true; });
    return D.cases.filter(function (c) {
      return c.articles.some(function (n) { return nums[n]; });
    });
  }

  /* ---------- Extraction ---------- */
  function extract(text) {
    const t = String(text || "");
    const out = { parties: "", court: "", caseNumber: "", dates: "", articles: "" };

    const pm = t.match(/([^\n]{3,60}?)\s+(?:vs\.?|v\.|versus)\s+([^\n]{3,70})/i);
    if (pm) {
      const a = pm[1].trim().replace(/^[\s:,-]+/, "");
      const b = pm[2].trim().replace(/[\s.,;:]+$/, "");
      // keep only text before the first sentence break in the second party
      const b2 = b.split(/\s{2,}|\.\s+[A-Z]/)[0];
      out.parties = a + " vs " + b2;
    }

    const cm = t.match(/([A-Za-z.() ]{0,30}?\bNos?\.?\s*\d+[A-Za-z0-9\/-]*\s*(?:of|\/)\s*\d{4})/i);
    if (cm) out.caseNumber = cm[1].trim();

    const co = t.match(/(supreme court of india|[a-z ]*high court(?: of [a-z ]+)?|court of [a-z ,]+)/i);
    if (co) out.court = titleCaseIfShouting(co[1].trim().replace(/[ ,]+$/, ""));

    const dm = t.match(/\b\d{1,2}(?:st|nd|rd|th)?(?:\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+\d{4}|[\/.-]\d{1,2}[\/.-]\d{2,4})/gi);
    if (dm) out.dates = Array.from(new Set(dm)).join(", ");

    const labels = [];
    const re = /articles?\s+((?:\d+[A-Z]?(?:\(\w+\))*(?:\s*(?:,|and|&)\s*)?)+)/gi;
    let m;
    while ((m = re.exec(t))) {
      const parts = m[1].match(/\d+[A-Z]?(?:\(\w+\))*/g) || [];
      parts.forEach(function (p) { if (labels.indexOf(p) === -1) labels.push(p); });
    }
    out.articles = labels.join(", ");
    return out;
  }

  /* ---------- Anonymisation (regex-based demo) ---------- */
  function anonymize(text) {
    let t = String(text || "");
    let count = 0;
    function rep(re, label) {
      t = t.replace(re, function () { count++; return label; });
    }

    rep(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]");
    rep(/(?:\+91[\s-]?)?[6-9]\d{9}\b/g, "[PHONE]");
    rep(/\b\d{4}\s\d{4}\s\d{4}\b/g, "[ID NUMBER]");
    rep(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[ID NUMBER]");

    const info = extract(t);
    if (info.caseNumber) rep(new RegExp(escapeRegExp(info.caseNumber), "g"), "[CASE NO.]");

    rep(/\b(?:Flat|House|Plot|Door|H\.?\s?No\.?)\s*(?:No\.?\s*)?[\w\/-]+(?:,\s*[A-Za-z0-9 .\/-]+){0,2}/gi, "[ADDRESS]");
    rep(/\b\d{6}\b/g, "[PINCODE]");

    if (info.parties) {
      const sides = info.parties.split(/\s+vs\s+/);
      const labels = ["[PARTY A]", "[PARTY B]"];
      sides.forEach(function (s, i) {
        if (s && s.length > 2) rep(new RegExp(escapeRegExp(s.trim()), "g"), labels[i] || "[PARTY]");
      });
    }
    rep(/\b(?:Mr|Mrs|Ms|Shri|Smt|Dr|Sri|Kumari)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}/g, "[PERSON]");

    return { text: t, count: count };
  }

  function timeAgo(iso) {
    const d = new Date(iso).getTime();
    if (isNaN(d)) return "";
    const s = Math.max(1, Math.round((Date.now() - d) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " hr ago";
    return Math.round(s / 86400) + " days ago";
  }

  const api = {
    search: search, extract: extract, anonymize: anonymize,
    casesForArticles: casesForArticles, baseNumber: baseNumber, timeAgo: timeAgo
  };
  root.VDLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
