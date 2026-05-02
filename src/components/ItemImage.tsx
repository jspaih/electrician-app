import { useEffect, useState } from 'react'
import { resolveImageSrc, isImageRef } from '../services/imageService'

interface Props {
  /** Storage value: legacy base64 dataUrl OR new "img://local/..." ref. */
  src?:       string
  alt?:       string
  className?: string
  onClick?:   () => void
}

/**
 * Renders an image regardless of whether it's stored as inline base64
 * (legacy) or as an IndexedDB ref string (new). Async-resolves refs
 * once and caches the result for the lifetime of the component.
 */
export function ItemImage({ src, alt = '', className, onClick }: Props) {
  const [resolved, setResolved] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    if (!src) {
      setResolved('')
      return
    }
    if (isImageRef(src)) {
      resolveImageSrc(src).then(url => {
        if (!cancelled) setResolved(url)
      })
    } else {
      setResolved(src)
    }
    return () => { cancelled = true }
  }, [src])

  if (!resolved) return null
  return <img src={resolved} alt={alt} className={className} onClick={onClick} />
}
