"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { RefObject } from "react"

// --- TYPES ---
interface Vector {
  x: number
  y: number
}
interface Character {
  id: number
  name: string
  initials: string
  color: string
  position: Vector
  velocity: Vector
  radius: number
  isAlive: boolean
  kills: number
  fireCooldown: number
}
interface Bullet {
  id: number
  ownerId: number
  position: Vector
  velocity: Vector
  radius: number
  lifetime: number
}
interface GameSettings {
  characterNames: string[]
  enableSfx: boolean
  enableHaptics: boolean
}
type GameStatus = "setup" | "countdown" | "playing" | "finished"
interface GameState {
  characters: Character[]
  bullets: Bullet[]
  arena: {
    type: "circle" // Always a circle from the start
    width: number // Canvas width
    height: number // Canvas height
    centerX: number
    centerY: number
    radius: number // Current radius of the circle
    initialRadius: number // Stores the initial radius for shrinking calculations
  }
  elapsedTime: number
}

// --- CONSTANTS ---
const CHARACTER_COLORS = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"]
const DEFAULT_NAMES = ["BlueBot", "RedRanger", "GoldGuard", "GreenGunner"]
const CHARACTER_SPEED = 110
const BULLET_SPEED = 220
const BULLET_LIFETIME = 4
const FIRE_RATE_MIN = 1.0
const FIRE_RATE_MAX = 2.0
const CHARACTER_RADIUS = 15
const BULLET_RADIUS = 4
const ARENA_SHRINK_START_TIME = 10
const ARENA_SHRINK_DURATION = 30
const FINAL_ARENA_SCALE = 0.2
const INITIAL_CIRCLE_DIAMETER_SCALE = 0.9 // 90% of smaller screen dimension
const COUNTDOWN_SECONDS = 3

// --- HELPER FUNCTIONS ---
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const randomName = () => {
  const prefixes = ["Cyber", "Robo", "Giga", "Nano", "Pixel", "Quantum"]
  const suffixes = ["Striker", "Defender", "Blaster", "Knight", "Ninja", "Mage"]
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`
}
const playSound = (type: "shoot" | "hit" | "bounce" | "win" | "start", audioCtx: AudioContext | null) => {
  if (!audioCtx) return
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)

  switch (type) {
    case "shoot":
      oscillator.type = "triangle"
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1)
      break
    case "hit":
      oscillator.type = "square"
      oscillator.frequency.setValueAtTime(220, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2)
      break
    case "bounce":
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(110, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1)
      break
    case "win":
      oscillator.type = "sawtooth"
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5)
      break
    case "start":
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime) // A4
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1)
      break
  }
  oscillator.start(audioCtx.currentTime)
  oscillator.stop(audioCtx.currentTime + 0.5)
}
const vibrate = (pattern: number | number[]) => {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      // Vibration might be disabled by user settings
    }
  }
}

export const useAutomatedBattle = (canvasRef: RefObject<HTMLCanvasElement>) => {
  const [status, setStatus] = useState<GameStatus>("setup")
  const [settings, setSettingsState] = useState<GameSettings>({
    characterNames: [...DEFAULT_NAMES],
    enableSfx: true,
    enableHaptics: true,
  })
  const [leaderboard, setLeaderboard] = useState<Pick<Character, "id" | "name" | "isAlive" | "kills">[]>([])
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [winner, setWinner] = useState<Character | Character[] | null>(null)

  const gameState = useRef<GameState | null>(null)
  const animationFrameId = useRef<number>()
  const lastTime = useRef<number>(0)
  const audioCtx = useRef<AudioContext | null>(null)
  let nextBulletId = 0

  const setSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettingsState((prev) => ({ ...prev, [key]: value }))
  }

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...settings.characterNames]
    newNames[index] = name
    setSetting("characterNames", newNames)
  }

  const randomizeNames = () => {
    setSetting("characterNames", Array.from({ length: 4 }, randomName))
  }

  const initGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const { width, height } = canvas.getBoundingClientRect()

    // Crucial check: Ensure canvas has actual dimensions before proceeding
    if (width === 0 || height === 0) {
      console.warn("Canvas has zero dimensions, deferring game initialization.")
      return false // Indicate that initialization was not completed
    }

    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    // Calculate initial circle radius based on 90% of the smaller dimension
    const initialCircleRadius = (Math.min(canvas.width, canvas.height) / 2) * INITIAL_CIRCLE_DIAMETER_SCALE

    gameState.current = {
      characters: settings.characterNames.map((name, i) => {
        const angle = randomBetween(0, 2 * Math.PI)
        return {
          id: i,
          name,
          initials: name.substring(0, 2).toUpperCase(),
          color: CHARACTER_COLORS[i], // Directly assign hex color
          position: { x: canvas.width / 2, y: canvas.height / 2 }, // Initial center position
          velocity: { x: Math.cos(angle) * CHARACTER_SPEED, y: Math.sin(angle) * CHARACTER_SPEED },
          radius: CHARACTER_RADIUS * window.devicePixelRatio,
          isAlive: true,
          kills: 0,
          fireCooldown: randomBetween(FIRE_RATE_MIN, FIRE_RATE_MAX),
        }
      }),
      bullets: [],
      arena: {
        type: "circle", // Always a circle from the start
        width: canvas.width,
        height: canvas.height,
        centerX: canvas.width / 2,
        centerY: canvas.height / 2,
        radius: initialCircleRadius, // Set current radius to initial circle radius
        initialRadius: initialCircleRadius, // Store the initial circle radius for shrinking
      },
      elapsedTime: 0,
    }

    // Initial spawn positions within the initial circle
    gameState.current.characters.forEach((char, i) => {
      const spawnRadiusLimit = gameState.current!.arena.radius * 0.6 // Spawn within 60% of the arena radius
      const angle = randomBetween(0, 2 * Math.PI)
      const distance = randomBetween(0, spawnRadiusLimit)
      char.position = {
        x: gameState.current!.arena.centerX + Math.cos(angle) * distance,
        y: gameState.current!.arena.centerY + Math.sin(angle) * distance,
      }
    })

    setLeaderboard(
      gameState.current.characters.map((c) => ({ id: c.id, name: c.name, isAlive: c.isAlive, kills: c.kills })),
    )
    setElapsedTime(0)
    setWinner(null)
    return true // Indicate that initialization was successful
  }, [canvasRef, settings.characterNames])

  const startGame = useCallback(() => {
    if (typeof window.AudioContext !== "undefined" && !audioCtx.current) {
      audioCtx.current = new AudioContext()
    }
    setStatus("countdown")
  }, [])

  const resetGame = useCallback((to: "setup" | "countdown" = "countdown") => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }
    if (to === "setup") {
      setStatus("setup")
    } else {
      setStatus("countdown")
    }
  }, [])

  const update = useCallback(
    (dt: number) => {
      if (!gameState.current) return
      const { characters, bullets, arena } = gameState.current

      // Update elapsed time and arena
      gameState.current.elapsedTime += dt

      // Arena shrinking logic (applies to the initial circle)
      if (gameState.current.elapsedTime >= ARENA_SHRINK_START_TIME) {
        const shrinkElapsedTime = gameState.current.elapsedTime - ARENA_SHRINK_START_TIME
        const shrinkProgress = Math.min(shrinkElapsedTime / ARENA_SHRINK_DURATION, 1)
        const finalRadius = arena.initialRadius * FINAL_ARENA_SCALE
        arena.radius = arena.initialRadius - (arena.initialRadius - finalRadius) * shrinkProgress
      }

      // Update characters
      characters.forEach((char) => {
        if (!char.isAlive) return

        // Movement
        char.position.x += char.velocity.x * dt
        char.position.y += char.velocity.y * dt

        // Circle boundary collision
        const dist = Math.hypot(char.position.x - arena.centerX, char.position.y - arena.centerY)
        if (dist + char.radius > arena.radius) {
          const normal = { x: (char.position.x - arena.centerX) / dist, y: (char.position.y - arena.centerY) / dist }
          const dot = char.velocity.x * normal.x + char.velocity.y * normal.y
          char.velocity.x -= 2 * dot * normal.x
          char.velocity.y -= 2 * dot * normal.y

          // Clamp position to inside the circle
          char.position.x = arena.centerX + normal.x * (arena.radius - char.radius)
          char.position.y = arena.centerY + normal.y * (arena.radius - char.radius)

          if (settings.enableSfx) playSound("bounce", audioCtx.current)
        }

        // Shooting
        char.fireCooldown -= dt
        if (char.fireCooldown <= 0) {
          char.fireCooldown = randomBetween(FIRE_RATE_MIN, FIRE_RATE_MAX)
          const angle = randomBetween(0, 2 * Math.PI)
          bullets.push({
            id: nextBulletId++,
            ownerId: char.id,
            position: { ...char.position },
            velocity: { x: Math.cos(angle) * BULLET_SPEED, y: Math.sin(angle) * BULLET_SPEED },
            radius: BULLET_RADIUS * window.devicePixelRatio,
            lifetime: BULLET_LIFETIME,
          })
          if (settings.enableSfx) playSound("shoot", audioCtx.current)
        }
      })

      // Update bullets
      gameState.current.bullets = bullets.filter((bullet) => {
        bullet.position.x += bullet.velocity.x * dt
        bullet.position.y += bullet.velocity.y * dt
        bullet.lifetime -= dt

        if (bullet.lifetime <= 0) return false

        // Bullet-circle boundary collision
        const dist = Math.hypot(bullet.position.x - arena.centerX, bullet.position.y - arena.centerY)
        if (dist > arena.radius) {
          return false
        }

        // Bullet-character collision
        for (const char of characters) {
          if (char.isAlive && char.id !== bullet.ownerId) {
            const dist = Math.hypot(bullet.position.x - char.position.x, bullet.position.y - char.position.y)
            if (dist < bullet.radius + char.radius) {
              char.isAlive = false
              const killer = characters.find((c) => c.id === bullet.ownerId)
              if (killer) killer.kills++
              if (settings.enableSfx) playSound("hit", audioCtx.current)
              if (settings.enableHaptics) vibrate(100)
              return false // Bullet is consumed
            }
          }
        }
        return true
      })

      // Check for win condition
      const aliveCharacters = characters.filter((c) => c.isAlive)
      if (aliveCharacters.length <= 1 && status === "playing") {
        let finalWinner: Character | Character[] | null = null
        if (aliveCharacters.length === 1) {
          finalWinner = aliveCharacters[0]
          if (settings.enableSfx) playSound("win", audioCtx.current)
          if (settings.enableHaptics) vibrate([200, 50, 200])
        } else {
          // Tie
          const lastDead = characters.filter((c) => !c.isAlive && c.kills > 0)
          finalWinner = lastDead.length > 1 ? lastDead : characters.filter((c) => !c.isAlive)
        }

        // Set winner and status in the same batch
        setWinner(finalWinner)
        // Use setTimeout(0) to ensure the state update for winner is processed
        // before the Dialog component in app/page.tsx attempts to render based on it.
        setTimeout(() => setStatus("finished"), 0)
      }

      // Update UI state
      setLeaderboard(characters.map((c) => ({ id: c.id, name: c.name, isAlive: c.isAlive, kills: c.kills })))
      setElapsedTime(gameState.current.elapsedTime)
    },
    [status, settings.enableSfx, settings.enableHaptics],
  )

  const draw = useCallback(() => {
    if (!canvasRef.current || !gameState.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { characters, bullets, arena } = gameState.current
    const dpr = window.devicePixelRatio

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw arena (always a circle now)
    ctx.fillStyle = "#F9FAFB" // Very light gray background
    ctx.strokeStyle = "#D1D5DB" // Lighter gray border
    ctx.lineWidth = 0.5 * dpr // 0.5px border
    ctx.beginPath()
    ctx.arc(arena.centerX, arena.centerY, arena.radius, 0, 2 * Math.PI)
    ctx.fill() // Fill the circle
    ctx.stroke() // Stroke the border

    // Draw bullets
    bullets.forEach((bullet) => {
      const owner = characters.find((c) => c.id === bullet.ownerId)
      ctx.fillStyle = owner ? owner.color : "#fff" // Use direct hex color
      ctx.beginPath()
      ctx.arc(bullet.position.x, bullet.position.y, bullet.radius, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw characters
    characters.forEach((char) => {
      if (!char.isAlive) return
      ctx.fillStyle = char.color // Use direct hex color
      ctx.beginPath()
      ctx.arc(char.position.x, char.position.y, char.radius, 0, 2 * Math.PI)
      ctx.fill()

      ctx.fillStyle = "#fff"
      ctx.font = `bold ${12 * dpr}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(char.initials, char.position.x, char.position.y)
    })
  }, [canvasRef])

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!lastTime.current) lastTime.current = timestamp
      const dt = (timestamp - lastTime.current) / 1000
      lastTime.current = timestamp

      if (status === "playing") {
        update(dt)
      }
      draw()
      animationFrameId.current = requestAnimationFrame(gameLoop)
    },
    [status, update, draw],
  )

  // Use useEffect to set up ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          // Only re-initialize if the game is not in setup mode
          // and the dimensions are valid (non-zero)
          if (status !== "setup" && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            initGame()
          }
        }
      }
    })

    resizeObserver.observe(canvas)

    return () => {
      resizeObserver.unobserve(canvas)
    }
  }, [canvasRef, status, initGame]) // Depend on status and initGame

  // useEffect for countdown timer logic
  useEffect(() => {
    if (status === "countdown") {
      // Explicitly try to initialize the game state here
      const initialized = initGame()
      if (!initialized) {
        // If not initialized (canvas dimensions not ready), re-queue the status change
        const timeoutId = setTimeout(() => setStatus("countdown"), 50)
        return () => clearTimeout(timeoutId)
      }

      let currentCount = COUNTDOWN_SECONDS
      setCountdown(currentCount)
      if (settings.enableSfx) playSound("start", audioCtx.current)
      const interval = setInterval(() => {
        currentCount--
        setCountdown(currentCount)
        if (currentCount > 0) {
          if (settings.enableSfx) playSound("start", audioCtx.current)
        }
        if (currentCount <= 0) {
          clearInterval(interval)
          setStatus("playing")
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [status, settings.enableSfx, initGame]) // Added initGame to dependencies

  // useEffect for managing the requestAnimationFrame game loop
  useEffect(() => {
    // Only start the game loop if status is not 'setup' AND gameState is confirmed initialized
    // AND the arena dimensions are valid (non-zero).
    if (
      status !== "setup" &&
      gameState.current &&
      gameState.current.arena.width > 0 &&
      gameState.current.arena.height > 0
    ) {
      lastTime.current = 0
      animationFrameId.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [status, gameLoop, gameState.current?.arena.width, gameState.current?.arena.height])

  // useEffect for setting CSS variables for character colors
  useEffect(() => {
    CHARACTER_COLORS.forEach((color, i) => {
      document.documentElement.style.setProperty(`--char-color-${i}`, color)
    })
  }, [])

  return {
    status,
    settings,
    leaderboard,
    countdown,
    elapsedTime,
    winner,
    setSetting,
    handleNameChange,
    randomizeNames,
    startGame,
    resetGame,
  }
}
