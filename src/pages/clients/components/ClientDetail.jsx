import React from 'react'
import { Button, Card } from '../../../components/ui'
import { formatDate } from '../../../utils/helpers'

const ClientDetail = ({ client, onEdit, onClose }) => {
  if (!client) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <i className={`fas ${client.type === 'company' ? 'fa-building' : 'fa-user'} text-primary-600 text-xl`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-500">
              {client.type === 'company' ? 'Firma' : 'Fyzická osoba'}
            </p>
          </div>
        </div>
        <Button onClick={onEdit} variant="outline">
          <i className="fas fa-edit mr-2" />
          Upravit
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Základní informace
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Název / Jméno
              </label>
              <p className="text-sm text-gray-900">{client.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Typ
              </label>
              <p className="text-sm text-gray-900">
                {client.type === 'company' ? 'Firma' : 'Fyzická osoba'}
              </p>
            </div>

            {client.contact_person && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Kontaktní osoba
                </label>
                <p className="text-sm text-gray-900">{client.contact_person}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Datum vytvoření
              </label>
              <p className="text-sm text-gray-900">{formatDate(client.created_at)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Kontaktní informace
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.email && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900 flex items-center">
                  <i className="fas fa-envelope mr-2 text-gray-400" />
                  {client.email}
                </p>
              </div>
            )}

            {client.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Telefon
                </label>
                <p className="text-sm text-gray-900 flex items-center">
                  <i className="fas fa-phone mr-2 text-gray-400" />
                  {client.phone}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Company Information (if type is company) */}
      {client.type === 'company' && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Firemní údaje
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.ico && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    IČO
                  </label>
                  <p className="text-sm text-gray-900">{client.ico}</p>
                </div>
              )}

              {client.dic && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    DIČ
                  </label>
                  <p className="text-sm text-gray-900">{client.dic}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Address Information */}
      {(client.address || client.city || client.postal_code) && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Adresa
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {client.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Ulice a číslo
                  </label>
                  <p className="text-sm text-gray-900">{client.address}</p>
                </div>
              )}

              {client.city && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Město
                  </label>
                  <p className="text-sm text-gray-900">{client.city}</p>
                </div>
              )}

              {client.postal_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    PSČ
                  </label>
                  <p className="text-sm text-gray-900">{client.postal_code}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Projects Information */}
      <Card>
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Projekty
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {client.projects?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Celkem projektů</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {client.projects?.filter(p => p.status === 'active').length || 0}
              </p>
              <p className="text-sm text-gray-600">Aktivních</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {client.projects?.filter(p => p.status === 'completed').length || 0}
              </p>
              <p className="text-sm text-gray-600">Dokončených</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {client.notes && (
        <Card>
          <div className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Poznámky
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {client.notes}
            </p>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button onClick={onClose} variant="outline">
          Zavřít
        </Button>
        <Button onClick={onEdit}>
          <i className="fas fa-edit mr-2" />
          Upravit klienta
        </Button>
      </div>
    </div>
  )
}

export default ClientDetail
