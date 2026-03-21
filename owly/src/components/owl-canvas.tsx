"use client"

import { useEffect, useRef, useState } from "react"
import { smoothNoise } from "@/lib/noise"

const CONFIG = {
  halftoneSize: 6,
  contrast: 1.4,
  accentColor: "#00fff5",
  mouseRadius: 80,
  repulsionStrength: 8,
  returnSpeed: 3,
  accentProbability: 0.15,
  sizeVariation: 0.3,
}

interface DotData {
  x: number
  y: number
  baseX: number
  baseY: number
  baseSize: number
  brightness: number
  isAccent: boolean
  sizeMultiplier: number
  twinklePhase: number
  twinkleSpeed: number
  vx: number
  vy: number
}

interface TrailPoint {
  x: number
  y: number
  timestamp: number
  strength: number
}

export function OwlCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<DotData[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 })
  const animationFrameRef = useRef<number>(0)
  const isFirstMoveRef = useRef(true)
  const lastMoveTimeRef = useRef(0)
  const mouseTrailRef = useRef<TrailPoint[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = "/owl.jpg"
    img.onload = () => {
      initCanvas(img)
      setLoaded(true)
    }

    function initCanvas(image: HTMLImageElement) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      const MAX_WIDTH = 480
      const MAX_HEIGHT = 480

      const scaleX = MAX_WIDTH / image.width
      const scaleY = MAX_HEIGHT / image.height
      const scale = Math.min(1, scaleX, scaleY)

      const dpr = window.devicePixelRatio || 1
      const displayWidth = image.width * scale
      const displayHeight = image.height * scale

      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      ctx.scale(dpr, dpr)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(image, 0, 0, displayWidth, displayHeight)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, ((data[i] / 255 - 0.5) * CONFIG.contrast + 0.5) * 255))
        data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] / 255 - 0.5) * CONFIG.contrast + 0.5) * 255))
        data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] / 255 - 0.5) * CONFIG.contrast + 0.5) * 255))
      }

      const dots: DotData[] = []
      const adjustedHalftoneSize = Math.max(2, CONFIG.halftoneSize * scale)

      for (let y = 0; y < displayHeight; y += adjustedHalftoneSize) {
        for (let x = 0; x < displayWidth; x += adjustedHalftoneSize) {
          const sampleX = Math.floor(x * dpr)
          const sampleY = Math.floor(y * dpr)
          const i = (sampleY * canvas.width + sampleX) * 4
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
          const dotSize = (brightness / 255) * adjustedHalftoneSize * 0.9

          if (dotSize > 0.5) {
            const centerX = x + adjustedHalftoneSize / 2
            const centerY = y + adjustedHalftoneSize / 2

            dots.push({
              x: centerX,
              y: centerY,
              baseX: centerX,
              baseY: centerY,
              baseSize: dotSize,
              brightness,
              isAccent: Math.random() < CONFIG.accentProbability && brightness > 150,
              sizeMultiplier: 1 + (Math.random() - 0.5) * CONFIG.sizeVariation,
              twinklePhase: Math.random() * Math.PI * 2,
              twinkleSpeed: 0.02 + Math.random() * 0.03,
              vx: 0,
              vy: 0,
            })
          }
        }
      }

      dotsRef.current = dots

      const animate = () => {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, displayWidth, displayHeight)

        const timeSinceLastMove = Date.now() - lastMoveTimeRef.current
        const isMouseMoving = timeSinceLastMove < 100
        if (!isMouseMoving) mouseTrailRef.current = []

        const time = Date.now() * 0.001

        dots.forEach((dot) => {
          let maxDistanceFactor = 0
          let totalForceX = 0
          let totalForceY = 0

          if (mouseTrailRef.current.length > 0) {
            mouseTrailRef.current.forEach((trailPoint) => {
              const dx = trailPoint.x - dot.x
              const dy = trailPoint.y - dot.y
              const distance = Math.sqrt(dx * dx + dy * dy)
              if (distance > CONFIG.mouseRadius * 1.5) return

              const noiseValue = smoothNoise(dot.baseX, dot.baseY, 0.02, time)
              const irregularRadius = CONFIG.mouseRadius * (0.7 + noiseValue * 0.6)

              if (distance < irregularRadius) {
                const distanceFactor = 1 - distance / irregularRadius
                const smoothFactor = distanceFactor * distanceFactor * (3 - 2 * distanceFactor)
                maxDistanceFactor = Math.max(maxDistanceFactor, smoothFactor)

                if (distance > 0.1) {
                  const force = CONFIG.repulsionStrength * smoothFactor * trailPoint.strength * 0.5
                  totalForceX -= (dx / distance) * force
                  totalForceY -= (dy / distance) * force
                }
              }
            })
          }

          if (mouseRef.current.x > 0) {
            const dx = mouseRef.current.x - dot.x
            const dy = mouseRef.current.y - dot.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const noiseValue = smoothNoise(dot.baseX, dot.baseY, 0.02, time)
            const irregularRadius = CONFIG.mouseRadius * (0.7 + noiseValue * 0.6)

            if (distance < irregularRadius) {
              const distanceFactor = 1 - distance / irregularRadius
              const smoothFactor = distanceFactor * distanceFactor * (3 - 2 * distanceFactor)
              maxDistanceFactor = Math.max(maxDistanceFactor, smoothFactor)
            }
          }

          dot.vx += totalForceX
          dot.vy += totalForceY
          dot.vx += (dot.baseX - dot.x) * CONFIG.returnSpeed * 0.1
          dot.vy += (dot.baseY - dot.y) * CONFIG.returnSpeed * 0.1
          dot.vx *= 0.85
          dot.vy *= 0.85
          dot.x += dot.vx
          dot.y += dot.vy

          const currentSize = dot.baseSize * dot.sizeMultiplier
          let opacity = 1

          if (maxDistanceFactor > 0) {
            dot.twinklePhase += dot.twinkleSpeed
            const twinkle = Math.sin(dot.twinklePhase) * 0.5 + 0.5
            const twinkleAmount = (0.3 + twinkle * 0.7) * maxDistanceFactor
            opacity = 1 - (1 - twinkleAmount) * maxDistanceFactor
          }

          ctx.globalAlpha = opacity
          ctx.fillStyle = dot.isAccent ? CONFIG.accentColor : "#ffffff"
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, currentSize / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        })

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animate()

      const onMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const newX = e.clientX - rect.left
        const newY = e.clientY - rect.top
        lastMoveTimeRef.current = Date.now()

        if (isFirstMoveRef.current) {
          mouseRef.current = { x: newX, y: newY, prevX: newX, prevY: newY }
          isFirstMoveRef.current = false
          return
        }

        mouseRef.current.prevX = mouseRef.current.x
        mouseRef.current.prevY = mouseRef.current.y
        mouseRef.current.x = newX
        mouseRef.current.y = newY

        const velX = newX - mouseRef.current.prevX
        const velY = newY - mouseRef.current.prevY
        const speed = Math.sqrt(velX * velX + velY * velY)
        const steps = Math.max(1, Math.ceil(speed / 10))

        for (let i = 0; i < steps; i++) {
          const t = i / steps
          mouseTrailRef.current.push({
            x: mouseRef.current.prevX + velX * t,
            y: mouseRef.current.prevY + velY * t,
            timestamp: Date.now(),
            strength: Math.min(speed / 10, 1),
          })
        }

        mouseTrailRef.current = mouseTrailRef.current.filter((p) => Date.now() - p.timestamp < 150)
      }

      canvas.addEventListener("mousemove", onMouseMove)

      return () => {
        cancelAnimationFrame(animationFrameRef.current)
        canvas.removeEventListener("mousemove", onMouseMove)
      }
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`cursor-crosshair transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
    />
  )
}
