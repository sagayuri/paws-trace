/**
 * PhotoUploadGrid — DESIGN_SYSTEM.md §1 Color / §3 Shape
 *
 * 写真選択 → クロップモーダル → プレビュー の一連の流れを内包する。
 *
 * 空セル:
 *   - 破線ティールボーダー (1.5px dashed brand-teal)
 *   - 「＋」アイコン (ティール, 22px)
 *   - 「写真を選択」テキスト (ティール, 11px)
 *
 * 選択済みセル:
 *   - 画像プレビュー（object-fit: cover）
 *   - 右上の削除ボタン（赤丸 × アイコン）
 *   - ティール実線ボーダー
 *
 * Props:
 *   images    (string|null)[]   — base64 or URL配列
 *   onChange  (images) => void
 *   max       number            default: 3
 *   hint      string
 *   disabled  boolean
 *   className string
 */
import { useRef, useState, useEffect } from 'react';

// ── アイコン ──────────────────────────────────────────────────────────────────
function PlusIcon({ className = '' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="text-white">
      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── クロップモーダル ───────────────────────────────────────────────────────────
function CropModal({ src, onCrop, onCancel }) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [imgNatural, setImgNatural] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setContainerSize({ w: width, h: height });
  }, []);

  const CROP_SIZE = containerSize.w > 0 ? Math.min(containerSize.w, containerSize.h) * 0.85 : 280;
  const scale = imgNatural && containerSize.w > 0
    ? Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h) : 1;
  const imgW = imgNatural ? imgNatural.w * scale : CROP_SIZE;
  const imgH = imgNatural ? imgNatural.h * scale : CROP_SIZE;
  const maxX = Math.max(0, (imgW - CROP_SIZE) / 2);
  const maxY = Math.max(0, (imgH - CROP_SIZE) / 2);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const cx = clamp(offset.x, -maxX, maxX);
  const cy = clamp(offset.y, -maxY, maxY);
  const imgLeft = (containerSize.w - imgW) / 2 + cx;
  const imgTop  = (containerSize.h - imgH) / 2 + cy;
  const cropLeft = (containerSize.w - CROP_SIZE) / 2;
  const cropTop  = (containerSize.h - CROP_SIZE) / 2;

  const startDrag = (clientX, clientY) => {
    dragRef.current = { clientX, clientY, ox: offset.x, oy: offset.y };
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (clientX - dragRef.current.clientX),
      y: dragRef.current.oy + (clientY - dragRef.current.clientY),
    });
  };
  const endDrag = () => { dragRef.current = null; };

  const handleCrop = () => {
    if (!imgNatural) return;
    const canvas = document.createElement('canvas');
    const OUT = 800;
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const sx = (cropLeft - imgLeft) / scale;
      const sy = (cropTop  - imgTop)  / scale;
      const sw = CROP_SIZE / scale;
      ctx.drawImage(img, sx, sy, sw, sw, 0, 0, OUT, OUT);
      onCrop(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = src;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col select-none">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0">
        <button onClick={onCancel} className="text-white/70 text-[15px] font-medium">
          キャンセル
        </button>
        <span className="text-white font-semibold text-[15px]">写真を切り取る</span>
        <button onClick={handleCrop} className="text-[#73351F] font-bold text-[16px]">
          完了
        </button>
      </div>

      {/* キャンバスエリア */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onMouseDown={e  => startDrag(e.clientX, e.clientY)}
        onMouseMove={e  => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e  => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
      >
        {containerSize.w > 0 && (
          <>
            <img
              src={src}
              onLoad={e => setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
              draggable={false}
              style={{
                position: 'absolute',
                width: imgW, height: imgH,
                left: imgLeft, top: imgTop,
                pointerEvents: 'none', userSelect: 'none',
              }}
            />
            {/* クロップ枠 */}
            <div style={{
              position: 'absolute',
              left: cropLeft, top: cropTop,
              width: CROP_SIZE, height: CROP_SIZE,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: 12,
              pointerEvents: 'none',
            }} />
            {/* コーナーハンドル（視覚的ガイド） */}
            {[
              { top: cropTop - 1,              left: cropLeft - 1              },
              { top: cropTop - 1,              left: cropLeft + CROP_SIZE - 19 },
              { top: cropTop + CROP_SIZE - 19, left: cropLeft - 1              },
              { top: cropTop + CROP_SIZE - 19, left: cropLeft + CROP_SIZE - 19 },
            ].map((pos, idx) => (
              <div key={idx} style={{
                position: 'absolute',
                width: 20, height: 20,
                ...pos,
                border: '3px solid white',
                borderRadius: 3,
                pointerEvents: 'none',
                // 各コーナーで適切な辺だけ表示
                borderTop:    idx < 2   ? '3px solid white' : 'none',
                borderBottom: idx >= 2  ? '3px solid white' : 'none',
                borderLeft:   idx % 2 === 0 ? '3px solid white' : 'none',
                borderRight:  idx % 2 === 1 ? '3px solid white' : 'none',
              }} />
            ))}
          </>
        )}
      </div>

      {/* フッター */}
      <div className="shrink-0 pt-3 pb-8 text-center">
        <p className="text-white/40 text-[13px]">ドラッグして位置を調整</p>
      </div>
    </div>
  );
}

// ── メイン ────────────────────────────────────────────────────────────────────
export default function PhotoUploadGrid({
  images = [null, null, null],
  onChange,
  max = 3,
  hint,
  disabled = false,
  className = '',
}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fileRefs = Array.from({ length: max }, () => useRef(null));
  const [cropState, setCropState] = useState(null); // { index, src }

  const handleFile = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropState({ index, src: reader.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropDone = (dataUrl) => {
    const next = [...images];
    next[cropState.index] = dataUrl;
    onChange?.(next);
    setCropState(null);
  };

  const handleRemove = (index) => {
    const next = [...images];
    next[index] = null;
    onChange?.(next);
  };

  const slots = Array.from({ length: max }, (_, i) => images[i] ?? null);

  return (
    <>
      <div className={className}>
        {/* グリッド */}
        <div className="grid grid-cols-3 gap-2.5">
          {slots.map((img, i) => (
            <div key={i} className="relative">
              {img ? (
                /* ── 選択済みセル ── */
                <div className="aspect-square rounded-input border-2 border-brand-teal bg-brand-surface overflow-hidden flex items-center justify-center">
                  <img
                    src={img}
                    alt={`ペットの写真 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      aria-label={`写真 ${i + 1} を削除`}
                      className={[
                        'absolute -top-[7px] -right-[7px]',
                        'w-[22px] h-[22px] rounded-full bg-brand-red',
                        'flex items-center justify-center p-0 border-none cursor-pointer z-[2]',
                        'transition-all duration-150 hover:bg-brand-red-dark hover:scale-110',
                      ].join(' ')}
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              ) : (
                /* ── 空セル ── */
                <div
                  className={[
                    'aspect-square rounded-input bg-brand-surface',
                    'border-[1.5px] border-dashed border-brand-teal',
                    'flex flex-col items-center justify-center',
                    'transition-colors duration-150',
                    disabled
                      ? 'opacity-45 pointer-events-none'
                      : 'cursor-pointer hover:border-brand-teal-dark hover:bg-brand-teal/5',
                  ].join(' ')}
                  onClick={() => !disabled && fileRefs[i].current?.click()}
                  role="button"
                  aria-label={`写真 ${i + 1} を選択`}
                  tabIndex={disabled ? -1 : 0}
                  onKeyDown={e => e.key === 'Enter' && !disabled && fileRefs[i].current?.click()}
                >
                  <PlusIcon className="text-brand-teal" />
                  <span className="font-ui text-ui-label font-semibold text-brand-teal mt-1.5 tracking-[0.1px]">
                    写真を選択
                  </span>
                </div>
              )}

              {/* ファイル入力（非表示） */}
              <input
                ref={fileRefs[i]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFile(i, e)}
                disabled={disabled}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>

        {/* ヒント */}
        {hint && (
          <p className="font-ui text-ui-label font-normal text-brand-muted mt-2 tracking-[0.1px] leading-relaxed">
            {hint}
          </p>
        )}
      </div>

      {/* クロップモーダル（ポータルなしで fixed で全画面） */}
      {cropState && (
        <CropModal
          src={cropState.src}
          onCrop={handleCropDone}
          onCancel={() => setCropState(null)}
        />
      )}
    </>
  );
}
