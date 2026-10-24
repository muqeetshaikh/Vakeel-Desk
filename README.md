# Vakeel Desk

Private, self-hosted AI workspace for lawyers. A local open-weight model (Gemma 4) extracts case records from scanned documents, with human review, and anonymizes cases before sharing them with a peer community.

Plain HTML, CSS and JavaScript. No install, no build step, no accounts.

## Run it

Double-click `index.html` (or right-click, Open With, Safari/Chrome).
That's it. It works offline in **demo mode** using the sample data in `data.js`.

## Files

| File | What it does |
|---|---|
| `index.html` | The page shell and navigation |
| `style.css` | All the design (navy, white and gold) |
| `data.js` | Sample Constitution articles, 11 Supreme Court cases, sample posts and a sample notice |
| `logic.js` | Built-in demo logic: search, field extraction, anonymization |
| `app.js` | The four pages (Search, My Matters, Community, Activity) |

## Connect the real backend (Gemma 4)

Open `app.js` and set `API_URL` near the top, for example:

```js
const API_URL = "http://localhost:5000";
```

The backend must allow CORS and provide these endpoints (all `POST`, JSON in and out):

| Endpoint | Send | Get back |
|---|---|---|
| `/ask` | `{ "question": "..." }` | `{ "answer": "...", "articles": [{ "number", "title", "text" }], "cases": [{ "name", "year", "summary", "articles": ["21"] }] }` |
| `/extract` | `{ "text": "..." }` | `{ "parties", "court", "caseNumber", "dates", "articles" }` |
| `/anonymize` | `{ "text": "..." }` | `{ "anonymized": "..." }` |

If the backend can't be reached, the app shows a message and falls back to the demo logic, so the demo never breaks.

## Notes

- The demo anonymizer uses simple pattern matching. The real version should use the local model. The screen always shows a before/after preview, and the lawyer approves before anything is posted.
- Saved matters, posts and the activity log are kept in the browser (localStorage) for the demo.
- Article and case summaries are short and simplified. Verify against the official text.
- Information only, not legal advice.
