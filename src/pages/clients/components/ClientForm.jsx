import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import useClientsStore from '../../../store/clientsStore'
import { Button, Spinner } from '../../../components/ui'
import toast from 'react-hot-toast'

const ClientForm = ({ client, onSuccess, onCancel }) => {
  const { createClient, updateClient, validateICO, isLoading } = useClientsStore()
  const [icoValidation, setIcoValidation] = useState({ isValid: true, message: '' })
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: client || {
      name: '',
      type: 'company',
      email: '',
      phone: '',
      ico: '',
      dic: '',
      address: '',
      city: '',
      postal_code: '',
      contact_person: '',
      notes: ''
    }
  })

  const watchedType = watch('type')
  const watchedICO = watch('ico')

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      reset(client)
    }
  }, [client, reset])

  // Validate ICO when it changes
  useEffect(() => {
    const validateIcoAsync = async () => {
      if (watchedICO && watchedICO.length >= 8) {
        const result = await validateICO(watchedICO, client?.id)
        if (result.success) {
          setIcoValidation({
            isValid: result.data.isValid,
            message: result.data.isValid ? '' : `IČO již existuje u klienta: ${result.data.existingClient?.name}`
          })
        }
      } else {
        setIcoValidation({ isValid: true, message: '' })
      }
    }

    const timeoutId = setTimeout(validateIcoAsync, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedICO, validateICO, client?.id])

  const onSubmit = async (data) => {
    // Validate ICO if provided
    if (data.ico && !icoValidation.isValid) {
      toast.error('IČO již existuje')
      return
    }

    let result
    if (client) {
      result = await updateClient(client.id, data)
    } else {
      result = await createClient(data)
    }

    if (result.success) {
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Název / Jméno *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Název je povinný' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Název firmy nebo jméno osoby"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Typ *
          </label>
          <select
            {...register('type', { required: 'Typ je povinný' })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.type ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="company">Firma</option>
            <option value="individual">Fyzická osoba</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kontaktní osoba
          </label>
          <input
            type="text"
            {...register('contact_person')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Jméno kontaktní osoby"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register('email', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Neplatný email'
              }
            })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="+420 123 456 789"
          />
        </div>
      </div>

      {/* Company Information */}
      {watchedType === 'company' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IČO
            </label>
            <input
              type="text"
              {...register('ico', {
                pattern: {
                  value: /^\d{8}$/,
                  message: 'IČO musí mít 8 číslic'
                }
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.ico || !icoValidation.isValid ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="12345678"
            />
            {errors.ico && (
              <p className="mt-1 text-sm text-red-600">{errors.ico.message}</p>
            )}
            {!icoValidation.isValid && (
              <p className="mt-1 text-sm text-red-600">{icoValidation.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DIČ
            </label>
            <input
              type="text"
              {...register('dic')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="CZ12345678"
            />
          </div>
        </div>
      )}

      {/* Address */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresa
          </label>
          <input
            type="text"
            {...register('address')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ulice a číslo popisné"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Město
            </label>
            <input
              type="text"
              {...register('city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Praha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PSČ
            </label>
            <input
              type="text"
              {...register('postal_code', {
                pattern: {
                  value: /^\d{5}$/,
                  message: 'PSČ musí mít 5 číslic'
                }
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.postal_code ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="12000"
            />
            {errors.postal_code && (
              <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Poznámky
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Dodatečné poznámky..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={isLoading}
        >
          Zrušit
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !icoValidation.isValid}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {client ? 'Aktualizuji...' : 'Vytvářím...'}
            </>
          ) : (
            client ? 'Aktualizovat' : 'Vytvořit'
          )}
        </Button>
      </div>
    </form>
  )
}

export default ClientForm
