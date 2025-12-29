const assert = require('assert')

const { stringifyCsv, parseCsv, hasUnescapedFormulaCell } = require('../api/_lib/csv')

function run() {
  assert.strictEqual(hasUnescapedFormulaCell('=2+2'), true)
  assert.strictEqual(hasUnescapedFormulaCell(' +SUM(A1:A2)'), true)
  assert.strictEqual(hasUnescapedFormulaCell('-1'), true)
  assert.strictEqual(hasUnescapedFormulaCell('@cmd'), true)
  assert.strictEqual(hasUnescapedFormulaCell("'=2+2"), false)
  assert.strictEqual(hasUnescapedFormulaCell(" '=2+2"), false)

  const csv = stringifyCsv({
    columns: ['title', 'notes'],
    rows: [
      { title: '=2+2', notes: 'plain' },
      { title: 'Normal', notes: '+SUM(A1:A2)' },
      { title: 'Already escaped', notes: "'-1" },
    ],
  })

  assert.ok(csv.includes("'=2+2"), 'export should escape leading formulas with apostrophe')
  assert.ok(csv.includes("'+SUM(A1:A2)"), 'export should escape leading formulas with apostrophe')
  assert.ok(csv.includes("\"'-1\"") || csv.includes("'-1"), 'export should keep already-escaped values stable')

  const parsed = parseCsv(csv)
  assert.ok(!parsed.error, parsed.error || 'parse error')
  assert.deepStrictEqual(parsed.headers, ['title', 'notes'])
  assert.strictEqual(parsed.records.length, 3)
  assert.strictEqual(parsed.records[0].title, "'=2+2")
  assert.strictEqual(parsed.records[1].notes, "'+SUM(A1:A2)")

  console.log('CSV safety checks: OK')
}

if (require.main === module) {
  run()
}

