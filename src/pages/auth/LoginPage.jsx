import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'
import { Button, Input } from '../../components/ui'
import { validateForm, validationSchemas } from '../../utils/validation'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isLoading, error, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Get redirect path from location state
  const from = location.state?.from?.pathname || '/dashboard'

  // Show error from location state (e.g., permission denied)
  useEffect(() => {
    if (location.state?.error) {
      toast.error(location.state.error)
    }
  }, [location.state])

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const onSubmit = async (data) => {
    // Clear previous errors
    clearError()

    // Validate form data
    const { isValid, errors: validationErrors } = validateForm(data, validationSchemas.login)
    
    if (!isValid) {
      Object.entries(validationErrors).forEach(([field, fieldErrors]) => {
        setError(field, { message: fieldErrors[0] })
      })
      return
    }

    try {
      const result = await signIn(data.email, data.password)
      
      if (result.success) {
        toast.success('Úspěšně přihlášen!')
        navigate(from, { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          
          {/* Brand */}
          <h1 className="text-3xl font-bold logo-gradient mb-2">
            AstraCore
          </h1>
          <p className="text-primary-600 font-medium mb-6">SOLUTIONS</p>
          
          <h2 className="text-2xl font-bold text-gray-900">
            Přihlášení do systému
          </h2>
          <p className="mt-2 text-gray-600">
            Zadejte své přihlašovací údaje
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <Input
              {...register('email')}
              label="E-mail"
              type="email"
              placeholder="vas.email@example.com"
              icon="fas fa-envelope"
              error={errors.email?.message}
              required
            />

            {/* Password */}
            <div className="relative">
              <Input
                {...register('password')}
                label="Heslo"
                type={showPassword ? 'text' : 'password'}
                placeholder="Vaše heslo"
                icon="fas fa-lock"
                error={errors.password?.message}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            {/* Global error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
              size="lg"
              icon="fas fa-sign-in-alt"
            >
              {isLoading ? 'Přihlašuji...' : 'Přihlásit se'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Problém s přihlášením? Kontaktujte administrátora.
            </p>
          </div>
        </div>

        {/* Version info */}
        <div className="text-center text-xs text-gray-400">
          AstraCore Solutions v2.0.0
        </div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-300 rounded-full opacity-20 blur-3xl" />
      </div>
    </div>
  )
}

export default LoginPage
