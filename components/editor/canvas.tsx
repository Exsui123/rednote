"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { EditorState, Point, PerspectiveTransform } from "@/lib/types"
import { PerspectiveControls } from "./perspective-controls"
import { drawPerspectiveImage } from "@/lib/utils/perspective"
import { useImageLoader } from "@/lib/hooks/use-image-loader"

interface CanvasProps {
  editorState: EditorState
  onStateChange: (state: EditorState) => void
}

export function Canvas({ editorState, onStateChange }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isMovingImage, setIsMovingImage] = useState(false)
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })

  // Get current image and use shared transform
  const currentReplaceImage = editorState.replaceImages[editorState.currentReplaceIndex]
  const currentTransform = editorState.sharedTransform

  // Load images with caching
  const loadedImages = useImageLoader(
    editorState.backgroundImage?.url,
    currentReplaceImage?.url
  )

  // Initialize shared perspective transform for new images
  useEffect(() => {
    if (currentReplaceImage && !editorState.sharedTransform && loadedImages.replace) {
      const img = loadedImages.replace
      const transform: PerspectiveTransform = {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 100 + img.width * 0.5, y: 100 },
        bottomLeft: { x: 100, y: 100 + img.height * 0.5 },
        bottomRight: { x: 100 + img.width * 0.5, y: 100 + img.height * 0.5 }
      }
      
      // Update the shared transform
      onStateChange({
        ...editorState,
        sharedTransform: transform
      })
    }
  }, [currentReplaceImage?.id, loadedImages.replace, editorState.sharedTransform])

  // Update shared transform (affects all images)
  const updateSharedTransform = useCallback((transform: PerspectiveTransform) => {
    onStateChange({
      ...editorState,
      sharedTransform: transform
    })
  }, [editorState, onStateChange])

  // Draw canvas content
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    if (loadedImages.background) {
      ctx.drawImage(loadedImages.background, 0, 0, canvas.width, canvas.height)
    }

    // Draw replace image with perspective transform
    if (loadedImages.replace && currentTransform) {
      drawPerspectiveImage(ctx, loadedImages.replace, currentTransform)
    }
  }, [loadedImages, currentTransform])

  // Redraw when images or transform changes
  useEffect(() => {
    draw()
  }, [draw])

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = editorState.canvasSize.width
    canvas.height = editorState.canvasSize.height
    draw()
  }, [editorState.canvasSize, draw])

  // Center canvas on mount and zoom change
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const containerRect = container.getBoundingClientRect()
    const canvasWidth = editorState.canvasSize.width * editorState.zoom
    const canvasHeight = editorState.canvasSize.height * editorState.zoom

    setCanvasOffset({
      x: (containerRect.width - canvasWidth) / 2,
      y: (containerRect.height - canvasHeight) / 2
    })
  }, [editorState.canvasSize, editorState.zoom])

  // Check if click is on the replace image
  const isPointInImage = useCallback((point: Point): boolean => {
    if (!currentTransform) return false

    const { x, y } = point

    // Simple bounding box check (can be improved with proper point-in-polygon)
    const minX = Math.min(currentTransform.topLeft.x, currentTransform.topRight.x, currentTransform.bottomLeft.x, currentTransform.bottomRight.x)
    const maxX = Math.max(currentTransform.topLeft.x, currentTransform.topRight.x, currentTransform.bottomLeft.x, currentTransform.bottomRight.x)
    const minY = Math.min(currentTransform.topLeft.y, currentTransform.topRight.y, currentTransform.bottomLeft.y, currentTransform.bottomRight.y)
    const maxY = Math.max(currentTransform.topLeft.y, currentTransform.topRight.y, currentTransform.bottomLeft.y, currentTransform.bottomRight.y)

    return x >= minX && x <= maxX && y >= minY && y <= maxY
  }, [currentTransform])

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / editorState.zoom
    const y = (e.clientY - rect.top) / editorState.zoom

    // Check if clicking on the image
    if (e.button === 0 && !e.ctrlKey && isPointInImage({ x, y })) {
      setIsMovingImage(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
    // Canvas pan with middle mouse or Ctrl+left click
    else if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsDragging(true)
    }
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMovingImage && currentTransform) {
      const deltaX = (e.clientX - dragStart.x) / editorState.zoom
      const deltaY = (e.clientY - dragStart.y) / editorState.zoom

      const newTransform: PerspectiveTransform = {
        topLeft: {
          x: currentTransform.topLeft.x + deltaX,
          y: currentTransform.topLeft.y + deltaY
        },
        topRight: {
          x: currentTransform.topRight.x + deltaX,
          y: currentTransform.topRight.y + deltaY
        },
        bottomLeft: {
          x: currentTransform.bottomLeft.x + deltaX,
          y: currentTransform.bottomLeft.y + deltaY
        },
        bottomRight: {
          x: currentTransform.bottomRight.x + deltaX,
          y: currentTransform.bottomRight.y + deltaY
        }
      }

      updateSharedTransform(newTransform)
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (isDragging) {
      setCanvasOffset({
        x: canvasOffset.x + e.movementX,
        y: canvasOffset.y + e.movementY
      })
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false)
    setIsMovingImage(false)
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: isDragging ? 'move' : isMovingImage ? 'grabbing' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${editorState.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute'
        }}
      >
        <canvas
          ref={canvasRef}
          className="bg-white shadow-lg"
          style={{
            width: editorState.canvasSize.width,
            height: editorState.canvasSize.height,
            cursor: 'grab'
          }}
        />
        
        {currentTransform && currentReplaceImage && (
          <PerspectiveControls
            transform={currentTransform}
            zoom={editorState.zoom}
            onChange={updateSharedTransform}
          />
        )}
      </div>
    </div>
  )
}