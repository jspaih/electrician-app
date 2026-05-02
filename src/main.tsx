import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { runMigrations } from './migrations'
import { installGlobalHandlers } from './services/errorSafety'
import { ErrorBoundary } from './components/ErrorBoundary'

// Step 8: catch any unhandled error / promise rejection at the
// window boundary so nothing slips past silently.
installGlobalHandlers()

/**
 * Run schema migrations before the UI mounts. If migrations fail,
 * the in-memory rollback inside safeMigrate has already restored
 * localStorage to its pre-migration state, so the app is still
 * usable at the previous schema version. We log and proceed.
 *
 * We deliberately do NOT block the render forever on a failure —
 * the owner needs to be able to reach Settings → Export to
 * preserve their data even if something goes wrong.
 */
async function bootstrap() {
  try {
    await runMigrations()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[bootstrap] migrations failed (rolled back):', err)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

bootstrap()
