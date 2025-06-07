import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../../config/supabase'
import { Button, Input } from '../../components/ui'
import toast from 'react-hot-toast'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const watchPassword = watch('password')

  useEffect(() => {
    // Check if we have the required tokens
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      toast.error('Neplatný odkaz pro obnovení hesla')
      navigate('/login')
      return
    }

    // Set the session
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }, [searchParams, navigate])

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Hesla se neshodují')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) throw error

      toast.success('Heslo bylo úspěšně změněno')
      navigate('/login')
      
    } catch (error) {
      toast.error('Chyba při změně hesla: ' + error.message)
    } finally {
      setIsLoading(false)
    }
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
            Nové heslo
          </h2>
          <p className="mt-2 text-gray-600">
            Zadejte své nové heslo
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <Input
                {...register('password', { 
                  required: 'Heslo je povinné',
                  minLength: {
                    value: 6,
                    message: 'Heslo musí mít alespoň 6 znaků'
                  }
                })}
                label="Nové heslo"
                type={showPassword ? 'text' : 'password'}
                placeholder="Vaše nové heslo"
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

            <Input
              {...register('confirmPassword', { 
                required: 'Potvrzení hesla je povinné',
                validate: value => 
                  value === watchPassword || 'Hesla se neshodují'
              })}
              label="Potvrzení hesla"
              type={showPassword ? 'text' : 'password'}
              placeholder="Potvrďte nové heslo"
              icon="fas fa-lock"
              error={errors.confirmPassword?.message}
              required
            />

            {/* Password strength indicator */}
            {watchPassword && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Síla hesla:</div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength = getPasswordStrength(watchPassword)
                    return (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded ${
                          level <= strength
                            ? strength <= 2
                              ? 'bg-red-400'
                              : strength === 3
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
              size="lg"
              icon="fas fa-key"
            >
              {isLoading ? 'Měním heslo...' : 'Změnit heslo'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Helper function for password strength
const getPasswordStrength = (password) => {
  let strength = 0
  
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return Math.min(strength, 4)
}

export default ResetPasswordPage
