import { useState, useEffect } from 'react'
import { refAPI } from '../../lib/api'
import {
  Plus, Trash2, Edit3, Save, X, Loader2, MapPin, Tag, AlertTriangle, ChevronDown,
} from 'lucide-react'

function RefSection({ title, icon: Icon, items, onCreate, onUpdate, onDelete, fields, color }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const openCreate = () => {
    setEditingId(null)
    setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}))
    setError('')
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: item[f.key] || '' }), {}))
    setError('')
    setShowForm(true)
  }

  const save = async () => {
    for (const f of fields) {
      if (f.required && !form[f.key]) {
        setError(`${f.label} est requis`)
        return
      }
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await onUpdate(editingId, form)
      } else {
        await onCreate(form)
      }
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="badge-info">{items.length}</span>
        </div>
        <button onClick={openCreate} className="btn-secondary text-sm py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {showForm && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-3">
            {fields.map((f) => (
              <div key={f.key} className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="select-field text-sm py-1.5"
                  >
                    <option value="">Sélectionner</option>
                    {f.options?.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="input-field text-sm py-1.5"
                    placeholder={f.label}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary text-sm py-1.5 px-3">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editingId ? 'Modifier' : 'Ajouter'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-1.5 px-3">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">Aucun élément</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                {item.area_id && (
                  <p className="text-xs text-gray-500">Area ID: {item.area_id}</p>
                )}
                {item.postes && item.postes?.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Postes: {item.postes.map((p) => p.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function ReferenceData() {
  const [areas, setAreas] = useState([])
  const [postes, setPostes] = useState([])
  const [typeScraps, setTypeScraps] = useState([])
  const [raisons, setRaisons] = useState([])

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const [areasRes, postesRes, typesRes, raisonsRes] = await Promise.all([
      refAPI.listAreas(),
      refAPI.listPostes(),
      refAPI.listTypeScraps(),
      refAPI.listRaisons(),
    ])
    setAreas(areasRes.data)
    setPostes(postesRes.data)
    setTypeScraps(typesRes.data)
    setRaisons(raisonsRes.data)
  }

  const handleDelete = async (type, id) => {
    if (!confirm('Supprimer cet élément?')) return
    const apiMap = {
      area: refAPI.deleteArea,
      poste: refAPI.deletePoste,
      typeScrap: refAPI.deleteTypeScrap,
      raison: refAPI.deleteRaison,
    }
    try {
      await apiMap[type](id)
      loadAll()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Référentiels</h2>
        <p className="text-gray-500 mt-1">Gérer les données de référence du système</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RefSection
          title="Areas"
          icon={MapPin}
          items={areas}
          color="blue"
          fields={[{ key: 'name', label: 'Nom', required: true }]}
          onCreate={(data) => refAPI.createArea(data).then(loadAll)}
          onUpdate={(id, data) => refAPI.updateArea(id, data).then(loadAll)}
          onDelete={(id) => handleDelete('area', id)}
        />

        <RefSection
          title="Postes"
          icon={Tag}
          items={postes}
          color="purple"
          fields={[
            { key: 'name', label: 'Nom', required: true },
            { key: 'area_id', label: 'Area', type: 'select', options: areas, required: true },
          ]}
          onCreate={(data) => refAPI.createPoste({ ...data, area_id: parseInt(data.area_id) }).then(loadAll)}
          onUpdate={(id, data) => refAPI.updatePoste(id, { ...data, area_id: parseInt(data.area_id) }).then(loadAll)}
          onDelete={(id) => handleDelete('poste', id)}
        />

        <RefSection
          title="Types de Scrap"
          icon={AlertTriangle}
          items={typeScraps}
          color="amber"
          fields={[{ key: 'name', label: 'Nom', required: true }]}
          onCreate={(data) => refAPI.createTypeScrap(data).then(loadAll)}
          onUpdate={(id, data) => refAPI.updateTypeScrap(id, data).then(loadAll)}
          onDelete={(id) => handleDelete('typeScrap', id)}
        />

        <RefSection
          title="Raisons"
          icon={AlertTriangle}
          items={raisons}
          color="emerald"
          fields={[{ key: 'name', label: 'Nom', required: true }]}
          onCreate={(data) => refAPI.createRaison(data).then(loadAll)}
          onUpdate={(id, data) => refAPI.updateRaison(id, data).then(loadAll)}
          onDelete={(id) => handleDelete('raison', id)}
        />
      </div>
    </div>
  )
}
