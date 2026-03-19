/**
 * RadioGroup — DESIGN_SYSTEM.md §1 Color / §3 Shape
 *
 * Variants:
 *   radio — 縦並びラジオボタン（デフォルト）
 *   chip  — 横並びチップボタン（12px角丸）
 *
 * Props:
 *   options          string[] | {label, value}[]
 *   value            string
 *   onChange         (value) => void
 *   variant          "radio" | "chip"   default: "radio"
 *   name             string
 *   label            string
 *   required         boolean
 *   otherLabel       string   default: "その他"
 *   otherValue       string
 *   onOtherChange    (val) => void
 *   otherPlaceholder string
 *   className        string
 */

function normalize(opt) {
  return typeof opt === 'string' ? { label: opt, value: opt } : opt;
}

export default function RadioGroup({
  options = [],
  value,
  onChange,
  variant = 'radio',
  name = 'radio-group',
  label,
  required = false,
  otherLabel = 'その他',
  otherValue = '',
  onOtherChange,
  otherPlaceholder = '例：うさぎ、フェレット、ハムスター',
  className = '',
}) {
  const normalized      = options.map(normalize);
  const isOtherSelected = value === otherLabel || (value && !normalized.find(o => o.value === value));
  const showOtherInput  = isOtherSelected && typeof onOtherChange === 'function';

  // ── Chip variant ─────────────────────────────────────────────────────────
  if (variant === 'chip') {
    return (
      <div className={`flex flex-col ${className}`}>
        {label && (
          <p className="font-ui text-ui-label font-bold text-brand-label tracking-[0.2px] mb-2.5">
            {label}
            {required && <span className="text-brand-teal ml-[3px]">*</span>}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {normalized.map(opt => {
            const isActive = value === opt.value || (opt.value === otherLabel && isOtherSelected);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value === otherLabel ? otherLabel : opt.value)}
                aria-pressed={isActive}
                className={[
                  'inline-flex items-center px-4 py-2 rounded-xl border-[1.5px]',
                  'font-ui text-ui-caption font-semibold cursor-pointer',
                  'select-none [-webkit-tap-highlight-color:transparent] transition-all duration-150',
                  isActive
                    ? 'bg-brand-teal/10 border-brand-teal text-brand-teal'
                    : 'bg-brand-surface border-transparent text-brand-label hover:border-brand-sand-mid hover:text-brand-dark',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {showOtherInput && (
          <input
            type="text"
            value={otherValue}
            onChange={e => onOtherChange(e.target.value)}
            placeholder={otherPlaceholder}
            autoFocus
            className={[
              'w-full mt-2.5 px-[14px] py-[11px]',
              'bg-white border-2 border-brand-teal rounded-input',
              'font-ui text-ui-body font-semibold text-brand-dark outline-none',
              'placeholder:text-brand-muted placeholder:font-normal',
            ].join(' ')}
          />
        )}
      </div>
    );
  }

  // ── Radio variant (デフォルト) ────────────────────────────────────────────
  return (
    <div
      role="radiogroup"
      aria-label={label || name}
      className={`flex flex-col gap-0.5 ${className}`}
    >
      {label && (
        <p className="font-ui text-ui-label font-bold text-brand-label tracking-[0.2px] mb-2">
          {label}
          {required && <span className="text-brand-teal ml-[3px]">*</span>}
        </p>
      )}

      {normalized.map(opt => {
        const isActive = value === opt.value || (opt.value === otherLabel && isOtherSelected);
        return (
          <div key={opt.value}>
            <label
              htmlFor={`${name}-${opt.value}`}
              className="flex items-center gap-2.5 py-1 cursor-pointer select-none [-webkit-tap-highlight-color:transparent]"
            >
              {/* 非表示ネイティブ radio */}
              <input
                id={`${name}-${opt.value}`}
                type="radio"
                name={name}
                value={opt.value}
                checked={isActive}
                onChange={() => onChange(opt.value === otherLabel ? otherLabel : opt.value)}
                className="absolute opacity-0 w-0 h-0"
              />

              {/* カスタム円 */}
              <span className={[
                'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                'transition-all duration-150',
                isActive ? 'border-brand-teal bg-brand-teal' : 'border-brand-radio',
              ].join(' ')}>
                {isActive && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>

              {/* ラベルテキスト */}
              <span className={[
                'font-ui text-ui-body transition-colors duration-150',
                isActive ? 'font-semibold text-brand-teal' : 'font-normal text-brand-dark',
              ].join(' ')}>
                {opt.label}
              </span>
            </label>

            {/* その他: 入力展開 */}
            {opt.value === otherLabel && isActive && showOtherInput && (
              <input
                type="text"
                value={otherValue}
                onChange={e => onOtherChange(e.target.value)}
                placeholder={otherPlaceholder}
                autoFocus
                className={[
                  'mt-1.5 ml-[30px] w-[calc(100%-30px)]',
                  'px-[14px] py-2.5',
                  'bg-brand-surface border-[1.5px] border-brand-teal rounded-input',
                  'font-ui text-ui-body font-medium text-brand-dark outline-none',
                  'placeholder:text-brand-muted placeholder:font-normal',
                  'focus:bg-white transition-all duration-150',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
