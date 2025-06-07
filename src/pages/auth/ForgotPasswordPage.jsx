import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuthStore from '../../store/authStore'
import { Button, Input } from '../../components/ui'
import toast from 'react-hot-toast'

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuthStore()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await resetPassword(data.email)
      
      if (result.success) {
        setIsSubmitted(true)
        toast.success('E-mail pro obnovení hesla byl odeslán')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Chyba při odesílání e-mailu')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-2xl flex items-center justify-center">
              <i className="fas fa-check text-3xl text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              E-mail odeslán
            </h2>
            
            <p className="text-gray-600 mb-6">
              Zkontrolujte svou e-mailovou schránku a následujte instrukce pro obnovení hesla.
            </p>
            
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Zpět na přihlášení
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          
          <h1 className="text-3xl font-bold logo-gradient mb-2">
            AstraCore
          </h1>
          <p className="text-primary-600 font-medium mb-6">SOLUTIONS</p>
          
          <h2 className="text-2xl font-bold text-gray-900">
            Zapomenuté heslo
          </h2>
          <p className="mt-2 text-gray-600">
            Zadejte svou e-mailovou adresu a my vám pošleme odkaz pro obnovení hesla
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register('email', { 
                required: 'E-mail je povinný',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Neplatný formát e-mailu'
                }
              })}
              label="E-mailová adresa"
              type="email"
              placeholder="vas.email@example.com"
              icon="fas fa-envelope"
              error={errors.email?.message}
              required
            />

            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
              size="lg"
              icon="fas fa-paper-plane"
            >
              {isLoading ? 'Odesílám...' : 'Odeslat odkaz'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              ← Zpět na přihlášení
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
