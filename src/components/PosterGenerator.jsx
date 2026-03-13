import React, { useState, useRef, useCallback } from 'react'
import './PosterGenerator.css'

const SPECIES_OPTIONS = [
  { value: 'dog', label: '犬' },
  { value: 'cat', label: '猫' },
  { value: 'bird', label: '鳥' },
  { value: 'rabbit', label: 'うさぎ' },
  { value: 'hamster', label: 'ハムスター' },
  { value: 'turtle', label: 'カメ' },
  { value: 'fish', label: '魚' },
  { value: 'other', label: 'その他' },
]

const DEFAULT_POSTER = {
  petName: '',
  species: 'dog',
  breed: '',
  color: '',
  gender: '',
  age: '',
  features: '',
  lastSeenDate: '',
  lastSeenPlace: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  reward: '',
  message: '',
}

export default function PosterGenerator({ petInfo, onPetInfoChange }) {
  const [poster, setPoster] = useState(() => ({
    ...DEFAULT_POSTER,
    petName: petInfo?.name || '',
    species: petInfo?.species || 'dog',
    breed: petInfo?.breed || '',
    color: petInfo?.color || '',
    lastSeenDate: petInfo?.lastSeen?.slice(0, 10) || '',
  }))
  const [photos, setPhotos] = useState([]) // [{url, file}]
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const fileInputRef = useRef(null)
  const posterRef = useRef(null)

  const handleChange = (field) => (e) => {
    setPoster(d => ({ ...d, [field]: e.target.value }))
  }

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 3 - photos.length
    const toAdd = files.slice(0, remaining)

    toAdd.forEach(file => {
      const url = URL.createObjectURL(file)
      setPhotos(p => [...p, { url, file, id: Date.now() + Math.random() }])
    })
    e.target.value = ''
  }

  const handlePhotoRemove = (id) => {
    setPhotos(p => {
      const removed = p.find(x => x.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return p.filter(x => x.id !== id)
    })
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    const remaining = 3 - photos.length
    const toAdd = files.slice(0, remaining)
    toAdd.forEach(file => {
      const url = URL.createObjectURL(file)
      setPhotos(p => [...p, { url, file, id: Date.now() + Math.random() }])
    })
  }, [photos.length])

  const handleDragOver = (e) => e.preventDefault()

  const handleExport = async () => {
    if (!posterRef.current) return
    setIsGenerating(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `迷子ポスター_${poster.petName || 'ペット'}_${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('エクスポートに失敗しました。もう一度お試しください。')
    } finally {
      setIsGenerating(false)
    }
  }

  const speciesLabel = SPECIES_OPTIONS.find(o => o.value === poster.species)?.label || poster.species

  return (
    <div className="poster-layout">
      {/* Left: Form */}
      <div className="poster-form-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">🖨️ ポスター情報入力</span>
          </div>
          <div className="card-body">
            {/* Photo upload */}
            <div className="section-title">写真（最大3枚）</div>
            <div className="photo-upload-area">
              <div className="photo-thumbs">
                {photos.map((p) => (
                  <div key={p.id} className="photo-thumb">
                    <img src={p.url} alt="ペット写真" />
                    <button
                      className="photo-remove"
                      onClick={() => handlePhotoRemove(p.id)}
                    >✕</button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <div
                    className="photo-drop-zone"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <span className="photo-drop-icon">📷</span>
                    <span className="photo-drop-text">
                      クリックまたは<br />ドロップで追加
                    </span>
                    <span className="photo-drop-sub">PNG・JPEG</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/jpg"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoAdd}
              />
            </div>

            <hr className="divider" />

            {/* Pet info */}
            <div className="section-title">ペット情報</div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label required">名前</label>
                <input
                  className="form-input"
                  placeholder="例: ポチ"
                  value={poster.petName}
                  onChange={handleChange('petName')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">種類</label>
                <select className="form-select" value={poster.species} onChange={handleChange('species')}>
                  {SPECIES_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">品種</label>
                <input
                  className="form-input"
                  placeholder="例: トイプードル"
                  value={poster.breed}
                  onChange={handleChange('breed')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">毛色・体色</label>
                <input
                  className="form-input"
                  placeholder="例: 茶色と白"
                  value={poster.color}
                  onChange={handleChange('color')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">性別</label>
                <select className="form-select" value={poster.gender} onChange={handleChange('gender')}>
                  <option value="">不明</option>
                  <option value="オス">オス</option>
                  <option value="メス">メス</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">年齢</label>
                <input
                  className="form-input"
                  placeholder="例: 3歳"
                  value={poster.age}
                  onChange={handleChange('age')}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">特徴・外見</label>
              <textarea
                className="form-textarea"
                placeholder="例: 右耳に小さな傷あり、首輪は赤色"
                value={poster.features}
                onChange={handleChange('features')}
                rows={2}
              />
            </div>

            <hr className="divider" />

            {/* Last seen */}
            <div className="section-title">最終目撃情報</div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">日付</label>
                <input
                  type="date"
                  className="form-input"
                  value={poster.lastSeenDate}
                  onChange={handleChange('lastSeenDate')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">場所</label>
                <input
                  className="form-input"
                  placeholder="例: ○○公園付近"
                  value={poster.lastSeenPlace}
                  onChange={handleChange('lastSeenPlace')}
                />
              </div>
            </div>

            <hr className="divider" />

            {/* Contact */}
            <div className="section-title">連絡先</div>
            <div className="form-group">
              <label className="form-label required">お名前</label>
              <input
                className="form-input"
                placeholder="例: 山田 太郎"
                value={poster.contactName}
                onChange={handleChange('contactName')}
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label required">電話番号</label>
                <input
                  className="form-input"
                  placeholder="例: 090-1234-5678"
                  value={poster.contactPhone}
                  onChange={handleChange('contactPhone')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="例: example@email.com"
                  value={poster.contactEmail}
                  onChange={handleChange('contactEmail')}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">お礼について</label>
              <input
                className="form-input"
                placeholder="例: お礼をご用意しています"
                value={poster.reward}
                onChange={handleChange('reward')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">メッセージ</label>
              <textarea
                className="form-textarea"
                placeholder="例: 家族全員で探しています。心当たりの方はご連絡ください。"
                value={poster.message}
                onChange={handleChange('message')}
                rows={2}
              />
            </div>

            <div className="poster-action-row">
              <button
                className={`btn btn-secondary ${previewMode ? 'active' : ''}`}
                onClick={() => setPreviewMode(v => !v)}
              >
                {previewMode ? 'プレビューを閉じる' : '👁 プレビュー'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isGenerating || !poster.petName}
                title={!poster.petName ? 'ペットの名前を入力してください' : ''}
              >
                {isGenerating ? '生成中...' : '⬇ PNG保存'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Preview */}
      <div className={`poster-preview-col ${previewMode ? 'show' : ''}`}>
        <div className="poster-preview-header">
          <span className="card-title">プレビュー</span>
          <button className="btn btn-primary" onClick={handleExport} disabled={isGenerating || !poster.petName}>
            {isGenerating ? '生成中...' : '⬇ PNG保存'}
          </button>
        </div>

        {/* The actual poster DOM */}
        <div className="poster-wrapper">
          <div ref={posterRef} className="poster-canvas">
            {/* Header */}
            <div className="poster-header-bar">
              <div className="poster-urgent">🚨 迷子のお知らせ</div>
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div className={`poster-photos poster-photos-${photos.length}`}>
                {photos.map((p, i) => (
                  <div key={p.id} className="poster-photo">
                    <img src={p.url} alt={`写真${i + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && (
              <div className="poster-no-photo">
                <span>📷</span>
                <span>写真を追加してください</span>
              </div>
            )}

            {/* Pet name */}
            <div className="poster-pet-name">
              {poster.petName || '（名前未入力）'}
            </div>

            {/* Info grid */}
            <div className="poster-info-grid">
              {poster.species && (
                <div className="poster-info-item">
                  <span className="poster-info-label">種類</span>
                  <span className="poster-info-value">{speciesLabel}</span>
                </div>
              )}
              {poster.breed && (
                <div className="poster-info-item">
                  <span className="poster-info-label">品種</span>
                  <span className="poster-info-value">{poster.breed}</span>
                </div>
              )}
              {poster.color && (
                <div className="poster-info-item">
                  <span className="poster-info-label">毛色</span>
                  <span className="poster-info-value">{poster.color}</span>
                </div>
              )}
              {poster.gender && (
                <div className="poster-info-item">
                  <span className="poster-info-label">性別</span>
                  <span className="poster-info-value">{poster.gender}</span>
                </div>
              )}
              {poster.age && (
                <div className="poster-info-item">
                  <span className="poster-info-label">年齢</span>
                  <span className="poster-info-value">{poster.age}</span>
                </div>
              )}
            </div>

            {poster.features && (
              <div className="poster-features">
                <div className="poster-features-label">特徴</div>
                <div className="poster-features-text">{poster.features}</div>
              </div>
            )}

            {(poster.lastSeenDate || poster.lastSeenPlace) && (
              <div className="poster-last-seen">
                <div className="poster-last-seen-label">最終目撃</div>
                <div className="poster-last-seen-value">
                  {poster.lastSeenDate && (
                    <span>{new Date(poster.lastSeenDate + 'T00:00:00').toLocaleDateString('ja-JP', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}</span>
                  )}
                  {poster.lastSeenPlace && <span> / {poster.lastSeenPlace}</span>}
                </div>
              </div>
            )}

            {poster.message && (
              <div className="poster-message">{poster.message}</div>
            )}

            {poster.reward && (
              <div className="poster-reward">🎁 {poster.reward}</div>
            )}

            {/* Contact */}
            <div className="poster-contact">
              <div className="poster-contact-title">お心当たりの方はご連絡ください</div>
              {poster.contactName && (
                <div className="poster-contact-row">👤 {poster.contactName}</div>
              )}
              {poster.contactPhone && (
                <div className="poster-contact-phone">📞 {poster.contactPhone}</div>
              )}
              {poster.contactEmail && (
                <div className="poster-contact-row">✉️ {poster.contactEmail}</div>
              )}
            </div>

            <div className="poster-footer">
              PawsTrace Pro で作成
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
