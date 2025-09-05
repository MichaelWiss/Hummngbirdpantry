import React from 'react'

interface CameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement>
}

export const CameraViewport: React.FC<CameraViewportProps> = ({ videoRef }) => (
  <div className="relative aspect-square bg-neutral-900">
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      playsInline
      muted
      autoPlay
    />
  </div>
)

export default CameraViewport
