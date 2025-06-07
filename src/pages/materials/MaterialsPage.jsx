import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Table, Card, Input, Modal, ActionButton, CurrencyCell } from '../../components/ui'
import { MATERIAL_CATEGORIES } from '../../utils/constants'
import { formatCurrency } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
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

  // Load materials from Supabase
  const loadMaterials = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name')

      if (error) throw error

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('Chyba při načítání materiálů')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
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
      const materialData = {
        ...data,
        price_per_unit: parseFloat(data.price_per_unit) || 0,
        current_stock: parseInt(data.current_stock) || 0,
        min_stock: parseInt(data.min_stock) || 0,
      }

      let result
      if (editingMaterial) {
        // Update existing material
        result = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', editingMaterial.id)
          .select()
      } else {
        // Create new material
        result = await supabase
          .from('materials')
          .insert([materialData])
          .select()
      }

      if (result.error) throw result.error

      toast.success(editingMaterial ? 'Materiál byl aktualizován' : 'Materiál byl přidán')
      
      // Reload materials
      await loadMaterials()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingMaterial(null)
      
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Chyba při ukládání materiálu')
    } finally {
      setSubmitting(false)
    }
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
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialToDelete.id)

      if (error) throw error

      toast.success('Materiál byl smazán')
      await loadMaterials()
      setShowDeleteModal(false)
      setMaterialToDelete(null)
      
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Chyba při mazání materiálu')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingMaterial(null)
    reset()
    setShowAddModal(true)
  }

  const filteredMaterials = getFilteredMaterials()
  const stats = getMaterialStats()

  const columns = [
    {
      key: 'name',
      title: 'Materiál',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.category}</div>
        </div>
      )
    },
    {
      key: 'current_stock',
      title: 'Sklad',
      render: (value, row) => (
        <div className="text-center">
          <span className={`font-semibold ${
            value <= row.min_stock ? 'text-red-600' : 'text-gray-900'
          }`}>
            {value} {row.unit}
          </span>
          {value <= row.min_stock && (
            <div className="text-xs text-red-500">Nízký stav!</div>
          )}
        </div>
      )
    },
    {
      key: 'price_per_unit',
      title: 'Cena/jednotka',
      render: (value, row) => (
        <div className="text-right">
          <CurrencyCell amount={value} />
          <div className="text-xs text-gray-500">za {row.unit}</div>
        </div>
      )
    },
    {
      key: 'total_value',
      title: 'Celková hodnota',
      render: (_, row) => (
        <div className="text-right">
          <CurrencyCell amount={row.current_stock * row.price_per_unit} />
        </div>
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
          <p className="text-gray-600 mt-1">Správa skladových zásob a materiálů</p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary-600 hover:bg-primary-700">
          <i className="fas fa-plus mr-2" />
          Přidat materiál
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celkem materiálů</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-boxes text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Nízký stav</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Celková hodnota</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Kategorie</p>
                <p className="text-2xl font-bold text-gray-900">{stats.categoriesCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-tags text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Hledat materiál..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Všechny kategorie</option>
              {MATERIAL_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setFilters({ category: '', search: '' })}
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Materials Table */}
      <Card>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Sklad materiálu ({filteredMaterials.length})
          </h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <i className="fas fa-download mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <i className="fas fa-upload mr-2" />
              Import
            </Button>
          </div>
        </div>
        <Table
          data={filteredMaterials}
          columns={columns}
          loading={isLoading}
          emptyMessage="Žádné materiály nenalezeny"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingMaterial(null)
          reset()
        }}
        title={editingMaterial ? 'Upravit materiál' : 'Nový materiál'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Název materiálu *"
              {...register('name', { required: 'Název je povinný' })}
              error={errors.name?.message}
            />
            <select
              {...register('category', { required: 'Kategorie je povinná' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Vyberte kategorii</option>
              {MATERIAL_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Jednotka *"
              {...register('unit', { required: 'Jednotka je povinná' })}
              error={errors.unit?.message}
              placeholder="kg, ks, m..."
            />
            <Input
              label="Cena za jednotku"
              type="number"
              step="0.01"
              {...register('price_per_unit')}
              placeholder="0.00"
            />
            <Input
              label="Současný stav"
              type="number"
              {...register('current_stock')}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Minimální stav"
              type="number"
              {...register('min_stock')}
              placeholder="0"
            />
            <Input
              label="Dodavatel"
              {...register('supplier')}
              placeholder="Název dodavatele"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poznámky
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dodatečné informace o materiálu..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                setEditingMaterial(null)
                reset()
              }}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {editingMaterial ? 'Uložit změny' : 'Přidat materiál'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setMaterialToDelete(null)
        }}
        title="Smazat materiál"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Opravdu chcete smazat materiál "{materialToDelete?.name}"? Tato akce je nevratná.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setMaterialToDelete(null)
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              loading={deleteLoading}
              onClick={handleDelete}
            >
              Smazat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MaterialsPage
