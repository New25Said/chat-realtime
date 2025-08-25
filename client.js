const socket = io();

const loginDiv = document.getElementById("login");
const chatDiv = document.getElementById("chat");
const joinBtn = document.getElementById("joinBtn");
const nicknameInput = document.getElementById("nickname");
const avatarInput = document.getElementById("avatar");
const secretInput = document.getElementById("secret");

const messagesDiv = document.getElementById("messages");
const msgBox = document.getElementById("msgBox");
const sendBtn = document.getElementById("sendBtn");

joinBtn.onclick = () => {
  const nickname = nicknameInput.value;
  const avatarUrl = avatarInput.value;
  const secret = secretInput.value;
  if (!nickname) return alert("Pon un nickname");

  socket.emit("join", { nickname, avatarUrl, secret }, res => {
    if (res.ok) {
      loginDiv.style.display = "none";
      chatDiv.style.display = "block";
    }
  });
};

sendBtn.onclick = () => {
  const text = msgBox.value;
  if (!text) return;
  socket.emit("public_message", { text });
  msgBox.value = "";
};

socket.on("public_message", data => {
  const div = document.createElement("div");
  div.textContent = `${data.from}: ${data.text}`;
  messagesDiv.appendChild(div);
});

socket.on("system", data => {
  const div = document.createElement("div");
  div.textContent = `[Sistema] ${data.text}`;
  messagesDiv.appendChild(div);
});
