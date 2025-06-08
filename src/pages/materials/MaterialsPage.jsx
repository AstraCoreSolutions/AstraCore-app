import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Card, Input, Table, Modal, StatCard } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [materialToDelete, setMaterialToDelete] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    lowStock: false
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
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

  // Load data on mount
  useEffect(() => {
    loadMaterials()
    loadSuppliers()
  }, [])

  // Load materials from Supabase
  const loadMaterials = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('Chyba při načítání materiálů')
      setMaterials([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load suppliers for dropdown
  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
      // Don't show error for suppliers as it's not critical
    }
  }

  // Handle form submission
  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const materialData = {
        ...data,
        price_per_unit: parseFloat(data.price_per_unit) || 0,
        current_stock: parseInt(data.current_stock) || 0,
        min_stock: parseInt(data.min_stock) || 0,
        updated_at: new Date().toISOString()
      }

      if (editingMaterial) {
        // Update existing material
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', editingMaterial.id)

        if (error) throw error
        toast.success('Materiál byl aktualizován')
      } else {
        // Create new material
        materialData.created_at = new Date().toISOString()

        const { error } = await supabase
          .from('materials')
          .insert([materialData])

        if (error) throw error
        toast.success('Materiál byl přidán')
      }

      // Reload materials
      await loadMaterials()
      
      // Reset form and close modal
      reset()
      setShowAddModal(false)
      setEditingMaterial(null)
      
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error('Chyba při ukládání materiálu: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (material) => {
    setEditingMaterial(material)
    reset({
      name: material.name || '',
      category: material.category || '',
      unit: material.unit || '',
      price_per_unit: material.price_per_unit?.toString() || '',
      current_stock: material.current_stock?.toString() || '',
      min_stock: material.min_stock?.toString() || '',
      supplier: material.supplier || '',
      notes: material.notes || ''
    })
    setShowAddModal(true)
  }

  // Handle delete click
  const handleDeleteClick = (material) => {
    setMaterialToDelete(material)
    setShowDeleteModal(true)
  }

  // Handle delete confirm
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
      toast.error('Chyba při mazání materiálu: ' + error.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle add new
  const handleAddNew = () => {
    setEditingMaterial(null)
    reset({
      name: '',
      category: '',
      unit: '',
      price_per_unit: '',
      current_stock: '',
      min_stock: '',
      supplier: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingMaterial(null)
    reset()
  }

  // Filter materials
  const getFilteredMaterials = () => {
    return materials.filter(material => {
      const matchesSearch = !filters.search || 
        material.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        material.category?.toLowerCase().includes(filters.search.toLowerCase()) ||
        material.supplier?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesCategory = !filters.category || material.category === filters.category
      
      const matchesLowStock = !filters.lowStock || 
        (material.current_stock <= material.min_stock)
      
      return matchesSearch && matchesCategory && matchesLowStock
    })
  }

  // Calculate statistics
  const getMaterialStats = () => {
    const total = materials.length
    const lowStock = materials.filter(m => m.current_stock <= m.min_stock).length
    const outOfStock = materials.filter(m => m.current_stock === 0).length
    const totalValue = materials.reduce((sum, m) => 
      sum + (parseFloat(m.price_per_unit || 0) * parseInt(m.current_stock || 0)), 0
    )
    
    // Get unique categories
    const categories = [...new Set(materials.map(m => m.category).filter(Boolean))].length
    
    return { total, lowStock, outOfStock, totalValue, categories }
  }

  // Get unique categories for filter
  const getCategories = () => {
    const categories = [...new Set(materials.map(m => m.category).filter(Boolean))]
    return categories.sort()
  }

  // Get unique units for dropdown
  const getUnits = () => {
    return ['ks', 'm', 'm²', 'm³', 'kg', 'l', 'balení', 'sada', 'role', 'pytel']
  }

  const filteredMaterials = getFilteredMaterials()
  const stats = getMaterialStats()
  const categories = getCategories()
  const units = getUnits()

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
            value <= row.min_stock 
              ? value === 0 
                ? 'text-red-600' 
                : 'text-yellow-600'
              : 'text-green-600'
          }`}>
            {value} {row.unit}
          </span>
          {value <= row.min_stock && (
            <div className="text-xs text-red-500">
              <i className="fas fa-exclamation-triangle mr-1" />
              Nízký stav
            </div>
          )}
        </div>
      )
    },
    {
      key: 'min_stock',
      title: 'Min. stav',
      render: (value, row) => `${value} ${row.unit}`
    },
    {
      key: 'price_per_unit',
      title: 'Cena/jednotka',
      render: (value, row) => `${formatCurrency(value)}/${row.unit}`
    },
    {
      key: 'total_value',
      title: 'Celková hodnota',
      render: (_, row) => formatCurrency(
        parseFloat(row.price_per_unit || 0) * parseInt(row.current_stock || 0)
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
            icon="fas fa-edit"
          >
            Upravit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteClick(row)}
            icon="fas fa-trash"
            className="text-red-600 hover:text-red-700"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiály</h1>
          <p className="text-gray-600">Správa skladových zásob a materiálů</p>
        </div>
        <Button
          onClick={handleAddNew}
          icon="fas fa-plus"
        >
          Přidat materiál
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Celkem materiálů"
          value={stats.total}
          icon="fas fa-boxes"
          trend="neutral"
        />
        <StatCard
          title="Nízký stav"
          value={stats.lowStock}
          icon="fas fa-exclamation-triangle"
          trend={stats.lowStock > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Vyprodáno"
          value={stats.outOfStock}
          icon="fas fa-times-circle"
          trend={stats.outOfStock > 0 ? "negative" : "positive"}
        />
        <StatCard
          title="Celková hodnota"
          value={formatCurrency(stats.totalValue)}
          icon="fas fa-euro-sign"
          trend="positive"
        />
        <StatCard
          title="Kategorií"
          value={stats.categories}
          icon="fas fa-tags"
          trend="neutral"
        />
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-500 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-900">
                  Upozornění na nízký stav materiálů
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {stats.lowStock} materiálů má nízký stav skladu. 
                  {stats.outOfStock > 0 && ` ${stats.outOfStock} materiálů je zcela vyprodáno.`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                onClick={() => setFilters(prev => ({ ...prev, lowStock: true }))}
              >
                Zobrazit
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Hledat materiál..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              icon="fas fa-search"
            />
            
            <Input
              type="select"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Všechny kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Input>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowStock"
                checked={filters.lowStock}
                onChange={(e) => setFilters(prev => ({ ...prev, lowStock: e.target.checked }))}
                className="form-checkbox"
              />
              <label htmlFor="lowStock" className="text-sm font-medium text-gray-700">
                Pouze nízký stav
              </label>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setFilters({ search: '', category: '', lowStock: false })}
              icon="fas fa-times"
            >
              Vymazat filtry
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {materials.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <i className="fas fa-boxes text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Zatím žádné materiály</h3>
          <p className="text-gray-600 mb-6">
            Začněte přidáním prvního materiálu do skladu
          </p>
          <Button
            onClick={handleAddNew}
            icon="fas fa-plus"
            size="lg"
          >
            Přidat první materiál
          </Button>
        </Card>
      )}

      {/* Materials Table */}
      {materials.length > 0 && (
        <Card>
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Materiály ({filteredMaterials.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon="fas fa-download"
                disabled
              >
                Export (brzy)
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon="fas fa-upload"
                disabled
              >
                Import (brzy)
              </Button>
            </div>
          </div>
          
          <Table
            columns={columns}
            data={filteredMaterials}
            loading={isLoading}
            emptyMessage="Žádné materiály nevyhovují filtrům"
            emptyIcon="fas fa-filter"
          />
        </Card>
      )}
      {/* Add/Edit Material Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingMaterial ? 'Upravit materiál' : 'Nový materiál'}
        size="xl"
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Základní údaje</h3>
              
              <Input
                {...register('name', { required: 'Název materiálu je povinný' })}
                label="Název materiálu"
                error={errors.name?.message}
                required
                placeholder="Např. Cement Portland"
              />
              
              <Input
                {...register('category', { required: 'Kategorie je povinná' })}
                label="Kategorie"
                error={errors.category?.message}
                required
                placeholder="Např. Stavební materiály"
                list="categories-list"
              />
              <datalist id="categories-list">
                {categories.map(category => (
                  <option key={category} value={category} />
                ))}
                <option value="Stavební materiály" />
                <option value="Nářadí" />
                <option value="Elektroinstalace" />
                <option value="Vodoinstalace" />
                <option value="Izolace" />
                <option value="Dlažby a obklady" />
                <option value="Barvy a laky" />
                <option value="Dřevo" />
                <option value="Kovy" />
                <option value="Spojovací materiál" />
              </datalist>
              
              <Input
                {...register('unit', { required: 'Jednotka je povinná' })}
                label="Jednotka"
                type="select"
                error={errors.unit?.message}
                required
              >
                <option value="">Vyberte jednotku</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Input>
              
              <Input
                {...register('supplier')}
                label="Dodavatel"
                placeholder="Název dodavatele"
                list="suppliers-list"
              />
              <datalist id="suppliers-list">
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Skladové údaje</h3>
              
              <Input
                {...register('current_stock', { 
                  required: 'Aktuální stav je povinný',
                  min: { value: 0, message: 'Stav nemůže být záporný' }
                })}
                label="Aktuální stav"
                type="number"
                min="0"
                error={errors.current_stock?.message}
                required
                placeholder="0"
                suffix={watch('unit') || 'ks'}
              />
              
              <Input
                {...register('min_stock', { 
                  required: 'Minimální stav je povinný',
                  min: { value: 0, message: 'Minimální stav nemůže být záporný' }
                })}
                label="Minimální stav"
                type="number"
                min="0"
                error={errors.min_stock?.message}
                required
                placeholder="0"
                suffix={watch('unit') || 'ks'}
                helpText="Při dosažení tohoto stavu bude zobrazeno upozornění"
              />
              
              <Input
                {...register('price_per_unit', { 
                  required: 'Cena je povinná',
                  min: { value: 0, message: 'Cena nemůže být záporná' }
                })}
                label="Cena za jednotku"
                type="number"
                step="0.01"
                min="0"
                error={errors.price_per_unit?.message}
                required
                placeholder="0.00"
                suffix="Kč"
              />

              {/* Calculated total value */}
              {watch('current_stock') && watch('price_per_unit') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Celková hodnota skladu</div>
                    <div className="text-blue-700 text-lg font-semibold">
                      {formatCurrency(
                        (parseFloat(watch('current_stock')) || 0) * 
                        (parseFloat(watch('price_per_unit')) || 0)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Input
              {...register('notes')}
              label="Poznámky"
              type="textarea"
              rows={3}
              placeholder="Dodatečné informace o materiálu, specifikace, poznámky..."
              helpText="Interní poznámky pro lepší identifikaci materiálu"
            />
          </div>

          {/* Stock Status Preview */}
          {watch('current_stock') && watch('min_stock') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Stav skladu</h4>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Aktuální stav</div>
                  <div className="text-lg font-semibold">
                    {watch('current_stock')} {watch('unit')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Minimální stav</div>
                  <div className="text-lg font-semibold">
                    {watch('min_stock')} {watch('unit')}
                  </div>
                </div>
                <div className="text-right">
                  {parseInt(watch('current_stock')) <= parseInt(watch('min_stock')) ? (
                    <div className="flex items-center text-red-600">
                      <i className="fas fa-exclamation-triangle mr-2" />
                      <span className="font-medium">Nízký stav!</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <i className="fas fa-check-circle mr-2" />
                      <span className="font-medium">Dostatečný stav</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat materiál"
        size="md"
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
              icon="fas fa-trash"
            >
              Smazat materiál
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Opravdu smazat materiál?
            </h3>
            <p className="text-gray-600">
              Chcete smazat materiál <strong>{materialToDelete?.name}</strong>?
            </p>
            {materialToDelete && materialToDelete.current_stock > 0 && (
              <p className="text-sm text-yellow-600 mt-2">
                <i className="fas fa-exclamation-triangle mr-1" />
                Materiál má aktuální stav {materialToDelete.current_stock} {materialToDelete.unit}
              </p>
            )}
            <p className="text-sm text-red-600 mt-2">
              Tato akce je nevratná. Historie použití materiálu zůstane zachována.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MaterialsPage
