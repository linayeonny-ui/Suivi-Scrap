import { useState, useEffect } from 'react'
import { adminAPI } from '../../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import {
  TrendingUp, Package, Scale, AlertTriangle, CheckCircle2, Clock,
  BarChart3, Activity,
} from 'lucide-react'

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.dashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-gray-500">Erreur de chargement du tableau de bord</p>
  }

  const { summary, scrap_by_type, scrap_by_area, scrap_by_section, scrap_by_segment, scrap_by_equipe, scrap_by_raison, weekly_trend, daily_trend, top_postes, top_fils } = data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-500 mt-1">Vue d'ensemble des données de scrap</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="stat-value">{summary.total_entries}</p>
          <p className="stat-label">Total entrées</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="stat-value">{summary.total_weight.toFixed(1)}</p>
          <p className="stat-label">Poids total (kg)</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="stat-value">{summary.completed_sessions}</p>
          <p className="stat-label">Sessions complétées</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="stat-value">{summary.pending_sessions}</p>
          <p className="stat-label">Sessions en attente</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scrap by Type */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Scrap par Type</h3>
          </div>
          <div className="card-body">
            {scrap_by_type.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scrap_by_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantite" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Quantité" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Scrap by Area (Pie) */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Scrap par Area</h3>
          </div>
          <div className="card-body">
            {scrap_by_area.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={scrap_by_area}
                    dataKey="quantite"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {scrap_by_area.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Weekly trend */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Tendance hebdomadaire</h3>
          </div>
          <div className="card-body">
            {weekly_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weekly_trend.reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="semaine" tick={{ fontSize: 12 }} label={{ value: 'Semaine', position: 'insideBottom', offset: -5 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="quantite" stroke="#3b82f6" strokeWidth={2} name="Quantité" />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} name="Poids (kg)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Scrap by Raison */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Scrap par Raison</h3>
          </div>
          <div className="card-body">
            {scrap_by_raison.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scrap_by_raison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantite" fill="#ef4444" radius={[0, 4, 4, 0]} name="Quantité" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>

      {/* Top tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Postes */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Top Postes par scrap</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Poste</th>
                  <th className="table-header">Area</th>
                  <th className="table-header text-right">Entrées</th>
                  <th className="table-header text-right">Quantité</th>
                </tr>
              </thead>
              <tbody>
                {top_postes.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell font-medium">{row.poste}</td>
                    <td className="table-cell">{row.area}</td>
                    <td className="table-cell text-right">{row.count}</td>
                    <td className="table-cell text-right font-semibold">{row.quantite}</td>
                  </tr>
                ))}
                {top_postes.length === 0 && (
                  <tr><td colSpan={4} className="table-cell text-center text-gray-400">Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Fils */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Top Fils ou composants par scrap</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Fil ou composant</th>
                  <th className="table-header">N° Pièce / CCFE / PN</th>
                  <th className="table-header text-right">Entrées</th>
                  <th className="table-header text-right">Quantité</th>
                </tr>
              </thead>
              <tbody>
                {top_fils.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell font-medium">{row.fil}</td>
                    <td className="table-cell text-gray-500">{row.ccfe}</td>
                    <td className="table-cell text-right">{row.count}</td>
                    <td className="table-cell text-right font-semibold">{row.quantite}</td>
                  </tr>
                ))}
                {top_fils.length === 0 && (
                  <tr><td colSpan={4} className="table-cell text-center text-gray-400">Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Scrap by Section, Segment & Equipe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Scrap par Section</h3>
          </div>
          <div className="card-body">
            {scrap_by_section && scrap_by_section.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scrap_by_section}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantite" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Quantité" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Scrap par Segment</h3>
          </div>
          <div className="card-body">
            {scrap_by_segment.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scrap_by_segment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantite" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Quantité" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Scrap par Équipe</h3>
          </div>
          <div className="card-body">
            {scrap_by_equipe.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scrap_by_equipe}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantite" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Quantité" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
