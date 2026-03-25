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

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

const DEFAULT_POSTER = {
  petName: '',
  species: 'dog',
  breed: '',
  color: '',
  gender: '',
  age: '',
  features: '',
  collar: '',
  circumstances: '',
  lastSeenDate: '',
  lastSeenPlace: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
}

function formatDateJP(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = DAY_NAMES[d.getDay()]
  return `${m}/${day} (${dow})`
}

export default function PosterGenerator({ petInfo, onPetInfoChange }) {
  const [poster, setPoster] = useState(() => ({
    ...DEFAULT_POSTER,
    petName: petInfo?.name || '',
    species: petInfo?.species || 'dog',
    breed: petInfo?.breed || '',
    color: petInfo?.color || '',
    collar: petInfo?.collar || '',
    features: petInfo?.features || '',
    lastSeenDate: petInfo?.lastSeen?.slice(0, 10) || '',
    contactName: petInfo?.ownerName || '',
    contactPhone: petInfo?.contact || '',
    contactEmail: petInfo?.email || '',
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
        backgroundColor: '#E6D6B5',
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
  const headerText = `${speciesLabel}を探しています`

  return (
    <div className="poster-layout">
      {/* Left: Form */}
      <div className="poster-form-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">ポスター情報入力</span>
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
                  placeholder="例: こじろう"
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
                  placeholder="例: パピヨン"
                  value={poster.breed}
                  onChange={handleChange('breed')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">毛色・体色</label>
                <input
                  className="form-input"
                  placeholder="例: 白茶"
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
                <label className="form-label">首輪・タグ</label>
                <input
                  className="form-input"
                  placeholder="例: 青い首輪に迷子札"
                  value={poster.collar}
                  onChange={handleChange('collar')}
                />
              </div>
            </div>

            <hr className="divider" />

            {/* Features & circumstances */}
            <div className="section-title">特徴・いなくなった経緯</div>
            <div className="form-group">
              <label className="form-label">特徴・外見</label>
              <textarea
                className="form-textarea"
                placeholder="例: 両前足に茶色いぶちがあります"
                value={poster.features}
                onChange={handleChange('features')}
                rows={2}
              />
            </div>
            <div className="form-group">
              <label className="form-label">いなくなった経緯</label>
              <textarea
                className="form-textarea"
                placeholder="例: 車の音に驚いた拍子にハーネスが抜けてしまった。怖がりなので呼んだら逃げてしまう可能性があります。"
                value={poster.circumstances}
                onChange={handleChange('circumstances')}
                rows={3}
              />
            </div>

            <hr className="divider" />

            {/* Last seen */}
            <div className="section-title">発生日・場所</div>
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
                  placeholder="例: 東京都渋谷区千駄木1丁目"
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
                placeholder="例: 飼主 太郎"
                value={poster.contactName}
                onChange={handleChange('contactName')}
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label required">電話番号</label>
                <input
                  className="form-input"
                  placeholder="例: XXX-XXXX-XXXX"
                  value={poster.contactPhone}
                  onChange={handleChange('contactPhone')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="例: xxxx@xx.jp"
                  value={poster.contactEmail}
                  onChange={handleChange('contactEmail')}
                />
              </div>
            </div>

            <div className="poster-action-row">
              <button
                className={`btn btn-secondary ${previewMode ? 'active' : ''}`}
                onClick={() => setPreviewMode(v => !v)}
              >
                {previewMode ? 'プレビューを閉じる' : 'プレビュー'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isGenerating || !poster.petName}
                title={!poster.petName ? 'ペットの名前を入力してください' : ''}
              >
                {isGenerating ? '生成中...' : 'PNG保存'}
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
            {isGenerating ? '生成中...' : 'PNG保存'}
          </button>
        </div>

        {/* The actual poster DOM */}
        <div className="poster-wrapper">
          <div ref={posterRef} className="poster-canvas">
            {/* Header banner */}
            <div className="poster-header-bar">
              <div className="poster-title-text">{headerText}</div>
            </div>

            {/* Photos */}
            <div className="poster-photos-area">
              {[0, 1].map(i => (
                <div key={i} className="poster-photo-frame">
                  {photos[i] ? (
                    <img src={photos[i].url} alt={`写真${i + 1}`} />
                  ) : (
                    <div className="poster-photo-empty" />
                  )}
                </div>
              ))}
            </div>

            {/* Date & location */}
            <div className="poster-location-row">
              <span className="poster-date">
                {poster.lastSeenDate ? formatDateJP(poster.lastSeenDate) : '{発生日}'}
              </span>
              <span className="poster-address">
                {poster.lastSeenPlace || '{住所住所住所住所住所}'}
              </span>
            </div>
            <div className="poster-missing-label">付近で行方不明</div>

            {/* Info section */}
            <div className="poster-info-section">
              <div className="poster-info-heading">情報</div>

              <div className="poster-info-grid">
                <span className="poster-info-label">名前</span>
                <span className="poster-info-value">{poster.petName || '—'}</span>

                <span className="poster-info-label">種類</span>
                <span className="poster-info-value">
                  {speciesLabel}{poster.breed ? `／${poster.breed}` : ''}
                </span>

                <span className="poster-info-label">毛色</span>
                <span className="poster-info-value">
                  <span className="poster-info-inline">
                    <span>{poster.color || '—'}</span>
                    {poster.gender && (
                      <span>
                        <span className="poster-info-label" style={{ marginLeft: 8 }}>性別</span>
                        <span className="poster-info-value">{poster.gender}</span>
                      </span>
                    )}
                  </span>
                </span>

                {poster.collar && (
                  <>
                    <span className="poster-info-label">首輪</span>
                    <span className="poster-info-value">{poster.collar}</span>
                  </>
                )}
              </div>

              {/* Features & circumstances */}
              <div className="poster-features-section" style={{ margin: '10px 0 0', padding: 0, background: 'transparent' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="poster-features-label" style={{ gridColumn: 'auto' }}>特徴・いなくなった経緯</div>
                </div>
                <div className="poster-features-box" style={{ gridColumn: '1 / -1' }}>
                  {poster.features || poster.circumstances
                    ? [poster.features, poster.circumstances].filter(Boolean).join('\n\n')
                    : ''
                  }
                </div>
              </div>
            </div>

            {/* Contact footer */}
            <div className="poster-contact-bar">
              <span className="poster-contact-label">連絡先</span>
              <div className="poster-contact-info">
                <div className="poster-contact-phone">
                  {poster.contactPhone || 'XXX-XXXX-XXXX'}
                </div>
                {poster.contactEmail && (
                  <div className="poster-contact-email">{poster.contactEmail}</div>
                )}
              </div>
              <span className="poster-contact-name">
                {poster.contactName || '飼主 太郎'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
