import React from 'react'

const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'border-primary-500',
    white: 'border-white',
    gray: 'border-gray-500',
    success: 'border-green-500',
    danger: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500'
  }

  const classes = [
    'spinner',
    'animate-spin rounded-full border-4 border-gray-200 border-t-transparent',
    sizeClasses[size],
    colorClasses[color].replace('border-', 'border-t-'),
    className
  ].filter(Boolean).join(' ')

  return <div className={classes} {...props} />
}

// Overlay Spinner for full page loading
export const SpinnerOverlay = ({
  show = true,
  message = 'Načítám...',
  backdrop = true,
  className = '',
  ...props
}) => {
  if (!show) return null

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${backdrop ? 'bg-white bg-opacity-75' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="text-center">
        <Spinner size="xl" />
        {message && (
          <p className="mt-4 text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  )
}

// Inline Spinner for buttons and small areas
export const InlineSpinner = ({
  size = 'sm',
  className = '',
  ...props
}) => {
  return (
    <Spinner 
      size={size} 
      className={`inline-block ${className}`} 
      {...props} 
    />
  )
}

// Spinner with text
export const SpinnerWithText = ({
  text = 'Načítám...',
  position = 'right',
  size = 'md',
  className = '',
  ...props
}) => {
  const flexDirection = position === 'top' ? 'flex-col' : 'flex-row'
  const spacing = position === 'top' ? 'space-y-2' : 'space-x-3'

  return (
    <div className={`flex items-center ${flexDirection} ${spacing} ${className}`} {...props}>
      <Spinner size={size} />
      <span className="text-gray-600">{text}</span>
    </div>
  )
}

// Pulse Spinner (alternative animation)
export const PulseSpinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'bg-primary-500',
    white: 'bg-white',
    gray: 'bg-gray-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }

  const classes = [
    'animate-pulse rounded-full',
    sizeClasses[size],
    colorClasses[color],
    className
  ].filter(Boolean).join(' ')

  return <div className={classes} {...props} />
}

// Dots Spinner
export const DotsSpinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  const dotSizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  }

  const colorClasses = {
    primary: 'bg-primary-500',
    white: 'bg-white',
    gray: 'bg-gray-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }

  const dotClasses = [
    'rounded-full animate-bounce',
    dotSizeClasses[size],
    colorClasses[color]
  ].join(' ')

  return (
    <div className={`flex space-x-1 ${className}`} {...props}>
      <div className={dotClasses} style={{ animationDelay: '0ms' }} />
      <div className={dotClasses} style={{ animationDelay: '150ms' }} />
      <div className={dotClasses} style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// Skeleton loader
export const Skeleton = ({
  width = 'full',
  height = '4',
  className = '',
  animated = true,
  ...props
}) => {
  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4'
  }

  const heightClasses = {
    '2': 'h-2',
    '3': 'h-3',
    '4': 'h-4',
    '5': 'h-5',
    '6': 'h-6',
    '8': 'h-8',
    '10': 'h-10',
    '12': 'h-12'
  }

  const classes = [
    'bg-gray-200 rounded',
    widthClasses[width] || `w-${width}`,
    heightClasses[height] || `h-${height}`,
    animated ? 'animate-pulse' : '',
    className
  ].filter(Boolean).join(' ')

  return <div className={classes} {...props} />
}

export default Spinner
