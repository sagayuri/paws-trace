import React, { useState } from 'react'
import './SearchProgress.css'

const STATUS_OPTIONS = [
  { value: 'unsearched', label: '未着手', className: 'unsearched' },
  { value: 'in_progress', label: '捜索中', className: 'pending' },
  { value: 'confirmed', label: '確認済み', className: 'confirmed' },
]

function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0]
  const icons = { unsearched: '○', in_progress: '◎', confirmed: '✓' }
  return (
    <span className={`status-badge ${opt.className}`}>
      {icons[status]} {opt.label}
    </span>
  )
}

export default function SearchProgress({ areas, sightings, petInfo, onAreasChange }) {
  const [newArea, setNewArea] = useState({ name: '', note: '', priority: 'normal' })
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')

  const handleAddArea = () => {
    if (!newArea.name.trim()) return
    const area = {
      id: Date.now(),
      name: newArea.name.trim(),
      note: newArea.note.trim(),
      priority: newArea.priority,
      status: 'unsearched',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onAreasChange([...areas, area])
    setNewArea({ name: '', note: '', priority: 'normal' })
    setShowForm(false)
  }

  const handleStatusChange = (id, status) => {
    onAreasChange(areas.map(a =>
      a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
    ))
  }

  const handleDelete = (id) => {
    onAreasChange(areas.filter(a => a.id !== id))
  }

  const handleNoteEdit = (id, note) => {
    onAreasChange(areas.map(a =>
      a.id === id ? { ...a, note, updatedAt: new Date().toISOString() } : a
    ))
  }

  // Stats
  const total = areas.length
  const confirmed = areas.filter(a => a.status === 'confirmed').length
  const inProgress = areas.filter(a => a.status === 'in_progress').length
  const unsearched = areas.filter(a => a.status === 'unsearched').length
  const progress = total > 0 ? Math.round((confirmed / total) * 100) : 0

  const filteredAreas = filter === 'all'
    ? areas
    : areas.filter(a => a.status === filter)

  const PRIORITY_LABELS = { high: '🔴 高', normal: '🟡 中', low: '🟢 低' }

  const formatDate = (str) => {
    if (!str) return ''
    return new Date(str).toLocaleDateString('ja-JP', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="progress-layout">
      {/* Stats panel */}
      <div className="progress-stats-row">
        <div className="progress-stat-card">
          <div className="progress-stat-value">{total}</div>
          <div className="progress-stat-label">総エリア数</div>
        </div>
        <div className="progress-stat-card success">
          <div className="progress-stat-value">{confirmed}</div>
          <div className="progress-stat-label">確認済み</div>
        </div>
        <div className="progress-stat-card warning">
          <div className="progress-stat-value">{inProgress}</div>
          <div className="progress-stat-label">捜索中</div>
        </div>
        <div className="progress-stat-card neutral">
          <div className="progress-stat-value">{unsearched}</div>
          <div className="progress-stat-label">未着手</div>
        </div>
        <div className="progress-stat-card primary">
          <div className="progress-stat-value">{sightings.length}</div>
          <div className="progress-stat-label">目撃情報</div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card mb-progress">
          <div className="card-body progress-bar-section">
            <div className="progress-bar-header">
              <span className="progress-bar-label">捜索進捗</span>
              <span className="progress-bar-pct">{progress}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-bar-sub">
              {confirmed}/{total} エリア確認済み
            </div>
          </div>
        </div>
      )}

      {/* Area list */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📋 捜索エリア管理</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="form-select"
              style={{ width: 'auto', fontSize: 13 }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">全て表示</option>
              <option value="unsearched">未着手のみ</option>
              <option value="in_progress">捜索中のみ</option>
              <option value="confirmed">確認済みのみ</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(v => !v)}
            >
              {showForm ? '閉じる' : '＋ エリア追加'}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="area-add-form fade-in">
            <div className="card-body">
              <div className="form-grid-3">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label required">エリア名</label>
                  <input
                    className="form-input"
                    placeholder="例: ○○公園、駅前商店街"
                    value={newArea.name}
                    onChange={e => setNewArea(d => ({ ...d, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddArea()}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">優先度</label>
                  <select
                    className="form-select"
                    value={newArea.priority}
                    onChange={e => setNewArea(d => ({ ...d, priority: e.target.value }))}
                  >
                    <option value="high">🔴 高</option>
                    <option value="normal">🟡 中</option>
                    <option value="low">🟢 低</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">メモ</label>
                <input
                  className="form-input"
                  placeholder="例: ペットが好きだった場所、目撃情報あり"
                  value={newArea.note}
                  onChange={e => setNewArea(d => ({ ...d, note: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>キャンセル</button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddArea}
                  disabled={!newArea.name.trim()}
                >
                  追加する
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card-body">
          {filteredAreas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🗺️</span>
              <div className="empty-state-text">
                {filter === 'all' ? 'エリアが登録されていません' : 'このカテゴリのエリアはありません'}
              </div>
              <div className="empty-state-sub">
                {filter === 'all' ? 'ペットが行きそうな場所をリストアップしてください' : '他のフィルターを試してみてください'}
              </div>
            </div>
          ) : (
            <div className="area-list">
              {filteredAreas
                .sort((a, b) => {
                  const pOrder = { high: 0, normal: 1, low: 2 }
                  return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1)
                })
                .map(area => (
                  <AreaItem
                    key={area.id}
                    area={area}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onNoteEdit={handleNoteEdit}
                    formatDate={formatDate}
                    PRIORITY_LABELS={PRIORITY_LABELS}
                  />
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="tips-card">
        <div className="tips-title">💡 捜索のヒント</div>
        <ul className="tips-list">
          <li>ペットの行動範囲を中心に半径2km以内のエリアを優先</li>
          <li>公園・神社・学校など人目の少ない緑地を重点捜索</li>
          <li>夜明け・夕方はペットの活動時間帯のため発見率が高い</li>
          <li>目撃情報のあったエリア周辺を繰り返し確認する</li>
          <li>SNS・地域掲示板への投稿と並行して進める</li>
        </ul>
      </div>
    </div>
  )
}

function AreaItem({ area, onStatusChange, onDelete, onNoteEdit, formatDate, PRIORITY_LABELS }) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteVal, setNoteVal] = useState(area.note)

  return (
    <div className={`area-item area-item-${area.status}`}>
      <div className="area-item-left">
        <div className="area-item-header">
          <span className="area-priority-badge">{PRIORITY_LABELS[area.priority]}</span>
          <span className="area-item-name">{area.name}</span>
        </div>
        {editingNote ? (
          <div className="area-note-edit">
            <input
              className="form-input"
              value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              onBlur={() => { onNoteEdit(area.id, noteVal); setEditingNote(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') { onNoteEdit(area.id, noteVal); setEditingNote(false) }
                if (e.key === 'Escape') { setNoteVal(area.note); setEditingNote(false) }
              }}
              autoFocus
              style={{ fontSize: 12, padding: '4px 8px' }}
            />
          </div>
        ) : (
          <div
            className="area-item-note"
            onClick={() => setEditingNote(true)}
            title="クリックして編集"
          >
            {area.note || <span className="area-note-placeholder">メモを追加...</span>}
          </div>
        )}
        <div className="area-item-meta">
          更新: {formatDate(area.updatedAt)}
        </div>
      </div>

      <div className="area-item-right">
        <select
          className="area-status-select"
          value={area.status}
          onChange={e => onStatusChange(area.id, e.target.value)}
        >
          <option value="unsearched">○ 未着手</option>
          <option value="in_progress">◎ 捜索中</option>
          <option value="confirmed">✓ 確認済み</option>
        </select>
        <button
          className="area-delete-btn"
          onClick={() => onDelete(area.id)}
          title="削除"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
