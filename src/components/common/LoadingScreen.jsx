import React from 'react'
import { Spinner } from '../ui'

const LoadingScreen = ({
  message = 'Načítání aplikace...',
  showLogo = true,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center bg-white
        ${className}
      `}
      {...props}
    >
      <div className="text-center">
        {showLogo && (
          <div className="mb-8">
            {/* AstraCore Logo */}
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">A</span>
            </div>
            <h1 className="text-2xl font-bold logo-gradient">
              AstraCore
            </h1>
            <p className="text-primary-600 font-medium">SOLUTIONS</p>
          </div>
        )}
        
        <div className="space-y-4">
          <Spinner size="xl" color="primary" />
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
        
        {/* Progress dots animation */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-300 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary-200 rounded-full blur-3xl" />
      </div>
    </div>
  )
}

// Minimal loading screen for page transitions
export const PageLoadingScreen = ({
  message = 'Načítám...',
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`
        flex items-center justify-center min-h-[400px]
        ${className}
      `}
      {...props}
    >
      <div className="text-center">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Loading screen for modals and cards
export const CardLoadingScreen = ({
  lines = 3,
  className = '',
  ...props
}) => {
  return (
    <div className={`animate-pulse ${className}`} {...props}>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}

// Loading screen with custom content
export const CustomLoadingScreen = ({
  children,
  overlay = true,
  className = '',
  ...props
}) => {
  const containerClasses = overlay 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90'
    : 'flex items-center justify-center min-h-[200px]'

  return (
    <div className={`${containerClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

export default LoadingScreen
