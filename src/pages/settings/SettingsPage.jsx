import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import useAuthStore from '../../store/authStore'
import { Button, Card, Input, Modal } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { profile, updateProfile, createUser, isLoading } = useAuthStore()
  const { userRole, hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('profile')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: ''
    }
  })

  const { register: registerUser, handleSubmit: handleUserSubmit, reset: resetUser, formState: { errors: userErrors } } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'employee',
      position: ''
    }
  })

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        position: profile.position || ''
      })
    }
  }, [profile, reset])

  const tabs = [
    { id: 'profile', label: 'Můj profil', icon: 'fas fa-user' },
    { id: 'company', label: 'Firma', icon: 'fas fa-building', permission: 'settings' },
    { id: 'users', label: 'Uživatelé', icon: 'fas fa-users', permission: 'users' },
    { id: 'security', label: 'Zabezpečení', icon: 'fas fa-shield-alt' },
    { id: 'notifications', label: 'Notifikace', icon: 'fas fa-bell' },
    { id: 'system', label: 'Systém', icon: 'fas fa-cog', permission: 'settings' }
  ]

  const filteredTabs = tabs.filter(tab => !tab.permission || hasPermission(tab.permission))

  const onSubmitProfile = async (data) => {
    setSubmitting(true)
    try {
      const result = await updateProfile(data)
      if (result.success) {
        toast.success('Profil aktualizován')
      } else {
        toast.error(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitUser = async (data) => {
    setSubmitting(true)
    try {
      const result = await createUser(data)
      if (result.success) {
        toast.success('Uživatel vytvořen')
        setShowAddUserModal(false)
        resetUser()
      } else {
        toast.error(result.error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
          <p className="text-gray-600">Správa účtu a systémových nastavení</p>
        </div>
        {hasPermission('users') && (
          <Button
            onClick={() => setShowAddUserModal(true)}
            icon="fas fa-user-plus"
          >
            Přidat uživatele
          </Button>
        )}
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              {filteredTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className={`${tab.icon} mr-3`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Profil uživatele</h2>
              </div>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="p-6 space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-gray-500">{profile?.role}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <i className="fas fa-camera mr-2" />
                      Změnit foto
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register('first_name', { required: 'Jméno je povinné' })}
                    label="Křestní jméno"
                    error={errors.first_name?.message}
                    required
                  />
                  <Input
                    {...register('last_name', { required: 'Příjmení je povinné' })}
                    label="Příjmení"
                    error={errors.last_name?.message}
                    required
                  />
                </div>

                <Input
                  {...register('email')}
                  label="E-mail"
                  type="email"
                  disabled
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register('phone')}
                    label="Telefon"
                    type="tel"
                  />
                  <Input
                    {...register('position')}
                    label="Pozice"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={submitting}
                    icon="fas fa-save"
                  >
                    Uložit změny
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'company' && hasPermission('settings') && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Nastavení firmy</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Název firmy" defaultValue="AstraCore Solutions s.r.o." />
                  <Input label="IČO" defaultValue="12345678" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="DIČ" defaultValue="CZ12345678" />
                  <Input label="Telefon" defaultValue="+420 555 123 456" />
                </div>
                <Input label="Adresa" defaultValue="Průmyslová 123, Praha 11000" />
                <Input label="E-mail" defaultValue="info@astracore.cz" />
                <Input label="Web" defaultValue="www.astracore.cz" />
                
                <div className="flex justify-end">
                  <Button icon="fas fa-save">Uložit změny</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'users' && hasPermission('users') && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Správa uživatelů</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-blue-600">JD</span>
                      </div>
                      <div>
                        <div className="font-medium">Jan Dvořák</div>
                        <div className="text-sm text-gray-500">jan.dvorak@astracore.cz • Admin</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" icon="fas fa-edit">Upravit</Button>
                      <Button variant="outline" size="sm" icon="fas fa-key">Reset hesla</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="font-medium text-green-600">PS</span>
                      </div>
                      <div>
                        <div className="font-medium">Petr Svoboda</div>
                        <div className="text-sm text-gray-500">petr.svoboda@astracore.cz • Manager</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" icon="fas fa-edit">Upravit</Button>
                      <Button variant="outline" size="sm" icon="fas fa-key">Reset hesla</Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Zabezpečení</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Změna hesla</h3>
                  <div className="space-y-4">
                    <Input label="Současné heslo" type="password" />
                    <Input label="Nové heslo" type="password" />
                    <Input label="Potvrzení hesla" type="password" />
                    <Button icon="fas fa-key">Změnit heslo</Button>
                  </div>
                </div>

                <hr />

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dvoufaktorové ověření</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">Zvyšte bezpečnost svého účtu pomocí 2FA</p>
                    </div>
                    <Button variant="outline">Aktivovat 2FA</Button>
                  </div>
                </div>

                <hr />

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Aktivní relace</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Chrome na Windows</div>
                        <div className="text-sm text-gray-500">Praha, Česká republika • Právě teď</div>
                      </div>
                      <span className="text-green-600 text-sm">Současná relace</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Nastavení notifikací</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">E-mailové notifikace</div>
                      <div className="text-sm text-gray-500">Dostávejte důležité aktualizace e-mailem</div>
                    </div>
                    <input type="checkbox" defaultChecked className="form-checkbox" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Nové projekty</div>
                      <div className="text-sm text-gray-500">Upozornění na přiřazení nových projektů</div>
                    </div>
                    <input type="checkbox" defaultChecked className="form-checkbox" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Termíny projektů</div>
                      <div className="text-sm text-gray-500">Připomínky blížících se termínů</div>
                    </div>
                    <input type="checkbox" defaultChecked className="form-checkbox" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Faktury po splatnosti</div>
                      <div className="text-sm text-gray-500">Upozornění na neuhrazené faktury</div>
                    </div>
                    <input type="checkbox" defaultChecked className="form-checkbox" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Nízký stav materiálu</div>
                      <div className="text-sm text-gray-500">Varování při nízkém stavu skladu</div>
                    </div>
                    <input type="checkbox" defaultChecked className="form-checkbox" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Týdenní reporty</div>
                      <div className="text-sm text-gray-500">Automatické týdenní přehledy</div>
                    </div>
                    <input type="checkbox" className="form-checkbox" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button icon="fas fa-save">Uložit nastavení</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'system' && hasPermission('settings') && (
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Systémová nastavení</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Měna" defaultValue="CZK" />
                  <Input label="Časová zóna" defaultValue="Europe/Prague" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Formát data" defaultValue="DD.MM.YYYY" />
                  <Input label="První den v týdnu" defaultValue="Pondělí" />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Automatické zálohy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Denní zálohy</div>
                        <div className="text-sm text-gray-500">Automatické zálohy každý den ve 2:00</div>
                      </div>
                      <input type="checkbox" defaultChecked className="form-checkbox" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Týdenní zálohy</div>
                        <div className="text-sm text-gray-500">Kompletní záloha každou neděli</div>
                      </div>
                      <input type="checkbox" defaultChecked className="form-checkbox" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Údržba systému</h3>
                  <div className="space-y-3">
                    <Button variant="outline" icon="fas fa-broom">Vyčistit cache</Button>
                    <Button variant="outline" icon="fas fa-database">Optimalizovat databázi</Button>
                    <Button variant="outline" icon="fas fa-download">Exportovat data</Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button icon="fas fa-save">Uložit nastavení</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Přidat nového uživatele"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowAddUserModal(false)}
              disabled={submitting}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleUserSubmit(onSubmitUser)}
              loading={submitting}
              icon="fas fa-user-plus"
            >
              Vytvořit uživatele
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...registerUser('first_name', { required: 'Jméno je povinné' })}
              label="Křestní jméno"
              error={userErrors.first_name?.message}
              required
            />
            <Input
              {...registerUser('last_name', { required: 'Příjmení je povinné' })}
              label="Příjmení"
              error={userErrors.last_name?.message}
              required
            />
          </div>

          <Input
            {...registerUser('email', { required: 'E-mail je povinný' })}
            label="E-mail"
            type="email"
            error={userErrors.email?.message}
            required
          />

          <Input
            {...registerUser('password', { required: 'Heslo je povinné', minLength: { value: 6, message: 'Minimálně 6 znaků' } })}
            label="Heslo"
            type="password"
            error={userErrors.password?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...registerUser('role')}
              label="Role"
              type="select"
            >
              <option value="employee">Zaměstnanec</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrátor</option>
            </Input>
            
            <Input
              {...registerUser('position')}
              label="Pozice"
              placeholder="Stavbyvedoucí, Zedník..."
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SettingsPage
