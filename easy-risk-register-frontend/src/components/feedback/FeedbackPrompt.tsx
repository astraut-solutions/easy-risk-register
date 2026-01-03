import { useMemo, useState } from 'react'

import { Button, Textarea } from '../../design-system'
import { cn } from '../../utils/cn'

const RATING_OPTIONS = [
  { value: 1, emoji: '😕', label: 'Confusing' },
  { value: 2, emoji: '😐', label: 'Needs context' },
  { value: 3, emoji: '🙂', label: 'Mostly clear' },
  { value: 4, emoji: '😊', label: 'Clear & confident' },
  { value: 5, emoji: '🤩', label: 'Extremely clear' },
] as const

type RatingValue = (typeof RATING_OPTIONS)[number]['value']

type FeedbackPromptProps = {
  triggerLabel?: string
  onClose: () => void
  onSubmit: (payload: { rating: RatingValue; notes: string; subscribed: boolean }) => void
  onSubscribeChange: (subscribed: boolean) => void
}

export const FeedbackPrompt = ({
  triggerLabel,
  onClose,
  onSubmit,
  onSubscribeChange,
}: FeedbackPromptProps) => {
  const [rating, setRating] = useState<RatingValue | null>(null)
  const [notes, setNotes] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const helperText = useMemo(() => {
    if (!rating) return 'Tap an emoji to rate how clear that experience felt.'
    const option = RATING_OPTIONS.find((entry) => entry.value === rating)
    return option ? `You selected ${option.value} – ${option.label}` : 'Thanks for sharing!'
  }, [rating])

  const handleSubscribeToggle = () => {
    const next = !subscribed
    setSubscribed(next)
    onSubscribeChange(next)
  }

  const handleSubmit = () => {
    if (rating === null) return
    onSubmit({ rating, notes: notes.trim(), subscribed })
  }

  return (
    <div className="rr-panel space-y-4 rounded-2xl border border-border-faint bg-surface-secondary/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text-high">Share a quick usability note</p>
        <p className="text-xs text-text-low">
          {triggerLabel ? (
            <>How clear was that {triggerLabel}? Share a score and an optional note.</>
          ) : (
            <>How clear was that experience? Share a score and an optional note.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              'flex h-16 flex-col items-center justify-center rounded-2xl border p-1 text-xs transition-colors',
              rating === option.value
                ? 'border-brand-primary bg-brand-primary-light/40 text-brand-primary'
                : 'border-border-faint bg-surface-primary/60 text-text-low hover:border-border-subtle hover:text-text-high',
            )}
            aria-pressed={rating === option.value}
            aria-label={`${option.label} (${option.value})`}
            onClick={() => setRating(option.value)}
          >
            <span className="text-2xl" aria-hidden="true">
              {option.emoji}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-current">{option.value}</span>
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-text-low" role="status" aria-live="polite">
        {helperText}
      </p>

      <Textarea
        label="What could we improve?"
        helperText="Optional—no need to write a paragraph."
        placeholder="Let us know what felt unclear or what you expected to see."
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={500}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-low">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border-faint text-brand-primary focus:ring-2 focus:ring-brand-primary/50"
            checked={subscribed}
            onChange={handleSubscribeToggle}
          />
          Keep me posted if we follow up on this study
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Not now
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={handleSubmit} disabled={rating === null}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FeedbackPrompt
