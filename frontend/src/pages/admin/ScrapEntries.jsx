import { useState, useEffect } from 'react'
import { adminAPI, refAPI } from '../../lib/api'
import { formatDate, formatDateTime } from '../../lib/utils'
import {
  Search, Filter, Trash2, Edit3, Eye, ChevronLeft, ChevronRight,
  X, Save, Loader2, FileText,
} from 'lucide-react'

export default function ScrapEntries() {
  const [sessions, setSessions] = useState([])
  const [areas, setAreas] = useState([])
  const [typeScraps, setTypeScraps] = useState([])
  const [raisons, setRaisons] = useState([])
  const [postes, setPostes] = useState([])

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    segment: '',
    equipe: '',
    ligne: '',
    semaine: '',
    date_from: '',
    date_to: '',
  })

  // Edit modal
  const [editingEntry, setEditingEntry] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  // View modal
  const [viewingSession, setViewingSession] = useState(null)

  useEffect(() => {
    refAPI.listAreas().then((r) => setAreas(r.data)).catch(() => {})
    refAPI.listTypeScraps().then((r) => setTypeScraps(r.data)).catch(() => {})
    refAPI.listRaisons().then((r) => setRaisons(r.data)).catch(() => {})
    refAPI.listPostes().then((r) => setPostes(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    loadSessions()
  }, [page, filters])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v
      })
      const res = await adminAPI.listSessions(params)
      setSessions(res.data.items)
      setTotalPages(res.data.pages)
      setTotal(res.data.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (id) => {
    if (!confirm('Supprimer cette session et toutes ses entrées?')) return
    try {
      await adminAPI.deleteSession(id)
      loadSessions()
    } catch {
      // ignore
    }
  }

  const deleteEntry = async (entryId) => {
    if (!confirm('Supprimer cette entrée?')) return
    try {
      await adminAPI.deleteEntry(entryId)
      if (viewingSession) {
        setViewingSession({
          ...viewingSession,
          entries: viewingSession.entries.filter((e) => e.id !== entryId),
        })
      }
      loadSessions()
    } catch {
      // ignore
    }
  }

  const startEdit = (entry) => {
    setEditingEntry(entry.id)
    setEditForm({
      area_id: entry.area_id,
      type_scrap_id: entry.type_scrap_id,
      poste_id: entry.poste_id,
      raison_id: entry.raison_id,
      numero_piece: entry.numero_piece,
      fil: entry.fil,
      quantite: entry.quantite,
    })
  }

  const saveEdit = async () => {
    setSaving(true)
    try {
      await adminAPI.updateEntry(editingEntry, editForm)
      setEditingEntry(null)
      loadSessions()
      if (viewingSession) {
        const res = await adminAPI.getSession(viewingSession.id)
        setViewingSession(res.data)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const viewSession = async (session) => {
    try {
      const res = await adminAPI.getSession(session.id)
      setViewingSession(res.data)
    } catch {
      // ignore
    }
  }

  const getAreaName = (id) => areas.find((a) => a.id === id)?.name || '-'
  const getTypeName = (id) => typeScraps.find((t) => t.id === id)?.name || '-'
  const getRaisonName = (id) => raisons.find((r) => r.id === id)?.name || '-'
  const getPosteName = (id) => postes.find((p) => p.id === id)?.name || '-'

  const getPostesForArea = (areaId) => postes.filter((p) => p.area_id === areaId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sessions Scrap</h2>
          <p className="text-gray-500 mt-1">{total} session(s) au total</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary"
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="select-field text-sm"
              >
                <option value="">Tous</option>
                <option value="completed">Complété</option>
                <option value="pending_weight">En attente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Segment</label>
              <input
                type="text"
                value={filters.segment}
                onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
                className="input-field text-sm"
                placeholder="Segment..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Équipe</label>
              <input
                type="text"
                value={filters.equipe}
                onChange={(e) => setFilters({ ...filters, equipe: e.target.value })}
                className="input-field text-sm"
                placeholder="Équipe..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ligne</label>
              <input
                type="text"
                value={filters.ligne}
                onChange={(e) => setFilters({ ...filters, ligne: e.target.value })}
                className="input-field text-sm"
                placeholder="Ligne..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semaine</label>
              <input
                type="number"
                value={filters.semaine}
                onChange={(e) => setFilters({ ...filters, semaine: e.target.value })}
                className="input-field text-sm"
                placeholder="N° semaine"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date début</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-field text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilters({ status: '', segment: '', equipe: '', ligne: '', semaine: '', date_from: '', date_to: '' }); setPage(1) }}
                className="btn-secondary text-sm"
              >
                <X className="w-3 h-3" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Semaine</th>
                <th className="table-header">Date</th>
                <th className="table-header">Segment</th>
                <th className="table-header">Équipe</th>
                <th className="table-header">Ligne</th>
                <th className="table-header">Entrées</th>
                <th className="table-header">Poids (kg)</th>
                <th className="table-header">Statut</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="table-cell text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-8 text-gray-400">Aucune session trouvée</td></tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell font-medium">S{s.semaine}</td>
                    <td className="table-cell">{formatDate(s.date)}</td>
                    <td className="table-cell">{s.segment}</td>
                    <td className="table-cell">{s.equipe}</td>
                    <td className="table-cell">{s.ligne}</td>
                    <td className="table-cell">{s.entries_count}</td>
                    <td className="table-cell font-medium">{s.total_weight || '-'}</td>
                    <td className="table-cell">
                      {s.status === 'completed' ? (
                        <span className="badge-success">Complétée</span>
                      ) : (
                        <span className="badge-warning">En attente</span>
                      )}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewSession(s)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Voir détails">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteSession(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Session Modal */}
      {viewingSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingSession(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Session #{viewingSession.id}</h3>
                <p className="text-sm text-gray-500">
                  {viewingSession.segment} | {viewingSession.equipe} | {viewingSession.ligne}
                </p>
              </div>
              <button onClick={() => setViewingSession(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div><span className="text-gray-500">Semaine:</span> <strong>S{viewingSession.semaine}</strong></div>
                <div><span className="text-gray-500">Date:</span> <strong>{formatDate(viewingSession.date)}</strong></div>
                <div><span className="text-gray-500">Poids:</span> <strong>{viewingSession.total_weight || '-'} kg</strong></div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3">
                Entrées ({viewingSession.entries?.length || 0})
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="table-header">Area</th>
                      <th className="table-header">Poste</th>
                      <th className="table-header">Type</th>
                      <th className="table-header">Fil</th>
                      <th className="table-header">CCFE</th>
                      <th className="table-header">Qté</th>
                      <th className="table-header">Raison</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSession.entries?.map((entry) => (
                      editingEntry === entry.id ? (
                        <tr key={entry.id} className="border-b border-gray-50 bg-primary-50/30">
                          <td className="table-cell">
                            <select value={editForm.area_id} onChange={(e) => setEditForm({ ...editForm, area_id: parseInt(e.target.value) })} className="select-field text-xs py-1">
                              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </td>
                          <td className="table-cell">
                            <select value={editForm.poste_id} onChange={(e) => setEditForm({ ...editForm, poste_id: parseInt(e.target.value) })} className="select-field text-xs py-1">
                              {getPostesForArea(editForm.area_id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="table-cell">
                            <select value={editForm.type_scrap_id} onChange={(e) => setEditForm({ ...editForm, type_scrap_id: parseInt(e.target.value) })} className="select-field text-xs py-1">
                              {typeScraps.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </td>
                          <td className="table-cell">
                            <input type="text" value={editForm.fil} onChange={(e) => setEditForm({ ...editForm, fil: e.target.value })} className="input-field text-xs py-1" />
                          </td>
                          <td className="table-cell">
                            <input type="text" value={editForm.numero_piece} onChange={(e) => setEditForm({ ...editForm, numero_piece: e.target.value })} className="input-field text-xs py-1" />
                          </td>
                          <td className="table-cell">
                            <input type="number" value={editForm.quantite} onChange={(e) => setEditForm({ ...editForm, quantite: parseInt(e.target.value) })} className="input-field text-xs py-1 w-20" />
                          </td>
                          <td className="table-cell">
                            <select value={editForm.raison_id} onChange={(e) => setEditForm({ ...editForm, raison_id: parseInt(e.target.value) })} className="select-field text-xs py-1">
                              {raisons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                          </td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={saveEdit} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                              <button onClick={() => setEditingEntry(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={entry.id} className="border-b border-gray-50">
                          <td className="table-cell">{entry.area?.name}</td>
                          <td className="table-cell">{entry.poste?.name}</td>
                          <td className="table-cell">{entry.type_scrap?.name}</td>
                          <td className="table-cell font-medium">{entry.fil}</td>
                          <td className="table-cell text-gray-500">{entry.numero_piece}</td>
                          <td className="table-cell font-semibold">{entry.quantite}</td>
                          <td className="table-cell">{entry.raison?.name}</td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => startEdit(entry)} className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
