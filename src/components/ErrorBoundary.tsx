import React from 'react'
import { AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { reportError, diagnosticsSnapshot } from '../services/errorSafety'
import { backupData } from '../services/backup'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?:   Error
}

/**
 * Top-level safety net. Catches any render-time error in the tree
 * below it, logs to errorSafety, and shows a recovery UI instead of
 * a white screen. The user can:
 *   - Reload the app
 *   - Download a backup of their localStorage (so support can help)
 *   - Copy diagnostics for the developer
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError('ErrorBoundary', error)
    // eslint-disable-next-line no-console
    console.error('Component stack:', info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleBackup = () => {
    try {
      backupData({ filenamePrefix: 'pre-recovery-backup' })
    } catch (err) {
      reportError('ErrorBoundary.handleBackup', err)
    }
  }

  handleCopyDiagnostics = async () => {
    try {
      const snap = diagnosticsSnapshot()
      const text = JSON.stringify({
        error: this.state.error?.message,
        stack: this.state.error?.stack,
        snapshot: snap,
      }, null, 2)
      await navigator.clipboard.writeText(text)
      alert('Diagnostics copied to clipboard')
    } catch (err) {
      reportError('ErrorBoundary.handleCopyDiagnostics', err)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gray-900 border border-red-900/40 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Something went wrong</h1>
              <p className="text-gray-500 text-xs">Your data is safe — nothing was lost</p>
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-5 text-xs font-mono text-red-300 break-all max-h-32 overflow-y-auto">
            {this.state.error?.message ?? 'Unknown error'}
          </div>

          <p className="text-gray-400 text-sm mb-5">
            The app hit an unexpected error. Try reloading first. If the problem
            persists, download a backup so we can investigate without risking your data.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={this.handleReload}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload the app
            </button>
            <button
              onClick={this.handleBackup}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download backup
            </button>
            <button
              onClick={this.handleCopyDiagnostics}
              className="text-xs text-gray-500 hover:text-gray-300 underline mt-1"
            >
              Copy diagnostics
            </button>
          </div>
        </div>
      </div>
    )
  }
}
