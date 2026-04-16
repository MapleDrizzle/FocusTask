type Props = {
  totalSeconds: number
}

export default function TimerDisplay({ totalSeconds }: Props) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return (
    <p aria-live="polite" className="time-display">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </p>
  )
}