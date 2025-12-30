const DEFAULT_MAX_CSV_BYTES = 5 * 1024 * 1024
const DEFAULT_MAX_ROWS = 10000
const DEFAULT_MAX_COLUMNS = 64

const FORMULA_PREFIXES = new Set(['=', '+', '-', '@'])

function coerceString(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function escapeCsvInjection(value) {
  if (typeof value !== 'string') return value
  if (!value) return value
  if (value.startsWith("'")) return value

  const firstNonWhitespace = value.match(/[^\s]/)
  if (!firstNonWhitespace) return value

  const idx = firstNonWhitespace.index ?? 0
  const firstChar = value[idx]
  if (!FORMULA_PREFIXES.has(firstChar)) return value

  return `'${value}`
}

function quoteCsvCell(value) {
  const str = coerceString(value)
  const escaped = str.replace(/"/g, '""')

  const needsQuotes =
    escaped.includes(',') ||
    escaped.includes('\n') ||
    escaped.includes('\r') ||
    escaped.includes('"') ||
    /^\s/.test(escaped) ||
    /\s$/.test(escaped)

  return needsQuotes ? `"${escaped}"` : escaped
}

function stringifyCsv({ columns, rows }) {
  const header = columns.map((c) => quoteCsvCell(c)).join(',')
  const lines = [header]

  for (const row of rows) {
    const line = stringifyCsvRow({ columns, row })
    lines.push(line)
  }

  return lines.join('\n') + '\n'
}

function stringifyCsvRow({ columns, row }) {
  return columns
    .map((col) => {
      const raw = row && typeof row === 'object' ? row[col] : ''
      const asString = typeof raw === 'string' ? escapeCsvInjection(raw) : raw
      return quoteCsvCell(asString)
    })
    .join(',')
}

function stringifyCsvHeader(columns) {
  return columns.map((c) => quoteCsvCell(c)).join(',')
}

function readTextBody(req, { maxBytes = DEFAULT_MAX_CSV_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let total = 0

    req.on('data', (chunk) => {
      const buf = Buffer.from(chunk)
      total += buf.length
      if (total > maxBytes) {
        const err = new Error('Payload too large')
        err.code = 'PAYLOAD_TOO_LARGE'
        reject(err)
        req.destroy()
        return
      }
      chunks.push(buf)
    })

    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function parseCsv(text, { maxRows = DEFAULT_MAX_ROWS, maxColumns = DEFAULT_MAX_COLUMNS } = {}) {
  if (typeof text !== 'string') {
    return { error: 'Expected CSV text' }
  }

  const input = text.replace(/^\uFEFF/, '') // strip UTF-8 BOM
  let i = 0
  const len = input.length

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const isRowEmpty = (candidate) => {
    if (!Array.isArray(candidate) || candidate.length === 0) return true
    for (const cell of candidate) {
      if (cell === null || cell === undefined) continue
      if (String(cell) !== '') return false
    }
    return true
  }

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    if (isRowEmpty(row)) {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  while (i < len) {
    const ch = input[i]

    if (inQuotes) {
      if (ch === '"') {
        const next = input[i + 1]
        if (next === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += ch
      i += 1
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }

    if (ch === ',') {
      pushField()
      if (row.length > maxColumns) return { error: 'CSV has too many columns' }
      i += 1
      continue
    }

    if (ch === '\n') {
      pushField()
      pushRow()
      if (rows.length > maxRows) return { error: 'CSV has too many rows' }
      i += 1
      continue
    }

    if (ch === '\r') {
      if (input[i + 1] === '\n') {
        pushField()
        pushRow()
        if (rows.length > maxRows) return { error: 'CSV has too many rows' }
        i += 2
        continue
      }
      pushField()
      pushRow()
      if (rows.length > maxRows) return { error: 'CSV has too many rows' }
      i += 1
      continue
    }

    field += ch
    i += 1
  }

  if (inQuotes) return { error: 'Unterminated CSV quote' }

  pushField()
  if (row.length > 1 || row[0] !== '' || rows.length > 0) pushRow()

  if (!rows.length) return { rows: [], headers: [], records: [] }

  const headers = rows[0].map((h) => String(h || '').trim())
  const records = []

  for (let r = 1; r < rows.length; r += 1) {
    const values = rows[r]
    const record = {}
    for (let c = 0; c < headers.length; c += 1) {
      const key = headers[c]
      if (!key) continue
      record[key] = values[c] === undefined ? '' : String(values[c])
    }
    records.push(record)
  }

  return { headers, records }
}

function hasUnescapedFormulaCell(value) {
  if (typeof value !== 'string') return false
  const trimmedLeft = value.replace(/^\s+/, '')
  if (!trimmedLeft) return false
  if (trimmedLeft.startsWith("'")) return false
  return FORMULA_PREFIXES.has(trimmedLeft[0])
}

module.exports = {
  DEFAULT_MAX_CSV_BYTES,
  DEFAULT_MAX_ROWS,
  DEFAULT_MAX_COLUMNS,
  escapeCsvInjection,
  stringifyCsv,
  stringifyCsvHeader,
  stringifyCsvRow,
  parseCsv,
  readTextBody,
  hasUnescapedFormulaCell,
}
