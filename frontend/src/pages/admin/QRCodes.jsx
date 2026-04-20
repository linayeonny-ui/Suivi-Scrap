import { useState, useEffect } from 'react'
import { qrAPI } from '../../lib/api'
import { formatDate, formatDateTime } from '../../lib/utils'
import {
  Plus, QrCode, Trash2, Edit3, ChevronLeft, ChevronRight,
  X, Save, Loader2, Download, ToggleLeft, ToggleRight,
} from 'lucide-react'

export default function QRCodes() {
  const [qrCodes, setQrCodes] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editingQR, setEditingQR] = useState(null)
  const [form, setForm] = useState({ code: '', section: '', segment: '', equipe: '', ligne: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadQRCodes()
  }, [page])

  const loadQRCodes = async () => {
    setLoading(true)
    try {
      const res = await qrAPI.list({ page, per_page: 15 })
      setQrCodes(res.data.items)
      setTotalPages(res.data.pages)
      setTotal(res.data.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingQR(null)
    setForm({ code: '', section: '', segment: '', equipe: '', ligne: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (qr) => {
    setEditingQR(qr)
    setForm({ code: qr.code, section: qr.section, segment: qr.segment, equipe: qr.equipe, ligne: qr.ligne })
    setError('')
    setShowModal(true)
  }

  const saveQR = async () => {
    if (!form.section || !form.segment || !form.equipe || !form.ligne) {
      setError('Tous les champs sont requis (Section, Segment, Équipe, Ligne)')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingQR) {
        await qrAPI.update(editingQR.id, form)
      } else {
        await qrAPI.create(form)
      }
      setShowModal(false)
      loadQRCodes()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const deleteQR = async (id) => {
    if (!confirm('Supprimer ce QR code?')) return
    try {
      await qrAPI.delete(id)
      loadQRCodes()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const toggleActive = async (qr) => {
    try {
      await qrAPI.update(qr.id, { is_active: !qr.is_active })
      loadQRCodes()
    } catch {
      // ignore
    }
  }

  // Single site QR code
  const [siteQR, setSiteQR] = useState(null)
  const [showSiteQRModal, setShowSiteQRModal] = useState(false)
  const [loadingSiteQR, setLoadingSiteQR] = useState(false)
  const [siteQRError, setSiteQRError] = useState('')

  const openSiteQR = async () => {
    setShowSiteQRModal(true)
    setLoadingSiteQR(true)
    setSiteQRError('')
    setSiteQR(null)
    try {
      const baseUrl = window.location.origin
      const res = await qrAPI.getSiteQR(baseUrl)
      setSiteQR(res.data)
    } catch (err) {
      setSiteQRError(err.response?.data?.error || 'Erreur lors du chargement du QR Site')
    } finally {
      setLoadingSiteQR(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Codes d'affectation</h2>
          <p className="text-gray-500 mt-1">{total} code(s) d'affectation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openSiteQR} className="btn-secondary">
            <QrCode className="w-4 h-4" />
            QR Site
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau code
          </button>
        </div>
      </div>

      {/* QR Codes table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Code</th>
                <th className="table-header">Section</th>
                <th className="table-header">Segment</th>
                <th className="table-header">Équipe</th>
                <th className="table-header">Ligne</th>
                <th className="table-header">Entrées</th>
                <th className="table-header">Statut</th>
                <th className="table-header">Créé le</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="table-cell text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : qrCodes.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-8 text-gray-400">Aucun code d'affectation</td></tr>
              ) : (
                qrCodes.map((qr) => (
                  <tr key={qr.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell font-mono font-medium">{qr.code}</td>
                    <td className="table-cell">{qr.section}</td>
                    <td className="table-cell">{qr.segment}</td>
                    <td className="table-cell">{qr.equipe}</td>
                    <td className="table-cell">{qr.ligne}</td>
                    <td className="table-cell">{qr.entries_count}</td>
                    <td className="table-cell">
                      <button onClick={() => toggleActive(qr)} className="flex items-center gap-1">
                        {qr.is_active ? (
                          <><ToggleRight className="w-5 h-5 text-emerald-500" /> <span className="badge-success">Actif</span></>
                        ) : (
                          <><ToggleLeft className="w-5 h-5 text-gray-400" /> <span className="badge-danger">Inactif</span></>
                        )}
                      </button>
                    </td>
                    <td className="table-cell text-gray-500">{formatDate(qr.created_at)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(qr)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Modifier">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteQR(qr.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
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
            <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingQR ? 'Modifier le code' : 'Nouveau code d\'affectation'}
            </h3>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code (auto-généré si vide)</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="input-field"
                  placeholder="Laisser vide pour auto-générer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                <input
                  type="text"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="input-field"
                  placeholder="Section 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment *</label>
                <input
                  type="text"
                  value={form.segment}
                  onChange={(e) => setForm({ ...form, segment: e.target.value })}
                  className="input-field"
                  placeholder="Segment A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Équipe *</label>
                <input
                  type="text"
                  value={form.equipe}
                  onChange={(e) => setForm({ ...form, equipe: e.target.value })}
                  className="input-field"
                  placeholder="Équipe Alpha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ligne *</label>
                <input
                  type="text"
                  value={form.ligne}
                  onChange={(e) => setForm({ ...form, ligne: e.target.value })}
                  className="input-field"
                  placeholder="Ligne 1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveQR} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingQR ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site QR Modal */}
      {showSiteQRModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSiteQRModal(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">QR Code du Site</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ce QR code est unique. Tous les opérateurs le scannent puis entrent leur code d'affectation.
            </p>
            {loadingSiteQR ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            ) : siteQRError ? (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{siteQRError}</div>
            ) : siteQR ? (
              <>
                <img src={siteQR.image} alt="QR Code Site" className="mx-auto mb-4" />
                <p className="text-xs text-gray-400 mb-4 break-all">URL: {siteQR.url}</p>
              </>
            ) : null}
            <div className="flex gap-3">
              <button onClick={() => setShowSiteQRModal(false)} className="btn-secondary flex-1">Fermer</button>
              {siteQR && !loadingSiteQR && (
                <a
                  href={siteQR.image}
                  download="qr_site.png"
                  className="btn-primary flex-1"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
