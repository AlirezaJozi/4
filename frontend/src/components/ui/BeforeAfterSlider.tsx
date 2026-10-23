import { useState } from 'react'
import type { CSSProperties } from 'react'
import { SmartImage } from './SmartImage'

interface BeforeAfterSliderProps {
  beforeImage: string | null | undefined
  afterImage: string | null | undefined
  alt: string
}

export function BeforeAfterSlider({ beforeImage, afterImage, alt }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const style = { '--ba-position': `${position}%` } as CSSProperties

  return (
    <div className="ba-slider" style={style}>
      <SmartImage
        src={beforeImage}
        alt={`${alt} — قبل`}
        className="ba-before"
        placeholder="تصویر قبل در دسترس نیست"
      />
      <SmartImage
        src={afterImage}
        alt={`${alt} — بعد`}
        className="ba-after"
        placeholder="تصویر بعد در دسترس نیست"
      />
      <span className="ba-label ba-label-before">قبل</span>
      <span className="ba-label ba-label-after">بعد</span>
      <span className="ba-divider" aria-hidden="true" />
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="مقایسه تصویر قبل و بعد"
      />
    </div>
  )
}
