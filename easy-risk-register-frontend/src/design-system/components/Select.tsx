import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import { cn } from '../../utils/cn'
import { Tooltip } from './Tooltip'

type Option = { value: string; label: string }

export interface SelectProps {
  label?: string
  labelVisibility?: 'visible' | 'sr-only'
  error?: string
  helperText?: string
  tooltip?: string
  options: Option[]
  className?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  name?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

export const Select = ({
  className,
  label,
  labelVisibility = 'visible',
  error,
  helperText,
  tooltip,
  options,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  placeholder = 'Select an option',
  disabled = false,
  required,
  id,
}: SelectProps) => {
  const hasError = Boolean(error)
  const listboxId = useId()
  const generatedId = useId()
  const selectId = id ?? name ?? generatedId
  const helperId = helperText ? `${selectId}-helper` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const containerRef = useRef<HTMLDivElement>(null)

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(
    () => value ?? defaultValue ?? '',
  )
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const selectedValue = isControlled ? value ?? '' : internalValue

  const selectedOption = useMemo(
    () => options.find(option => option.value === selectedValue),
    [options, selectedValue],
  )

  useEffect(() => {
    if (isControlled) {
      setInternalValue(value ?? '')
    }
  }, [isControlled, value])

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalValue(defaultValue)
    }
  }, [defaultValue, isControlled])

  useEffect(() => {
    const index = Math.max(
      options.findIndex(option => option.value === selectedValue),
      0,
    )
    setHighlightedIndex(index)
  }, [options, selectedValue])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        onBlur?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, onBlur])

  const commitSelection = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
    setIsOpen(false)
    onBlur?.()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || !options.length) {
      return
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(index => (index + 1) % options.length)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(index =>
          index - 1 < 0 ? options.length - 1 : index - 1,
        )
        break
      }
      case 'Home': {
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
        break
      }
      case 'End': {
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(Math.max(options.length - 1, 0))
        break
      }
      case 'Enter':
      case ' ': {
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          const option = options[highlightedIndex]
          if (option) {
            commitSelection(option.value)
          }
        }
        break
      }
      case 'Escape': {
        if (isOpen) {
          event.preventDefault()
          setIsOpen(false)
          onBlur?.()
        }
        break
      }
      default:
        break
    }
  }

  const dropdownId = `${listboxId}-options`
  const activeDescendantId = options.length
    ? `${dropdownId}-${highlightedIndex}`
    : undefined

  return (
    <div className="w-full" ref={containerRef}>
      {label ? (
        <div
          className={cn(
            'mb-2 flex items-center gap-2',
            labelVisibility === 'sr-only' && 'sr-only',
          )}
        >
          <label className="text-sm font-medium text-text-high" htmlFor={selectId}>
            {label}
          </label>
          {labelVisibility !== 'sr-only' && tooltip ? (
            <Tooltip content={tooltip} ariaLabel={`Help: ${label}`} />
          ) : null}
        </div>
      ) : null}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          required={required}
          disabled={disabled}
        />
      )}
      <div className="relative">
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-[20px] border border-border-faint bg-surface-secondary/10 px-4 py-2.5 text-left text-sm text-text-high transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-status-danger focus-visible:ring-status-danger/20',
            className,
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={dropdownId}
          aria-invalid={hasError}
          aria-describedby={[helperId, errorId].filter(Boolean).join(' ') || undefined}
          onClick={() => {
            if (!disabled) {
              setIsOpen(prev => !prev)
            }
          }}
          onKeyDown={handleKeyDown}
        >
          <span className={cn('truncate', !selectedOption && 'text-text-low')}>
            {selectedOption?.label ?? placeholder}
          </span>
          <svg
            className={cn(
              'ml-3 h-4 w-4 flex-shrink-0 text-text-low transition-transform',
              isOpen && 'rotate-180',
            )}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute left-0 right-0 z-30 mt-2 origin-top rounded-[18px] border border-border-faint/80 bg-surface-primary shadow-[0_20px_40px_rgba(15,23,42,0.14)]">
            <ul
              id={dropdownId}
              role="listbox"
              aria-activedescendant={activeDescendantId}
              className="max-h-60 overflow-y-auto py-1 text-sm"
            >
              {options.map((option, index) => {
                const isSelected = option.value === selectedValue
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    id={`${dropdownId}-${index}`}
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'flex cursor-pointer items-center justify-between px-4 py-2',
                      isHighlighted && 'bg-brand-primary/10 text-brand-primary',
                      isSelected && 'font-medium text-brand-primary',
                    )}
                    onMouseDown={event => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => commitSelection(option.value)}
                  >
                    {option.label}
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-brand-primary"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          d="M5 10l3 3 7-7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </li>
                )
              })}
              {!options.length && (
                <li className="px-4 py-2 text-text-low">No options</li>
              )}
            </ul>
          </div>
        )}
      </div>
      {helperText && !hasError && (
        <p id={helperId} className="mt-2 text-sm text-text-low">{helperText}</p>
      )}
      {error && <p id={errorId} className="mt-2 text-sm text-status-danger">{error}</p>}
    </div>
  )
}

Select.displayName = 'Select'

export default Select
