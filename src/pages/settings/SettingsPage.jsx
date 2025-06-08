import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import useAuthStore from '../../store/authStore'
import { Button, Card, Input, Modal, Table } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { profile, updateProfile, createUser, isLoading } = useAuthStore()
  const { userRole, hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('profile')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

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

  // Load profile data into form
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

  // Load users when users tab is active
  useEffect(() => {
    if (activeTab === 'users' && hasPermission('users')) {
      loadUsers()
    }
  }, [activeTab])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Chyba při načítání uživatelů')
    } finally {
      setLoadingUsers(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Můj profil', icon: 'fas fa-user' },
    { id: 'company', label: 'Firma', icon: 'fas fa-building' },
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
        toast.success('Profil byl aktualizován')
      } else {
        toast.error(result.error || 'Chyba při aktualizaci profilu')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Chyba při aktualizaci profilu')
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitUser = async (data) => {
    setSubmitting(true)
    try {
      const result = await createUser(data)
      if (result.success) {
        toast.success('Uživatel byl vytvořen')
        setShowAddUserModal(false)
        resetUser()
        loadUsers()
      } else {
        toast.error(result.error || 'Chyba při vytváření uživatele')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Chyba při vytváření uživatele')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Opravdu chcete smazat tohoto uživatele?')) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      toast.success('Uživatel byl smazán')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Chyba při mazání uživatele')
    }
  }

  // Get company data from env variables
  const companyData = {
    name: import.meta.env.VITE_COMPANY_NAME || 'AstraCore Solutions s.r.o.',
    ico: import.meta.env.VITE_COMPANY_ICO || '22220020',
    dic: import.meta.env.VITE_COMPANY_DIC || 'CZ22220020',
    address: import.meta.env.VITE_COMPANY_ADDRESS || 'U Klavírky 1501/4',
    city: import.meta.env.VITE_COMPANY_CITY || 'Praha-Smíchov',
    postal: import.meta.env.VITE_COMPANY_POSTAL || '15000',
    phone: import.meta.env.VITE_COMPANY_PHONE || '774401259',
    email: import.meta.env.VITE_COMPANY_EMAIL || 'info@astracore-solutions.cz',
    bankAccount: import.meta.env.VITE_COMPANY_BANK_ACCOUNT || '',
    bankName: import.meta.env.VITE_COMPANY_BANK_NAME || ''
  }

  const userColumns = [
    {
      key: 'name',
      title: 'Jméno',
      render: (_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Bez jména'
    },
    {
      key: 'email',
      title: 'Email'
    },
    {
      key: 'role',
      title: 'Role',
      render: (value) => {
        const roleLabels = {
          admin: 'Administrátor',
          manager: 'Manažer',
          employee: 'Zaměstnanec'
        }
        return roleLabels[value] || value
      }
    },
    {
      key: 'position',
      title: 'Pozice',
      render: (value) => value || '-'
    },
    {
      key: 'created_at',
      title: 'Vytvořen',
      render: (value) => new Date(value).toLocaleDateString('cs-CZ')
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteUser(row.id)}
            icon="fas fa-trash"
            disabled={row.id === profile?.id}
          >
            Smazat
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
        <p className="text-gray-600">Správa profilu, firmy a systému</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={`${tab.icon} mr-2`} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Osobní údaje</h2>
              <p className="text-sm text-gray-600 mt-1">Upravte své osobní informace</p>
            </div>
            <form onSubmit={handleSubmit(onSubmitProfile)} className="p-6 space-y-6">
              {/* Avatar section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-semibold text-primary-600">
                      {profile?.first_name?.[0] || profile?.email?.[0] || 'U'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-gray-500 capitalize">{profile?.role}</p>
                  <Button variant="outline" size="sm" className="mt-2" disabled>
                    <i className="fas fa-camera mr-2" />
                    Změnit foto (brzy)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...register('first_name', { required: 'Křestní jméno je povinné' })}
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
                className="bg-gray-50"
                helpText="Email nelze změnit"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...register('phone')}
                  label="Telefon"
                  type="tel"
                  placeholder="+420 777 123 456"
                />
                <Input
                  {...register('position')}
                  label="Pozice"
                  placeholder="Stavební inženýr"
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
        {/* Company Tab */}
        {activeTab === 'company' && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Firemní údaje</h2>
              <p className="text-sm text-gray-600 mt-1">Základní informace o vaší společnosti</p>
            </div>
            <div className="p-6 space-y-8">
              
              {/* Základní firemní údaje */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Základní údaje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input 
                      label="Obchodní název"
                      value={companyData.name}
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="IČO"
                      value={companyData.ico}
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="DIČ"
                      value={companyData.dic}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-4">
                    <Input 
                      label="Právní forma"
                      value="Společnost s ručením omezeným"
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="Založena"
                      value="2024"
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="Odvětví"
                      value="Stavebnictví a projektování"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Kontaktní údaje */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktní údaje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input 
                      label="Adresa sídla"
                      value={`${companyData.address}, ${companyData.city} ${companyData.postal}`}
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="Telefon"
                      value={companyData.phone}
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="E-mail"
                      value={companyData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-4">
                    <Input 
                      label="Web"
                      value="https://astracore.pro"
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="Fakturační adresa"
                      value="Shodná s adresou sídla"
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="Provozovna"
                      value="Dle místa realizace projektů"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Bankovní údaje */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bankovní údaje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input 
                      label="Číslo účtu"
                      value={companyData.bankAccount || 'Bude doplněno'}
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="Název banky"
                      value={companyData.bankName || 'Bude doplněno'}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-4">
                    <Input 
                      label="SWIFT/BIC"
                      value="Bude doplněno"
                      disabled
                      className="bg-gray-50"
                    />
                    
                    <Input 
                      label="IBAN"
                      value="Bude doplněno"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900">Informace o firemních údajích</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Firemní údaje jsou načítány z konfiguračního souboru a slouží pro automatické vyplňování faktur a dokumentů. 
                      Změny těchto údajů je možné provést pouze úpravou konfigurace aplikace.
                    </p>
                  </div>
                </div>
              </div>

              {/* Služby a specializace */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Poskytované služby</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Projektování</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Architektonické studie</li>
                      <li>• Konstrukční návrhy</li>
                      <li>• Stavební dokumentace</li>
                      <li>• Energetické audity</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Realizace</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Novostavby</li>
                      <li>• Rekonstrukce</li>
                      <li>• Stavební dozor</li>
                      <li>• Projektový management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && hasPermission('users') && (
          <Card>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Správa uživatelů</h2>
                <p className="text-sm text-gray-600 mt-1">Spravujte uživatelské účty a oprávnění</p>
              </div>
              <Button
                onClick={() => setShowAddUserModal(true)}
                icon="fas fa-plus"
              >
                Přidat uživatele
              </Button>
            </div>
            
            <Table
              columns={userColumns}
              data={users}
              loading={loadingUsers}
              emptyMessage="Žádní uživatelé"
              emptyIcon="fas fa-users"
            />
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Zabezpečení</h2>
              <p className="text-sm text-gray-600 mt-1">Nastavení hesla a zabezpečení účtu</p>
            </div>
            <div className="p-6 space-y-6">
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Změna hesla</h3>
                <div className="space-y-4 max-w-md">
                  <Input
                    label="Současné heslo"
                    type="password"
                    disabled
                  />
                  <Input
                    label="Nové heslo"
                    type="password"
                    disabled
                  />
                  <Input
                    label="Potvrdit heslo"
                    type="password"
                    disabled
                  />
                  <Button disabled>
                    Změnit heslo (brzy)
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dvoufaktorová autentizace</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">2FA aplikace</div>
                      <div className="text-sm text-gray-500">Použít autentizační aplikaci</div>
                    </div>
                    <Button variant="outline" disabled>
                      Aktivovat (brzy)
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aktivní relace</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <div className="font-medium">Aktuální relace</div>
                      <div className="text-sm text-gray-500">Chrome, Praha</div>
                    </div>
                    <span className="text-green-600 text-sm">Aktivní nyní</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Notifikace</h2>
              <p className="text-sm text-gray-600 mt-1">Nastavte, jak chcete být informováni</p>
            </div>
            <div className="p-6 space-y-6">
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">E-mailové notifikace</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Nové projekty</div>
                      <div className="text-sm text-gray-500">Upozornění na nově přidělené projekty</div>
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
                      <div className="font-medium">Finanční transakce</div>
                      <div className="text-sm text-gray-500">Upozornění na nové příjmy a výdaje</div>
                    </div>
                    <input type="checkbox" className="form-checkbox" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Push notifikace</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Povolení notifikací</div>
                      <div className="text-sm text-gray-500">Zobrazování notifikací v prohlížeči</div>
                    </div>
                    <Button variant="outline" disabled>
                      Povolit (brzy)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        {/* System Tab */}
        {activeTab === 'system' && hasPermission('settings') && (
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Systémová nastavení</h2>
              <p className="text-sm text-gray-600 mt-1">Obecná nastavení aplikace a údržba</p>
            </div>
            <div className="p-6 space-y-6">
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Obecné nastavení</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Časové pásmo" value="Europe/Prague" disabled className="bg-gray-50" />
                  <Input label="Jazyk" value="Čeština" disabled className="bg-gray-50" />
                  <Input label="Měna" value="CZK" disabled className="bg-gray-50" />
                  <Input label="Formát data" value="DD.MM.YYYY" disabled className="bg-gray-50" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Zálohy a údržba</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Automatické zálohy</div>
                      <div className="text-sm text-gray-500">Automatické zálohy každý den ve 2:00</div>
                    </div>
                    <input type="checkbox" defaultChecked className="form-checkbox" disabled />
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Nástroje údržby</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button variant="outline" icon="fas fa-broom" disabled>
                        Vyčistit cache (brzy)
                      </Button>
                      <Button variant="outline" icon="fas fa-database" disabled>
                        Optimalizovat DB (brzy)
                      </Button>
                      <Button variant="outline" icon="fas fa-download" disabled>
                        Export dat (brzy)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informace o aplikaci</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Verze:</span>
                    <span>{import.meta.env.VITE_APP_VERSION || '1.0.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Prostředí:</span>
                    <span>{import.meta.env.VITE_DEV_MODE === 'true' ? 'Development' : 'Production'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Databáze:</span>
                    <span className="text-green-600">Připojeno</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Poslední aktualizace:</span>
                    <span>{new Date().toLocaleDateString('cs-CZ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
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
              icon="fas fa-save"
            >
              Vytvořit uživatele
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...registerUser('first_name', { required: 'Křestní jméno je povinné' })}
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
            {...registerUser('email', { 
              required: 'E-mail je povinný',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Neplatný formát e-mailu'
              }
            })}
            label="E-mail"
            type="email"
            error={userErrors.email?.message}
            required
          />

          <Input
            {...registerUser('password', { 
              required: 'Heslo je povinné',
              minLength: {
                value: 6,
                message: 'Heslo musí mít alespoň 6 znaků'
              }
            })}
            label="Heslo"
            type="password"
            error={userErrors.password?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...registerUser('role', { required: 'Role je povinná' })}
              label="Role"
              type="select"
              error={userErrors.role?.message}
              required
            >
              <option value="employee">Zaměstnanec</option>
              <option value="manager">Manažer</option>
              <option value="admin">Administrátor</option>
            </Input>

            <Input
              {...registerUser('position')}
              label="Pozice"
              placeholder="Stavební inženýr"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SettingsPage
