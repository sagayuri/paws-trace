/**
 * FormField — DESIGN_SYSTEM.md §2 Typography / §3 Shape / §4 Spacing
 *
 * ラベル付きテキスト入力フィールド。
 * フォーカス時: ティールボーダー + 白背景
 * 通常時: 透明ボーダー + brand-surface 背景
 *
 * Props:
 *   label         string
 *   value         string
 *   onChange      (e) => void
 *   placeholder   string
 *   type          "text" | "tel" | "email" | "date" | "number"   default: "text"
 *   required      boolean
 *   hint          string
 *   error         string
 *   disabled      boolean
 *   className     string — ルートdivへの追加クラス
 *   inputClassName string — inputへの追加クラス
 */

export default function FormField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  required = false,
  hint,
  error,
  disabled = false,
  className = '',
  inputClassName = '',
}) {
  const hasError = Boolean(error);

  return (
    <div className={`flex flex-col ${className}`}>

      {/* ラベル */}
      {label && (
        <label className={[
          'block font-ui text-ui-label font-bold tracking-[0.2px] mb-1.5 transition-colors duration-150',
          hasError ? 'text-brand-red' : 'text-brand-label',
        ].join(' ')}>
          {label}
          {required && (
            <span className="text-brand-teal ml-[3px]">*</span>
          )}
        </label>
      )}

      {/* インプット */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={[
          'form-input',   /* date picker 疑似要素は index.css で管理 */
          'w-full px-[14px] py-[11px]',
          'bg-brand-surface border-[1.5px] border-transparent rounded-input',
          'font-ui text-ui-body font-medium text-brand-dark outline-none',
          'transition-colors duration-150 [-webkit-appearance:none]',
          'placeholder:text-brand-muted placeholder:font-normal',
          'focus:border-brand-teal focus:bg-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError ? 'border-brand-red bg-brand-red/5' : '',
          inputClassName,
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
