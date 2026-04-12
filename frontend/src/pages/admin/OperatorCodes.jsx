import { useState, useEffect } from 'react'
import { adminAPI } from '../../lib/api'
import {
  Key, Plus, Trash2, Edit3, Check, X, Shuffle, Copy,
  Loader2, AlertCircle, ToggleLeft, ToggleRight,
} from 'lucide-react'

export default function OperatorCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formCode, setFormCode] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const load = async () => {
    try {
      const res = await adminAPI.listOperatorCodes()
      setCodes(res.data)
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const generate = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await adminAPI.generateOperatorCode(formLabel || undefined)
      setCodes([res.data, ...codes])
      setShowForm(false)
      setFormCode('')
      setFormLabel('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const create = async () => {
    if (!formCode.trim()) { setError('Code requis'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await adminAPI.createOperatorCode({ code: formCode, label: formLabel })
      setCodes([res.data, ...codes])
      setShowForm(false)
      setFormCode('')
      setFormLabel('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (opCode) => {
    try {
      const res = await adminAPI.updateOperatorCode(opCode.id, { is_active: !opCode.is_active })
      setCodes(codes.map((c) => (c.id === opCode.id ? res.data : c)))
    } catch {}
  }

  const startEdit = (opCode) => {
    setEditId(opCode.id)
    setFormCode(opCode.code)
    setFormLabel(opCode.label)
  }

  const saveEdit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await adminAPI.updateOperatorCode(editId, { code: formCode, label: formLabel })
      setCodes(codes.map((c) => (c.id === editId ? res.data : c)))
      setEditId(null)
      setFormCode('')
      setFormLabel('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCode = async (id) => {
    if (!confirm('Supprimer ce code opérateur ?')) return
    try {
      await adminAPI.deleteOperatorCode(id)
      setCodes(codes.filter((c) => c.id !== id))
    } catch {}
  }

  const copyCode = (opCode) => {
    navigator.clipboard.writeText(opCode.code)
    setCopiedId(opCode.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Codes Opérateur</h2>
          <p className="text-gray-500 mt-1">Gérer les codes d'accès pour les opérateurs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(true); setEditId(null); setFormCode(''); setFormLabel('') }} className="btn-primary">
            <Plus className="w-4 h-4" /> Créer
          </button>
          <button onClick={generate} disabled={submitting} className="btn-secondary">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
            Générer aléatoire
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Nouveau code opérateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input type="text" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="input-field" placeholder="Ex: OP1234" maxLength={20} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
              <input type="text" value={formLabel} onChange={(e) => setFormLabel(e.target.value)}
                className="input-field" placeholder="Ex: Équipe A" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Créer
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              <X className="w-4 h-4" /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Codes list */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Libellé</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Créé le</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Aucun code opérateur créé
                  </td>
                </tr>
              ) : (
                codes.map((opCode) => (
                  <tr key={opCode.id} className="border-b border-gray-50 hover:bg-gray-50">
                    {editId === opCode.id ? (
                      <>
                        <td className="py-3 px-4">
                          <input type="text" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                            className="input-field py-1" maxLength={20} />
                        </td>
                        <td className="py-3 px-4">
                          <input type="text" value={formLabel} onChange={(e) => setFormLabel(e.target.value)}
                            className="input-field py-1" />
                        </td>
                        <td className="py-3 px-4 text-center">—</td>
                        <td className="py-3 px-4">—</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={saveEdit} disabled={submitting} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono font-bold text-base">
                              {opCode.code}
                            </code>
                            <button onClick={() => copyCode(opCode)} className="p-1 text-gray-400 hover:text-primary-600" title="Copier">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {copiedId === opCode.id && (
                              <span className="text-xs text-emerald-600 font-medium">Copié!</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{opCode.label}</td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => toggleActive(opCode)} className="inline-flex items-center gap-1">
                            {opCode.is_active ? (
                              <><ToggleRight className="w-6 h-6 text-emerald-500" /><span className="text-xs text-emerald-600 font-medium">Actif</span></>
                            ) : (
                              <><ToggleLeft className="w-6 h-6 text-gray-400" /><span className="text-xs text-gray-400">Inactif</span></>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {new Date(opCode.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => startEdit(opCode)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteCode(opCode.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
