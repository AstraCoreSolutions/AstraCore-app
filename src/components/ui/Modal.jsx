import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
  className = ''
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose()
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleBackdropClick}
      >
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel */}
        <div 
          className={`
            inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl 
            transform transition-all sm:my-8 sm:align-middle w-full
            ${sizeClasses[size]} ${className}
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    icon="fas fa-times"
                    className="text-gray-400 hover:text-gray-600"
                  />
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="bg-white px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                {footer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// Predefined modal variants
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Potvrzení',
  message,
  confirmText = 'Potvrdit',
  cancelText = 'Zrušit',
  variant = 'danger',
  loading = false
}) => {
  const footer = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant}
        onClick={onConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
      closeOnBackdrop={!loading}
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  )
}

export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'OK'
}) => {
  const icons = {
    success: 'fas fa-check-circle text-green-500',
    error: 'fas fa-times-circle text-red-500',
    warning: 'fas fa-exclamation-triangle text-yellow-500',
    info: 'fas fa-info-circle text-blue-500'
  }

  const footer = (
    <Button onClick={onClose}>
      {buttonText}
    </Button>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="flex items-start space-x-3">
        <i className={`${icons[variant]} text-2xl mt-1`} />
        <p className="text-gray-600 flex-1">{message}</p>
      </div>
    </Modal>
  )
}

export default Modal
