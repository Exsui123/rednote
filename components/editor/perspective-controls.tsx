"use client"

import { useState, useCallback } from "react"
import { PerspectiveTransform, Point } from "@/lib/types"

interface PerspectiveControlsProps {
  transform: PerspectiveTransform
  zoom: number
  onChange: (transform: PerspectiveTransform) => void
}

type ControlPoint = keyof PerspectiveTransform

export function PerspectiveControls({ transform, zoom, onChange }: PerspectiveControlsProps) {
  const [draggingPoint, setDraggingPoint] = useState<ControlPoint | null>(null)

  const handleMouseDown = useCallback((point: ControlPoint) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingPoint(point)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingPoint) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    onChange({
      ...transform,
      [draggingPoint]: { x, y }
    })
  }, [draggingPoint, transform, onChange, zoom])

  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null)
  }, [])

  const renderControlPoint = (point: ControlPoint) => {
    const position = transform[point]
    return (
      <div
        key={point}
        className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-primary border-2 border-white rounded-full cursor-move hover:scale-125 transition-transform"
        style={{
          left: position.x,
          top: position.y,
        }}
        onMouseDown={handleMouseDown(point)}
      />
    )
  }

  // 绘制连线
  const renderLines = () => {
    const points = [
      transform.topLeft,
      transform.topRight,
      transform.bottomRight,
      transform.bottomLeft,
      transform.topLeft // 闭合
    ]

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <path
          d={pathData}
          fill="none"
          stroke="rgb(var(--primary))"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </svg>
    )
  }

  return (
    <div
      className="absolute inset-0"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {renderLines()}
      {renderControlPoint('topLeft')}
      {renderControlPoint('topRight')}
      {renderControlPoint('bottomLeft')}
      {renderControlPoint('bottomRight')}
    </div>
  )
}