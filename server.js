const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.query.type === "sticker" ? "stickers" : "files";
    const dir = path.join(UPLOAD_DIR, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// servir archivos estáticos desde la raíz del proyecto
app.use(express.static(__dirname));
app.use("/uploads", express.static(UPLOAD_DIR));

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false });
  const url = `/uploads/${req.query.type === "sticker" ? "stickers" : "files"}/${req.file.filename}`;
  res.json({ ok: true, url, originalName: req.file.originalname });
});

// === CHAT LOGIC (igual que antes, resumido para ejemplo) ===
const users = {};
const nickToSocket = {};
const groups = {};
const unread = {};

function incUnread(toNick, chatId) {
  if (!unread[toNick]) unread[toNick] = {};
  unread[toNick][chatId] = (unread[toNick][chatId] || 0) + 1;
}

io.on("connection", socket => {
  console.log("connected", socket.id);

  socket.on("join", (payload, ack) => {
    users[socket.id] = { nickname: payload.nickname, avatarUrl: payload.avatarUrl, secret: payload.secret };
    nickToSocket[payload.nickname] = socket.id;
    socket.join("public");
    ack && ack({ ok: true });
    io.to("public").emit("system", { text: `${payload.nickname} se unió`, time: Date.now() });
  });

  socket.on("public_message", msg => {
    const user = users[socket.id]; if (!user) return;
    const data = { from: user.nickname, avatar: user.avatarUrl, text: msg.text, time: Date.now() };
    io.to("public").emit("public_message", data);
  });

  socket.on("disconnect", () => {
    const u = users[socket.id];
    if (u) {
      delete nickToSocket[u.nickname];
      io.to("public").emit("system", { text: `${u.nickname} salió`, time: Date.now() });
      delete users[socket.id];
    }
  });
});

server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
