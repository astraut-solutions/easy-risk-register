export function downloadTextFile({ filename, content, contentType }: { filename: string; content: string; contentType: string }) {
  if (typeof window === 'undefined') return

  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noreferrer'
  anchor.click()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

export function downloadJsonFile(filename: string, payload: unknown) {
  const content = JSON.stringify(payload ?? null, null, 2)
  downloadTextFile({ filename, content, contentType: 'application/json' })
}

