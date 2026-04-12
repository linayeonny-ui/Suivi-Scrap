import { useState, useEffect, useRef } from 'react'
import { uploadAPI } from '../../lib/api'
import {
  Upload, Trash2, Search, ChevronLeft, ChevronRight, Loader2,
  FileSpreadsheet, AlertCircle, CheckCircle2, X,
} from 'lucide-react'

export default function WireMappings() {
  const [mappings, setMappings] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState('replace')
  const [uploadResult, setUploadResult] = useState(null)

  useEffect(() => {
    loadMappings()
  }, [page, search])

  const loadMappings = async () => {
    setLoading(true)
    try {
      const res = await uploadAPI.listWireMappings({ page, per_page: 30, search })
      setMappings(res.data.items)
      setTotalPages(res.data.pages)
      setTotal(res.data.total)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadResult(null)
    try {
      const res = await uploadAPI.uploadWireMapping(file, uploadMode)
      setUploadResult({ type: 'success', ...res.data })
      setPage(1)
      loadMappings()
    } catch (err) {
      setUploadResult({ type: 'error', message: err.response?.data?.error || 'Erreur lors de l\'upload' })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const deleteMapping = async (id) => {
    try {
      await uploadAPI.deleteWireMapping(id)
      loadMappings()
    } catch {
      // ignore
    }
  }

  const clearAll = async () => {
    if (!confirm('Supprimer TOUS les mappings fil/CCFE?')) return
    try {
      await uploadAPI.clearWireMappings()
      setPage(1)
      loadMappings()
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Fils / CCFE</h2>
        <p className="text-gray-500 mt-1">Gérer les mappings Fil → CCFE (N° Pièce)</p>
      </div>

      {/* Upload section */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Importer un fichier Excel</h3>
        </div>
        <div className="card-body">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700">
              <strong>Format requis:</strong> Fichier Excel (.xlsx) avec la colonne A = Fil (wire ID) et la colonne B = CCFE (N° Pièce). La première ligne est considérée comme en-tête et sera ignorée.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700">Mode:</label>
                <select
                  value={uploadMode}
                  onChange={(e) => setUploadMode(e.target.value)}
                  className="select-field text-sm py-1.5 w-auto"
                >
                  <option value="replace">Remplacer tout</option>
                  <option value="append">Ajouter (append)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleUpload}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary-600" />}
              </div>
            </div>
          </div>

          {uploadResult && (
            <div className={`mt-4 rounded-lg p-3 text-sm flex items-center gap-2 ${uploadResult.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {uploadResult.type === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {uploadResult.message} — Total: {uploadResult.total_mappings} mappings
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {uploadResult.message}
                </>
              )}
              <button onClick={() => setUploadResult(null)} className="ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-10"
            placeholder="Rechercher fil ou CCFE..."
          />
        </div>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 py-2">{total} mappings</span>
          <button onClick={clearAll} className="btn-danger text-sm py-1.5 px-3">
            <Trash2 className="w-3.5 h-3.5" />
            Tout supprimer
          </button>
        </div>
      </div>

      {/* Mappings table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Fil</th>
                <th className="table-header">CCFE (N° Pièce)</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="table-cell text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : mappings.length === 0 ? (
                <tr><td colSpan={3} className="table-cell text-center py-8 text-gray-400">Aucun mapping trouvé</td></tr>
              ) : (
                mappings.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell font-medium font-mono">{m.fil}</td>
                    <td className="table-cell text-gray-600">{m.ccfe}</td>
                    <td className="table-cell text-right">
                      <button onClick={() => deleteMapping(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
    </div>
  )
}
