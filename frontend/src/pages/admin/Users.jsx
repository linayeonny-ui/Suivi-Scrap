import { useState, useEffect } from 'react'
import { adminAPI } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import {
  Plus, Trash2, Edit3, Save, X, Loader2, Users as UsersIcon, Shield,
} from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', email: '', full_name: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.listUsers()
      setUsers(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingUser(null)
    setForm({ username: '', password: '', email: '', full_name: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({ username: user.username, password: '', email: user.email || '', full_name: user.full_name || '' })
    setError('')
    setShowModal(true)
  }

  const saveUser = async () => {
    if (!editingUser && (!form.username || !form.password)) {
      setError('Nom d\'utilisateur et mot de passe sont requis')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = { ...form }
      if (editingUser && !data.password) delete data.password
      if (editingUser) {
        await adminAPI.updateUser(editingUser.id, data)
      } else {
        await adminAPI.createUser(data)
      }
      setShowModal(false)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (id) => {
    if (!confirm('Supprimer cet utilisateur?')) return
    try {
      await adminAPI.deleteUser(id)
      loadUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-gray-500 mt-1">{users.length} utilisateur(s) administrateur(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Utilisateur</th>
                <th className="table-header">Nom complet</th>
                <th className="table-header">Email</th>
                <th className="table-header">Rôle</th>
                <th className="table-header">Créé le</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-cell text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="table-cell text-center py-8 text-gray-400">Aucun utilisateur</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-bold">
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="table-cell">{user.full_name || '-'}</td>
                    <td className="table-cell text-gray-500">{user.email || '-'}</td>
                    <td className="table-cell">
                      <span className="badge-info"><Shield className="w-3 h-3 mr-1" />Admin</span>
                    </td>
                    <td className="table-cell text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteUser(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
            </h3>

            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe {editingUser ? '(laisser vide pour ne pas changer)' : '*'}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveUser} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingUser ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
