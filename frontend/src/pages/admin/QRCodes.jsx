import { useState, useEffect } from 'react'
import { qrAPI } from '../../lib/api'
import { formatDate, formatDateTime } from '../../lib/utils'
import {
  Plus, QrCode, Trash2, Edit3, Eye, ChevronLeft, ChevronRight,
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
  const [form, setForm] = useState({ code: '', segment: '', equipe: '', ligne: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // QR image modal
  const [qrImage, setQrImage] = useState(null)
  const [loadingImage, setLoadingImage] = useState(false)

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
    setForm({ code: '', segment: '', equipe: '', ligne: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (qr) => {
    setEditingQR(qr)
    setForm({ code: qr.code, segment: qr.segment, equipe: qr.equipe, ligne: qr.ligne })
    setError('')
    setShowModal(true)
  }

  const saveQR = async () => {
    if (!form.segment || !form.equipe || !form.ligne) {
      setError('Tous les champs sont requis')
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

  const showQRImage = async (qr) => {
    setLoadingImage(true)
    setQrImage(null)
    try {
      const baseUrl = window.location.origin
      const res = await qrAPI.getImage(qr.id, baseUrl)
      setQrImage({ ...qr, image: res.data.image, url: res.data.url })
    } catch {
      // ignore
    } finally {
      setLoadingImage(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QR Codes</h2>
          <p className="text-gray-500 mt-1">{total} QR code(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouveau QR Code
        </button>
      </div>

      {/* QR Codes table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Code</th>
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
                <tr><td colSpan={8} className="table-cell text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : qrCodes.length === 0 ? (
                <tr><td colSpan={8} className="table-cell text-center py-8 text-gray-400">Aucun QR code</td></tr>
              ) : (
                qrCodes.map((qr) => (
                  <tr key={qr.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell font-mono font-medium">{qr.code}</td>
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
                        <button onClick={() => showQRImage(qr)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Voir QR">
                          <QrCode className="w-4 h-4" />
                        </button>
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
              {editingQR ? 'Modifier QR Code' : 'Nouveau QR Code'}
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

      {/* QR Image Modal */}
      {qrImage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQrImage(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">QR Code: {qrImage.code}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {qrImage.segment} | {qrImage.equipe} | {qrImage.ligne}
            </p>
            {loadingImage ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            ) : (
              <img src={qrImage.image} alt="QR Code" className="mx-auto mb-4" />
            )}
            <p className="text-xs text-gray-400 mb-4 break-all">URL: {qrImage.url}</p>
            <div className="flex gap-3">
              <button onClick={() => setQrImage(null)} className="btn-secondary flex-1">Fermer</button>
              <a
                href={qrImage.image}
                download={`qr_${qrImage.code}.png`}
                className="btn-primary flex-1"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
