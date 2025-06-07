import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, ActionButton, CurrencyCell } from '../../components/ui'
import { MATERIAL_CATEGORIES } from '../../utils/constants'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    search: ''
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      category: '',
      unit: '',
      price_per_unit: '',
      current_stock: '',
      min_stock: '',
      supplier: '',
      notes: ''
    }
  })

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockMaterials = [
      {
        id: 1,
        name: 'Cement Portland CEM I 42,5',
        category: 'Beton a malta',
        unit: 'kg',
        price_per_unit: 4.50,
        current_stock: 2500,
        min_stock: 500,
        supplier: 'Heidelberg Cement',
        notes: 'Standardní cement pro běžné stavby',
        last_updated: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'Cihla pálená plná 250x120x65',
        category: 'Cihly a bloky',
        unit: 'ks',
        price_per_unit: 8.20,
        current_stock: 15000,
        min_stock: 2000,
        supplier: 'Wienerberger',
        notes: 'Pálená cihla pro nosné konstrukce',
        last_updated: '2024-01-14T14:30:00Z'
      },
      {
        id: 3,
        name: 'Řezivo jehličnaté 50x100mm',
        category: 'Dřevo a materiály',
        unit: 'm',
        price_per_unit: 125.00,
        current_stock: 850,
        min_stock: 100,
        supplier: 'Stora Enso',
        notes: 'Konstrukční řezivo C24',
        last_updated: '2024-01-13T09:15:00Z'
      },
      {
        id: 4,
        name: 'Ocelová výztuž B500B 12mm',
        category: 'Ocel a kovy',
        unit: 'kg',
        price_per_unit: 28.50,
        current_stock: 1200,
        min_stock: 200,
        supplier: 'ArcelorMittal',
        notes: 'Betonářská výztuž',
        last_updated: '2024-01-12T16:45:00Z'
      }
    ]

    setTimeout(() => {
      setMaterials(mockMaterials)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    if (editingMaterial) {
      Object.keys(editingMaterial).forEach(key => {
        setValue(key, editingMaterial[key] || '')
      })
    }
  }, [editingMaterial, setValue])

  const getFilteredMaterials = () => {
    return materials.filter(material => {
      // Category filter
      if (filters.category && material.category !== filters.category) {
        return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          material.name,
          material.supplier,
          material.notes
        ].filter(Boolean)
        
        const matchesSearch = searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  }

  const getMaterialStats = () => {
    const total = materials.length
    const lowStock = materials.filter(m => m.current_stock <= m.min_stock).length
    const totalValue = materials.reduce((sum, m) => sum + (m.current_stock * m.price_per_unit), 0)
    const categoriesCount = new Set(materials.map(m => m.category)).size

    return { total, lowStock, totalValue, categoriesCount }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newMaterial = {
        ...data,
        id: editingMaterial ? editingMaterial.id : Date.now(),
        price_per_unit: parseFloat(data.price_per_unit) || 0,
        current_stock: parseInt(data.current_stock) || 0,
        min_stock: parseInt(data.min_stock) || 0,
        last_updated: new Date().toISOString()
      }

      if (editingMaterial) {
        setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? newMaterial : m))
        toast.success('Materiál upraven')
      } else {
        setMaterials(prev => [newMaterial, ...prev])
        toast.success('Materiál přidán')
      }
      
      handleCloseModal()
    } catch (error) {
      toast.error('Chyba při ukládání')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingMaterial(null)
    reset()
  }

  const handleEdit = (material) => {
    setEditingMaterial(material)
    setShowAddModal(true)
  }

  const handleDeleteClick = (material) => {
    setMaterialToDelete(material)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!materialToDelete) return

    setDeleteLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id))
      toast.success('Materiál smazán')
      setShowDeleteModal(false)
      setMaterialToDelete(null)
    } catch (error) {
      toast.error('Chyba při mazání')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredMaterials = getFilteredMaterials()
  const stats = getMaterialStats()

  const columns = [
    {
      key: 'name',
      title: 'Materiál',
      render: (value, row) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
        </div>
      )
    },
    {
      key: 'current_stock',
      title: 'Sklad',
      render: (value, row) => (
        <div>
          <span className={`font-medium ${value <= row.min_stock ? 'text-red-600' : 'text-gray-900'}`}>
            {value} {row.unit}
          </span>
          {value <= row.min_stock && (
            <div className="text-xs text-red-600 flex items-center mt-1">
              <i className="fas fa-exclamation-triangle mr-1" />
              Nízký stav
            </div>
          )}
        </div>
      )
    },
    {
      key: 'price_per_unit',
      title: 'Cena/jednotka',
      render: (value, row) => (
        <div>
          <CurrencyCell amount={value} />
          <div className="text-xs text-gray-500">za {row.unit}</div>
        </div>
      )
    },
    {
      key: 'total_value',
      title: 'Celková hodnota',
      render: (_, row) => (
        <CurrencyCell amount={row.current_stock * row.price_per_unit} />
      )
    },
    {
      key: 'supplier',
      title: 'Dodavatel',
      render: (value) => value || '-'
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <ActionButton
            icon="fas fa-plus"
            tooltip="Přidat do skladu"
            onClick={() => console.log('Add stock', row)}
            variant="ghost"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          />
          <ActionButton
            icon="fas fa-minus"
            tooltip="Odebrat ze skladu"
            onClick={() => console.log('Remove stock', row)}
            variant="ghost"
            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          />
          <ActionButton
            icon="fas fa-edit"
            tooltip="Upravit"
            onClick={() => handleEdit(row)}
            variant="ghost"
          />
          <ActionButton
            icon="fas fa-trash"
            tooltip="Smazat"
            onClick={() => handleDeleteClick(row)}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          />
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiál</h1>
          <p className="text-gray-600">Správa skladu a nákupu materiálu</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => console.log('Generate order')}
            icon="fas fa-shopping-cart"
          >
            Vygenerovat objednávku
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            icon="fas fa-plus"
          >
            Přidat materiál
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-boxes text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Druhy materiálu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Nízký stav</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-coins text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Hodnota skladu</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-tags text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Kategorie</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.categoriesCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="text"
              placeholder="Hledat materiál..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Všechny kategorie</option>
              {MATERIAL_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>

            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', category: '' })}
              size="sm"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Materials Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Sklad materiálu ({filteredMaterials.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" icon="fas fa-download">
                Export
              </Button>
              <Button variant="outline" size="sm" icon="fas fa-upload">
                Import
              </Button>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredMaterials.map(material => ({
            ...material,
            _highlight: material.current_stock <= material.min_stock
          }))}
          loading={isLoading}
          emptyMessage="Žádný materiál nenalezen"
          emptyIcon="fas fa-boxes"
        />
      </Card>

      {/* Add/Edit Material Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingMaterial ? 'Upravit materiál' : 'Nový materiál'}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={submitting}
              icon="fas fa-save"
            >
              {editingMaterial ? 'Uložit změny' : 'Přidat materiál'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <Input
            {...register('name', { required: 'Název materiálu je povinný' })}
            label="Název materiálu"
            type="text"
            placeholder="Cement Portland CEM I 42,5"
            error={errors.name?.message}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('category', { required: 'Kategorie je povinná' })}
              label="Kategorie"
              type="select"
              error={errors.category?.message}
              required
            >
              <option value="">Vyberte kategorii</option>
              {MATERIAL_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>
            
            <Input
              {...register('unit', { required: 'Jednotka je povinná' })}
              label="Jednotka"
              type="text"
              placeholder="kg, m, ks, m², m³"
              error={errors.unit?.message}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('price_per_unit', { 
                required: 'Cena je povinná',
                min: { value: 0, message: 'Cena musí být kladná' }
              })}
              label="Cena za jednotku"
              type="number"
              step="0.01"
              placeholder="0.00"
              suffix="Kč"
              error={errors.price_per_unit?.message}
              required
            />
            
            <Input
              {...register('current_stock', { 
                required: 'Současný stav je povinný',
                min: { value: 0, message: 'Stav nemůže být záporný' }
              })}
              label="Současný stav"
              type="number"
              placeholder="0"
              error={errors.current_stock?.message}
              required
            />
            
            <Input
              {...register('min_stock', { 
                min: { value: 0, message: 'Minimální stav nemůže být záporný' }
              })}
              label="Minimální stav"
              type="number"
              placeholder="0"
              error={errors.min_stock?.message}
            />
          </div>

          <Input
            {...register('supplier')}
            label="Dodavatel"
            type="text"
            placeholder="Název dodavatele"
          />

          <Input
            {...register('notes')}
            label="Poznámky"
            type="textarea"
            rows={3}
            placeholder="Dodatečné informace o materiálu..."
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat materiál"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteLoading}
            >
              Smazat
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600">
            <i className="fas fa-exclamation-triangle text-2xl" />
            <div>
              <p className="font-medium">Opravdu chcete smazat tento materiál?</p>
              <p className="text-sm text-gray-600 mt-1">Tato akce je nevratná.</p>
            </div>
          </div>
          
          {materialToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">{materialToDelete.name}</p>
              <p className="text-sm text-gray-600 mt-1">{materialToDelete.category}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default MaterialsPage
