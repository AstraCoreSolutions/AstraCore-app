import React from 'react'
import Button from './Button'

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'Žádná data',
  emptyIcon = 'fas fa-inbox',
  onRowClick,
  className = '',
  striped = false,
  hover = true,
  ...props
}) => {
  const tableClasses = [
    'table w-full',
    striped ? 'table-striped' : '',
    hover ? 'table-hover' : '',
    className
  ].filter(Boolean).join(' ')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-500">Načítám data...</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <i className={`${emptyIcon} text-4xl text-gray-300 mb-4`} />
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className={tableClasses} {...props}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50
                  ${column.width ? `w-${column.width}` : ''}
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : ''}
                `}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={`
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                ${row._highlight ? 'bg-yellow-50' : ''}
                ${row._danger ? 'bg-red-50' : ''}
              `}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={column.key || colIndex}
                  className={`
                    px-6 py-4 whitespace-nowrap text-sm text-gray-900
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Table Actions component
export const TableActions = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Status Badge component for tables
export const StatusBadge = ({
  status,
  statusLabels = {},
  statusColors = {},
  className = '',
  ...props
}) => {
  const defaultColors = {
    active: 'badge-success',
    inactive: 'badge-warning',
    pending: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    planning: 'badge-info',
    on_hold: 'badge-warning',
    paid: 'badge-success',
    overdue: 'badge-danger',
    draft: 'badge-secondary'
  }

  const colorClass = statusColors[status] || defaultColors[status] || 'badge-secondary'
  const label = statusLabels[status] || status

  return (
    <span className={`badge ${colorClass} ${className}`} {...props}>
      {label}
    </span>
  )
}

// Currency Cell component
export const CurrencyCell = ({
  amount,
  currency = 'CZK',
  className = '',
  positive = false,
  negative = false,
  ...props
}) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  const colorClass = positive ? 'text-green-600' : negative ? 'text-red-600' : ''

  return (
    <span className={`font-mono font-semibold ${colorClass} ${className}`} {...props}>
      {formatCurrency(amount)}
    </span>
  )
}

// Date Cell component
export const DateCell = ({
  date,
  format = 'short',
  className = '',
  ...props
}) => {
  if (!date) return <span className="text-gray-400">-</span>

  const formatDate = (dateString) => {
    const d = new Date(dateString)
    
    if (format === 'short') {
      return d.toLocaleDateString('cs-CZ')
    } else if (format === 'long') {
      return d.toLocaleString('cs-CZ')
    } else if (format === 'relative') {
      const now = new Date()
      const diffInMs = now - d
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) return 'Dnes'
      if (diffInDays === 1) return 'Včera'
      if (diffInDays < 7) return `Před ${diffInDays} dny`
      return d.toLocaleDateString('cs-CZ')
    }
    
    return d.toLocaleDateString('cs-CZ')
  }

  return (
    <span className={className} {...props}>
      {formatDate(date)}
    </span>
  )
}

// Progress Cell component
export const ProgressCell = ({
  progress,
  showLabel = true,
  color = 'primary',
  className = '',
  ...props
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  }

  const progressValue = Math.min(Math.max(progress || 0, 0), 100)

  return (
    <div className={`flex items-center ${className}`} {...props}>
      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
          {progressValue}%
        </span>
      )}
    </div>
  )
}

// Action Button component for table rows
export const ActionButton = ({
  icon,
  tooltip,
  variant = 'ghost',
  size = 'sm',
  onClick,
  className = '',
  ...props
}) => {
  const handleClick = (e) => {
    e.stopPropagation() // Prevent row click when clicking action button
    onClick?.(e)
  }

  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      onClick={handleClick}
      title={tooltip}
      className={`${className}`}
      {...props}
    />
  )
}

export default Table
