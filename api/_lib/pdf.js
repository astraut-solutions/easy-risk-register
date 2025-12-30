const A4_WIDTH_PT = 595.28
const A4_HEIGHT_PT = 841.89

function escapePdfAsciiString(input) {
  return String(input).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function isPdfDocEncodingCompatible(input) {
  const str = String(input)
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i)
    if (code === 0x0a || code === 0x0d || code === 0x09) continue
    if (code < 0x20 || code > 0x7e) return false
  }
  return true
}

function toUtf16BeHexString(input) {
  const str = String(input)
  const le = Buffer.from(str, 'utf16le')
  const be = Buffer.allocUnsafe(le.length + 2)
  be[0] = 0xfe
  be[1] = 0xff
  for (let i = 0; i < le.length; i += 2) {
    be[i + 2] = le[i + 1]
    be[i + 3] = le[i]
  }
  return `<${be.toString('hex').toUpperCase()}>`
}

function pdfStringLiteral(input) {
  if (isPdfDocEncodingCompatible(input)) return `(${escapePdfAsciiString(input)})`
  return toUtf16BeHexString(input)
}

function clampNumber(value, { min, max, fallback }) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  if (num < min) return min
  if (num > max) return max
  return num
}

function estimateMaxChars({ maxWidthPt, fontSizePt, mono = false }) {
  const widthPerChar = (mono ? 0.6 : 0.52) * fontSizePt
  return Math.max(1, Math.floor(maxWidthPt / widthPerChar))
}

function wrapText(text, { maxChars }) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = []
  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trimEnd()
    if (!line) {
      lines.push('')
      continue
    }
    if (line.length <= maxChars) {
      lines.push(line)
      continue
    }
    const words = line.split(/\s+/).filter(Boolean)
    let current = ''
    for (const word of words) {
      if (!current) {
        current = word
        continue
      }
      if ((current + ' ' + word).length <= maxChars) {
        current += ' ' + word
      } else {
        lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

class PdfDoc {
  constructor({
    title,
    author,
    pageWidthPt = A4_WIDTH_PT,
    pageHeightPt = A4_HEIGHT_PT,
    marginPt = 40,
  } = {}) {
    this.pageWidthPt = clampNumber(pageWidthPt, { min: 200, max: 2000, fallback: A4_WIDTH_PT })
    this.pageHeightPt = clampNumber(pageHeightPt, { min: 200, max: 2000, fallback: A4_HEIGHT_PT })
    this.marginPt = clampNumber(marginPt, { min: 10, max: 200, fallback: 40 })

    this.meta = {
      title: typeof title === 'string' ? title : null,
      author: typeof author === 'string' ? author : null,
    }

    this.pages = []
    this._startNewPage()
  }

  _startNewPage() {
    const content = []
    this.pages.push({ content })
    this._cursor = {
      x: this.marginPt,
      y: this.pageHeightPt - this.marginPt,
    }
  }

  _ensureSpace(lineHeightPt) {
    if (this._cursor.y - lineHeightPt < this.marginPt) this._startNewPage()
  }

  moveTo({ x, y }) {
    if (Number.isFinite(x)) this._cursor.x = x
    if (Number.isFinite(y)) this._cursor.y = y
  }

  addLineBreak(lineHeightPt) {
    const height = clampNumber(lineHeightPt, { min: 6, max: 60, fallback: 12 })
    this._ensureSpace(height)
    this._cursor.y -= height
  }

  addText(text, { font = 'F1', fontSizePt = 11, x, y } = {}) {
    const safeFontSize = clampNumber(fontSizePt, { min: 6, max: 28, fallback: 11 })
    const safeX = Number.isFinite(x) ? x : this._cursor.x
    const safeY = Number.isFinite(y) ? y : this._cursor.y
    this._ensureSpace(safeFontSize + 2)

    const page = this.pages[this.pages.length - 1]
    page.content.push(
      `BT /${font} ${safeFontSize} Tf ${safeX.toFixed(2)} ${safeY.toFixed(2)} Td ${pdfStringLiteral(text)} Tj ET`,
    )
    this._cursor.x = safeX
    this._cursor.y = safeY
  }

  addWrappedText(text, { font = 'F1', fontSizePt = 11, maxWidthPt, lineHeightPt } = {}) {
    const safeFontSize = clampNumber(fontSizePt, { min: 6, max: 28, fallback: 11 })
    const safeMaxWidthPt = clampNumber(maxWidthPt, {
      min: 50,
      max: this.pageWidthPt - this.marginPt * 2,
      fallback: this.pageWidthPt - this.marginPt * 2,
    })
    const safeLineHeightPt = clampNumber(lineHeightPt ?? safeFontSize * 1.25, { min: 8, max: 60, fallback: 14 })

    const mono = font === 'F2'
    const maxChars = estimateMaxChars({ maxWidthPt: safeMaxWidthPt, fontSizePt: safeFontSize, mono })
    const lines = wrapText(text, { maxChars })

    for (const line of lines) {
      this.addText(line, { font, fontSizePt: safeFontSize })
      this.addLineBreak(safeLineHeightPt)
    }
  }

  addHr({ thicknessPt = 1 } = {}) {
    const t = clampNumber(thicknessPt, { min: 0.5, max: 4, fallback: 1 })
    this._ensureSpace(10)
    const x1 = this.marginPt
    const x2 = this.pageWidthPt - this.marginPt
    const y = this._cursor.y
    const page = this.pages[this.pages.length - 1]
    page.content.push(`${t.toFixed(2)} w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`)
    this.addLineBreak(12)
  }

  toBuffer() {
    const objects = []
    const offsets = [0]
    const write = (str) => {
      const buf = Buffer.from(str, 'binary')
      offsets.push(offsets[offsets.length - 1] + buf.length)
      return str
    }

    const pageObjectIds = []
    const contentObjectIds = []

    const allocObjectId = () => objects.length + 1

    const addObject = (body) => {
      const id = allocObjectId()
      objects.push({ id, body })
      return id
    }

    const infoEntries = []
    if (this.meta.title) infoEntries.push(`/Title ${pdfStringLiteral(this.meta.title)}`)
    if (this.meta.author) infoEntries.push(`/Author ${pdfStringLiteral(this.meta.author)}`)
    infoEntries.push(`/Creator ${pdfStringLiteral('Easy Risk Register')}`)
    infoEntries.push(`/Producer ${pdfStringLiteral('Easy Risk Register')}`)
    infoEntries.push(`/CreationDate ${pdfStringLiteral(new Date().toISOString())}`)
    const infoId = addObject(`<<\n${infoEntries.join('\n')}\n>>`)

    // Font objects (standard 14 fonts: no embedding needed).
    const fontHelveticaId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`)
    const fontCourierId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>`)

    // Placeholder pages root (filled after page objects allocated).
    const pagesId = addObject('<<>>')

    // Content streams + pages
    for (const page of this.pages) {
      const rawContent = page.content.join('\n') + '\n'
      const contentStream = `<< /Length ${Buffer.byteLength(rawContent, 'binary')} >>\nstream\n${rawContent}endstream`
      const contentId = addObject(contentStream)
      contentObjectIds.push(contentId)

      const pageId = addObject(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.pageWidthPt.toFixed(
          2,
        )} ${this.pageHeightPt.toFixed(
          2,
        )}] /Resources << /Font << /F1 ${fontHelveticaId} 0 R /F2 ${fontCourierId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      )
      pageObjectIds.push(pageId)
    }

    // Fill pages root
    const kids = pageObjectIds.map((id) => `${id} 0 R`).join(' ')
    objects.find((o) => o.id === pagesId).body = `<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`

    const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

    let output = ''
    output += write('%PDF-1.4\n')
    output += write('%\xE2\xE3\xCF\xD3\n')

    const xrefPositions = {}

    for (const obj of objects) {
      xrefPositions[obj.id] = offsets[offsets.length - 1]
      output += write(`${obj.id} 0 obj\n${obj.body}\nendobj\n`)
    }

    const xrefStart = offsets[offsets.length - 1]
    output += write('xref\n')
    output += write(`0 ${objects.length + 1}\n`)
    output += write('0000000000 65535 f \n')

    for (let i = 1; i <= objects.length; i += 1) {
      const pos = xrefPositions[i] ?? 0
      output += write(`${String(pos).padStart(10, '0')} 00000 n \n`)
    }

    output += write('trailer\n')
    output += write(`<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\n`)
    output += write('startxref\n')
    output += write(`${xrefStart}\n`)
    output += write('%%EOF\n')

    return Buffer.from(output, 'binary')
  }
}

module.exports = { PdfDoc, A4_WIDTH_PT, A4_HEIGHT_PT }
