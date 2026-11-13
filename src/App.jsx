import React,{ useMemo, useState } from "react";
import { Chess } from "chess.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PIECES = {
  wk:"♔", wq:"♕", wr:"♖", wb:"♗", wn:"♘", wp:"♙",
  bk:"♚", bq:"♛", br:"♜", bb:"♝", bn:"♞", bp:"♟︎"
};
const LESSONS = [
  { title:"Move a pawn", san:"e4", text:"Pawns usually move one square forward. From their starting square, they may move two. Try moving the pawn in front of your King from e2 to e4.", tip:"Tap the white pawn on e2, then tap e4." },
  { title:"Bring out a knight", san:"Nf3", text:"Knights move in an L shape: two squares in one direction, then one square sideways. They can jump over other pieces.", tip:"Move the knight from g1 to f3." },
  { title:"Develop a bishop", san:"Bc4", text:"Bishops travel diagonally. Developing pieces means bringing them out so they can help control the board.", tip:"Move the bishop from f1 to c4." },
  { title:"Castle to protect your King", san:"O-O", text:"Castling moves your King two squares toward a rook, and that rook jumps beside it. It helps keep your King safer. The path must be clear and the King cannot castle through check.", tip:"Castle kingside when the move becomes available." },
  { title:"A simple opening idea", san:"", text:"You have developed pieces and prepared to castle. In the opening, try to control the centre, develop knights and bishops, and keep your King safe.", tip:"Switch to Free Play and practise both sides." }
];

function freshGame() { return new Chess(START_FEN); }

export default function App() {
  const [game, setGame] = useState(freshGame);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("lesson");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [message, setMessage] = useState("Welcome! Start by moving the white pawn from e2 to e4.");
  const [showHelp, setShowHelp] = useState(true);

  const turn = game.turn();
  const legalMoves = useMemo(() => selected ? game.moves({ square: selected, verbose: true }) : [], [game, selected]);
  const targets = legalMoves.map(m => m.to);
  const currentLesson = LESSONS[Math.min(lessonIndex, LESSONS.length - 1)];
  const isFinished = game.isGameOver();

  function commitMove(from, to) {
    const candidates = game.moves({ square: from, verbose: true }).filter(m => m.to === to);
    if (!candidates.length) {
      setMessage("That move is not legal. Choose one of the highlighted squares.");
      return;
    }
    let promotion = "q";
    if (candidates.some(m => m.promotion)) {
      const choice = window.prompt("Promote your pawn to q (queen), r (rook), b (bishop), or n (knight):", "q");
      promotion = ["q","r","b","n"].includes((choice || "q").toLowerCase()) ? choice.toLowerCase() : "q";
    }
    const san = game.move({ from, to, promotion });
    setHistory(h => [...h, game.fen() === START_FEN ? null : h.length ? h[h.length - 1] : START_FEN]);
    setGame(new Chess(game.fen()));
    setSelected(null);

    if (mode === "lesson" && lessonIndex < 4) {
      const expected = LESSONS[lessonIndex].san;
      if (san.san === expected) {
        const next = Math.min(lessonIndex + 1, LESSONS.length - 1);
        setLessonIndex(next);
        setMessage(`Correct! ${san.san}. ${LESSONS[next].text}`);
      } else {
        setMode("free");
        setMessage(`You played ${san.san}. Nice try! Free Play is now on, so you can explore any legal move.`);
      }
    } else {
      setMessage(san.san ? `You played ${san.san}. ${game.isCheck() ? "Check!" : "Good move — keep going."}` : "Good move!");
    }
  }

  function onSquareClick(square) {
    if (isFinished) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      commitMove(selected, square);
      return;
    }
    if (piece && piece.color === turn) {
      setSelected(square);
      setMessage(`Selected ${piece.type.toUpperCase()} on ${square}. Now choose a highlighted destination.`);
    } else {
      setSelected(null);
      setMessage("Select one of your own pieces first, then choose a highlighted square.");
    }
  }

  function reset() {
    setGame(freshGame()); setHistory([]); setSelected(null); setLessonIndex(0);
    setMode("lesson"); setMessage("New game! Move the white pawn from e2 to e4."); 
  }
  function undo() {
    if (!history.length) return;
    const previousFen = history[history.length - 1] || START_FEN;
    const next = new Chess(previousFen);
    setGame(next); setHistory(h => h.slice(0, -1)); setSelected(null);
    setMessage("Last move undone.");
    if (mode === "lesson") setLessonIndex(i => Math.max(0, i - 1));
  }
  function nextLesson() {
    if (lessonIndex === 0 && game.history().length === 0) {
      setMessage("First, move the pawn from e2 to e4. Then use Next Lesson.");
      return;
    }
    setLessonIndex(i => Math.min(i + 1, LESSONS.length - 1));
    setMessage("Read the lesson, then try the suggested move on the board.");
  }

  const board = [];
  for (let rank = 8; rank >= 1; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = "abcdefgh"[file] + rank;
      const piece = game.get(square);
      const isLight = (rank + file) % 2 === 0;
      const moveTarget = targets.includes(square);
      const last = game.history({ verbose: true }).slice(-1)[0];
      const isLast = last && (last.from === square || last.to === square);
      board.push(
        <button
          key={square}
          className={`square ${isLight ? "light" : "dark"} ${selected === square ? "selected" : ""} ${isLast ? "last" : ""}`}
          onClick={() => onSquareClick(square)}
          aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
        >
          {piece && <span className={`piece ${piece.color === "w" ? "white-piece" : "black-piece"}`}>{PIECES[piece.color + piece.type]}</span>}
          {moveTarget && <span className={`target ${piece ? "capture" : ""}`} />}
          {file === 0 && <span className="coord rank">{rank}</span>}
          {rank === 1 && <span className="coord file">{"abcdefgh"[file]}</span>}
        </button>
      );
    }
  }

  const status = isFinished
    ? game.isCheckmate() ? `Checkmate — ${turn === "w" ? "Black" : "White"} wins!` : "Game drawn."
    : `${turn === "w" ? "White" : "Black"} to move${game.isCheck() ? " · Check!" : ""}`;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">♞</div>
        <div><div className="eyebrow">CHESS STARTER</div><h1>Learn chess, one move at a time</h1></div>
        <span className="beginner-pill">Beginner friendly</span>
      </header>

      <section className="intro">
        <div><p className="eyebrow">YOUR FIRST CHESS GAME</p><h2>Understand the pieces. Make a move. Have fun and Enjoy</h2>
          <p>No experience needed. Follow the short guided lesson, or switch to Free Play whenever you're ready.</p></div>
        <div className="intro-icon">♟</div>
      </section>

      <div className="mode-row">
        <div className="tabs">
          <button className={mode === "lesson" ? "active" : ""} onClick={() => {setMode("lesson"); setMessage("Follow the lesson card and try its suggested move.");}}>Guided lesson</button>
          <button className={mode === "free" ? "active" : ""} onClick={() => {setMode("free"); setMessage("Free Play: take turns moving White and Black. All moves are checked for legality.");}}>Free Play</button>
        </div>
        <div className="game-status"><span className={`status-dot ${isFinished ? "done" : ""}`} />{status}</div>
      </div>

      <section className="play-layout">
        <div className="board-wrap">
          <div className="board-label"><span>BLACK</span><span>WHITE</span></div>
          <div className="chessboard">{board}</div>
          <div className="board-actions">
            <button className="secondary" onClick={undo} disabled={!history.length}>↶ Undo</button>
            <button className="secondary" onClick={reset}>↻ Restart</button>
            <span className="move-count">{game.history().length} half-moves</span>
          </div>
        </div>

        <aside className="side-panel">
          {mode === "lesson" ? <>
            <div className="panel-heading"><span className="step-label">STEP {Math.min(lessonIndex + 1, 5)} OF 5</span><span className="step-track"><i style={{width:`${(lessonIndex + 1) * 20}%`}} /></span></div>
            <h3>{currentLesson.title}</h3>
            <p className="lesson-copy">{currentLesson.text}</p>
            <div className="tip-box"><span>💡 TRY THIS</span><p>{currentLesson.tip}</p></div>
            <div className="lesson-buttons">
              <button className="primary" onClick={nextLesson} disabled={lessonIndex >= 4}>Next lesson <span>→</span></button>
              <button className="text-button" onClick={() => {setMode("free");setMessage("Free Play enabled. Try any legal move.");}}>Skip to free play</button>
            </div>
          </> : <>
            <span className="step-label">FREE PLAY</span>
            <h3>Your board, your moves</h3>
            <p className="lesson-copy">Play both sides on this device. Select a piece to see its legal moves, then select a highlighted square.</p>
            <div className="tip-box"><span>💡 BEGINNER TIP</span><p>Try to control the four centre squares (d4, e4, d5 and e5). Develop your knights and bishops before bringing your queen out.</p></div>
            <button className="primary full" onClick={reset}>Start a new game</button>
          </>}
          <div className="message-box" aria-live="polite"><span>GAME COACH</span><p>{message}</p></div>
          {isFinished && <div className="result-box">{status}<button onClick={reset}>Play again</button></div>}
        </aside>
      </section>

      <section className="learn-section">
        <div className="section-title"><div><p className="eyebrow">THE BASICS</p><h2>Meet your chess pieces</h2></div><button className="text-button" onClick={() => setShowHelp(v => !v)}>{showHelp ? "Hide guide" : "Show guide"}</button></div>
        {showHelp && <div className="piece-grid">
          {[
            ["♔","King","One square in any direction.","Most important piece."],
            ["♕","Queen","Any number of squares, straight or diagonal.","Most powerful piece."],
            ["♖","Rook","Any number of squares horizontally or vertically.","Strong on open files."],
            ["♗","Bishop","Any number of squares diagonally.","Stays on its colour."],
            ["♘","Knight","Moves in an L shape and can jump.","The only piece that jumps."],
            ["♙","Pawn","Moves forward; captures one square diagonally.","Can become a queen at the far end."]
          ].map(([symbol,name,move,note]) => <article className="piece-card" key={name}><div className="piece-symbol">{symbol}</div><div><h4>{name}</h4><p>{move}</p><small>{note}</small></div></article>)}
        </div>}
      </section>

      <footer><span>♞ Chess Starter</span><span>Learn at your own pace · Developed by Syed Copyright © 2027</span></footer>
    </main>
  );
}
