const board = document.getElementById("chessboard");
const turnText = document.getElementById("turn");
const resetBtn = document.getElementById("reset");

let selected = null;
let turn = "white";

const pieces = {
  white: ["♖","♘","♗","♕","♔","♗","♘","♖","♙","♙","♙","♙","♙","♙","♙","♙"],
  black: ["♜","♞","♝","♛","♚","♝","♞","♜","♟","♟","♟","♟","♟","♟","♟","♟"]
};

function getPieceColor(piece) {
  if (!piece) return null;
  return pieces.white.includes(piece)
    ? "white"
    : pieces.black.includes(piece)
    ? "black"
    : null;
}

function createBoard() {
  board.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square", (row + col) % 2 === 0 ? "light" : "dark");
      square.dataset.row = row;
      square.dataset.col = col;

      if (row === 0) square.textContent = pieces.black[col];
      if (row === 1) square.textContent = pieces.black[8 + col];
      if (row === 6) square.textContent = pieces.white[8 + col];
      if (row === 7) square.textContent = pieces.white[col];

      square.addEventListener("click", () => selectSquare(square));
      board.appendChild(square);
    }
  }
}

function getSquares() {
  return Array.from(document.querySelectorAll(".square"));
}

function getPiece(row, col) {
  const square = getSquares().find(
    (s) => s.dataset.row == row && s.dataset.col == col
  );
  return square ? square.textContent : "";
}

function isValidMove(fromRow, fromCol, toRow, toCol, piece) {
  const targetPiece = getPiece(toRow, toCol);
  const pieceColor = getPieceColor(piece);
  const targetColor = getPieceColor(targetPiece);
  const dRow = toRow - fromRow;
  const dCol = toCol - fromCol;
  const absRow = Math.abs(dRow);
  const absCol = Math.abs(dCol);

  if (targetColor === pieceColor) return false;

  switch (piece) {
    case "♙":
      if (dCol === 0 && dRow === -1 && targetPiece === "") return true;
      if (fromRow === 6 && dCol === 0 && dRow === -2 && targetPiece === "" && getPiece(5, fromCol) === "") return true;
      if (absCol === 1 && dRow === -1 && targetPiece !== "" && targetColor === "black") return true;
      return false;
    case "♟":
      if (dCol === 0 && dRow === 1 && targetPiece === "") return true;
      if (fromRow === 1 && dCol === 0 && dRow === 2 && targetPiece === "" && getPiece(2, fromCol) === "") return true;
      if (absCol === 1 && dRow === 1 && targetPiece !== "" && targetColor === "white") return true;
      return false;
    case "♖": case "♜":
      if (dRow !== 0 && dCol !== 0) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);
    case "♕": case "♛":
      if (absRow === absCol || dRow === 0 || dCol === 0)
        return isPathClear(fromRow, fromCol, toRow, toCol);
      return false;
    case "♗": case "♝":
      if (absRow === absCol) return isPathClear(fromRow, fromCol, toRow, toCol);
      return false;
    case "♘": case "♞":
      return (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
    case "♔": case "♚":
      return absRow <= 1 && absCol <= 1;
  }
  return false;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
  const dRow = Math.sign(toRow - fromRow);
  const dCol = Math.sign(toCol - fromCol);
  let row = fromRow + dRow;
  let col = fromCol + dCol;

  while (row !== toRow || col !== toCol) {
    if (getPiece(row, col) !== "") return false;
    row += dRow;
    col += dCol;
  }
  return true;
}

function findKing(color) {
  return getSquares().find(s => s.textContent === (color === "white" ? "♔" : "♚"));
}

function isSquareAttacked(row, col, attackerColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = getPiece(r, c);
      const color = getPieceColor(piece);
      if (color === attackerColor && isValidMove(r, c, row, col, piece)) return true;
    }
  }
  return false;
}

function isKingInCheck(color) {
  const king = findKing(color);
  if (!king) return false;
  const row = parseInt(king.dataset.row);
  const col = parseInt(king.dataset.col);
  const enemy = color === "white" ? "black" : "white";
  return isSquareAttacked(row, col, enemy);
}

function simulateMove(from, to) {
  const fromPiece = from.textContent;
  const toPiece = to.textContent;
  from.textContent = "";
  to.textContent = fromPiece;
  const inCheck = isKingInCheck(getPieceColor(fromPiece));
  from.textContent = fromPiece;
  to.textContent = toPiece;
  return inCheck;
}

function hasAnyLegalMove(color) {
  const squares = getSquares();
  for (const from of squares) {
    const piece = from.textContent;
    if (getPieceColor(piece) !== color) continue;
    for (const to of squares) {
      const r = parseInt(to.dataset.row);
      const c = parseInt(to.dataset.col);
      const fromR = parseInt(from.dataset.row);
      const fromC = parseInt(from.dataset.col);
      if (isValidMove(fromR, fromC, r, c, piece) && !simulateMove(from, to)) return true;
    }
  }
  return false;
}

function checkForCheckmate(color) {
  if (isKingInCheck(color) && !hasAnyLegalMove(color)) {
    showGameOver(`Turn: ${color.charAt(0).toUpperCase() + color.slice(1)} Checkmate`);
    return true;
  }
  return false;
}

function showGameOver(text) {
  turnText.textContent = text;
  board.style.pointerEvents = "none";

  setTimeout(() => {
    resetGame();
  }, 3000);
}

function selectSquare(square) {
  if (board.style.pointerEvents === "none") return;

  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = square.textContent;
  const color = getPieceColor(piece);

  if (selected) {
    const fromRow = parseInt(selected.dataset.row);
    const fromCol = parseInt(selected.dataset.col);
    const fromPiece = selected.textContent;
    const fromColor = getPieceColor(fromPiece);

    if (fromColor === turn && isValidMove(fromRow, fromCol, row, col, fromPiece)) {
      if (simulateMove(selected, square)) {
        selected.classList.remove("selected");
        selected = null;
        return;
      }

      square.textContent = fromPiece;
      selected.textContent = "";
      selected.classList.remove("selected");
      selected = null;

      turn = turn === "white" ? "black" : "white";

      if (!checkForCheckmate(turn)) {
        if (isKingInCheck(turn)) {
          turnText.textContent = `Turn: ${turn.charAt(0).toUpperCase() + turn.slice(1)} (Check!)`;
        } else {
          turnText.textContent = `Turn: ${turn.charAt(0).toUpperCase() + turn.slice(1)}`;
        }
      }
    } else {
      selected.classList.remove("selected");
      selected = null;
    }
  } else if (piece !== "" && color === turn) {
    selected = square;
    square.classList.add("selected");
  }
}

function resetGame() {
  createBoard();
  turn = "white";
  turnText.textContent = "Turn: White";
  board.style.pointerEvents = "auto";
}

resetBtn.addEventListener("click", resetGame);
createBoard();
