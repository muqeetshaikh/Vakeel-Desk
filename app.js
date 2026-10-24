/* Vakeel Desk - frontend app (plain JavaScript, no build step).

   HOW IT WORKS
   - Everything runs in the browser using built-in demo logic (logic.js) and sample data (data.js).
   - To connect your real backend (Gemma 4), set API_URL below, e.g. "http://localhost:5000".
     The app then calls POST /ask, /extract and /anonymize (see README.md for the exact shapes).
     If the backend is unreachable, the app falls back to the built-in logic and says so.
*/
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  const memory = {};
  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v) return JSON.parse(v);
    } catch (e) { /* storage unavailable: use memory only */ }
    return memory[key] !== undefined ? memory[key] : fallback;
  }
  function save(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  const esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  const nl2br = function (s) { return esc(s).replace(/\n/g, "<br>"); };
  const fmtTime = function (iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  const API_URL = ""; // <-- put your backend address here, e.g. "http://localhost:5000"

  const D = window.VD_DATA;
  const L = window.VDLogic;
  const view = document.getElementById("view");

  function getGroqApiKey() {
    return load("vd_groq_api_key", "");
  }

  function getEngine() {
    const apiKey = getGroqApiKey();
    return API_URL ? "Gemma 4 (backend)" : (apiKey ? "Groq (Llama 3.1)" : "Built-in demo logic");
  }

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }

  async function callApi(path, body) {
    if (!API_URL) return null;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(function () { ctl.abort(); }, 90000);
      const res = await fetch(API_URL.replace(/\/$/, "") + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctl.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      toast("Backend not reachable, using built-in demo logic instead.");
      return null;
    }
  }

  async function callGroq(systemPrompt, userPrompt) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getGroqApiKey()
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.5,
          max_tokens: 1024
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Groq API error:", errorData);
        throw new Error("Groq API error: " + res.status + " - " + (errorData.error?.message || res.statusText));
      }
      const data = await res.json();
      return data.choices[0]?.message?.content || "";
    } catch (e) {
      console.error("Groq API error:", e);
      toast("AI API error: " + e.message);
      return null;
    }
  }

  /* ---------- state ---------- */
  const seedInfo = L.extract(D.sampleNotice);
  let matters = load("vd_matters", [{
    id: "sample-1",
    sample: true,
    title: seedInfo.parties || "Sample matter",
    parties: seedInfo.parties, court: seedInfo.court, caseNumber: seedInfo.caseNumber,
    dates: seedInfo.dates, articles: seedInfo.articles,
    text: D.sampleNotice, saved: new Date().toISOString()
  }]);
  let posts = load("vd_posts", D.samplePosts.map(function (p, i) {
    return { id: "seed-" + i, author: p.author, iso: p.iso, text: p.text, articles: p.articles };
  }));
  let logs = load("vd_log", [
    { iso: "2026-10-23T09:12:00+05:30", type: "ai", user: "Sample data", action: "Matter extracted", details: "Sample notice read; fields proposed" },
    { iso: "2026-10-23T09:15:00+05:30", type: "human", user: "Sample data", action: "Lawyer confirmed details", details: "All fields reviewed and approved" },
    { iso: "2026-10-23T09:20:00+05:30", type: "ai", user: "Sample data", action: "Post anonymized", details: "Names, case number and address replaced" },
    { iso: "2026-10-23T09:21:00+05:30", type: "human", user: "Sample data", action: "Anonymized post approved", details: "Shared to Community" }
  ]);

  function addLog(type, action, details) {
    logs.unshift({ iso: new Date().toISOString(), type: type, user: type === "ai" ? getEngine() : "You (advocate)", action: action, details: details || "" });
    save("vd_log", logs);
  }

  /* ---------- router ---------- */
  const routes = { search: viewSearch, matters: viewMatters, community: viewCommunity, activity: viewActivity, settings: viewSettings };
  let pendingQuestion = "";

  function currentRoute() {
    const h = (location.hash || "#/search").replace(/^#\//, "").split("?")[0];
    return routes[h] ? h : "search";
  }
  function render() {
    const r = currentRoute();
    document.querySelectorAll("#nav a").forEach(function (a) {
      a.classList.toggle("active", a.dataset.route === r);
    });
    routes[r]();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);

  function goSearch(q) {
    pendingQuestion = q;
    if (currentRoute() === "search") render(); else location.hash = "#/search";
  }

  /* ---------- SEARCH ---------- */
  const EXAMPLES = [
    "Can the government read my private messages?",
    "What is my right to equality?",
    "Can I be arrested without being told why?"
  ];

  function viewSearch() {
    view.innerHTML =
      '<section class="hero">' +
        "<h1>Your private AI clerk for Indian law.</h1>" +
        "<p>Ask a question in plain words. Vakeel Desk shows the matching articles of the Constitution, a simple explanation, and related Supreme Court cases.</p>" +
        '<form id="sf" class="searchbox" autocomplete="off">' +
          '<input type="text" id="q" placeholder="Ask about the Constitution of India" aria-label="Your question">' +
          '<button class="btn gold" type="submit">Ask</button>' +
        "</form>" +
        '<div class="chips">' + EXAMPLES.map(function (e) {
          return '<button class="chip" type="button" data-q="' + esc(e) + '">' + esc(e) + "</button>";
        }).join("") + "</div>" +
      "</section>" +
      '<div id="results"></div>';

    const input = document.getElementById("q");
    document.getElementById("sf").addEventListener("submit", function (ev) {
      ev.preventDefault();
      runSearch(input.value.trim());
    });
    view.querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () { input.value = c.dataset.q; runSearch(c.dataset.q); });
    });
    if (pendingQuestion) {
      const q = pendingQuestion; pendingQuestion = "";
      input.value = q; runSearch(q);
    }
  }

  async function runSearch(q) {
    const box = document.getElementById("results");
    if (!q) { box.innerHTML = '<div class="empty">Type a question or click an example above.</div>'; return; }
    box.innerHTML = '<div class="card loading"><div class="spinner"></div><div>Researching the Constitution...</div></div>';

    let res = null;
    const remote = await callApi("/ask", { question: q });
    if (remote && (remote.answer || remote.articles)) {
      res = {
        answer: remote.answer || "",
        articles: (remote.articles || []).map(function (a) {
          return { number: a.number, title: a.title || "", plain: a.text || a.plain || "" };
        }),
        cases: (remote.cases || []).map(function (c) {
          return { name: c.name, year: c.year, summary: c.summary || "", articles: c.articles || [] };
        })
      };
    } else if (getGroqApiKey()) {
      const systemPrompt = `You are a legal expert on the Constitution of India.
When answering questions:
1. Provide a clear, plain-language explanation
2. Cite relevant articles by number
3. Mention related Supreme Court cases if applicable
4. Keep responses concise and practical

Respond in JSON format:
{
  "answer": "your explanation",
  "articles": [{"number": "21", "title": "Article title", "text": "plain text"}],
  "cases": [{"name": "Case name", "year": "year", "summary": "brief summary", "articles": ["21"]}]
}`;
      const groqResponse = await callGroq(systemPrompt, q);
      if (groqResponse) {
        try {
          const parsed = JSON.parse(groqResponse);
          res = {
            answer: parsed.answer || groqResponse,
            articles: parsed.articles || [],
            cases: parsed.cases || []
          };
        } catch (e) {
          res = {
            answer: groqResponse,
            articles: [],
            cases: []
          };
        }
      }
    }
    if (!res) {
      res = L.search(q);
    }

    addLog("human", "Question asked", q.length > 90 ? q.slice(0, 90) + "..." : q);
    if (res) addLog("ai", "Articles retrieved", res.articles.map(function (a) { return "Art. " + a.number; }).join(", "));

    if (!res || !res.articles.length) {
      box.innerHTML = '<div class="card error"><h3>We couldn\'t find an answer for that</h3>' +
        "<p>Try different words, or ask about a specific article, for example \"Article 21\". " +
        "For anything urgent, speak to a lawyer or contact the official legal aid helpline (NALSA: 15100).</p></div>";
      return;
    }

    box.innerHTML =
      '<div class="card answer"><h3>Plain-language answer</h3><pre>' + esc(res.answer) + "</pre>" +
      '<p class="note" style="margin-top:10px">' +
      (API_URL ? "Generated from the retrieved articles only." : "Demo mode: composed from stored article summaries. Connect the backend to get a Gemma 4 explanation.") +
      "</p></div>" +
      '<div class="section-title"><h2>Relevant articles</h2><small>' + res.articles.length + " found</small></div>" +
      '<div class="grid two">' + res.articles.map(function (a) {
        return '<article class="card"><div class="art-no">ARTICLE ' + esc(a.number) + "</div><h3>" + esc(a.title) + "</h3><p>" + esc(a.plain) + "</p></article>";
      }).join("") + "</div>" +
      '<div class="section-title"><h2>Related Supreme Court cases</h2><small>' + res.cases.length + " found</small></div>" +
      (res.cases.length
        ? '<div class="grid two">' + res.cases.map(function (c) {
            return '<article class="card"><h3>' + esc(c.name) + ' <span class="case-year">(' + esc(c.year) + ")</span></h3><p>" + esc(c.summary) + "</p>" +
              (c.articles || []).map(function (n) { return '<span class="tag static">Art. ' + esc(n) + "</span>"; }).join("") + "</article>";
          }).join("") + "</div>"
        : '<div class="empty">No related cases in the demo library yet.</div>');
  }

  /* ---------- MY MATTERS ---------- */
  let draft = null; // extracted fields awaiting review

  function viewMatters() {
    view.innerHTML =
      "<h1>My Matters</h1>" +
      '<div class="split">' +
        "<section>" +
          '<div class="card">' +
            "<h2>New matter</h2>" +
            '<p class="notice">Your text is processed by a local AI model. You review everything before it is saved.</p>' +
            '<label class="lbl" for="notice-text">Paste a notice or case note</label>' +
            '<textarea id="notice-text" placeholder="Paste the text of a notice, order or your own case note..."></textarea>' +
            '<div class="row-actions">' +
              '<button class="btn" id="extract-btn" type="button">Extract details</button>' +
              '<button class="btn ghost" id="sample-btn" type="button">Use sample notice</button>' +
            "</div>" +
          "</div>" +
          '<div id="review"></div>' +
        "</section>" +
        "<section>" +
          "<h2>Saved matters</h2>" +
          '<div id="saved"></div>' +
        "</section>" +
      "</div>";

    const ta = document.getElementById("notice-text");
    document.getElementById("sample-btn").addEventListener("click", function () { ta.value = D.sampleNotice; });
    document.getElementById("extract-btn").addEventListener("click", async function () {
      const text = ta.value.trim();
      if (!text) { toast("Paste some text first, or use the sample notice."); return; }
      const btn = this; btn.disabled = true;
      document.getElementById("review").innerHTML = '<div class="card loading" style="margin-top:14px"><div class="spinner"></div><div>Reading the document...</div></div>';
      const remote = await callApi("/extract", { text: text });
      let f;
      if (remote) {
        f = {
          parties: remote.parties || "", court: remote.court || "", caseNumber: remote.caseNumber || remote.case_number || "",
          dates: Array.isArray(remote.dates) ? remote.dates.join(", ") : (remote.dates || ""),
          articles: Array.isArray(remote.articles) ? remote.articles.join(", ") : (remote.articles || "")
        };
      } else if (getGroqApiKey()) {
        const systemPrompt = `You are a legal document processor. Extract key information from legal notices and documents.
Extract the following fields:
- parties: The parties involved in the case
- court: The court name
- caseNumber: The case number
- dates: Important dates (filing, hearing, etc.)
- articles: Any constitutional articles mentioned

Respond in JSON format:
{
  "parties": "string",
  "court": "string",
  "caseNumber": "string",
  "dates": "string",
  "articles": "string"
}`;
        const groqResponse = await callGroq(systemPrompt, text);
        if (groqResponse) {
          try {
            const parsed = JSON.parse(groqResponse);
            f = {
              parties: parsed.parties || "",
              court: parsed.court || "",
              caseNumber: parsed.caseNumber || "",
              dates: parsed.dates || "",
              articles: parsed.articles || ""
            };
          } catch (e) {
            f = L.extract(text);
          }
        } else {
          f = L.extract(text);
        }
      } else {
        f = L.extract(text);
      }
      draft = { fields: f, text: text };
      addLog("ai", "Matter extracted", f.caseNumber || f.parties || "Fields proposed");
      btn.disabled = false;
      renderReview();
    });
    renderSaved();
    renderReview();
  }

  function renderReview() {
    const box = document.getElementById("review");
    if (!box) return;
    if (!draft) { box.innerHTML = ""; return; }
    const f = draft.fields;
    const field = function (id, label, val) {
      return '<label class="lbl" for="f-' + id + '">' + label + '</label><input type="text" id="f-' + id + '" value="' + esc(val) + '">';
    };
    box.innerHTML =
      '<div class="card" style="margin-top:14px"><h2>Review extracted details</h2>' +
      '<p class="note">Check and correct each field. Nothing is saved until you click Confirm.</p>' +
      field("parties", "Parties", f.parties) + field("court", "Court", f.court) +
      field("caseNumber", "Case number", f.caseNumber) + field("dates", "Key dates", f.dates) +
      field("articles", "Articles mentioned", f.articles) +
      '<div class="row-actions"><button class="btn gold" id="confirm-btn" type="button">Confirm and save</button>' +
      '<button class="btn ghost" id="discard-btn" type="button">Discard</button></div></div>';

    document.getElementById("discard-btn").addEventListener("click", function () {
      draft = null; renderReview(); addLog("human", "Extraction discarded", "");
    });
    document.getElementById("confirm-btn").addEventListener("click", function () {
      const get = function (id) { return document.getElementById("f-" + id).value.trim(); };
      const m = {
        id: "m-" + Date.now(),
        title: get("parties") || get("caseNumber") || "Untitled matter",
        parties: get("parties"), court: get("court"), caseNumber: get("caseNumber"),
        dates: get("dates"), articles: get("articles"),
        text: draft.text, saved: new Date().toISOString()
      };
      matters.unshift(m); save("vd_matters", matters);
      addLog("human", "Lawyer confirmed details", m.title);
      draft = null;
      document.getElementById("notice-text").value = "";
      renderReview(); renderSaved();
      toast("Matter saved.");
    });
  }

  function articleList(str) {
    return String(str || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function renderSaved() {
    const box = document.getElementById("saved");
    if (!box) return;
    if (!matters.length) { box.innerHTML = '<div class="empty">No saved matters yet.</div>'; return; }
    box.innerHTML = matters.map(function (m) {
      return '<div class="card matter"><h3>' + esc(m.title) + (m.sample ? ' <span class="pill">Sample</span>' : "") + "</h3>" +
        '<dl class="kv"><dt>Court</dt><dd>' + esc(m.court || "-") + "</dd><dt>Case no.</dt><dd>" + esc(m.caseNumber || "-") +
        "</dd><dt>Key dates</dt><dd>" + esc(m.dates || "-") + "</dd></dl>" +
        articleList(m.articles).map(function (a) { return '<span class="tag static">Art. ' + esc(a) + "</span>"; }).join("") +
        '<div class="row-actions"><button class="btn small gold" data-share="' + esc(m.id) + '" type="button">Share to Community</button></div></div>';
    }).join("");
    box.querySelectorAll("[data-share]").forEach(function (b) {
      b.addEventListener("click", function () {
        const m = matters.find(function (x) { return x.id === b.dataset.share; });
        if (m) openAnonymize({ title: m.title, text: m.text, articles: articleList(m.articles) });
      });
    });
  }

  /* ---------- SHARE / ANONYMIZE MODAL ---------- */
  const modal = document.getElementById("modal");
  function closeModal() { modal.hidden = true; modal.innerHTML = ""; }
  modal.addEventListener("click", function (ev) { if (ev.target === modal) closeModal(); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !modal.hidden) closeModal(); });

  async function openAnonymize(item) {
    modal.hidden = false;
    modal.innerHTML = '<div class="modal-box"><div class="loading"><div class="spinner"></div><div>Removing identifying details...</div></div></div>';

    let anon = null, count = null;
    const remote = await callApi("/anonymize", { text: item.text });
    if (remote && (remote.anonymized || remote.text)) {
      anon = remote.anonymized || remote.text;
    } else if (getGroqApiKey()) {
      const systemPrompt = `You are a document anonymizer. Remove all personally identifiable information from legal documents.
Replace with placeholders:
- Names → [NAME]
- Addresses → [ADDRESS]
- Phone numbers → [PHONE]
- Email addresses → [EMAIL]
- Case numbers → [CASE NUMBER]
- Any other identifying details → [REDACTED]

Return only the anonymized text.`;
      const groqResponse = await callGroq(systemPrompt, item.text);
      if (groqResponse) {
        anon = groqResponse;
      } else {
        const r = L.anonymize(item.text);
        anon = r.text; count = r.count;
      }
    } else {
      const r = L.anonymize(item.text);
      anon = r.text; count = r.count;
    }
    addLog("ai", "Post anonymized", item.title || "New post");

    const highlighted = esc(anon).replace(/\[[A-Z .]+\]/g, function (m) { return '<span class="redact">' + m + "</span>"; });
    modal.innerHTML =
      '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Review before sharing">' +
        "<h2>Review before sharing</h2>" +
        '<p class="notice">Names, case numbers and addresses are removed. You approve before anything is posted.' +
        (count !== null ? " (" + count + " items replaced by the demo anonymizer.)" : "") + "</p>" +
        '<div class="grid two">' +
          '<div class="panel"><h4>Original (private, stays with you)</h4>' + esc(item.text) + "</div>" +
          '<div class="panel safe"><h4>Anonymized (what will be shared)</h4>' + highlighted + "</div>" +
        "</div>" +
        '<p class="note" style="margin-top:10px">Read the right-hand side carefully. Automatic redaction can miss details, so edit anything that could identify a client before approving.</p>' +
        '<div class="row-actions"><button class="btn gold" id="approve-btn" type="button">Approve and post</button>' +
        '<button class="btn ghost" id="cancel-btn" type="button">Cancel</button></div>' +
      "</div>";

    document.getElementById("cancel-btn").addEventListener("click", function () {
      addLog("human", "Share cancelled", item.title || "New post");
      closeModal();
    });
    document.getElementById("approve-btn").addEventListener("click", function () {
      posts.unshift({
        id: "p-" + Date.now(), author: item.author || "You (advocate)", iso: new Date().toISOString(),
        text: anon, articles: (item.articles || []).map(L.baseNumber)
      });
      save("vd_posts", posts);
      addLog("human", "Anonymized post approved", "Shared to Community");
      closeModal();
      toast("Posted to the Community.");
      if (currentRoute() === "community") render(); else location.hash = "#/community";
    });
  }

  /* ---------- COMMUNITY ---------- */
  function viewCommunity() {
    view.innerHTML =
      "<h1>Community</h1>" +
      '<p class="muted">A peer space for advocates. Only anonymized text is posted here, and you approve every post.</p>' +
      '<div class="card"><h3>New post</h3>' +
        '<label class="lbl" for="p-author">Your name or handle</label>' +
        '<input type="text" id="p-author" value="You (advocate)">' +
        '<label class="lbl" for="p-text">What do you want to ask or share?</label>' +
        '<textarea id="p-text" style="min-height:110px" placeholder="Ask for a second opinion or share a lesson. Do not include client details; the next step removes them for you to review."></textarea>' +
        '<div class="row-actions"><button class="btn" id="post-btn" type="button">Review and post</button></div></div>' +
      '<div class="section-title"><h2>Recent posts</h2></div><div id="feed"></div>';

    document.getElementById("post-btn").addEventListener("click", function () {
      const text = document.getElementById("p-text").value.trim();
      const author = document.getElementById("p-author").value.trim() || "You (advocate)";
      if (!text) { toast("Write something first."); return; }
      openAnonymize({ title: "New post", author: author, text: text, articles: articleList(L.extract(text).articles) });
    });

    document.getElementById("feed").innerHTML = posts.map(function (p) {
      const tags = (p.articles || []).map(function (n) {
        return '<button class="tag" type="button" data-q="Article ' + esc(n) + '">Article ' + esc(n) + "</button>";
      }).join("");
      const rel = L.casesForArticles(p.articles).slice(0, 2).map(function (c) { return esc(c.name); });
      return '<div class="card post"><div class="post-head"><strong>' + esc(p.author) + "</strong><span>" + esc(L.timeAgo(p.iso)) + "</span></div>" +
        "<p>" + nl2br(p.text) + "</p>" + tags +
        (rel.length ? '<div class="related">Related cases: ' + rel.join("; ") + "</div>" : "") + "</div>";
    }).join("") || '<div class="empty">No posts yet.</div>';

    view.querySelectorAll("#feed .tag").forEach(function (b) {
      b.addEventListener("click", function () { goSearch(b.dataset.q); });
    });
  }

  /* ---------- ACTIVITY ---------- */
  let filter = "all";
  function viewActivity() {
    view.innerHTML =
      "<h1>Activity</h1>" +
      '<p class="notice">Every AI action and every human approval is recorded here.</p>' +
      '<div class="filterbar"><label for="flt" class="muted">Show</label>' +
        '<select id="flt"><option value="all">All actions</option><option value="ai">AI actions</option><option value="human">Human actions and approvals</option></select></div>' +
      '<div class="card table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>By</th><th>Details</th></tr></thead><tbody id="rows"></tbody></table></div>';
    const sel = document.getElementById("flt");
    sel.value = filter;
    sel.addEventListener("change", function () { filter = sel.value; renderRows(); });
    renderRows();
  }
  function renderRows() {
    const rows = logs.filter(function (l) { return filter === "all" || l.type === filter; });
    document.getElementById("rows").innerHTML = rows.length ? rows.map(function (l) {
      return "<tr><td>" + esc(fmtTime(l.iso)) + '</td><td><span class="pill ' + (l.type === "ai" ? "ai" : "human") + '">' + esc(l.action) + "</span></td><td>" + esc(l.user) + "</td><td>" + esc(l.details) + "</td></tr>";
    }).join("") : '<tr><td colspan="4" class="muted">Nothing here yet.</td></tr>';
  }

  /* ---------- SETTINGS ---------- */
  function viewSettings() {
    view.innerHTML =
      "<h1>Settings</h1>" +
      '<div class="card">' +
        "<h2>AI Configuration</h2>" +
        '<p class="note">Configure your AI provider. The API key is stored locally in your browser.</p>' +
        '<label class="lbl" for="groq-key">Groq API Key</label>' +
        '<input type="password" id="groq-key" placeholder="gsk_..." value="' + esc(getGroqApiKey()) + '">' +
        '<p class="muted" style="margin-top:8px">Get your API key from <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a></p>' +
        '<div class="row-actions"><button class="btn gold" id="save-settings" type="button">Save Settings</button></div>' +
      '</div>' +
      '<div class="card">' +
        "<h2>Backend Server (Optional)</h2>" +
        '<p class="note">For production use, run the Node.js backend server to keep your API key secure on the server.</p>' +
        '<label class="lbl" for="api-url">Backend URL</label>' +
        '<input type="text" id="api-url" placeholder="http://localhost:5000" value="' + esc(API_URL) + '">' +
        '<p class="muted" style="margin-top:8px">Leave empty to use direct Groq API from browser.</p>' +
      '</div>';

    document.getElementById("save-settings").addEventListener("click", function () {
      const groqKey = document.getElementById("groq-key").value.trim();
      const apiUrl = document.getElementById("api-url").value.trim();
      save("vd_groq_api_key", groqKey);
      // Update the mode display
      updateModeDisplay();
      // Note: API_URL is a constant, so we'd need to reload to apply changes
      if (apiUrl !== API_URL) {
        toast("API URL change requires page reload to take effect.");
      } else {
        toast("Settings saved.");
      }
    });
  }

  /* ---------- start ---------- */
  const mode = document.getElementById("mode");

  function updateModeDisplay() {
    if (API_URL) {
      mode.textContent = "Backend: Gemma 4";
      mode.classList.add("live");
    } else if (getGroqApiKey()) {
      mode.textContent = "AI: Groq (Llama 3.1)";
      mode.classList.add("live");
    } else {
      mode.textContent = "Demo mode";
      mode.classList.remove("live");
    }
  }

  updateModeDisplay();
  render();
})();
