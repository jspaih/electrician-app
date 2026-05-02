/**
 * Local equivalents of the SQL get_trial_balance / get_balance_sheet
 * functions. Walk all journal entry lines, fold by account, and
 * apply normal-balance direction to produce signed balances.
 *
 * These functions are pure — pass in the data, get back a result.
 * Memoize at the call site if needed.
 */

import type {
  ChartAccount, JournalEntry, AccountType,
} from '../../types'

export interface AccountBalance {
  account:        ChartAccount
  totalDebit:     number
  totalCredit:    number
  /** Signed balance in the account's normal direction (positive = healthy) */
  balance:        number
  /** Raw debit-side number for trial balance display (≥ 0) */
  tbDebit:        number
  /** Raw credit-side number for trial balance display (≥ 0) */
  tbCredit:       number
}

const NORMAL_BALANCE: Record<AccountType, 'debit' | 'credit'> = {
  asset:     'debit',
  liability: 'credit',
  equity:    'credit',
  revenue:   'credit',
  expense:   'debit',
}

const ON_STATEMENT: Record<AccountType, 'balance_sheet' | 'income_statement'> = {
  asset:     'balance_sheet',
  liability: 'balance_sheet',
  equity:    'balance_sheet',
  revenue:   'income_statement',
  expense:   'income_statement',
}

/**
 * Compute account balances from journal entry lines.
 *
 * @param accounts  Chart of Accounts
 * @param entries   Journal entries to consider
 * @param opts.toDate    Include entries where date ≤ this (default: today)
 * @param opts.fromDate  Include entries where date ≥ this (default: no lower bound)
 */
export function computeAccountBalances(
  accounts: ChartAccount[],
  entries:  JournalEntry[],
  opts:     { toDate?: string; fromDate?: string } = {},
): AccountBalance[] {
  const { toDate, fromDate } = opts

  // Index accounts by ID for O(1) lookup
  const accountById = new Map<string, ChartAccount>()
  for (const a of accounts) accountById.set(a.id, a)

  // Aggregator
  const agg = new Map<string, { debit: number; credit: number }>()

  for (const e of entries) {
    if (toDate   && e.date > toDate)   continue
    if (fromDate && e.date < fromDate) continue
    for (const line of e.lines) {
      if (!line.accountId) continue
      const cur = agg.get(line.accountId) ?? { debit: 0, credit: 0 }
      cur.debit  += line.debit  || 0
      cur.credit += line.credit || 0
      agg.set(line.accountId, cur)
    }
  }

  const result: AccountBalance[] = []
  for (const [accountId, sums] of agg) {
    const account = accountById.get(accountId)
    if (!account) continue

    const normal = NORMAL_BALANCE[account.type]
    const balance = normal === 'debit'
      ? sums.debit  - sums.credit
      : sums.credit - sums.debit

    let tbDebit = 0, tbCredit = 0
    if (normal === 'debit') {
      if (balance >= 0) tbDebit  = balance
      else              tbCredit = Math.abs(balance)
    } else {
      if (balance >= 0) tbCredit = balance
      else              tbDebit  = Math.abs(balance)
    }

    result.push({
      account,
      totalDebit:  sums.debit,
      totalCredit: sums.credit,
      balance,
      tbDebit,
      tbCredit,
    })
  }

  // Stable sort by account code
  result.sort((a, b) => a.account.code.localeCompare(b.account.code))
  return result
}

/**
 * Trial balance shape — same as `computeAccountBalances` but filtered
 * to non-zero balances by default (to match the SQL view).
 */
export function getTrialBalance(
  accounts: ChartAccount[],
  entries:  JournalEntry[],
  opts:     { toDate?: string; fromDate?: string; includeZero?: boolean } = {},
): AccountBalance[] {
  const all = computeAccountBalances(accounts, entries, opts)
  if (opts.includeZero) return all
  return all.filter(r => r.totalDebit > 0 || r.totalCredit > 0)
}

/**
 * Balance Sheet snapshot.
 *
 * Net Income (revenue - expenses) is rolled into Equity as the
 * "current year profit" line, mimicking standard end-of-period closure.
 */
export interface BalanceSheet {
  asOf: string
  assets:           AccountBalance[]
  totalAssets:      number
  liabilities:      AccountBalance[]
  totalLiabilities: number
  equity:           AccountBalance[]
  totalEquity:      number
  netIncome:        number
  isBalanced:       boolean
}

export function getBalanceSheet(
  accounts: ChartAccount[],
  entries:  JournalEntry[],
  asOf:     string,
): BalanceSheet {
  const all = computeAccountBalances(accounts, entries, { toDate: asOf })

  const byType = (t: AccountType) => all.filter(r => r.account.type === t && r.balance !== 0)
  const sumOf  = (rows: AccountBalance[]) => rows.reduce((s, r) => s + r.balance, 0)

  const assets      = byType('asset')
  const liabilities = byType('liability')
  const equityRaw   = byType('equity')
  const revenue     = byType('revenue')
  const expense     = byType('expense')

  const totalAssets      = sumOf(assets)
  const totalLiabilities = sumOf(liabilities)
  const equityBase       = sumOf(equityRaw)
  const netIncome        = sumOf(revenue) - sumOf(expense)
  const totalEquity      = equityBase + netIncome

  const isBalanced =
    Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01

  return {
    asOf,
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity: equityRaw,
    totalEquity,
    netIncome,
    isBalanced,
  }
}

/**
 * P&L Statement (Income Statement) snapshot for a period.
 */
export interface IncomeStatement {
  fromDate: string
  toDate:   string
  revenue:  AccountBalance[]
  totalRevenue: number
  expenses:     AccountBalance[]
  totalExpenses: number
  netIncome:    number
}

export function getIncomeStatement(
  accounts: ChartAccount[],
  entries:  JournalEntry[],
  fromDate: string,
  toDate:   string,
): IncomeStatement {
  const all = computeAccountBalances(accounts, entries, { fromDate, toDate })

  const revenue  = all.filter(r => r.account.type === 'revenue' && r.balance !== 0)
  const expenses = all.filter(r => r.account.type === 'expense' && r.balance !== 0)

  const totalRevenue  = revenue.reduce((s, r) => s + r.balance, 0)
  const totalExpenses = expenses.reduce((s, r) => s + r.balance, 0)
  const netIncome     = totalRevenue - totalExpenses

  return {
    fromDate, toDate,
    revenue, totalRevenue,
    expenses, totalExpenses,
    netIncome,
  }
}

/** True if an account belongs on the balance sheet (asset/liability/equity). */
export function isOnBalanceSheet(account: ChartAccount): boolean {
  return ON_STATEMENT[account.type] === 'balance_sheet'
}

/** True if an account belongs on the income statement (revenue/expense). */
export function isOnIncomeStatement(account: ChartAccount): boolean {
  return ON_STATEMENT[account.type] === 'income_statement'
}
