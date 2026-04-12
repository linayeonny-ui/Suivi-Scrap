import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { scrapAPI, qrAPI, refAPI } from '../lib/api'
import {
  ScanLine, Plus, Trash2, CheckCircle2, Package, ChevronDown,
  Loader2, AlertCircle, Scale, ArrowRight, Key, Split,
} from 'lucide-react'

const STEPS = {
  LOADING: 'loading',
  CODE: 'code',
  FORM: 'form',
  WEIGHT: 'weight',
  DONE: 'done',
}

export default function ScanPage() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [step, setStep] = useState(STEPS.LOADING)
  const [error, setError] = useState('')
  const [qrData, setQrData] = useState(null)
  const [session, setSession] = useState(null)
  const [entries, setEntries] = useState([])

  // Operator code
  const [operatorCode, setOperatorCode] = useState('')
  const [codeVerified, setCodeVerified] = useState(false)
  const [codeLabel, setCodeLabel] = useState('')

  // Form fields
  const [areas, setAreas] = useState([])
  const [postes, setPostes] = useState([])
  const [typeScraps, setTypeScraps] = useState([])
  const [raisons, setRaisons] = useState([])

  const [selectedArea, setSelectedArea] = useState('')
  const [selectedPoste, setSelectedPoste] = useState('')
  const [selectedTypeScrap, setSelectedTypeScrap] = useState('')
  const [filInput, setFilInput] = useState('')
  const [filSuggestions, setFilSuggestions] = useState([])
  const [ccfeValue, setCcfeValue] = useState('')
  const [totalQuantite, setTotalQuantite] = useState('')
  const [totalWeight, setTotalWeight] = useState('')

  // Split-by-raison
  const [splitMode, setSplitMode] = useState(false)
  const [raisonSplits, setRaisonSplits] = useState([{ raison_id: '', quantite: '' }])

  const [submitting, setSubmitting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Load QR code data and reference data
  useEffect(() => {
    async function init() {
      try {
        const [qrRes, areasRes, typesRes, raisonsRes] = await Promise.all([
          qrAPI.scan(code),
          refAPI.listAreas(),
          refAPI.listTypeScraps(),
          refAPI.listRaisons(),
        ])

        const qr = qrRes.data
        setQrData(qr)
        setAreas(areasRes.data)
        setTypeScraps(typesRes.data)
        setRaisons(raisonsRes.data)
        setStep(STEPS.CODE)
      } catch (err) {
        setError(err.response?.data?.error || 'QR code invalide ou inactif')
        setStep(STEPS.CODE)
      }
    }
    init()
  }, [code])

  // Load postes when area changes
  useEffect(() => {
    if (!selectedArea) {
      setPostes([])
      setSelectedPoste('')
      return
    }
    scrapAPI.getPostesByArea(selectedArea).then((res) => {
      setPostes(res.data)
      setSelectedPoste('')
    }).catch(() => setPostes([]))
  }, [selectedArea])

  // Wire autocomplete
  const searchWire = useCallback(async (query) => {
    if (query.length < 2) {
      setFilSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const res = await scrapAPI.searchWire(query)
      setFilSuggestions(res.data)
      setShowSuggestions(res.data.length > 0)
    } catch {
      setFilSuggestions([])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchWire(filInput), 300)
    return () => clearTimeout(timer)
  }, [filInput, searchWire])

  const selectWire = (wire) => {
    setFilInput(wire.fil)
    setCcfeValue(wire.ccfe)
    setShowSuggestions(false)
  }

  // Verify operator code and create session
  const verifyAndCreateSession = async () => {
    if (!operatorCode.trim()) {
      setError('Veuillez entrer le code opérateur')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      // Verify code
      const verifyRes = await scrapAPI.verifyOperatorCode(operatorCode.trim())
      setCodeVerified(true)
      setCodeLabel(verifyRes.data.label || '')

      // Create session
      const sessionRes = await scrapAPI.createSession(qrData.id, operatorCode.trim())
      setSession(sessionRes.data)
      setStep(STEPS.FORM)
    } catch (err) {
      setError(err.response?.data?.error || 'Code opérateur invalide')
    } finally {
      setSubmitting(false)
    }
  }

  // Split-by-raison helpers
  const addSplit = () => {
    setRaisonSplits([...raisonSplits, { raison_id: '', quantite: '' }])
  }

  const removeSplit = (index) => {
    if (raisonSplits.length <= 1) return
    setRaisonSplits(raisonSplits.filter((_, i) => i !== index))
  }

  const updateSplit = (index, field, value) => {
    const updated = [...raisonSplits]
    updated[index] = { ...updated[index], [field]: value }
    setRaisonSplits(updated)
  }

  const getSplitTotal = () => raisonSplits.reduce((sum, s) => sum + (parseInt(s.quantite) || 0), 0)

  // Add entry (single or batch)
  const addEntry = async () => {
    if (!selectedArea || !selectedTypeScrap || !selectedPoste || !filInput || !totalQuantite) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (splitMode) {
        // Validate splits
        const splitTotal = getSplitTotal()
        if (splitTotal !== parseInt(totalQuantite)) {
          setError(`La somme des quantités par raison (${splitTotal}) doit être égale à la quantité totale (${totalQuantite})`)
          setSubmitting(false)
          return
        }
        const hasEmptyRaison = raisonSplits.some((s) => !s.raison_id)
        if (hasEmptyRaison) {
          setError('Veuillez sélectionner une raison pour chaque portion')
          setSubmitting(false)
          return
        }

        const res = await scrapAPI.addEntriesBatch(session.id, {
          area_id: parseInt(selectedArea),
          type_scrap_id: parseInt(selectedTypeScrap),
          poste_id: parseInt(selectedPoste),
          fil: filInput,
          numero_piece: ccfeValue,
          raison_splits: raisonSplits.map((s) => ({
            raison_id: parseInt(s.raison_id),
            quantite: parseInt(s.quantite),
          })),
        })
        setEntries([...entries, ...res.data])
      } else {
        // Single raison mode - need a raison selected
        const singleRaison = raisonSplits[0]?.raison_id
        if (!singleRaison) {
          setError('Veuillez sélectionner une raison')
          setSubmitting(false)
          return
        }
        const res = await scrapAPI.addEntry(session.id, {
          area_id: parseInt(selectedArea),
          type_scrap_id: parseInt(selectedTypeScrap),
          poste_id: parseInt(selectedPoste),
          raison_id: parseInt(singleRaison),
          fil: filInput,
          numero_piece: ccfeValue,
          quantite: parseInt(totalQuantite),
        })
        setEntries([...entries, res.data])
      }

      // Reset form for next entry
      setSelectedPoste('')
      setFilInput('')
      setCcfeValue('')
      setTotalQuantite('')
      setSplitMode(false)
      setRaisonSplits([{ raison_id: '', quantite: '' }])
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout')
    } finally {
      setSubmitting(false)
    }
  }

  const removeEntry = async (entryId) => {
    try {
      await scrapAPI.deleteEntry(session.id, entryId)
      setEntries(entries.filter((e) => e.id !== entryId))
    } catch {
      // ignore
    }
  }

  const goToWeight = () => {
    if (entries.length === 0) {
      setError('Ajoutez au moins un élément de scrap')
      return
    }
    setStep(STEPS.WEIGHT)
  }

  const completeSession = async () => {
    if (!totalWeight || parseFloat(totalWeight) < 0) {
      setError('Veuillez entrer le poids total')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await scrapAPI.completeSession(session.id, parseFloat(totalWeight))
      setStep(STEPS.DONE)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la finalisation')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === STEPS.LOADING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement du QR code...</p>
        </div>
      </div>
    )
  }

  if (error && !qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (step === STEPS.DONE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session terminée!</h2>
          <p className="text-gray-600 mb-2">
            {entries.length} élément(s) de scrap enregistré(s)
          </p>
          <p className="text-gray-600 mb-6">
            Poids total: <strong>{totalWeight} kg</strong>
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-emerald-700">
              Merci! Vos données ont été envoyées au panneau d'administration.
            </p>
          </div>
          <p className="text-sm text-gray-400">
            Vous pouvez scanner un autre QR code pour commencer une nouvelle session.
          </p>
        </div>
      </div>
    )
  }

  // Operator code entry gate
  if (step === STEPS.CODE && !codeVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Accès Opérateur</h2>
            <p className="text-sm text-gray-500 mt-1">QR: {code}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code opérateur *
            </label>
            <input
              type="text"
              value={operatorCode}
              onChange={(e) => setOperatorCode(e.target.value.toUpperCase())}
              className="input-field text-center text-lg font-mono tracking-widest"
              placeholder="ENTREZ LE CODE"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && verifyAndCreateSession()}
            />
          </div>

          <button
            onClick={verifyAndCreateSession}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Vérifier et continuer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Déclaration Scrap</h1>
              <p className="text-xs text-gray-500">QR: {code} | Opérateur: {codeLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        {/* Auto-filled info card */}
        {session && (
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Semaine</span>
                <p className="font-semibold text-gray-900">{session.semaine}</p>
              </div>
              <div>
                <span className="text-gray-500">Date</span>
                <p className="font-semibold text-gray-900">
                  {new Date(session.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Segment</span>
                <p className="font-semibold text-gray-900">{session.segment}</p>
              </div>
              <div>
                <span className="text-gray-500">Équipe</span>
                <p className="font-semibold text-gray-900">{session.equipe}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Ligne</span>
                <p className="font-semibold text-gray-900">{session.ligne}</p>
              </div>
            </div>
          </div>
        )}

        {/* Existing entries */}
        {entries.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Éléments ajoutés ({entries.length})
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="card p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.fil} → {entry.numero_piece || '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qte: {entry.quantite} | {entry.area?.name} | {entry.raison?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="ml-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entry form */}
        {step === STEPS.FORM && (
          <div className="card p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary-600" />
              Ajouter un élément
            </h3>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* Area */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Area *</label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Sélectionner une area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Poste */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Poste *</label>
                <div className="relative">
                  <select
                    value={selectedPoste}
                    onChange={(e) => setSelectedPoste(e.target.value)}
                    className="select-field"
                    disabled={!selectedArea}
                  >
                    <option value="">Sélectionner un poste</option>
                    {postes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Type Scrap */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type Scrap *</label>
                <div className="relative">
                  <select
                    value={selectedTypeScrap}
                    onChange={(e) => setSelectedTypeScrap(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Sélectionner un type</option>
                    {typeScraps.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Fil with autocomplete */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Fil *</label>
                <input
                  type="text"
                  value={filInput}
                  onChange={(e) => {
                    setFilInput(e.target.value)
                    setCcfeValue('')
                  }}
                  className="input-field"
                  placeholder="Tapez le fil..."
                  autoComplete="off"
                />
                {showSuggestions && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filSuggestions.map((wire) => (
                      <button
                        key={wire.id}
                        className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0 transition-colors"
                        onClick={() => selectWire(wire)}
                      >
                        <span className="font-medium">{wire.fil}</span>
                        <span className="text-gray-500 ml-2">→ {wire.ccfe}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CCFE (auto-filled) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  N° Pièce / CCFE
                </label>
                <input
                  type="text"
                  value={ccfeValue}
                  readOnly
                  className="input-field bg-gray-50 text-gray-600"
                  placeholder="Rempli automatiquement"
                />
              </div>

              {/* Quantité totale */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantité totale *</label>
                <input
                  type="number"
                  value={totalQuantite}
                  onChange={(e) => setTotalQuantite(e.target.value)}
                  className="input-field"
                  placeholder="0"
                  min="1"
                />
              </div>

              {/* Split mode toggle */}
              <div className="flex items-center gap-2 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode(!splitMode)
                    if (!splitMode) {
                      setRaisonSplits([{ raison_id: '', quantite: '' }])
                    } else {
                      setRaisonSplits([{ raison_id: '', quantite: totalQuantite }])
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    splitMode
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  <Split className="w-4 h-4" />
                  Raisons multiples
                </button>
                {splitMode && (
                  <span className="text-xs text-amber-600">
                    Répartir la quantité par raison
                  </span>
                )}
              </div>

              {/* Raison section */}
              {!splitMode ? (
                /* Single raison */
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Raison *</label>
                  <div className="relative">
                    <select
                      value={raisonSplits[0]?.raison_id || ''}
                      onChange={(e) => updateSplit(0, 'raison_id', e.target.value)}
                      className="select-field"
                    >
                      <option value="">Sélectionner une raison</option>
                      {raisons.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              ) : (
                /* Split-by-raison */
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-amber-700 mb-1">
                    Répartition par raison (total: {getSplitTotal()} / {totalQuantite})
                  </label>
                  {raisonSplits.map((split, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={split.raison_id}
                          onChange={(e) => updateSplit(idx, 'raison_id', e.target.value)}
                          className="select-field text-sm"
                        >
                          <option value="">Raison...</option>
                          {raisons.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number"
                        value={split.quantite}
                        onChange={(e) => updateSplit(idx, 'quantite', e.target.value)}
                        className="input-field w-20 text-sm text-center"
                        placeholder="Qté"
                        min="1"
                      />
                      {raisonSplits.length > 1 && (
                        <button
                          onClick={() => removeSplit(idx)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSplit}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une raison
                  </button>
                  {getSplitTotal() !== parseInt(totalQuantite || 0) && totalQuantite && (
                    <p className="text-xs text-red-500">
                      ⚠ La somme ({getSplitTotal()}) doit être égale à {totalQuantite}
                    </p>
                  )}
                </div>
              )}

              {/* Add button */}
              <button
                onClick={addEntry}
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter {splitMode ? `${raisonSplits.length} entrée(s)` : 'cet élément'}
              </button>
            </div>
          </div>
        )}

        {/* Weight step */}
        {step === STEPS.WEIGHT && (
          <div className="card p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary-600" />
              Poids total
            </h3>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <p className="text-sm text-gray-600 mb-3">
              Entrez le poids total du scrap pour cette session ({entries.length} élément(s))
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Poids total (kg) *
              </label>
              <input
                type="number"
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                className="input-field text-lg"
                placeholder="0.00"
                min="0"
                step="0.01"
                autoFocus
              />
            </div>

            <button
              onClick={completeSession}
              disabled={submitting}
              className="btn-success w-full"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Terminer la session
            </button>
          </div>
        )}

        {/* Continue to weight button */}
        {step === STEPS.FORM && entries.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
            <div className="max-w-lg mx-auto">
              <button
                onClick={goToWeight}
                className="btn-primary w-full"
              >
                <Package className="w-4 h-4" />
                Continuer ({entries.length} élément(s))
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
