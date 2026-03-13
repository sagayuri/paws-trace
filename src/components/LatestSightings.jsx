import React, { useState } from 'react'
import './LatestSightings.css'

function formatTime(timeStr) {
  if (!timeStr) return '不明'
  const d = new Date(timeStr)
  if (isNaN(d.getTime())) return timeStr
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function LatestSightings({ sightings, onDelete }) {
  const [expanded, setExpanded] = useState(true)

  // Sort by time descending
  const sorted = [...sightings].sort((a, b) => {
    const ta = new Date(a.time || a.createdAt)
    const tb = new Date(b.time || b.createdAt)
    return tb - ta
  })

  const latest = sorted[0]

  return (
    <div className="card latest-sightings">
      <div className="card-header">
        <span className="card-title">
          <span className="live-dot" />
          最新の目撃状況
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sightings.length > 0 && (
            <span className="sighting-total-badge">{sightings.length}件</span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="card-body latest-body">
          {sightings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📍</span>
              <div className="empty-state-text">目撃情報なし</div>
              <div className="empty-state-sub">
                地図上でピンを立てて<br />目撃情報を追加してください
              </div>
            </div>
          ) : (
            <>
              {/* Latest highlight */}
              <div className="latest-highlight">
                <div className="latest-highlight-label">最新の目撃地点</div>
                <div className="latest-highlight-time">
                  🕐 {formatTime(latest.time || latest.createdAt)}
                </div>
                <div className="latest-highlight-coords">
                  📍 {latest.lat.toFixed(4)}, {latest.lng.toFixed(4)}
                </div>
                {latest.note && (
                  <div className="latest-highlight-note">💬 {latest.note}</div>
                )}
              </div>

              {/* Summary stats */}
              <div className="sighting-stats">
                <div className="stat-item">
                  <div className="stat-value">{sightings.length}</div>
                  <div className="stat-label">目撃件数</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {sightings.length > 0
                      ? formatTime(
                          sorted[0].time || sorted[0].createdAt
                        )
                      : '-'}
                  </div>
                  <div className="stat-label">最終目撃</div>
                </div>
              </div>

              {/* Sighting list */}
              <div className="sighting-list-section">
                <div className="sighting-list-header">目撃履歴</div>
                <div className="sighting-list">
                  {sorted.map((s, i) => (
                    <div key={s.id} className={`sighting-item ${i === 0 ? 'sighting-item-latest' : ''}`}>
                      <div className="sighting-item-num">{i === 0 ? '最新' : `#${sightings.length - i}`}</div>
                      <div className="sighting-item-info">
                        <div className="sighting-item-time">
                          {formatTime(s.time || s.createdAt)}
                        </div>
                        {s.note && (
                          <div className="sighting-item-note">{s.note}</div>
                        )}
                        <div className="sighting-item-coords">
                          {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                        </div>
                      </div>
                      <button
                        className="sighting-item-delete"
                        onClick={() => onDelete(s.id)}
                        title="削除"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
