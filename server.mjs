import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = process.env.DISCUSSION_DB || path.join(DATA_DIR, "community.sqlite");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const MAX_BODY_BYTES = 10_000;
const MAX_MESSAGES_PER_MINUTE = 6;
const ALLOWED_TOPICS = new Set(["Makan anak", "Tumbuh kembang", "Vitamin & suplemen", "Berbagi cerita"]);
const PUBLIC_FILES = new Set([
  "index.html", "styles.css", "app.js", "growth-reference-data.js", "menu-data.js",
  "chatbot-data.js", "food-analysis-config.js", "manifest.webmanifest", "app-icon.svg",
  "service-worker.js"
]);
const rateBuckets = new Map();

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS discussion_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    relation TEXT NOT NULL DEFAULT 'Orang tua/wali',
    child_age TEXT NOT NULL DEFAULT 'Tidak disebutkan',
    topic TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    client_id TEXT,
    parent_id INTEGER
  );
  CREATE TABLE IF NOT EXISTS discussion_participants (
    display_no INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
`);
const discussionColumns = new Set(db.prepare("PRAGMA table_info(discussion_messages)").all().map(column => column.name));
if (!discussionColumns.has("relation")) db.exec("ALTER TABLE discussion_messages ADD COLUMN relation TEXT NOT NULL DEFAULT 'Orang tua/wali'");
if (!discussionColumns.has("child_age")) db.exec("ALTER TABLE discussion_messages ADD COLUMN child_age TEXT NOT NULL DEFAULT 'Tidak disebutkan'");
if (!discussionColumns.has("client_id")) db.exec("ALTER TABLE discussion_messages ADD COLUMN client_id TEXT");
if (!discussionColumns.has("parent_id")) db.exec("ALTER TABLE discussion_messages ADD COLUMN parent_id INTEGER");
db.exec("CREATE INDEX IF NOT EXISTS idx_discussion_parent_id ON discussion_messages(parent_id,id)");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Pesan terlalu besar."), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("Format JSON tidak valid."), { status: 400 }); }
}

function allowPost(address) {
  const now = Date.now();
  const bucket = rateBuckets.get(address);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    rateBuckets.set(address, { startedAt: now, count: 1 });
    return true;
  }
  if (bucket.count >= MAX_MESSAGES_PER_MINUTE) return false;
  bucket.count++;
  return true;
}

function mapMessage(row) {
  return { id: row.id, nickname: row.nickname, relation: row.relation, childAge: row.child_age, topic: row.topic, text: row.body, createdAt: row.created_at };
}

function ensureParticipant(value) {
  const clientId = String(value || "");
  if (!/^[a-zA-Z0-9-]{12,80}$/.test(clientId)) throw Object.assign(new Error("Identitas perangkat tidak valid."), { status: 400 });
  let participant = db.prepare("SELECT display_no,client_id FROM discussion_participants WHERE client_id = ?").get(clientId);
  if (!participant) {
    db.prepare("INSERT OR IGNORE INTO discussion_participants (client_id,created_at) VALUES (?,?)").run(clientId, new Date().toISOString());
    participant = db.prepare("SELECT display_no,client_id FROM discussion_participants WHERE client_id = ?").get(clientId);
  }
  return { clientId: participant.client_id, displayName: `User ${participant.display_no}` };
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, { ok: true, service: "tumbuh-discussion" });
  }

  if (url.pathname === "/api/discussions" && req.method === "GET") {
    try {
      const currentUser = ensureParticipant(url.searchParams.get("clientId"));
      const requested = Number(url.searchParams.get("limit") || 60);
      const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 60, 1), 100);
      const posts = db.prepare("SELECT id,nickname,relation,child_age,topic,body,created_at FROM discussion_messages WHERE parent_id IS NULL ORDER BY id DESC LIMIT ?").all(limit).reverse();
      const getReplies = db.prepare("SELECT id,nickname,relation,child_age,topic,body,created_at FROM discussion_messages WHERE parent_id = ? ORDER BY id ASC");
      const messages = posts.map(post => ({ ...mapMessage(post), replies: getReplies.all(post.id).map(mapMessage) }));
      return sendJson(res, 200, { messages, currentUser });
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.status ? error.message : "Ruang diskusi belum dapat dimuat." });
    }
  }

  if (url.pathname === "/api/discussions" && req.method === "POST") {
    if (!allowPost(req.socket.remoteAddress || "unknown")) return sendJson(res, 429, { error: "Terlalu banyak pesan. Coba lagi sebentar." });
    try {
      const input = await readJson(req);
      const participant = ensureParticipant(input.clientId);
      const allowedRelations = new Set(["Orang tua/wali", "Ibu", "Ayah", "Pengasuh"]);
      const allowedAges = new Set(["Tidak disebutkan", "1 tahun", "2 tahun", "3 tahun", "4 tahun"]);
      const relation = allowedRelations.has(input.relation) ? input.relation : "Orang tua/wali";
      const childAge = allowedAges.has(input.childAge) ? input.childAge : "Tidak disebutkan";
      const topic = ALLOWED_TOPICS.has(input.topic) ? input.topic : "Berbagi cerita";
      const body = String(input.text || "").replace(/\u0000/g, "").trim();
      if (!body) return sendJson(res, 400, { error: "Pesan tidak boleh kosong." });
      if (body.length > 800) return sendJson(res, 413, { error: "Pesan maksimal 800 karakter." });
      const parentId = input.parentId == null ? null : Number(input.parentId);
      let postTopic = topic;
      if (parentId !== null) {
        if (!Number.isSafeInteger(parentId) || !db.prepare("SELECT id FROM discussion_messages WHERE id = ? AND parent_id IS NULL").get(parentId)) {
          return sendJson(res, 404, { error: "Diskusi yang ingin dibalas tidak ditemukan." });
        }
        postTopic = db.prepare("SELECT topic FROM discussion_messages WHERE id = ?").get(parentId).topic;
      }
      const createdAt = new Date().toISOString();
      const result = db.prepare("INSERT INTO discussion_messages (nickname,relation,child_age,topic,body,created_at,client_id,parent_id) VALUES (?,?,?,?,?,?,?,?)").run(participant.displayName, relation, childAge, postTopic, body, createdAt, participant.clientId, parentId);
      const message = mapMessage({ id: Number(result.lastInsertRowid), nickname: participant.displayName, relation, child_age: childAge, topic: postTopic, body, created_at: createdAt });
      return sendJson(res, 201, { message });
    } catch (error) {
      return sendJson(res, error.status || 500, { error: error.status ? error.message : "Pesan belum dapat disimpan." });
    }
  }

  return sendJson(res, 404, { error: "Endpoint tidak ditemukan." });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
  if (req.method !== "GET" && req.method !== "HEAD") return sendJson(res, 405, { error: "Method tidak didukung." });

  let relative;
  try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html"; }
  catch { return sendJson(res, 400, { error: "Path tidak valid." }); }
  if (!PUBLIC_FILES.has(relative)) return sendJson(res, 404, { error: "File tidak ditemukan." });
  const filePath = path.resolve(ROOT, relative);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) return sendJson(res, 404, { error: "File tidak ditemukan." });
  fs.readFile(filePath, (error, contents) => {
    if (error) return sendJson(res, 404, { error: "File tidak ditemukan." });
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache"
    });
    res.end(req.method === "HEAD" ? undefined : contents);
  });
});

server.listen(PORT, HOST, () => console.log(`Tumbuh server berjalan di http://${HOST}:${PORT}`));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { server.close(() => { db.close(); process.exit(0); }); });
}
