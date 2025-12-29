import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Tooltip } from '../../../src/design-system'

describe('Tooltip', () => {
  it('opens on keyboard focus and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<Tooltip content="Helpful guidance" ariaLabel="Help: Title" />)

    const trigger = screen.getByRole('button', { name: 'Help: Title' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.tab()
    expect(trigger).toHaveFocus()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful guidance')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

