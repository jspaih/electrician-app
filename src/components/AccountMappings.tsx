import { useMemo } from 'react'
import { useT } from '../hooks/useT'
import { useStore } from '../store/useStore'
import { Sparkles, Link as LinkIcon, AlertTriangle } from 'lucide-react'
import type { AccountMappingKey, AccountType, ChartAccount } from '../types'

const L = {
  en: {
    title:        'Account Mappings',
    subtitle:     'Map each transaction type to its target account in the chart of accounts',
    seedDefaults: 'Reset to defaults',
    needsCoa:     'Seed your Chart of Accounts first',
    needsCoaHint: 'Open Chart of Accounts and click "Seed default accounts" to populate the standard list, then return here.',
    transactionType: 'Transaction Type',
    targetAccount:   'Target Account',
    notMapped:       '— Not mapped —',
    sectionAR:       'Sales & Receivables',
    sectionAP:       'Purchases & Payables',
    sectionTax:      'Tax',
    sectionCash:     'Cash & Bank',
    sectionRevenue:  'Revenue',
    sectionExpense:  'Cost & Expense',
    keyDescriptions: {
      cash:                'Default cash account (used when no specific bank account selected)',
      accounts_receivable: 'What clients owe us (debit on sales invoices)',
      checks_in_box:       'Received checks in physical box (before deposit)',
      postdated_checks:    'Checks deposited but not yet cleared',
      inventory:           'Stock value on hand',
      accounts_payable:    'What we owe suppliers (credit on purchase invoices)',
      checks_payable:      'Issued checks pending clearance',
      vat_payable:         'Output VAT collected from clients (we owe government)',
      vat_receivable:      'Input VAT paid to suppliers (recoverable)',
      accrued_salaries:    'Wages owed to employees but not yet paid',
      service_revenue:     'Revenue from services (default for sales invoices)',
      sales_revenue:       'Revenue from product sales',
      direct_materials:    'Cost of materials used on jobs',
      direct_labor:        'Labor cost expense (when labor entries are recorded)',
      bank_charges:        'Bank fees and transfer charges',
    } as Record<AccountMappingKey, string>,
    keyNames: {
      cash:                'Default Cash',
      accounts_receivable: 'Accounts Receivable',
      checks_in_box:       'Checks in Box',
      postdated_checks:    'Postdated Checks',
      inventory:           'Inventory',
      accounts_payable:    'Accounts Payable',
      checks_payable:      'Checks Payable',
      vat_payable:         'VAT Payable (output)',
      vat_receivable:      'VAT Receivable (input)',
      accrued_salaries:    'Accrued Salaries',
      service_revenue:     'Service Revenue',
      sales_revenue:       'Sales Revenue',
      direct_materials:    'Direct Materials',
      direct_labor:        'Direct Labor',
      bank_charges:        'Bank Charges & Fees',
    } as Record<AccountMappingKey, string>,
  },
  ar: {
    title:        'ربط الحسابات',
    subtitle:     'اربط كل نوع معاملة بحسابها المستهدف في دليل الحسابات',
    seedDefaults: 'إعادة الافتراضي',
    needsCoa:     'يجب إنشاء دليل الحسابات أولاً',
    needsCoaHint: 'افتح دليل الحسابات واضغط "تعبئة الحسابات الافتراضية" لإضافة القائمة القياسية، ثم عُد إلى هنا.',
    transactionType: 'نوع المعاملة',
    targetAccount:   'الحساب المستهدف',
    notMapped:       '— غير مربوط —',
    sectionAR:       'المبيعات والذمم المدينة',
    sectionAP:       'المشتريات والذمم الدائنة',
    sectionTax:      'الضرائب',
    sectionCash:     'النقد والبنك',
    sectionRevenue:  'الإيرادات',
    sectionExpense:  'التكلفة والمصروفات',
    keyDescriptions: {
      cash:                'حساب النقد الافتراضي (يُستخدم عندما لا يُختار حساب بنكي محدد)',
      accounts_receivable: 'ما يدين به العملاء لنا (مدين في فواتير المبيعات)',
      checks_in_box:       'الشيكات المستلمة في الصندوق (قبل الإيداع)',
      postdated_checks:    'الشيكات المودعة وغير المستحقة بعد',
      inventory:           'قيمة المخزون',
      accounts_payable:    'ما ندين به للموردين (دائن في فواتير الشراء)',
      checks_payable:      'الشيكات الصادرة قيد التسوية',
      vat_payable:         'ضريبة القيمة المضافة المستحقة على المبيعات',
      vat_receivable:      'ضريبة القيمة المضافة المدفوعة على المشتريات',
      accrued_salaries:    'الرواتب المستحقة غير المدفوعة',
      service_revenue:     'إيرادات الخدمات (افتراضي لفواتير المبيعات)',
      sales_revenue:       'إيرادات بيع المواد',
      direct_materials:    'تكلفة المواد المستخدمة في الأعمال',
      direct_labor:        'تكلفة العمالة (عند تسجيل ساعات العمل)',
      bank_charges:        'عمولات البنك ورسوم التحويل',
    } as Record<AccountMappingKey, string>,
    keyNames: {
      cash:                'النقد الافتراضي',
      accounts_receivable: 'الذمم المدينة',
      checks_in_box:       'شيكات في الصندوق',
      postdated_checks:    'شيكات آجلة',
      inventory:           'المخزون',
      accounts_payable:    'الذمم الدائنة',
      checks_payable:      'شيكات مستحقة الدفع',
      vat_payable:         'ضريبة القيمة المضافة (مخرجات)',
      vat_receivable:      'ضريبة القيمة المضافة (مدخلات)',
      accrued_salaries:    'رواتب مستحقة',
      service_revenue:     'إيرادات الخدمات',
      sales_revenue:       'إيرادات المبيعات',
      direct_materials:    'مواد مباشرة',
      direct_labor:        'عمالة مباشرة',
      bank_charges:        'عمولات بنكية',
    } as Record<AccountMappingKey, string>,
  },
} as const

interface Section {
  label: string
  keys:  AccountMappingKey[]
  /** Account types valid for this section's dropdowns */
  allowedTypes: AccountType[]
}

const SECTIONS = (t: typeof L.en): Section[] => [
  {
    label: t.sectionAR,
    keys:  ['accounts_receivable'],
    allowedTypes: ['asset'],
  },
  {
    label: t.sectionAP,
    keys:  ['accounts_payable'],
    allowedTypes: ['liability'],
  },
  {
    label: t.sectionCash,
    keys:  ['cash', 'checks_in_box', 'postdated_checks', 'checks_payable', 'inventory'],
    allowedTypes: ['asset', 'liability'],
  },
  {
    label: t.sectionTax,
    keys:  ['vat_payable', 'vat_receivable'],
    allowedTypes: ['liability', 'asset'],
  },
  {
    label: t.sectionRevenue,
    keys:  ['service_revenue', 'sales_revenue'],
    allowedTypes: ['revenue'],
  },
  {
    label: t.sectionExpense,
    keys:  ['direct_materials', 'direct_labor', 'accrued_salaries', 'bank_charges'],
    allowedTypes: ['expense', 'liability'],
  },
]

export default function AccountMappings() {
  const t = useT(L)
  const chartAccounts   = useStore(s => s.chartAccounts)
  const accountMappings = useStore(s => s.accountMappings)
  const setAccountMapping  = useStore(s => s.setAccountMapping)
  const seedAccountMappings = useStore(s => s.seedAccountMappings)

  // Index mappings by key for O(1) lookup
  const mappingByKey = useMemo(() => {
    const m = new Map<AccountMappingKey, string>()
    for (const map of accountMappings) m.set(map.key, map.accountCode)
    return m
  }, [accountMappings])

  // Filter accounts by type for each dropdown
  const accountsByType = useMemo(() => {
    const m: Record<AccountType, ChartAccount[]> = {
      asset: [], liability: [], equity: [], revenue: [], expense: [],
    }
    for (const a of chartAccounts) {
      if (a.isActive) m[a.type].push(a)
    }
    for (const k of Object.keys(m) as AccountType[]) {
      m[k].sort((a, b) => a.code.localeCompare(b.code))
    }
    return m
  }, [chartAccounts])

  if (chartAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-3" />
          <p className="text-gray-300 font-medium">{t.needsCoa}</p>
          <p className="text-gray-500 text-sm mt-2 max-w-md">{t.needsCoaHint}</p>
        </div>
      </div>
    )
  }

  function handleReset() {
    // seedAccountMappings is idempotent; clear by direct set first
    useStore.setState({ accountMappings: [] })
    seedAccountMappings()
  }

  const sections = SECTIONS(t)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={handleReset}>
          <Sparkles className="w-4 h-4" /> {t.seedDefaults}
        </button>
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.label} className="card">
            <h2 className="font-semibold text-yellow-400 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> {section.label}
            </h2>
            <div className="space-y-3">
              {section.keys.map(key => {
                const currentCode = mappingByKey.get(key) ?? ''
                const candidates = section.allowedTypes.flatMap(typ => accountsByType[typ])

                return (
                  <div key={key} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 md:gap-4 items-start md:items-center">
                    <div>
                      <p className="text-sm text-gray-200 font-medium">
                        {t.keyNames[key]}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.keyDescriptions[key]}
                      </p>
                    </div>
                    <select
                      className="input md:w-72"
                      value={currentCode}
                      onChange={e => setAccountMapping(key, e.target.value)}
                    >
                      <option value="">{t.notMapped}</option>
                      {candidates.map(acc => (
                        <option key={acc.id} value={acc.code}>
                          {acc.code} — {acc.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
