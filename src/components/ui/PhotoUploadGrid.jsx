/**
 * PhotoUploadGrid — DESIGN_SYSTEM.md §1 Color / §3 Shape
 *
 * Figma node 17:118「写真」セクション仕様に準拠した写真アップロードグリッド。
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
import { useRef } from 'react';

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

  const handleFile = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const next = [...images];
      next[index] = reader.result;
      onChange?.(next);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemove = (index) => {
    const next = [...images];
    next[index] = null;
    onChange?.(next);
  };

  const slots = Array.from({ length: max }, (_, i) => images[i] ?? null);

  return (
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
  );
}
