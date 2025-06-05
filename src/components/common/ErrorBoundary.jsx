import React from 'react'
import { Button } from '../ui'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Report to error reporting service if available
    if (window.reportError) {
      window.reportError(error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              {/* Error Icon */}
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-3xl text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Něco se pokazilo
              </h1>
              
              <p className="text-gray-600 mb-6">
                Omlouváme se, došlo k neočekávané chybě. Prosím zkuste obnovit stránku.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button 
                onClick={this.handleReload}
                variant="primary"
                size="lg"
                className="w-full"
                icon="fas fa-refresh"
              >
                Obnovit stránku
              </Button>
              
              <Button 
                onClick={this.handleReset}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Zkusit znovu
              </Button>
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Zobrazit technické detaily
                </summary>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs font-mono text-red-600 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  <div>
                    <strong>Stack trace:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    // No error, render children normally
    return this.props.children
  }
}

// Hook for functional components error handling
export const useErrorHandler = () => {
  const handleError = (error, errorInfo = {}) => {
    console.error('Error caught by error handler:', error, errorInfo)
    
    // Report to error service
    if (window.reportError) {
      window.reportError(error, errorInfo)
    }
    
    // Show user-friendly error message
    if (window.showErrorToast) {
      window.showErrorToast('Došlo k chybě. Prosím zkuste to znovu.')
    }
  }

  return handleError
}

// Simple error fallback component
export const ErrorFallback = ({ 
  error, 
  resetError, 
  title = 'Nastala chyba',
  message = 'Něco se pokazilo. Zkuste to prosím znovu.',
  showDetails = false 
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <i className="fas fa-exclamation-triangle text-2xl text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6">
        {message}
      </p>
      
      <div className="space-x-3">
        <Button onClick={resetError} variant="primary">
          Zkusit znovu
        </Button>
        
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Obnovit stránku
        </Button>
      </div>

      {showDetails && error && process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left max-w-lg mx-auto">
          <summary className="cursor-pointer text-sm text-gray-500">
            Technické detaily
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-red-600 overflow-auto">
            {error.toString()}
          </pre>
        </details>
      )}
    </div>
  )
}

// Async error boundary for handling async errors
export const AsyncErrorBoundary = ({ children, onError }) => {
  const [error, setError] = React.useState(null)

  const resetError = () => setError(null)

  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      setError(new Error(event.reason))
      onError?.(event.reason)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [onError])

  if (error) {
    return <ErrorFallback error={error} resetError={resetError} />
  }

  return children
}

export default ErrorBoundary
