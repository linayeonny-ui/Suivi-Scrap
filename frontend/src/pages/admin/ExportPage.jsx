import { useState } from 'react'
import { adminAPI } from '../../lib/api'
import { downloadBlob } from '../../lib/utils'
import {
  Download, FileSpreadsheet, FileText, Filter, Loader2,
} from 'lucide-react'

export default function ExportPage() {
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    segment: '',
    equipe: '',
    ligne: '',
    semaine: '',
  })
  const [format, setFormat] = useState('xlsx')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { format, ...filters }
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k]
      })
      const res = await adminAPI.exportData(params)
      const filename = `scrap_export.${format}`
      downloadBlob(res.data, filename)
    } catch (err) {
      alert('Erreur lors de l\'export: ' + (err.response?.data?.error || err.message))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Export des données</h2>
        <p className="text-gray-500 mt-1">Exporter les données de scrap en CSV ou Excel</p>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Filtres d'export</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semaine</label>
              <input
                type="number"
                value={filters.semaine}
                onChange={(e) => setFilters({ ...filters, semaine: e.target.value })}
                className="input-field"
                placeholder="N° semaine"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segment</label>
              <input
                type="text"
                value={filters.segment}
                onChange={(e) => setFilters({ ...filters, segment: e.target.value })}
                className="input-field"
                placeholder="Segment..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Équipe</label>
              <input
                type="text"
                value={filters.equipe}
                onChange={(e) => setFilters({ ...filters, equipe: e.target.value })}
                className="input-field"
                placeholder="Équipe..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ligne</label>
              <input
                type="text"
                value={filters.ligne}
                onChange={(e) => setFilters({ ...filters, ligne: e.target.value })}
                className="input-field"
                placeholder="Ligne..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Download className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Format d'export</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setFormat('xlsx')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                format === 'xlsx'
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileSpreadsheet className={`w-8 h-8 mb-2 ${format === 'xlsx' ? 'text-primary-600' : 'text-gray-400'}`} />
              <p className="font-semibold text-gray-900">Excel (.xlsx)</p>
              <p className="text-sm text-gray-500">Format Excel avec mise en forme</p>
            </button>
            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                format === 'csv'
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`w-8 h-8 mb-2 ${format === 'csv' ? 'text-primary-600' : 'text-gray-400'}`} />
              <p className="font-semibold text-gray-900">CSV</p>
              <p className="text-sm text-gray-500">Format CSV compatible avec tous les logiciels</p>
            </button>
          </div>

          <button onClick={handleExport} disabled={exporting} className="btn-primary w-full">
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exporter en {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}
