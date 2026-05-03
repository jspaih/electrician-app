/**
 * Bank Statement Parsers
 * Supports: CSV, XLSX (SheetJS), BAI2, MT940, ISO 20022 CAMT.053, OFX / QFX
 *
 * All parsers return a normalised StatementLine[] so the reconciliation
 * component never needs to know which format was used.
 */

// ── Public types ─────────────────────────────────────────────────────────────

export interface StatementLine {
  id: string          // generated local id
  date: string        // YYYY-MM-DD
  description: string
  reference?: string
  debit: number       // money out of account (positive)
  credit: number      // money into account (positive)
  balance?: number    // running balance if the format supplies it
  rawText?: string    // original line for debugging
}

export type StatementFormat = 'csv' | 'xlsx' | 'bai2' | 'mt940' | 'camt' | 'ofx' | 'unknown'

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) }

/** Normalise various date-string formats → YYYY-MM-DD */
function parseDateStr(raw: string): string {
  if (!raw) return ''
  raw = raw.trim().replace(/["']/g, '')

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw                   // ISO
  if (/^\d{8}$/.test(raw)) {                                          // YYYYMMDD
    return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`
  }
  if (/^\d{6}$/.test(raw)) {                                          // YYMMDD (MT940)
    const yy = parseInt(raw.slice(0,2), 10)
    const year = yy >= 70 ? `19${raw.slice(0,2)}` : `20${raw.slice(0,2)}`
    return `${year}-${raw.slice(2,4)}-${raw.slice(4,6)}`
  }

  // DD/MM/YYYY or MM/DD/YYYY
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const [, a, b, y] = slash
    const isDay1 = parseInt(a,10) > 12
    const dd = (isDay1 ? a : b).padStart(2,'0')
    const mm = (isDay1 ? b : a).padStart(2,'0')
    return `${y}-${mm}-${dd}`
  }

  // DD.MM.YYYY (European)
  const dot = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dot) {
    const [, dd, mm, yyyy] = dot
    return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
  }

  // DD-MM-YYYY
  const dash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (dash) {
    const [, dd, mm, yyyy] = dash
    return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
  }

  // Fallback – native Date (handles "Jan 15 2026", "15 Jan 2026", etc.)
  try {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      const y  = d.getFullYear()
      const mo = String(d.getMonth()+1).padStart(2,'0')
      const dy = String(d.getDate()).padStart(2,'0')
      return `${y}-${mo}-${dy}`
    }
  } catch {/**/}

  return ''
}

/** Strip currency symbols / thousand separators and parse amount */
function parseAmt(val: string): number {
  if (!val || val.trim() === '') return 0
  // Handle (1,234.56) → negative
  const neg = /^\(.*\)$/.test(val.trim())
  const cleaned = val.replace(/[(),\s$€£₪¥]/g, '').replace(/['']/g, '')
  const n = parseFloat(cleaned) || 0
  return neg ? -Math.abs(n) : n
}

// ── CSV Parser ────────────────────────────────────────────────────────────────

/** RFC 4180-aware CSV row splitter */
function splitCSVRow(line: string): string[] {
  const cols: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if ((c === ',' || c === ';' || c === '\t') && !inQ) {
      cols.push(cur.trim()); cur = ''
    } else {
      cur += c
    }
  }
  cols.push(cur.trim())
  return cols
}

export function parseCSV(text: string): StatementLine[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = splitCSVRow(lines[0]).map(h =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  )

  // Flexible column detection
  const col = (tests: string[]): number =>
    headers.findIndex(h => tests.some(t => h === t || h.includes(t)))

  const iDate   = col(['date','dt'])
  const iDesc   = col(['description','desc','narration','detail','particular','memo','transaction','text','subject'])
  const iRef    = col(['reference','ref','chequeno','checkno','cheqno','refno'])
  const iDebit  = col(['debit','dr','withdrawal','withdraw','deductions','out','charge'])
  const iCredit = col(['credit','cr','deposit','deposits','in','addition'])
  const iAmount = col(['amount','amt','value'])
  const iBal    = col(['balance','bal','runningbalance','closingbalance'])

  const result: StatementLine[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVRow(lines[i])
    if (cols.length < 2) continue

    const rawDate = (iDate >= 0 ? cols[iDate] : cols[0]) ?? ''
    const date = parseDateStr(rawDate)
    if (!date) continue

    const description = (iDesc >= 0 ? cols[iDesc] : (iRef >= 0 ? cols[iRef] : '')) ?? ''
    const reference   = (iRef >= 0 && iRef !== iDesc ? cols[iRef] : undefined)

    let debit = 0, credit = 0
    if (iDebit >= 0 && iCredit >= 0) {
      debit  = Math.abs(parseAmt(cols[iDebit]  ?? ''))
      credit = Math.abs(parseAmt(cols[iCredit] ?? ''))
    } else if (iAmount >= 0) {
      const a = parseAmt(cols[iAmount] ?? '')
      if (a < 0) debit = -a; else credit = a
    }

    if (debit === 0 && credit === 0) continue

    const balance = iBal >= 0 ? parseAmt(cols[iBal] ?? '') : undefined

    result.push({ id: uid(), date, description, reference, debit, credit, balance })
  }
  return result
}

// ── XLSX Parser ───────────────────────────────────────────────────────────────

export async function parseXLSX(buffer: ArrayBuffer): Promise<StatementLine[]> {
  // Use new Function to construct the import at runtime so Vite's static
  // import-analysis pass never sees the specifier — avoids the
  // "Failed to resolve import" error when the xlsx package is absent.
  let XLSX: any
  try {
    const runtimeImport = new Function('s', 'return import(s)')
    XLSX = await runtimeImport('xlsx')
  } catch {
    throw new Error(
      'The xlsx package is not installed. Run "npm install xlsx" then restart the dev server.',
    )
  }
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const csv: string = XLSX.utils.sheet_to_csv(ws)
  return parseCSV(csv)
}

// ── BAI2 Parser ───────────────────────────────────────────────────────────────
/**
 * BAI2 (Bank Administration Institute version 2) format.
 * Used by most US banks (Bank of America, Wells Fargo, Chase, etc.)
 *
 * Record type 16 = Transaction Detail:
 *   16,type-code,amount[,funds-type[,date][,time]],bank-ref,customer-ref[,text]
 *
 * Credits (money in):  type codes 100–399
 * Debits  (money out): type codes 400–699
 */
export function parseBAI2(text: string): StatementLine[] {
  const result: StatementLine[] = []
  const lines = text.split(/\r?\n/)

  let groupDate = ''

  for (const raw of lines) {
    const parts = raw.split(',')
    const rec = parts[0]?.trim()

    if (rec === '02') {
      // Group Header: 02,originator-id,destination-id,group-status,as-of-date,...
      groupDate = parseDateStr(parts[4]?.trim() ?? '')
    }

    if (rec === '16') {
      const typeCode  = parseInt(parts[1]?.trim() ?? '0', 10)
      const amount    = Math.abs(parseAmt(parts[2]?.trim() ?? ''))
      const fundsType = parts[3]?.trim() ?? ''

      // Funds type S/V/Z add extra date/time fields
      let refIdx = 4
      let txDate = groupDate
      if (['S','V'].includes(fundsType)) {
        txDate  = parseDateStr(parts[4]?.trim() ?? '') || groupDate
        refIdx  = 6   // skip date + time
      } else if (fundsType === 'Z') {
        refIdx  = 5   // skip date only
        txDate  = parseDateStr(parts[4]?.trim() ?? '') || groupDate
      }

      const bankRef  = parts[refIdx]?.trim() ?? ''
      const custRef  = parts[refIdx+1]?.trim() ?? ''
      const textParts = parts.slice(refIdx+2)
      const description = textParts.join(' ').replace(/^\s*\/\/\s*/, '').trim()
                       || custRef || bankRef

      // Credits: 100–399, Debits: 400–699
      const isCredit = typeCode >= 100 && typeCode < 400

      if (amount === 0) continue
      result.push({
        id: uid(),
        date: txDate,
        description,
        reference: bankRef || custRef || undefined,
        debit:  isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
      })
    }
  }
  return result
}

// ── MT940 Parser ──────────────────────────────────────────────────────────────
/**
 * SWIFT MT940 Customer Statement Message.
 * Widely used by European and Middle-Eastern banks.
 *
 * :61: tag = Transaction:
 *   YYMMDD[MMDD]C|D[R]Amount[NTxType][//BankRef]
 * :86: tag = Supplementary information (description)
 */
export function parseMT940(text: string): StatementLine[] {
  const result: StatementLine[] = []
  const lines = text.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.startsWith(':61:')) { i++; continue }

    // Collect all continuation lines for :61: (lines not starting with ':')
    let body = line.slice(4)
    let j = i + 1
    while (j < lines.length && !lines[j].startsWith(':') && lines[j].trim()) {
      body += ' ' + lines[j].trim(); j++
    }

    // :61: body: YYMMDD[MMDD][C/D/RD/RC]Amount[NTxCode][//BankRef[\r\nCustRef]]
    const m = body.match(/^(\d{6})(\d{4})?(C|D|RD?|RC?)(\d+[,.]?\d*)/)
    if (!m) { i = j; continue }

    const rawDate = m[1]
    const dir     = m[2+1] // 'C','D','RC','RD'
    const amtStr  = m[2+2].replace(',', '.')
    const amount  = parseFloat(amtStr) || 0
    const date    = parseDateStr(rawDate)

    // Bank ref after //
    const bankRef = (/\/\/(.+)/.exec(body) ?? [])[1]?.split(/\r?\n/)[0]?.trim() ?? ''

    // Look ahead for :86: description block
    let description = bankRef
    let k = j
    while (k < lines.length && !lines[k].startsWith(':61:') && !lines[k].match(/^:62[FMD]?:/)) {
      if (lines[k].startsWith(':86:')) {
        let d86 = lines[k].slice(4)
        k++
        while (k < lines.length && !lines[k].startsWith(':') && lines[k].trim()) {
          d86 += ' ' + lines[k].trim(); k++
        }
        // MT940 :86: structured field uses ?NN delimiters
        description = d86.replace(/\?\d{2}/g, ' | ').replace(/\s+/g, ' ').trim()
        break
      }
      k++
    }

    const isCredit = dir === 'C' || dir === 'RC'
    result.push({
      id: uid(), date, description,
      reference: bankRef || undefined,
      debit:  isCredit ? 0 : amount,
      credit: isCredit ? amount : 0,
    })
    i = j
  }
  return result
}

// ── ISO 20022 / CAMT.053 Parser ───────────────────────────────────────────────
/**
 * ISO 20022 BankToCustomerStatement (camt.053).
 * XML format used by European banks, SEPA transactions, etc.
 */
export function parseCAMT(xml: string): StatementLine[] {
  const result: StatementLine[] = []
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(xml, 'text/xml')
  } catch { return [] }

  // Resolve a tag ignoring namespace prefixes
  function els(parent: Element | Document, tag: string): Element[] {
    // getElementsByTagName is namespace-unaware in most browsers when tag has no prefix
    const list = parent.getElementsByTagName(tag)
    if (list.length) return Array.from(list)
    // If nothing found, try stripping namespace from every child
    const all = parent.getElementsByTagName('*')
    return Array.from(all).filter(el => el.localName === tag)
  }
  function el1(parent: Element | Document, tag: string): Element | undefined {
    return els(parent, tag)[0]
  }
  function txt(parent: Element | Document, tag: string): string {
    return el1(parent, tag)?.textContent?.trim() ?? ''
  }

  for (const entry of els(doc, 'Ntry')) {
    const amtEl  = el1(entry, 'Amt')
    const amount = parseFloat(amtEl?.textContent?.trim() ?? '0') || 0
    const dir    = txt(entry, 'CdtDbtInd')   // CRDT | DBIT

    const bookEl = el1(entry, 'BookgDt')
    const valEl  = el1(entry, 'ValDt')
    const rawDate = (bookEl ? txt(bookEl, 'Dt') : '')
                 || (valEl  ? txt(valEl,  'Dt') : '')
    const date = parseDateStr(rawDate)
    if (!date || amount === 0) continue

    // Build description from available fields (ordered by preference)
    const description =
      txt(entry, 'AddtlNtryInf') ||
      txt(entry, 'Ustrd')        ||
      txt(entry, 'UstrdRmtInf') ||
      txt(entry, 'AddtlTxInf')   ||
      txt(entry, 'EndToEndId')   ||
      txt(entry, 'TxId')         || ''

    const ref = txt(entry, 'AcctSvcrRef') || txt(entry, 'EndToEndId') || undefined

    const isCredit = dir === 'CRDT'
    result.push({
      id: uid(), date, description, reference: ref,
      debit:  isCredit ? 0 : amount,
      credit: isCredit ? amount : 0,
    })
  }
  return result
}

// ── OFX / QFX Parser ─────────────────────────────────────────────────────────
/**
 * OFX (Open Financial Exchange) / QFX (Quicken variant).
 * OFX 1.x is SGML-like; OFX 2.x is XML.
 * Handles both automatically.
 */
export function parseOFX(text: string): StatementLine[] {
  const result: StatementLine[] = []

  // ── OFX 2.x (XML) ──────────────────────────────────────────────────────────
  // Try XML parse first; works for OFX 2.x and some 1.x variants
  try {
    const doc = new DOMParser().parseFromString(text, 'text/xml')
    const txns = doc.getElementsByTagName('STMTTRN')
    if (txns.length > 0) {
      for (let i = 0; i < txns.length; i++) {
        const tx = txns[i]
        const getT = (tag: string) => tx.getElementsByTagName(tag)[0]?.textContent?.trim() ?? ''
        const rawDate = getT('DTPOSTED').slice(0, 8)   // first 8 chars = YYYYMMDD
        const date    = parseDateStr(rawDate)
        const amtRaw  = parseFloat(getT('TRNAMT')) || 0
        const memo    = getT('MEMO') || getT('NAME') || getT('FITID')
        result.push({
          id: uid(), date, description: memo,
          reference: getT('FITID') || undefined,
          debit:  amtRaw < 0 ? -amtRaw : 0,
          credit: amtRaw > 0 ?  amtRaw : 0,
        })
      }
      if (result.length > 0) return result
    }
  } catch {/**/}

  // ── OFX 1.x (SGML) ─────────────────────────────────────────────────────────
  // Strip headers (everything before <OFX> or <ofx>)
  const bodyStart = text.search(/<OFX/i)
  const body = bodyStart >= 0 ? text.slice(bodyStart) : text

  // Self-closing SGML tags: <TAG>value\n<NEXTTAG>
  // We extract <STMTTRN>…</STMTTRN> blocks (or from <STMTTRN> to next <STMTTRN>)
  const blocks = body.split(/<STMTTRN>/i).slice(1)
  for (const block of blocks) {
    const end = block.search(/<\/STMTTRN>/i)
    const seg = end >= 0 ? block.slice(0, end) : block

    const getTag = (tag: string): string => {
      const r = new RegExp(`<${tag}>([^\r\n<]*)`, 'i')
      return r.exec(seg)?.[1]?.trim() ?? ''
    }

    const rawDate = getTag('DTPOSTED').slice(0, 8)
    const date    = parseDateStr(rawDate)
    const amtRaw  = parseFloat(getTag('TRNAMT')) || 0
    const memo    = getTag('MEMO') || getTag('NAME') || getTag('FITID')
    if (!date || amtRaw === 0) continue
    result.push({
      id: uid(), date, description: memo,
      reference: getTag('FITID') || undefined,
      debit:  amtRaw < 0 ? -amtRaw : 0,
      credit: amtRaw > 0 ?  amtRaw : 0,
    })
  }
  return result
}

// ── Format Detection ──────────────────────────────────────────────────────────

export function detectFormat(filename: string, content: string): StatementFormat {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'ofx'  || ext === 'qfx') return 'ofx'
  if (ext === 'csv'  || ext === 'tsv') return 'csv'

  const head = content.slice(0, 600).trim()

  // XML-based formats
  if (head.startsWith('<?xml') || head.startsWith('<Document') || head.includes('urn:iso:std:iso:20022')) {
    if (head.toLowerCase().includes('camt') ||
        head.includes('BkToCstmrStmt') ||
        head.includes('Ntry')) return 'camt'
    if (head.includes('OFX') || head.includes('STMTTRN')) return 'ofx'
  }
  if (/<OFX/i.test(head) || /OFXHEADER/.test(head)) return 'ofx'

  // MT940: starts with or contains :20: field
  if (/^:20:/m.test(head) || head.includes(':61:')) return 'mt940'

  // BAI2: file header starts with "01,"
  if (/^01,/.test(head)) return 'bai2'

  // CSV default
  return 'csv'
}

// ── Master entry-point ────────────────────────────────────────────────────────

export async function parseStatement(
  file: File,
): Promise<{ lines: StatementLine[]; format: StatementFormat; error?: string }> {
  try {
    const filename = file.name

    // XLSX: needs ArrayBuffer
    if (/\.(xlsx|xls)$/i.test(filename)) {
      const buf = await file.arrayBuffer()
      const lines = await parseXLSX(buf)
      return { lines, format: 'xlsx' }
    }

    const text = await file.text()
    const format = detectFormat(filename, text)

    let lines: StatementLine[] = []
    switch (format) {
      case 'csv':   lines = parseCSV(text);   break
      case 'bai2':  lines = parseBAI2(text);  break
      case 'mt940': lines = parseMT940(text); break
      case 'camt':  lines = parseCAMT(text);  break
      case 'ofx':   lines = parseOFX(text);   break
      default:      lines = parseCSV(text);   break  // best-effort
    }

    return { lines, format }
  } catch (err: any) {
    return { lines: [], format: 'unknown', error: String(err?.message ?? err) }
  }
}
