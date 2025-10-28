import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 🔥 GANTI DENGAN KONFIGURASI KAMU SENDIRI
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN.firebaseapp.com",
  databaseURL: "https://YOUR_DB_URL.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const board = document.getElementById("chessboard");
const turnText = document.getElementById("turn");
const resetBtn = document.getElementById("reset");

let selected = null;
let playerColor = null;
let turn = "white";

const pieces = {
  white: ["♖","♘","♗","♕","♔","♗","♘","♖","♙","♙","♙","♙","♙","♙","♙","♙"],
  black: ["♜","♞","♝","♛","♚","♝","♞","♜","♟","♟","♟","♟","♟","♟","♟","♟"]
};

async function joinGame() {
  const snapshot = await get(ref(db, "chess/players"));
  const data = snapshot.val() || {};

  if (!data.white) {
    playerColor = "white";
    await set(ref(db, "chess/players/white"), true);
  } else if (!data.black) {
    playerColor = "black";
    await set(ref(db, "chess/players/black"), true);
  } else {
    playerColor = "spectator";
  }
  turnText.textContent = `You are ${playerColor}`;
}

function createBoard(state = null) {
  board.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square", (row + col) % 2 === 0 ? "light" : "dark");
      square.dataset.row = row;
      square.dataset.col = col;

      if (state) {
        square.textContent = state[row][col];
      } else {
        if (row === 0) square.textContent = pieces.black[col];
        if (row === 1) square.textContent = pieces.black[8 + col];
        if (row === 6) square.textContent = pieces.white[8 + col];
        if (row === 7) square.textContent = pieces.white[col];
      }

      square.addEventListener("click", () => handleClick(square));
      board.appendChild(square);
    }
  }
}

function getBoardState() {
  const squares = Array.from(document.querySelectorAll(".square"));
  let state = [];
  for (let r = 0; r < 8; r++) {
    state.push(squares.slice(r * 8, (r + 1) * 8).map(s => s.textContent));
  }
  return state;
}

async function handleClick(square) {
  if (playerColor !== turn) return;

  const piece = square.textContent;
  if (selected) {
    if (selected === square) {
      selected.classList.remove("selected");
      selected = null;
      return;
    }

    // Gerakan sederhana (tanpa validasi penuh)
    square.textContent = selected.textContent;
    selected.textContent = "";
    selected.classList.remove("selected");
    selected = null;

    turn = turn === "white" ? "black" : "white";
    await updateGame();
  } else if (piece && getPieceColor(piece) === playerColor) {
    selected = square;
    square.classList.add("selected");
  }
}

function getPieceColor(piece) {
  if (pieces.white.includes(piece)) return "white";
  if (pieces.black.includes(piece)) return "black";
  return null;
}

async function updateGame() {
  await set(ref(db, "chess/state"), {
    board: getBoardState(),
    turn: turn
  });
}

function listenForUpdates() {
  onValue(ref(db, "chess/state"), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    createBoard(data.board);
    turn = data.turn;
    turnText.textContent = `Turn: ${turn}`;
  });
}

resetBtn.addEventListener("click", async () => {
  await set(ref(db, "chess"), null);
  createBoard();
  turn = "white";
  await updateGame();
});

await joinGame();
createBoard();
listenForUpdates();
