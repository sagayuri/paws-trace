import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import LatestSightings from './LatestSightings.jsx'
import './SightingMap.css'

// Fix Leaflet default icon in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const createSightingIcon = (index, isLatest) =>
  L.divIcon({
    className: '',
    html: `<div class="sighting-marker ${isLatest ? 'latest' : ''}">
      <span>${index + 1}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  })

function MapClickHandler({ onMapClick, isAddingMode }) {
  useMapEvents({
    click(e) {
      if (isAddingMode) {
        onMapClick(e.latlng)
      }
    },
  })
  return null
}

const DEFAULT_CENTER = [35.6812, 139.7671] // Tokyo
const DEFAULT_ZOOM = 14

export default function SightingMap({ sightings, petInfo, onSightingsChange, onPetInfoChange }) {
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [pendingLocation, setPendingLocation] = useState(null)
  const [formData, setFormData] = useState({ note: '', time: '' })
  const [showPetForm, setShowPetForm] = useState(!petInfo)
  const [petFormData, setPetFormData] = useState(petInfo || {
    name: '', species: 'dog', breed: '', color: '', lastSeen: ''
  })
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
  const mapRef = useRef(null)

  // Get user location on mount
  useEffect(() => {
    if (!petInfo) setShowPetForm(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      )
    }
  }, [])

  const handleMapClick = useCallback((latlng) => {
    setPendingLocation(latlng)
    setIsAddingMode(false)
    setFormData({ note: '', time: new Date().toISOString().slice(0, 16) })
  }, [])

  const handleAddSighting = () => {
    if (!pendingLocation) return
    const newSighting = {
      id: Date.now(),
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
      note: formData.note,
      time: formData.time,
      createdAt: new Date().toISOString(),
    }
    onSightingsChange([...sightings, newSighting])
    setPendingLocation(null)
    setFormData({ note: '', time: '' })
  }

  const handleDeleteSighting = (id) => {
    onSightingsChange(sightings.filter(s => s.id !== id))
  }

  const handleSavePet = () => {
    if (!petFormData.name.trim()) return
    onPetInfoChange(petFormData)
    setShowPetForm(false)
  }

  const latestSighting = sightings.length > 0
    ? sightings.reduce((a, b) => new Date(a.time || a.createdAt) > new Date(b.time || b.createdAt) ? a : b)
    : null

  const SPECIES_LABELS = {
    dog: '犬', cat: '猫', bird: '鳥', rabbit: 'うさぎ',
    hamster: 'ハムスター', other: 'その他'
  }

  return (
    <div className="sighting-map-layout">
      {/* Left sidebar */}
      <div className="map-sidebar">
        {/* Pet info card */}
        <div className="card mb-16">
          <div className="card-header">
            <span className="card-title">🐾 ペット情報</span>
            {petInfo && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPetForm(v => !v)}>
                {showPetForm ? '閉じる' : '編集'}
              </button>
            )}
          </div>

          {showPetForm ? (
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label required">ペットの名前</label>
                  <input
                    className="form-input"
                    placeholder="例: ポチ"
                    value={petFormData.name}
                    onChange={e => setPetFormData(d => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">種類</label>
                  <select
                    className="form-select"
                    value={petFormData.species}
                    onChange={e => setPetFormData(d => ({ ...d, species: e.target.value }))}
                  >
                    {Object.entries(SPECIES_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">品種・特徴</label>
                  <input
                    className="form-input"
                    placeholder="例: トイプードル、白毛"
                    value={petFormData.breed}
                    onChange={e => setPetFormData(d => ({ ...d, breed: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">毛色・体色</label>
                  <input
                    className="form-input"
                    placeholder="例: 茶色と白"
                    value={petFormData.color}
                    onChange={e => setPetFormData(d => ({ ...d, color: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">最後に目撃した日時</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={petFormData.lastSeen}
                  onChange={e => setPetFormData(d => ({ ...d, lastSeen: e.target.value }))}
                />
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleSavePet}
                disabled={!petFormData.name.trim()}
              >
                保存する
              </button>
            </div>
          ) : petInfo ? (
            <div className="card-body pet-summary">
              <div className="pet-name">{petInfo.name}</div>
              <div className="pet-detail">
                {SPECIES_LABELS[petInfo.species] || petInfo.species}
                {petInfo.breed && ` ／ ${petInfo.breed}`}
                {petInfo.color && ` ／ ${petInfo.color}`}
              </div>
              {petInfo.lastSeen && (
                <div className="pet-detail">
                  最終目撃: {new Date(petInfo.lastSeen).toLocaleString('ja-JP', {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Latest sightings status */}
        <LatestSightings sightings={sightings} onDelete={handleDeleteSighting} />
      </div>

      {/* Map area */}
      <div className="map-area">
        <div className="map-controls">
          <div className="map-controls-left">
            <span className="sighting-count-badge">
              📍 目撃情報: <strong>{sightings.length}件</strong>
            </span>
          </div>
          <div className="map-controls-right">
            {isAddingMode ? (
              <>
                <span className="adding-hint">🖱️ 地図をクリックしてピンを立てる</span>
                <button className="btn btn-secondary" onClick={() => setIsAddingMode(false)}>
                  キャンセル
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => { setIsAddingMode(true); setPendingLocation(null) }}
                disabled={!petInfo}
                title={!petInfo ? 'ペット情報を先に登録してください' : ''}
              >
                ＋ 目撃情報を追加
              </button>
            )}
          </div>
        </div>

        <div className={`map-wrapper ${isAddingMode ? 'adding-cursor' : ''}`}>
          <MapContainer
            center={mapCenter}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} isAddingMode={isAddingMode} />

            {sightings.map((s, i) => (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={createSightingIcon(i, s.id === latestSighting?.id)}
              >
                <Popup>
                  <div className="popup-content">
                    <div className="popup-header">目撃情報 #{i + 1}</div>
                    {s.time && (
                      <div className="popup-time">
                        🕐 {new Date(s.time).toLocaleString('ja-JP', {
                          year: 'numeric', month: 'numeric', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    )}
                    {s.note && <div className="popup-note">{s.note}</div>}
                    <div className="popup-coords">
                      {s.lat.toFixed(5)}, {s.lng.toFixed(5)}
                    </div>
                    <button
                      className="popup-delete-btn"
                      onClick={() => handleDeleteSighting(s.id)}
                    >
                      削除
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {isAddingMode && (
            <div className="adding-overlay">
              <div className="adding-overlay-text">地図をクリックして目撃場所を登録</div>
            </div>
          )}
        </div>

        {/* Pending location form */}
        {pendingLocation && (
          <div className="pending-form card fade-in">
            <div className="card-header">
              <span className="card-title">📍 目撃情報を登録</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPendingLocation(null)}>
                ✕
              </button>
            </div>
            <div className="card-body">
              <div className="pending-coords">
                緯度 {pendingLocation.lat.toFixed(5)} / 経度 {pendingLocation.lng.toFixed(5)}
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label required">目撃日時</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.time}
                    onChange={e => setFormData(d => ({ ...d, time: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">メモ</label>
                  <input
                    className="form-input"
                    placeholder="例: 公園の東側で目撃"
                    value={formData.note}
                    onChange={e => setFormData(d => ({ ...d, note: e.target.value }))}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleAddSighting}
                disabled={!formData.time}
              >
                登録する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
