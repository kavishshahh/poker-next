'use client'
import React from 'react'

export default function HiddenCard({ cardData, applyFoldedClassname }: any) {
  const { animationDelay } = cardData || {}
  return (
    <div className={`playing-card cardIn robotcard${(applyFoldedClassname ? ' folded' : '')}`} style={{ animationDelay: `${(applyFoldedClassname) ?  0 : animationDelay}ms`, padding: 8, minWidth: 36 }}>
    </div>
  )
}
