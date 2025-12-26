function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`)
    error.code = 'MISSING_ENV'
    throw error
  }
  return value
}

function escapeTagValue(value) {
  return String(value).replace(/([,= ])/g, '\\$1')
}

function escapeTagKey(value) {
  return String(value).replace(/([,= ])/g, '\\$1')
}

function escapeMeasurement(value) {
  return String(value).replace(/([, ])/g, '\\$1')
}

function toLineProtocolPoint({
  measurement,
  tags = {},
  fields = {},
  timestampMs,
}) {
  const measurementPart = escapeMeasurement(measurement)

  const tagParts = Object.entries(tags)
    .filter(([, tagValue]) => tagValue !== undefined && tagValue !== null && String(tagValue) !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tagKey, tagValue]) => `${escapeTagKey(tagKey)}=${escapeTagValue(tagValue)}`)

  const fieldParts = Object.entries(fields)
    .filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null && Number.isFinite(fieldValue))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fieldKey, fieldValue]) => `${escapeTagKey(fieldKey)}=${Math.trunc(fieldValue)}i`)

  if (fieldParts.length === 0) {
    throw new Error('At least one numeric field is required')
  }

  const tagSuffix = tagParts.length ? `,${tagParts.join(',')}` : ''
  const timePart = Number.isFinite(timestampMs) ? ` ${Math.trunc(timestampMs)}` : ''

  return `${measurementPart}${tagSuffix} ${fieldParts.join(',')}${timePart}`
}

function fluxStringLiteral(value) {
  return JSON.stringify(String(value))
}

function fluxTimeLiteral(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return null
  return `time(v: ${fluxStringLiteral(date.toISOString())})`
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body

  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (chunks.length === 0) return null

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null
  return JSON.parse(raw)
}

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        const next = line[i + 1]
        if (next === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells
}

function parseAnnotatedCsvToRecords(text) {
  const records = []
  let header = null

  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (!line) {
      header = null
      continue
    }
    if (line.startsWith('#')) continue

    if (!header) {
      header = parseCsvLine(line)
      continue
    }

    const values = parseCsvLine(line)
    const record = {}
    for (let i = 0; i < header.length; i += 1) record[header[i]] = values[i]
    records.push(record)
  }

  return records
}

async function influxWriteLine(line) {
  const baseUrl = requireEnv('INFLUXDB_URL').replace(/\/+$/, '')
  const token = requireEnv('INFLUXDB_TOKEN')
  const org = requireEnv('INFLUXDB_ORG')
  const bucket = requireEnv('INFLUXDB_BUCKET')

  const url = `${baseUrl}/api/v2/write?org=${encodeURIComponent(org)}&bucket=${encodeURIComponent(bucket)}&precision=ms`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Token ${token}`,
      'content-type': 'text/plain; charset=utf-8',
    },
    body: `${line}\n`,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const error = new Error(`Influx write failed (${res.status})${detail ? `: ${detail}` : ''}`)
    error.statusCode = 502
    throw error
  }
}

async function influxQuery(fluxQuery) {
  const baseUrl = requireEnv('INFLUXDB_URL').replace(/\/+$/, '')
  const token = requireEnv('INFLUXDB_TOKEN')
  const org = requireEnv('INFLUXDB_ORG')

  const url = `${baseUrl}/api/v2/query?org=${encodeURIComponent(org)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Token ${token}`,
      accept: 'application/csv',
      'content-type': 'application/vnd.flux',
    },
    body: fluxQuery,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    const error = new Error(`Influx query failed (${res.status})${detail ? `: ${detail}` : ''}`)
    error.statusCode = 502
    throw error
  }

  return res.text()
}

module.exports = {
  fluxStringLiteral,
  fluxTimeLiteral,
  influxQuery,
  influxWriteLine,
  parseAnnotatedCsvToRecords,
  readJsonBody,
  requireEnv,
  toLineProtocolPoint,
}
