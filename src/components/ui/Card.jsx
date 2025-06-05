import React from 'react'

const Card = ({
  children,
  className = '',
  hover = false,
  padding = true,
  shadow = 'sm',
  rounded = 'xl',
  border = true,
  background = 'white',
  ...props
}) => {
  const baseClasses = 'card'
  
  const hoverClasses = hover ? 'card-hover' : ''
  
  const paddingClasses = padding ? 'p-6' : ''
  
  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }
  
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }
  
  const borderClasses = border ? 'border border-gray-200' : 'border-0'
  
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary-50',
    transparent: 'bg-transparent'
  }
  
  const classes = [
    baseClasses,
    backgroundClasses[background],
    shadowClasses[shadow],
    roundedClasses[rounded],
    borderClasses,
    hoverClasses,
    paddingClasses,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Card Header component
export const CardHeader = ({
  children,
  className = '',
  border = true,
  padding = true,
  ...props
}) => {
  const borderClasses = border ? 'border-b border-gray-200' : ''
  const paddingClasses = padding ? 'px-6 py-4' : ''
  
  const classes = [
    'card-header',
    borderClasses,
    paddingClasses,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Card Body component
export const CardBody = ({
  children,
  className = '',
  padding = true,
  ...props
}) => {
  const paddingClasses = padding ? 'px-6 py-4' : ''
  
  const classes = [
    'card-body',
    paddingClasses,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Card Footer component
export const CardFooter = ({
  children,
  className = '',
  border = true,
  padding = true,
  background = 'gray',
  ...props
}) => {
  const borderClasses = border ? 'border-t border-gray-200' : ''
  const paddingClasses = padding ? 'px-6 py-4' : ''
  const backgroundClasses = background === 'gray' ? 'bg-gray-50' : 'bg-white'
  
  const classes = [
    'card-footer',
    backgroundClasses,
    borderClasses,
    paddingClasses,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Stat Card component for dashboard
export const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  change,
  changeType = 'increase',
  className = '',
  ...props
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    gray: 'bg-gray-500'
  }
  
  const changeClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  }
  
  const changeIcons = {
    increase: 'fas fa-arrow-up',
    decrease: 'fas fa-arrow-down',
    neutral: 'fas fa-minus'
  }
  
  return (
    <Card className={`stat-card ${className}`} hover {...props}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} bg-opacity-10 flex items-center justify-center`}>
            <i className={`${icon} text-xl ${colorClasses[color].replace('bg-', 'text-')}`} />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center text-sm ${changeClasses[changeType]}`}>
              <i className={`${changeIcons[changeType]} mr-1`} />
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Project Card component
export const ProjectCard = ({
  project,
  onClick,
  className = '',
  ...props
}) => {
  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    on_hold: 'bg-yellow-100 text-yellow-800'
  }
  
  const isOverdue = project.end_date && new Date(project.end_date) < new Date() && project.status === 'active'
  
  return (
    <Card 
      className={`cursor-pointer ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${className}`} 
      hover 
      onClick={onClick}
      {...props}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
        <span className={`badge ${statusColors[project.status]} ml-2`}>
          {project.status}
        </span>
      </div>
      
      {project.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
      )}
      
      <div className="space-y-2">
        {project.client && (
          <div className="flex items-center text-sm text-gray-500">
            <i className="fas fa-user mr-2" />
            <span>{project.client.name}</span>
          </div>
        )}
        
        {project.end_date && (
          <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
            <i className={`fas fa-calendar mr-2 ${isOverdue ? 'text-red-500' : ''}`} />
            <span>{new Date(project.end_date).toLocaleDateString('cs-CZ')}</span>
            {isOverdue && <span className="ml-1 font-medium">• Po termínu</span>}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Progress</span>
          <span className="text-sm font-medium">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(project.progress || 0, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

export default Card
