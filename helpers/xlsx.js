// Minimal .xlsx writer (no dependency): one workbook, a few sheets of strings / numbers, a bold header row.
// An .xlsx is a zip of XML parts; stored (uncompressed) entries + CRC-32 are all the zip format needs.
// shortcut: no styles beyond bold headers, no dates or formulas; use a real library if exports grow.

const enc = new TextEncoder()

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)

  for (let n = 0; n < 256; n++) {
    let c = n

    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1

    t[n] = c >>> 0
  }

  return t
})()

const crc32 = bytes => {
  let c = 0xffffffff

  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)

  return (c ^ 0xffffffff) >>> 0
}

/** Stored zip of { name, data: Uint8Array } entries. */
const zip = files => {
  const chunks = []
  const central = []
  let offset = 0

  const u16 = n => [n & 0xff, (n >>> 8) & 0xff]
  const u32 = n => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]

  for (const f of files) {
    const name = enc.encode(f.name)
    const crc = crc32(f.data)
    const size = f.data.length
    // version 20, flag 0x0800 (UTF-8 names), method 0 (stored), time/date 0
    const head = [
      ...u16(20),
      ...u16(0x0800),
      ...u16(0),
      ...u16(0),
      ...u16(0x21),
      ...u32(crc),
      ...u32(size),
      ...u32(size),
      ...u16(name.length),
      ...u16(0)
    ]
    const local = new Uint8Array([...u32(0x04034b50), ...head])

    chunks.push(local, name, f.data)
    central.push(
      new Uint8Array([...u32(0x02014b50), ...u16(20), ...head, ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]),
      name
    )
    offset += local.length + name.length + size
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0)
  const end = new Uint8Array([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(files.length),
    ...u16(files.length),
    ...u32(centralSize),
    ...u32(offset),
    ...u16(0)
  ])
  const parts = [...chunks, ...central, end]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0

  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }

  return out
}

const esc = s =>
  String(s)
    // XML 1.0 can't carry most control characters
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const colName = i => {
  let s = ''

  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s

  return s
}

const sheetXml = rows => {
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((v, c) => {
          if (v === null || v === undefined || v === '') return ''

          const ref = `${colName(c)}${r + 1}`
          const style = r === 0 ? ' s="1"' : ''

          return typeof v === 'number' && Number.isFinite(v)
            ? `<c r="${ref}"${style}><v>${v}</v></c>`
            : `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`
        })
        .join('')

      return `<row r="${r + 1}">${cells}</row>`
    })
    .join('')

  // column widths from the longest value (characters), so names and answers aren't cut off
  const widths = []

  rows.forEach(row => row.forEach((v, c) => (widths[c] = Math.max(widths[c] || 0, String(v ?? '').length))))

  const cols = widths
    .map((w, c) => `<col min="${c + 1}" max="${c + 1}" width="${Math.min(60, Math.max(8, w + 2))}" customWidth="1"/>`)
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${
    cols ? `<cols>${cols}</cols>` : ''
  }<sheetData>${body}</sheetData></worksheet>`
}

// Excel: max 31 chars, none of : \ / ? * [ ]
const sheetName = (name, i) =>
  (
    String(name)
      .replace(/[:\\/?*[\]]/g, ' ')
      .trim() || `Sheet${i + 1}`
  ).slice(0, 31)

/**
 * @param {{ name: string, rows: Array<Array<string|number|null>> }[]} sheets first row of each sheet is its (bold) header
 * @returns {Uint8Array} .xlsx file bytes
 */
export const buildXlsx = sheets => {
  const NS = 'http://schemas.openxmlformats.org'
  const files = [
    {
      name: '[Content_Types].xml',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${NS}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
        .map(
          (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${
              i + 1
            }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
        )
        .join('')}</Types>`
    },
    {
      name: '_rels/.rels',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS}/package/2006/relationships"><Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
    },
    {
      name: 'xl/workbook.xml',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${NS}/officeDocument/2006/relationships"><sheets>${sheets
        .map((s, i) => `<sheet name="${esc(sheetName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join('')}</sheets></workbook>`
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS}/package/2006/relationships">${sheets
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="${NS}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
              i + 1
            }.xml"/>`
        )
        .join('')}<Relationship Id="rId${
        sheets.length + 1
      }" Type="${NS}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
    },
    {
      // style 0 = default, 1 = bold (header row)
      name: 'xl/styles.xml',
      xml: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS}/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
    },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, xml: sheetXml(s.rows) }))
  ]

  return zip(files.map(f => ({ name: f.name, data: enc.encode(f.xml) })))
}
