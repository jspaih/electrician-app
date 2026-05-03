import { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useT } from './hooks/useT'
import Layout from './components/Layout'
import Login from './components/Login'
import Clients from './components/Clients'
import Projects from './components/Projects'
import Inventory from './components/Inventory'
import Payments from './components/Payments'
import Receipts from './components/Receipts'
import Banks from './components/Banks'
import Checks from './components/Checks'
import Transfers from './components/Transfers'
import Suppliers from './components/Suppliers'
import Quotations from './components/Quotations'
import WorkOrders from './components/WorkOrders'
import Employees from './components/Employees'
import Warranties from './components/Warranties'
import Settings from './components/Settings'
import PurchaseInvoices from './components/PurchaseInvoices'
import SupplierStatement from './components/SupplierStatement'
import InventoryReport from './components/InventoryReport'
import ExchangeRates from './components/ExchangeRates'
import SalesInvoices from './components/SalesInvoices'
import ClientStatement from './components/ClientStatement'
import BankStatement from './components/BankStatement'
import JournalEntries from './components/JournalEntries'
import ChartOfAccounts from './components/ChartOfAccounts'
import TrialBalance from './components/TrialBalance'
import BalanceSheet from './components/BalanceSheet'
import IncomeStatement from './components/IncomeStatement'
import AccountMappings from './components/AccountMappings'
import BankReconciliation from './components/BankReconciliation'

// Step 6: lazy-load the heavy chart/aggregation views so the
// initial bundle stays small. Routes other than these render
// instantly; Dashboard/Reports fetch on first visit.
const Dashboard = lazy(() => import('./components/Dashboard'))
const Reports   = lazy(() => import('./components/Reports'))

// Minimal, unobtrusive fallback — matches the app's dark theme
// so there's no visual flash during the chunk fetch.
const LOADING_L = {
  en: { loading: 'Loading…' },
  ar: { loading: 'جاري التحميل…' },
} as const

function RouteFallback() {
  const t = useT(LOADING_L)
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="text-gray-500 text-sm">{t.loading}</div>
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem('app_authenticated') === 'true'
  )

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients"      element={<Clients />} />
            <Route path="projects"     element={<Projects />} />
            <Route path="quotations"   element={<Quotations />} />
            <Route path="work-orders"  element={<WorkOrders />} />
            <Route path="employees"    element={<Employees />} />
            <Route path="inventory"    element={<Inventory />} />
            <Route path="suppliers"    element={<Suppliers />} />
            <Route path="payments"     element={<Payments />} />
            <Route path="receipts"     element={<Receipts />} />
            <Route path="banks"        element={<Banks />} />
            <Route path="checks"       element={<Checks />} />
            <Route path="transfers"    element={<Transfers />} />
            <Route path="journal-entries"     element={<JournalEntries />} />
            <Route path="chart-of-accounts"   element={<ChartOfAccounts />} />
            <Route path="trial-balance"       element={<TrialBalance />} />
            <Route path="balance-sheet"       element={<BalanceSheet />} />
            <Route path="income-statement"    element={<IncomeStatement />} />
            <Route path="account-mappings"    element={<AccountMappings />} />
            <Route path="reports"      element={<Reports />} />
            <Route path="warranties"          element={<Warranties />} />
            <Route path="settings"            element={<Settings />} />
            <Route path="purchase-invoices"   element={<PurchaseInvoices />} />
            <Route path="supplier-statement"  element={<SupplierStatement />} />
            <Route path="inventory-report"    element={<InventoryReport />} />
            <Route path="sales-invoices"      element={<SalesInvoices />} />
            <Route path="exchange-rates"      element={<ExchangeRates />} />
            <Route path="client-statement"    element={<ClientStatement />} />
            <Route path="bank-statement"      element={<BankStatement />} />
            <Route path="bank-reconciliation" element={<BankReconciliation />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
