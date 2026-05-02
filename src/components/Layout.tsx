import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderKanban, Package, CreditCard,
  Landmark, FileCheck, ArrowLeftRight, Receipt, Truck, Zap, Menu, X,
  FileText, ClipboardList, HardHat, BarChart3, Shield, Settings, LogOut,
  ShoppingCart, BookOpen, RefreshCw, UserCheck, Scale, ClipboardCheck, LineChart, Link2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { t } from '../utils/translations'
import type { TranslationKey } from '../utils/translations'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { settings } = useStore()
  const isRTL = settings.language === 'ar'
  const lang = settings.language

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme ?? 'dark')
  }, [settings.theme])

  // Apply direction + lang to <html> so the entire document — including
  // any portal/print views — gets correct RTL/LTR context.
  useEffect(() => {
    document.documentElement.setAttribute('dir',  isRTL ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', lang)
  }, [isRTL, lang])

  const NAV_GROUPS = [
    {
      label: t('group.overview', lang),
      items: [
        { to: '/',           label: t('nav.dashboard', lang),         icon: LayoutDashboard },
        { to: '/reports',    label: t('nav.reports', lang),           icon: BarChart3       },
      ],
    },
    {
      label: t('group.work', lang),
      items: [
        { to: '/clients',           label: t('nav.clients', lang),         icon: Users           },
        { to: '/projects',          label: t('nav.projects', lang),        icon: FolderKanban    },
        { to: '/quotations',        label: t('nav.quotations', lang),      icon: FileText        },
        { to: '/work-orders',       label: t('nav.workOrders', lang),      icon: ClipboardList   },
        { to: '/sales-invoices',    label: t('nav.salesInvoices', lang),   icon: Receipt         },
        { to: '/client-statement',  label: t('nav.clientStatement', lang), icon: UserCheck       },
      ],
    },
    {
      label: t('group.people', lang),
      items: [
        { to: '/employees',  label: t('nav.employees', lang),         icon: HardHat         },
      ],
    },
    {
      label: t('group.inventory', lang),
      items: [
        { to: '/inventory',         label: t('nav.inventory', lang),       icon: Package         },
        { to: '/inventory-report',  label: t('nav.invReport', lang),       icon: BarChart3       },
      ],
    },
    {
      label: t('group.suppliers', lang),
      items: [
        { to: '/suppliers',          label: t('nav.suppliers', lang),          icon: Truck           },
        { to: '/purchase-invoices',  label: t('nav.purchaseInvoices', lang),   icon: ShoppingCart    },
        { to: '/supplier-statement', label: t('nav.supplierStatement', lang),  icon: BookOpen        },
      ],
    },
    {
      label: t('group.finance', lang),
      items: [
        { to: '/payments',        label: t('nav.payments', lang),       icon: CreditCard      },
        { to: '/receipts',        label: t('nav.receipts', lang),       icon: Receipt         },
        { to: '/banks',           label: t('nav.banks', lang),          icon: Landmark        },
        { to: '/checks',          label: t('nav.checks', lang),         icon: FileCheck       },
        { to: '/transfers',       label: t('nav.transfers', lang),      icon: ArrowLeftRight  },
        { to: '/chart-of-accounts',label: t('nav.chartOfAccounts', lang),icon: BookOpen       },
        { to: '/account-mappings',label: t('nav.accountMappings', lang),icon: Link2           },
        { to: '/journal-entries', label: t('nav.journalEntries', lang), icon: BookOpen        },
        { to: '/trial-balance',   label: t('nav.trialBalance', lang),   icon: ClipboardCheck  },
        { to: '/balance-sheet',   label: t('nav.balanceSheet', lang),   icon: Scale           },
        { to: '/income-statement',label: t('nav.incomeStatement', lang),icon: LineChart       },
        { to: '/exchange-rates',  label: t('nav.exchangeRates', lang),  icon: RefreshCw       },
        { to: '/bank-statement',  label: t('nav.bankStatement', lang),  icon: BarChart3       },
      ],
    },
    {
      label: t('group.other', lang),
      items: [
        { to: '/warranties', label: t('nav.warranties', lang),        icon: Shield          },
        { to: '/settings',   label: t('nav.settings', lang),          icon: Settings        },
      ],
    },
  ]

  function handleLogout() {
    localStorage.removeItem('app_authenticated')
    window.location.reload()
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 z-30
        ${isRTL ? 'right-0' : 'left-0'}
        w-60 bg-gray-900 border-gray-800
        ${isRTL ? 'border-l' : 'border-r'}
        flex flex-col transition-transform duration-200
        ${open
          ? 'translate-x-0'
          : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-gray-900" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight truncate">
              {settings.companyName || 'Electrician'}
            </p>
            <p className="text-[10px] text-gray-500">{t('footer.businessManager', lang)}</p>
          </div>
          <button
            className={`lg:hidden text-gray-400 hover:text-white ${isRTL ? 'mr-auto' : 'ml-auto'}`}
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 py-1.5">{group.label}</p>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      isActive
                        ? 'bg-yellow-500/10 text-yellow-400 font-medium'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="w-[16px] h-[16px] shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-800 flex items-center justify-between">
          <p className="text-[10px] text-gray-600">{t('footer.dataSaved', lang)} • v1.0</p>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile). The hamburger is the FIRST child so it lands at
            the inline-start: left in LTR, right in RTL. justify-between pushes
            the title block to the inline-end. dir="rtl" on <html> handles the
            flow direction natively — no JS branching needed. */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-sm text-white">{settings.companyName || 'Electrician Manager'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
