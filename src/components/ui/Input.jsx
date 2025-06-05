import React, { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  className = '',
  icon,
  iconPosition = 'left',
  suffix,
  prefix,
  rows = 3,
  ...props
}, ref) => {
  const baseInputClasses = 'form-input'
  const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : ''
  
  const inputClasses = [
    baseInputClasses,
    errorClasses,
    disabledClasses,
    icon && iconPosition === 'left' ? 'pl-10' : '',
    icon && iconPosition === 'right' ? 'pr-10' : '',
    prefix ? 'pl-12' : '',
    suffix ? 'pr-12' : '',
    className
  ].filter(Boolean).join(' ')

  const renderInput = () => {
    const commonProps = {
      ref,
      type,
      value,
      onChange,
      onBlur,
      placeholder,
      disabled,
      required,
      className: inputClasses,
      ...props
    }

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={rows}
        />
      )
    }

    if (type === 'select') {
      return (
        <select {...commonProps}>
          {props.children}
        </select>
      )
    }

    return <input {...commonProps} />
  }

  return (
    <div className={`${type === 'hidden' ? 'hidden' : ''}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{prefix}</span>
          </div>
        )}
        
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className={`${icon} text-gray-400`} />
          </div>
        )}
        
        {renderInput()}
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <i className={`${icon} text-gray-400`} />
          </div>
        )}
        
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{suffix}</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="form-error">
          {Array.isArray(error) ? error[0] : error}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
