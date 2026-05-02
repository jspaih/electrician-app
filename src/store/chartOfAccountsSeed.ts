import type { ChartAccount } from '../types'

/**
 * Default Chart of Accounts for an electrician business.
 *
 * Numbering convention (industry-standard):
 *   1xxx — Assets
 *   2xxx — Liabilities
 *   3xxx — Equity
 *   4xxx — Revenue
 *   5xxx — Expenses
 *
 * Inserted on first store hydration if no accounts exist.
 * `id` and `createdAt` are filled in by the seeder. `isSystem: true`
 * accounts cannot be deleted from the UI.
 */
type SeedRow = Omit<ChartAccount, 'id' | 'createdAt'>

export const DEFAULT_CHART_OF_ACCOUNTS: SeedRow[] = [
  // ── ASSETS (1xxx) ─────────────────────────────────────────────────
  { code: '1000', nameEn: 'Assets',                  nameAr: 'الأصول',                type: 'asset',     isSystem: true, isActive: true },

  { code: '1100', nameEn: 'Cash on Hand',            nameAr: 'النقد في الصندوق',      type: 'asset', parentCode: '1000', isSystem: true, isActive: true },
  { code: '1110', nameEn: 'Petty Cash',              nameAr: 'المصروفات النثرية',    type: 'asset', parentCode: '1000', isSystem: true, isActive: true },
  { code: '1200', nameEn: 'Bank Accounts',           nameAr: 'الحسابات البنكية',     type: 'asset', parentCode: '1000', isSystem: true, isActive: true },
  { code: '1210', nameEn: 'Current Bank Account',    nameAr: 'الحساب الجاري',        type: 'asset', parentCode: '1200', isSystem: true, isActive: true },
  { code: '1300', nameEn: 'Accounts Receivable',     nameAr: 'الذمم المدينة',        type: 'asset', parentCode: '1000', isSystem: true, isActive: true },
  { code: '1310', nameEn: 'Checks in Box',           nameAr: 'شيكات في الصندوق',    type: 'asset', parentCode: '1000', isSystem: true, isActive: true },
  { code: '1320', nameEn: 'Postdated Checks',        nameAr: 'شيكات آجلة',           type: 'asset', parentCode: '1000', isSystem: true, isActive: true },
  { code: '1400', nameEn: 'Inventory',               nameAr: 'المخزون',              type: 'asset', parentCode: '1000', isSystem: true, isActive: true },

  { code: '1500', nameEn: 'Fixed Assets',            nameAr: 'الأصول الثابتة',       type: 'asset', parentCode: '1000', isSystem: true, isActive: true },
  { code: '1510', nameEn: 'Tools & Equipment',       nameAr: 'الأدوات والمعدات',     type: 'asset', parentCode: '1500', isSystem: true, isActive: true },
  { code: '1520', nameEn: 'Vehicles',                nameAr: 'المركبات',             type: 'asset', parentCode: '1500', isSystem: false, isActive: true },
  { code: '1530', nameEn: 'Office Equipment',        nameAr: 'معدات مكتبية',         type: 'asset', parentCode: '1500', isSystem: false, isActive: true },
  { code: '1590', nameEn: 'Accumulated Depreciation',nameAr: 'مجمع الإهلاك',        type: 'asset', parentCode: '1500', isSystem: true, isActive: true },

  // ── LIABILITIES (2xxx) ────────────────────────────────────────────
  { code: '2000', nameEn: 'Liabilities',             nameAr: 'الخصوم',                type: 'liability', isSystem: true, isActive: true },
  { code: '2100', nameEn: 'Accounts Payable',        nameAr: 'الذمم الدائنة',        type: 'liability', parentCode: '2000', isSystem: true, isActive: true },
  { code: '2110', nameEn: 'Checks Payable',          nameAr: 'شيكات مستحقة الدفع',  type: 'liability', parentCode: '2000', isSystem: true, isActive: true },
  { code: '2200', nameEn: 'VAT Payable',             nameAr: 'ضريبة القيمة المضافة', type: 'liability', parentCode: '2000', isSystem: true, isActive: true },
  { code: '2300', nameEn: 'Accrued Expenses',        nameAr: 'مصروفات مستحقة',       type: 'liability', parentCode: '2000', isSystem: true, isActive: true },
  { code: '2310', nameEn: 'Accrued Salaries',        nameAr: 'رواتب مستحقة',         type: 'liability', parentCode: '2300', isSystem: true, isActive: true },
  { code: '2400', nameEn: 'Customer Deposits',       nameAr: 'دفعات العملاء المقدمة',type: 'liability', parentCode: '2000', isSystem: false, isActive: true },
  { code: '2500', nameEn: 'Short-term Loans',        nameAr: 'قروض قصيرة الأجل',    type: 'liability', parentCode: '2000', isSystem: false, isActive: true },
  { code: '2600', nameEn: 'Long-term Loans',         nameAr: 'قروض طويلة الأجل',    type: 'liability', parentCode: '2000', isSystem: false, isActive: true },

  // ── EQUITY (3xxx) ─────────────────────────────────────────────────
  { code: '3000', nameEn: 'Equity',                  nameAr: 'حقوق الملكية',         type: 'equity',    isSystem: true, isActive: true },
  { code: '3100', nameEn: "Owner's Capital",         nameAr: 'رأس مال المالك',       type: 'equity', parentCode: '3000', isSystem: true, isActive: true },
  { code: '3200', nameEn: 'Retained Earnings',       nameAr: 'الأرباح المحتجزة',     type: 'equity', parentCode: '3000', isSystem: true, isActive: true },
  { code: '3300', nameEn: "Owner's Drawings",        nameAr: 'مسحوبات المالك',       type: 'equity', parentCode: '3000', isSystem: true, isActive: true },
  { code: '3400', nameEn: 'Current Year Profit/Loss',nameAr: 'أرباح/خسائر السنة',   type: 'equity', parentCode: '3000', isSystem: true, isActive: true },

  // ── REVENUE (4xxx) ────────────────────────────────────────────────
  { code: '4000', nameEn: 'Revenue',                 nameAr: 'الإيرادات',            type: 'revenue',   isSystem: true, isActive: true },
  { code: '4100', nameEn: 'Service Revenue',         nameAr: 'إيرادات الخدمات',      type: 'revenue', parentCode: '4000', isSystem: true, isActive: true },
  { code: '4110', nameEn: 'Electrical Installation', nameAr: 'تركيبات كهربائية',     type: 'revenue', parentCode: '4100', isSystem: true, isActive: true },
  { code: '4120', nameEn: 'Maintenance Services',    nameAr: 'خدمات الصيانة',        type: 'revenue', parentCode: '4100', isSystem: false, isActive: true },
  { code: '4130', nameEn: 'Consultation Fees',       nameAr: 'رسوم الاستشارة',       type: 'revenue', parentCode: '4100', isSystem: false, isActive: true },
  { code: '4200', nameEn: 'Sales Revenue',           nameAr: 'إيرادات المبيعات',     type: 'revenue', parentCode: '4000', isSystem: true, isActive: true },
  { code: '4210', nameEn: 'Materials Sales',         nameAr: 'مبيعات المواد',        type: 'revenue', parentCode: '4200', isSystem: true, isActive: true },
  { code: '4300', nameEn: 'Other Income',            nameAr: 'دخل آخر',              type: 'revenue', parentCode: '4000', isSystem: false, isActive: true },
  { code: '4310', nameEn: 'Discount Received',       nameAr: 'خصم مكتسب',            type: 'revenue', parentCode: '4300', isSystem: false, isActive: true },

  // ── EXPENSES (5xxx) ───────────────────────────────────────────────
  { code: '5000', nameEn: 'Expenses',                nameAr: 'المصروفات',             type: 'expense',   isSystem: true, isActive: true },

  { code: '5100', nameEn: 'Cost of Materials',       nameAr: 'تكلفة المواد',         type: 'expense', parentCode: '5000', isSystem: true, isActive: true },
  { code: '5110', nameEn: 'Direct Materials Used',   nameAr: 'مواد مباشرة مستخدمة',  type: 'expense', parentCode: '5100', isSystem: true, isActive: true },
  { code: '5120', nameEn: 'Materials Purchased',     nameAr: 'مشتريات المواد',       type: 'expense', parentCode: '5100', isSystem: true, isActive: true },

  { code: '5200', nameEn: 'Labor Cost',              nameAr: 'تكاليف العمالة',       type: 'expense', parentCode: '5000', isSystem: true, isActive: true },
  { code: '5210', nameEn: 'Direct Labor',            nameAr: 'عمالة مباشرة',         type: 'expense', parentCode: '5200', isSystem: true, isActive: true },
  { code: '5220', nameEn: 'Subcontractor Cost',      nameAr: 'تكاليف المقاولين',     type: 'expense', parentCode: '5200', isSystem: false, isActive: true },

  { code: '5300', nameEn: 'Operating Expenses',      nameAr: 'المصروفات التشغيلية',  type: 'expense', parentCode: '5000', isSystem: true, isActive: true },
  { code: '5310', nameEn: 'Rent',                    nameAr: 'الإيجار',              type: 'expense', parentCode: '5300', isSystem: false, isActive: true },
  { code: '5320', nameEn: 'Utilities',               nameAr: 'الكهرباء والمياه',     type: 'expense', parentCode: '5300', isSystem: false, isActive: true },
  { code: '5330', nameEn: 'Vehicle & Transport',     nameAr: 'نقل ومواصلات',         type: 'expense', parentCode: '5300', isSystem: false, isActive: true },
  { code: '5340', nameEn: 'Fuel',                    nameAr: 'وقود',                  type: 'expense', parentCode: '5300', isSystem: false, isActive: true },
  { code: '5350', nameEn: 'Equipment Maintenance',   nameAr: 'صيانة المعدات',        type: 'expense', parentCode: '5300', isSystem: false, isActive: true },
  { code: '5360', nameEn: 'Office Supplies',         nameAr: 'مستلزمات مكتبية',      type: 'expense', parentCode: '5300', isSystem: false, isActive: true },
  { code: '5370', nameEn: 'Mobile & Internet',       nameAr: 'هاتف وإنترنت',         type: 'expense', parentCode: '5300', isSystem: false, isActive: true },
  { code: '5380', nameEn: 'Insurance',               nameAr: 'تأمين',                 type: 'expense', parentCode: '5300', isSystem: false, isActive: true },

  { code: '5400', nameEn: 'Financial Expenses',      nameAr: 'المصروفات المالية',    type: 'expense', parentCode: '5000', isSystem: true, isActive: true },
  { code: '5410', nameEn: 'Bank Charges & Fees',     nameAr: 'عمولات بنكية',         type: 'expense', parentCode: '5400', isSystem: true, isActive: true },
  { code: '5420', nameEn: 'Interest Expense',        nameAr: 'فوائد الديون',         type: 'expense', parentCode: '5400', isSystem: false, isActive: true },
  { code: '5430', nameEn: 'Currency Exchange Loss',  nameAr: 'خسارة فروق العملة',   type: 'expense', parentCode: '5400', isSystem: false, isActive: true },

  { code: '5500', nameEn: 'Depreciation',            nameAr: 'الإهلاك',               type: 'expense', parentCode: '5000', isSystem: true, isActive: true },
  { code: '5510', nameEn: 'Equipment Depreciation',  nameAr: 'إهلاك المعدات',        type: 'expense', parentCode: '5500', isSystem: true, isActive: true },

  { code: '5900', nameEn: 'Miscellaneous Expenses',  nameAr: 'مصروفات متنوعة',       type: 'expense', parentCode: '5000', isSystem: false, isActive: true },
]
