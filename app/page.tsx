"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RotateCcw, Trophy, Skull, HelpCircle, X } from "lucide-react"

interface GameCard {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

interface GameResult {
  won: boolean
  points: number
}

const CARD_EMOJIS = ["🍜", "🍱", "🎌", "🎎", "🍙", "🌸", "⛩️", "🏮"]

export default function MemoryGame() {
  const [cards, setCards] = useState<GameCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [moves, setMoves] = useState(0)
  const [wrongMatches, setWrongMatches] = useState(0)
  const [points, setPoints] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [scoreHistory, setScoreHistory] = useState<number[]>([])
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [showRules, setShowRules] = useState(false)
  const [winMessage, setWinMessage] = useState("")
  const [loseMessage, setLoseMessage] = useState("")

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem("memoryGameHighScore")
    const savedHistory = localStorage.getItem("memoryGameHistory")
    const savedResults = localStorage.getItem("memoryGameResults")

    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
    if (savedHistory) {
      setScoreHistory(JSON.parse(savedHistory))
    }
    if (savedResults) {
      setGameResults(JSON.parse(savedResults))
    }
  }, [])

  // Initialize game
  const initializeGame = () => {
    const gameCards: GameCard[] = []
    let id = 0

    // Create pairs of cards
    CARD_EMOJIS.forEach((emoji) => {
      gameCards.push(
        { id: id++, emoji, isFlipped: false, isMatched: false },
        { id: id++, emoji, isFlipped: false, isMatched: false },
      )
    })

    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5)

    setCards(shuffledCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setWrongMatches(0)
    setPoints(0)
    setGameWon(false)
    setGameOver(false)
    setWinMessage("")
    setLoseMessage("")
  }

  // Initialize game on component mount
  useEffect(() => {
    initializeGame()
  }, [])

  // Check for game over when points or moves change
  useEffect(() => {
    if (points <= -16 || moves > 25) {
      if (!gameOver) {
        setGameOver(true)
      }
    }
  }, [points, moves, gameOver])

  // Get consecutive results message
  const getConsecutiveMessage = (won: boolean, results: GameResult[]) => {
    if (won) {
      const consecutiveWins = getConsecutiveCount(results, true)
      if (consecutiveWins > 1) {
        return "Good Now Do Something Productive"
      }
      return "Good Job Chigga!"
    } else {
      const consecutiveLosses = getConsecutiveCount(results, false)
      if (consecutiveLosses >= 3) {
        return "Even Monkeys Play better than you"
      } else if (consecutiveLosses >= 2) {
        return "Get Back to School"
      }
      return "WASTED"
    }
  }

  const getConsecutiveCount = (results: GameResult[], won: boolean) => {
    let count = 0
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].won === won) {
        count++
      } else {
        break
      }
    }
    return count + 1 // +1 for current game
  }

  // Handle game completion or game over
  const handleGameEnd = (finalPoints: number, won: boolean) => {
    // Update score history
    const newHistory = [finalPoints, ...scoreHistory].slice(0, 5)
    setScoreHistory(newHistory)
    localStorage.setItem("memoryGameHistory", JSON.stringify(newHistory))

    // Update game results
    const newResult: GameResult = { won, points: finalPoints }
    const newResults = [newResult, ...gameResults].slice(0, 10)
    setGameResults(newResults)
    localStorage.setItem("memoryGameResults", JSON.stringify(newResults))

    // Set appropriate message
    const message = getConsecutiveMessage(won, gameResults)
    if (won) {
      setWinMessage(message)
    } else {
      setLoseMessage(message)
    }

    // Update high score if beaten
    if (finalPoints > highScore) {
      setHighScore(finalPoints)
      localStorage.setItem("memoryGameHighScore", finalPoints.toString())
    }
  }

  // Handle card click
  const handleCardClick = (cardId: number) => {
    // Prevent clicking if game is over or card is already flipped, matched, or two cards are already flipped
    const card = cards.find((c) => c.id === cardId)
    if (gameOver || gameWon || !card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return
    }

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Flip the card
    setCards((prevCards) => prevCards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))

    // Check for match when two cards are flipped
    if (newFlippedCards.length === 2) {
      const newMoves = moves + 1
      setMoves(newMoves)

      const [firstCardId, secondCardId] = newFlippedCards
      const firstCard = cards.find((c) => c.id === firstCardId)
      const secondCard = cards.find((c) => c.id === secondCardId)

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found - add 5 points
        const newPoints = points + 5

        setPoints(newPoints)

        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((c) => (c.id === firstCardId || c.id === secondCardId ? { ...c, isMatched: true } : c)),
          )
          setMatchedPairs((prev) => {
            const newMatchedPairs = prev + 1
            // Check if game is won
            if (newMatchedPairs === CARD_EMOJIS.length) {
              setGameWon(true)
              handleGameEnd(newPoints, true)
            }
            return newMatchedPairs
          })
          setFlippedCards([])
        }, 500)
      } else {
        // No match - subtract 2 points and increment wrong matches
        const newPoints = points - 2
        const newWrongMatches = wrongMatches + 1
        setPoints(newPoints)
        setWrongMatches(newWrongMatches)

        // Check if game over after wrong match or too many moves
        if (newPoints <= -16 || newMoves > 25) {
          setTimeout(() => {
            setGameOver(true)
            handleGameEnd(newPoints, false)
          }, 1000)
        }

        // Flip cards back after delay
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((c) => (c.id === firstCardId || c.id === secondCardId ? { ...c, isFlipped: false } : c)),
          )
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const currentHighScore = Math.max(highScore, ...scoreHistory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-orange-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Memory Game <span className="text-yellow-300">AV</span>
          </h1>
          <p className="text-gray-300">Find all matching pairs by flipping two cards at a time</p>
        </div>

        <div className="flex gap-8 justify-center">
          {/* High Score Box - Left Side */}
          <div className="w-48">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <h3 className="text-white font-semibold mb-2">High Score</h3>
                <div className="text-3xl font-bold text-yellow-300">{currentHighScore}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Game Area */}
          <div className="flex-1 max-w-2xl">
            {/* Game Stats */}
            <div className="flex justify-center items-center gap-6 mb-8">
              <div className="text-center">
                <div className={`text-2xl font-bold ${moves > 20 ? "text-red-300" : "text-white"}`}>{25 - moves}</div>
                <div className="text-sm text-gray-300">Remaining Moves</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {moves - wrongMatches} / {wrongMatches}
                </div>
                <div className="text-sm text-gray-300">Luck</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {matchedPairs}/{CARD_EMOJIS.length}
                </div>
                <div className="text-sm text-gray-300">Pairs Found</div>
              </div>
              <Button
                onClick={initializeGame}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <RotateCcw className="w-4 h-4" />
                New Game
              </Button>
            </div>

            {/* Game Won Message */}
            {gameWon && winMessage && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full animate-pulse-grow">
                  <Trophy className="w-5 h-5" />
                  <span className="font-semibold">{winMessage}</span>
                </div>
              </div>
            )}

            {/* Game Over Message */}
            {gameOver && loseMessage && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-6 py-3 rounded-full animate-pulse-grow">
                  <Skull className="w-5 h-5" />
                  <span className="font-semibold">{loseMessage}</span>
                </div>
              </div>
            )}

            {/* Game Board */}
            <div className="grid grid-cols-4 gap-4">
              {cards.map((card) => (
                <Card
                  key={card.id}
                  className={`aspect-square cursor-pointer transition-all duration-300 hover:scale-105 ${
                    card.isMatched ? "ring-2 ring-green-400" : ""
                  } ${gameOver || gameWon ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <CardContent className="p-0 h-full flex items-center justify-center">
                    <div
                      className={`w-full h-full flex items-center justify-center text-6xl font-bold transition-all duration-500 ${
                        card.isFlipped || card.isMatched
                          ? "bg-white text-gray-800"
                          : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                      }`}
                    >
                      {card.isFlipped || card.isMatched ? card.emoji : <div className="text-4xl">?</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Instructions */}
            <div className="text-center mt-8 text-gray-300 max-w-md mx-auto">
              <p className="text-sm">
                +5 points for correct matches, -2 points for wrong matches. Game over at -16 points or 25+ moves!
              </p>
            </div>
          </div>

          {/* Right Side - Score History and Rules */}
          <div className="w-48 space-y-4">
            {/* Rules Button */}
            <Button
              onClick={() => setShowRules(true)}
              variant="outline"
              className="w-full flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <HelpCircle className="w-4 h-4" />
              Rules
            </Button>

            {/* Score History */}
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-3 text-center">Recent Scores</h3>
                <div className="space-y-2">
                  {scoreHistory.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center">No games played yet</div>
                  ) : (
                    scoreHistory.map((score, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center py-1 px-2 rounded ${
                          score === currentHighScore && score > 0
                            ? "font-bold text-yellow-300 bg-white/10"
                            : "text-white"
                        }`}
                      >
                        <span className="text-sm text-gray-600">{index + 1}.</span>
                        <span>{score}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white max-w-md w-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Game Rules</h2>
                  <Button onClick={() => setShowRules(false)} variant="ghost" size="sm" className="p-1">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>Objective:</strong> Find all matching pairs of anime stickers
                  </p>
                  <p>
                    <strong>How to Play:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Click cards to flip them over</li>
                    <li>Only 2 cards can be flipped at a time</li>
                    <li>Find matching pairs to keep them revealed</li>
                    <li>Complete all pairs to win</li>
                  </ul>
                  <p>
                    <strong>Scoring:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>+5 points for correct matches</li>
                    <li>-2 points for wrong matches</li>
                  </ul>
                  <p>
                    <strong>Lose Conditions:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Points reach -16 or below</li>
                    <li>More than 25 moves used</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-grow {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-pulse-grow {
          animation: pulse-grow 2.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
