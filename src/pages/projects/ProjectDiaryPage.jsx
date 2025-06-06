import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useProjectsStore from '../../store/projectsStore'
import useAuthStore from '../../store/authStore'
import { Button, Card, Input, Modal, Table } from '../../components/ui'
import { usePermissions } from '../../components/common/ProtectedRoute'
import { formatDate, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const ProjectDiaryPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { 
    currentProject, 
    projectDiary,
    loadProject, 
    loadProjectDiary,
    addDiaryEntry,
    updateDiaryEntry,
    isLoading 
  } = useProjectsStore()
  const { hasPermission } = usePermissions()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0],
      weather: '',
      temperature: '',
      work_description: '',
      workers_count: 1,
      materials_used: '',
      equipment_used: '',
      notes: '',
      photos: []
    }
  })

  useEffect(() => {
    if (id) {
      loadProject(id)
      loadProjectDiary(id)
    }
  }, [id, loadProject, loadProjectDiary])

  useEffect(() => {
    if (editingEntry) {
      // Fill form with editing data
      Object.keys(editingEntry).forEach(key => {
        if (key === 'entry_date') {
          setValue(key, editingEntry[key]?.split('T')[0])
        } else {
          setValue(key, editingEntry[key] || '')
        }
      })
    }
  }, [editingEntry, setValue])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      let result
      if (editingEntry) {
        result = await updateDiaryEntry(editingEntry.id, data)
      } else {
        result = await addDiaryEntry(id, data, profile.id)
      }

      if (result.success) {
        toast.success(editingEntry ? 'Záznam upraven' : 'Záznam přidán')
        handleCloseModal()
      } else {
        toast.error(result.error || 'Chyba při ukládání')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingEntry(null)
    reset()
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setShowAddModal(true)
  }

  const weatherOptions = [
    { value: '', label: 'Vyberte počasí' },
    { value: 'sunny', label: '☀️ Slunečno' },
    { value: 'cloudy', label: '☁️ Oblačno' },
    { value: 'partly_cloudy', label: '⛅ Polojasno' },
    { value: 'rainy', label: '🌧️ Deštivo' },
    { value: 'stormy', label: '⛈️ Bouřka' },
    { value: 'snowy', label: '❄️ Sněžení' },
    { value: 'foggy', label: '🌫️ Mlha' },
    { value: 'windy', label: '💨 Větrno' }
  ]

  const columns = [
    {
      key: 'entry_date',
      title: 'Datum',
      render: (value) => formatDate(value)
    },
    {
      key: 'weather',
      title: 'Počasí',
      render: (value) => {
        const weather = weatherOptions.find(w => w.value === value)
        return weather ? weather.label : value || '-'
      }
    },
    {
      key: 'temperature',
      title: 'Teplota',
      render: (value) => value ? `${value}°C` : '-'
    },
    {
      key: 'workers_count',
      title: 'Počet pracovníků',
      render: (value) => value || 0
    },
    {
      key: 'work_description',
      title: 'Popis prací',
      render: (value) => (
        <div className="max-w-xs">
          <p className="truncate" title={value}>{value || '-'}</p>
        </div>
      )
    },
    {
      key: 'author',
      title: 'Autor',
      render: (value) => value ? `${value.first_name} ${value.last_name}` : '-'
    },
    {
      key: 'created_at',
      title: 'Vytvořeno',
      render: (value) => formatDateTime(value)
    },
    {
      key: 'actions',
      title: 'Akce',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon="fas fa-eye"
            onClick={() => console.log('View entry', row)}
          />
          {hasPermission('projects') && (
            <Button
              variant="ghost"
              size="sm"
              icon="fas fa-edit"
              onClick={() => handleEdit(row)}
            />
          )}
        </div>
      )
    }
  ]

  if (isLoading || !currentProject) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/projects/${id}`)}
                icon="fas fa-arrow-left"
              >
                Zpět na projekt
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Stavební deník</h1>
            <p className="text-gray-600">{currentProject.name}</p>
          </div>
          
          {hasPermission('projects') && (
            <Button
              onClick={() => setShowAddModal(true)}
              icon="fas fa-plus"
            >
              Nový záznam
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-book text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Celkem záznamů</p>
              <p className="text-2xl font-bold text-gray-900">{projectDiary.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-calendar text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tento měsíc</p>
              <p className="text-2xl font-bold text-gray-900">
                {projectDiary.filter(entry => {
                  const entryDate = new Date(entry.entry_date)
                  const now = new Date()
                  return entryDate.getMonth() === now.getMonth() && 
                         entryDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Poslední záznam</p>
              <p className="text-lg font-bold text-gray-900">
                {projectDiary.length > 0 ? formatDate(projectDiary[0].entry_date) : '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Diary Entries Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Záznamy deníku ({projectDiary.length})
          </h2>
        </div>
        
        <Table
          columns={columns}
          data={projectDiary}
          loading={isLoading}
          emptyMessage="Zatím žádné záznamy v deníku"
          emptyIcon="fas fa-book-open"
        />
      </Card>

      {/* Add/Edit Entry Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={editingEntry ? 'Upravit záznam' : 'Nový záznam deníku'}
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
              {editingEntry ? 'Uložit změny' : 'Přidat záznam'}
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('entry_date', { required: 'Datum je povinné' })}
              label="Datum"
              type="date"
              error={errors.entry_date?.message}
              required
            />
            
            <Input
              {...register('weather')}
              label="Počasí"
              type="select"
            >
              {weatherOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            
            <Input
              {...register('temperature')}
              label="Teplota"
              type="number"
              placeholder="20"
              suffix="°C"
            />
          </div>

          <Input
            {...register('workers_count', { 
              required: 'Počet pracovníků je povinný',
              min: { value: 1, message: 'Minimálně 1 pracovník' }
            })}
            label="Počet pracovníků"
            type="number"
            min="1"
            error={errors.workers_count?.message}
            required
          />

          <Input
            {...register('work_description', { required: 'Popis prací je povinný' })}
            label="Popis vykonávaných prací"
            type="textarea"
            rows={4}
            placeholder="Detailní popis prací vykonávaných během dne..."
            error={errors.work_description?.message}
            required
          />

          <Input
            {...register('materials_used')}
            label="Použitý materiál"
            type="textarea"
            rows={3}
            placeholder="Seznam použitého materiálu..."
          />

          <Input
            {...register('equipment_used')}
            label="Použité nářadí a stroje"
            type="textarea"
            rows={3}
            placeholder="Seznam použitého nářadí a strojů..."
          />

          <Input
            {...register('notes')}
            label="Poznámky a pozorování"
            type="textarea"
            rows={3}
            placeholder="Dodatečné poznámky, problémy, pozorování..."
          />

          <div>
            <label className="form-label">Fotodokumentace</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <i className="fas fa-camera text-3xl text-gray-400 mb-2" />
              <p className="text-gray-500">Přidání fotografií bude implementováno v další verzi</p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProjectDiaryPage
