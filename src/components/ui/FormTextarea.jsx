/**
 * FormTextarea — DESIGN_SYSTEM.md §2 Typography / §3 Shape / §4 Spacing
 *
 * ラベル付き複数行テキスト入力。
 * フォーカス時: ティールボーダー + 白背景
 * 通常時: 透明ボーダー + brand-surface 背景
 *
 * Props:
 *   label            string
 *   value            string
 *   onChange         (e) => void
 *   placeholder      string
 *   rows             number       default: 3
 *   required         boolean
 *   hint             string
 *   error            string
 *   maxLength        number       — 文字数制限（右上に残数表示）
 *   disabled         boolean
 *   className        string — ルートdivへの追加クラス
 *   textareaClassName string — textareaへの追加クラス
 */

export default function FormTextarea({
  label,
  value = '',
  onChange,
  placeholder = '',
  rows = 3,
  required = false,
  hint,
  error,
  maxLength,
  disabled = false,
  className = '',
  textareaClassName = '',
}) {
  const hasError  = Boolean(error);
  const remaining = maxLength != null ? maxLength - (value?.length ?? 0) : null;
  const nearLimit = remaining != null && remaining <= 20;

  return (
    <div className={`flex flex-col ${className}`}>

      {/* ラベル行 + 残文字数 */}
      {(label || remaining != null) && (
        <div className="flex justify-between items-end mb-1.5">
          {label ? (
            <label className={[
              'font-ui text-ui-label font-bold tracking-[0.2px] transition-colors duration-150',
              hasError ? 'text-brand-red' : 'text-brand-label',
            ].join(' ')}>
              {label}
              {required && (
                <span className="text-brand-teal ml-[3px]">*</span>
              )}
            </label>
          ) : <span />}

          {remaining != null && (
            <span className={[
              'font-ui text-[10px] font-normal tracking-[0.1px] transition-colors duration-150',
              nearLimit ? 'text-brand-teal' : 'text-brand-muted',
            ].join(' ')}>
              {remaining}
            </span>
          )}
        </div>
      )}

      {/* テキストエリア */}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={[
          'w-full px-[14px] py-[11px]',
          'bg-brand-surface border-[1.5px] border-transparent rounded-input',
          'font-ui text-ui-body font-medium text-brand-dark outline-none resize-none',
          'leading-relaxed transition-colors duration-150 [-webkit-appearance:none]',
          'placeholder:text-brand-muted placeholder:font-normal',
          'focus:border-brand-teal focus:bg-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError ? 'border-brand-red bg-brand-red/5' : '',
          textareaClassName,
        ].join(' ')}
      />

      {/* エラー / ヒント */}
      {(error || hint) && (
        <p className={[
          'font-ui text-ui-label font-normal mt-[5px] leading-relaxed tracking-[0.1px]',
          hasError ? 'text-brand-red' : 'text-brand-muted',
        ].join(' ')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
