import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import "./Game.css";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 60;
const OBSTACLE_SIZE = 50;
const PLAYER_SPEED = 30;
const TOP_LINE_HEIGHT = 80;

export default function Game() {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem("highScore")) || 0
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [speedBoost, setSpeedBoost] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const gameRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  // Keyboard movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isGameOver || showIntro || countdown !== null) return;
      if (e.key === "ArrowLeft") {
        setPlayerX((prev) => Math.max(prev - PLAYER_SPEED, 0));
      } else if (e.key === "ArrowRight") {
        setPlayerX((prev) =>
          Math.min(prev + PLAYER_SPEED, GAME_WIDTH - PLAYER_SIZE)
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameOver, showIntro, countdown]);

  // Score function
  const checkScore = (o) => {
    const playerBottom = GAME_HEIGHT - PLAYER_SIZE - 10;
    if (!o.scored && o.y > playerBottom) {
      o.scored = true;
      setScore((prev) => {
        const newScore = prev + 1;
        if (newScore % 10 === 0) setSpeedBoost((boost) => boost + 0.2);
        if (newScore % 20 === 0) {
          setObstacles((prevObstacles) =>
            prevObstacles.map((ob) => ({ ...ob, speed: ob.speed + 0.05 }))
          );
        }
        return newScore;
      });
    }
  };

  // Game loop
  useEffect(() => {
    if (isGameOver || showIntro || countdown !== null) return;
    const interval = setInterval(() => {
      setObstacles((prev) => {
        const newObstacles = prev.map((o) => {
          let newX = o.x;
          if (o.dx !== 0) {
            newX = o.x + o.dx;
            if (newX < 0 || newX > GAME_WIDTH - OBSTACLE_SIZE) {
              o.dx = -o.dx;
              newX = o.x + o.dx;
            }
          }
          const updated = { ...o, y: o.y + o.speed, x: newX, dx: o.dx };
          checkScore(updated);
          return updated;
        });

        const filtered = newObstacles.filter((o) => {
          if (
            !o.hit &&
            o.y + OBSTACLE_SIZE > GAME_HEIGHT - PLAYER_SIZE - 10 &&
            o.x < playerX + PLAYER_SIZE &&
            o.x + OBSTACLE_SIZE > playerX
          ) {
            o.hit = true;
            setLives((prev) => {
              if (prev - 1 <= 0) setIsGameOver(true);
              return prev - 1;
            });
            return false;
          }
          if (o.y > GAME_HEIGHT) return false;
          return true;
        });

        return filtered;
      });

      if (Math.random() < 0.025) {
        const x = Math.floor(Math.random() * (GAME_WIDTH - OBSTACLE_SIZE));
        const isMoving = Math.random() < 0.5;
        const dx = isMoving ? (Math.random() < 0.5 ? -2 : 2) : 0;
        const baseSpeed = 3 + Math.floor(Math.random() * 5);
        const speed = baseSpeed + speedBoost;

        let type = "straight";
        if (isMoving) type = "moving";
        if (speed >= 6) type = "fast";

        setObstacles((prev) => [
          ...prev,
          { x, y: TOP_LINE_HEIGHT, dx, speed, type, scored: false, hit: false },
        ]);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [playerX, isGameOver, speedBoost, showIntro, countdown]);

  // High score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("highScore", score);
    }
  }, [score, highScore]);

  // Countdown
  const startCountdown = () => {
    let count = 3;
    setShowIntro(false);
    setCountdown(count);

    const timer = setInterval(() => {
      count--;
      if (count > 0) setCountdown(count);
      else if (count === 0) setCountdown("GO!");
      else {
        clearInterval(timer);
        setCountdown(null);
      }
    }, 1000);
  };

  // Reset game
  const resetGame = () => {
    setPlayerX(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
    setObstacles([]);
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setSpeedBoost(0);
    startCountdown();
  };

  return (
    <>
      <div className="game-container" ref={gameRef}>
        {/* Intro */}
        {showIntro && (
          <div className="intro-screen">
            <h2>How to Play</h2>
            <p>1. Move left or Move right</p>
            <div className="intro-diagram">Player 🟨 | Obstacles 🟥 🟦 🟩</div>
            <p>2. Avoid obstacles and survive as long as you can!</p>
            <button onClick={startCountdown}>Start Game</button>
          </div>
        )}

        {/* Countdown */}
        {countdown !== null && (
          <div className="countdown-overlay">
            <div key={countdown} className="countdown-number">
              {countdown}
            </div>
          </div>
        )}

        {/* Game UI */}
        {!showIntro && countdown === null && (
          <>
            <div className="score">Score: {score}</div>
            <div className="high-score">Best: {highScore}</div>
            <div className="lives">
              {[1, 2, 3].map((i) => (
                <span key={i} className={`heart ${lives >= i ? "full" : "empty"}`}>
                  ♥
                </span>
              ))}
            </div>

            <div
              className="top-line"
              style={{
                position: "absolute",
                top: TOP_LINE_HEIGHT - 5,
                left: 0,
                width: "100%",
                height: "2px",
                backgroundColor: "#fff",
                zIndex: 500,
              }}
            ></div>

            <div className="bottom-line"></div>
            <div className="player" style={{ left: playerX, bottom: 10 }}></div>
            {obstacles.map((o, i) => (
              <div
                key={i}
                className={`obstacle ${o.type}`}
                style={{ left: o.x, top: o.y }}
              ></div>
            ))}

            {isGameOver && (
              <div className="game-over">
                <h2>Game Over</h2>
                <button onClick={resetGame}>Play Again</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Buttons Below Game */}
      {isMobile && !showIntro && countdown === null && !isGameOver && (
        <div
          className="mobile-controls"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            marginTop: 15,
          }}
        >
          <button
            className="mobile-btn"
            onClick={() =>
              setPlayerX((prev) => Math.max(prev - PLAYER_SPEED, 0))
            }
          >
            <ArrowLeft size={32} />
          </button>
          <button
            className="mobile-btn"
            onClick={() =>
              setPlayerX((prev) =>
                Math.min(prev + PLAYER_SPEED, GAME_WIDTH - PLAYER_SIZE)
              )
            }
          >
            <ArrowRight size={32} />
          </button>
        </div>
      )}
    </>
  );
}
