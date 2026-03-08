// 1) MUST BE AT THE VERY TOP: DNS Fix for Node.js v19+ (best-effort)
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";


const require = createRequire(import.meta.url);
const dns = require("node:dns");

// ✅ 실무에선 "setServers"만으로 완전 해결 안 되는 경우 많음.
// 그래도 best-effort로 두고, Atlas가 계속 안되면 "Non-SRV" 연결 문자열로 바꾸는 게 확실함.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const client = require("prom-client");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;


// ✅ 프론트 도메인 나중에 제한 가능
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

// ✅ Prometheus registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ✅ 커스텀 메트릭 (type 라벨만)
const eventsCounter = new client.Counter({
  name: "carsite_events_total",
  help: "Total events received",
  labelNames: ["type"],
});
register.registerMetric(eventsCounter);

// ---- MongoDB connect ----
async function connectDB() {
  // ⚠️ 비밀번호에 특수문자 있으면 반드시 인코딩해야 함.
  // 예: * => %2A
  // const uri = "mongodb+srv://fear5579_db_user:123456789%2A@cluster0.pt8d93p.mongodb.net/carsite?retryWrites=true&w=majority";

  // ✅ 가능하면 .env로 빼라 (하지만 너는 하드코딩 속도전이라 했으니 일단 유지)
  const uri =
    "mongodb+srv://fear5579_db_user:123456789%2A@cluster0.pt8d93p.mongodb.net/carsite?retryWrites=true&w=majority";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      // family: 4, // IPv6 문제 있으면 켜볼 수 있음(환경 따라)
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

// ---- log file setup ----
const logDir = path.join(__dirname, "logs");
const logFile = path.join(logDir, "app.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(level, message) {
  const line = `${new Date().toISOString()} level=${level} message="${message}"\n`;
  fs.appendFileSync(logFile, line, "utf8");
  console.log(line.trim());
}

const EventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },

    // from client payload
    ts: { type: Number, required: true, index: true }, // Date.now()
    sessionId: { type: String, required: true, index: true },
    page: { type: String, default: "", index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    // from server
    ip: { type: String, default: "" },
    ua: { type: String, default: "" },
  },
  { timestamps: true }
);



// helpful indexes
EventSchema.index({ createdAt: -1 });
EventSchema.index({ sessionId: 1, ts: -1 });

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

// ---- routes ----
//app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => {
  writeLog("info", "GET /");
  res.send("Node app is running");
});

app.get("/error", (req, res) => {
  writeLog("error", "GET /error");
  res.status(500).send("error route");
});

app.get("/health", (req, res) => {
  writeLog("info", "GET /health");
  res.json({ ok: true });
});
// ✅ 프론트는 여기로 보내면 됨: POST http://localhost:4000/api/events

app.post("/api/events", async (req, res) => {
  try {
    const { type, ts, sessionId, page, data } = req.body || {};
        
    writeLog("info", `POST /api/events type=${type || "unknown"}`);
    console.log("EVENT RECEIVED:", req.body);

    // ✅ payload 필수값 검증 (새 payload 기준)
    if (!type) return res.status(400).json({ ok: false, error: "type required" });
    if (typeof ts !== "number") {
      return res.status(400).json({ ok: false, error: "ts required (number)" });
    }
    if (!sessionId) {
      return res.status(400).json({ ok: false, error: "sessionId required" });
    }

    // ✅ 프록시(배포)면 x-forwarded-for, 로컬이면 req.ip가 깔끔
    const ip =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "";

    const ua = req.headers["user-agent"] || "";
    
    console.log("ip ua:", ip, ua);


    // ✅ 새 payload 그대로 저장
    await Event.create({
      type,
      ts,
      sessionId,
      page: page || "",
      data: data || {},
      ip,
      ua,
    });

    eventsCounter.labels(type).inc();

   // res.json({ ok: true });
   res.json({ ok: true, ip, ua });
  } catch (e) {
    writeLog("error", `POST /api/events error=${e?.message || "server_error"}`);
    console.error("POST /api/events error:", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});
app.get("/api/events/recent", async (req, res) => {
  try {
    
    writeLog("info", "GET /api/events/recent");

    const limit = Math.min(Number(req.query.limit || 20), 100);

    const items = await Event.find({}, { __v: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ ok: true, items });
  } catch (e) {
    writeLog("error", `GET /api/events/recent error=${e?.message || "server_error"}`);
    console.error("GET /api/events/recent error:", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ✅ Prometheus scrape endpoint
app.get("/metrics", async (req, res) => {
  try {
    writeLog("info", "GET /metrics");
    
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (e) {
    writeLog("error", `GET /metrics error=${e?.message || "metrics_error"}`);
    res.status(500).end(e?.message || "metrics_error");
  }
});

// ---- start ----
//const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    writeLog("info", `server started on port ${PORT}`);
    app.listen(PORT, () => console.log(`✅ Backend running on :${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB connect failed:", err?.message || err);
    process.exit(1);
  });