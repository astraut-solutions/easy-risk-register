import { Button } from '../../design-system'

interface OnboardingCardProps {
  onStart: () => void
  onDismiss: () => void
}

export const OnboardingCard = ({ onStart, onDismiss }: OnboardingCardProps) => {
  return (
    <div className="rr-panel border border-brand-primary/20 bg-brand-primary-light/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-low">
            Getting started
          </p>
          <h3 className="mt-2 text-lg font-semibold text-text-high">
            First 3 steps to a clean risk register
          </h3>
          <ol className="mt-3 list-decimal pl-5 text-sm text-text-low">
            <li>Start a new risk and pick a cyber template (optional).</li>
            <li>Confirm likelihood/impact and assign an owner and due date.</li>
            <li>Attach the privacy incident checklist when relevant.</li>
          </ol>
          <p className="mt-3 text-xs text-text-low">
            Tip: Exports are local-only. Use the PDF export button, then select “Save as PDF” in your browser print dialog.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onStart} aria-label="Start creating a risk">
            Create a risk
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss onboarding tips">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingCard

