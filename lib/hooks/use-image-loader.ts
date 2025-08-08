import { useEffect, useRef, useState } from "react"

export interface LoadedImages {
  background?: HTMLImageElement
  replace?: HTMLImageElement
}

export function useImageLoader(
  backgroundUrl?: string,
  replaceUrl?: string
): LoadedImages {
  const [loadedImages, setLoadedImages] = useState<LoadedImages>({})
  const imageCache = useRef(new Map<string, HTMLImageElement>())

  useEffect(() => {
    let mounted = true

    const loadImage = async (url: string): Promise<HTMLImageElement | undefined> => {
      if (!url) return undefined

      // Check cache first
      if (imageCache.current.has(url)) {
        return imageCache.current.get(url)!
      }

      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          if (mounted) {
            imageCache.current.set(url, img)
            resolve(img)
          }
        }
        img.onerror = () => {
          console.error(`Failed to load image: ${url}`)
          resolve(undefined)
        }
        img.src = url
      })
    }

    const loadImages = async () => {
      const [background, replace] = await Promise.all([
        backgroundUrl ? loadImage(backgroundUrl) : Promise.resolve(undefined),
        replaceUrl ? loadImage(replaceUrl) : Promise.resolve(undefined)
      ])

      if (mounted) {
        setLoadedImages({ background, replace })
      }
    }

    loadImages()

    return () => {
      mounted = false
    }
  }, [backgroundUrl, replaceUrl])

  return loadedImages
}