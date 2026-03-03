const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const client = require("prom-client");
require("dotenv").config();

const app = express();

// ✅ CORS: 일단 전체 허용 (나중에 Netlify 도메인으로 제한 가능)
app.use(cors());
app.use(express.json());

// ✅ Prometheus registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// 커스텀 메트릭
const eventsCounter = new client.Counter({
  name: "carsite_events_total",
  help: "Total events received",
  labelNames: ["type"],
});
register.registerMetric(eventsCounter);

// ---- MongoDB connect ----
/*
async function connectDB() {
  // ✅ Atlas에서 "Standard connection string (non-SRV)" 복사해서 여기에 붙여넣기
  // 예시 형태:
  // mongodb://USER:PASSWORD@cluster0-shard-00-00.pt8d93p.mongodb.net:27017,cluster0-shard-00-01.pt8d93p.mongodb.net:27017,cluster0-shard-00-02.pt8d93p.mongodb.net:27017/carsite?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
  const uri ="mongodb+srv://fear5579_db_user:123456789*@cluster0.pt8d93p.mongodb.net";

  if (!uri) {
    console.error("❌ MONGODB_URI_NON_SRV missing in env");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("✅ MongoDB connected");
}
  */
 /*
 async function connectDB() {

  const uri =
    "mongodb+srv://fear5579_db_user:123456789*@cluster0.pt8d93p.mongodb.net/carsite?retryWrites=true&w=majority";

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("✅ MongoDB connected");
}
  */
 async function connectDB() {

  const uri =
  "mongodb+srv://fear5579_db_user:123456789*@cluster0.pt8d93p.mongodb.net/y";
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("✅ MongoDB connected");
}
// ---- Schema ----
const EventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    data: { type: Object, default: {} },
    ip: { type: String, default: "" },
    ua: { type: String, default: "" },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema);

// ---- routes ----
app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/events", async (req, res) => {
  try {
    const { type, data } = req.body || {};
    if (!type) return res.status(400).json({ ok: false, error: "type required" });

    const ip =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "";

    const ua = req.headers["user-agent"] || "";

    await Event.create({ type, data: data || {}, ip, ua });

    // ✅ metrics 증가
    eventsCounter.labels(type).inc();

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /api/events error:", e);
    res.status(500).json({ ok: false });
  }
});

app.get("/api/events/recent", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const items = await Event.find({}, { __v: 0 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({ ok: true, items });
});

// ✅ Prometheus scrape endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ---- start ----
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Backend running on :${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB connect failed:", err.message);
    process.exit(1);
  });