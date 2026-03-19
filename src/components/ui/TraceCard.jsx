/**
 * TraceCard — DESIGN_SYSTEM.md §1 Color / §3 Shape / §4 Spacing
 *
 * Variants:
 *   default  — 白地 + ティール左ボーダー 4px
 *   sand     — クリーム地 + ティール左ボーダー 4px
 *   outline  — 白地 + ティール全周ボーダー 1.5px
 *
 * Props:
 *   variant    "default" | "sand" | "outline"   default: "default"
 *   icon       ReactNode
 *   title      string
 *   titleRight ReactNode
 *   children   ReactNode
 *   footer     ReactNode
 *   noPadding  boolean
 *   onClick    function
 *   className  string
 */

const VARIANT_CLS = {
  default: 'bg-white border-l-4 border-l-brand-teal shadow-card',
  sand:    'bg-brand-cream border-l-4 border-l-brand-teal shadow-sm',
  outline: 'bg-white border-[1.5px] border-brand-teal shadow-[0_1px_4px_rgba(34,128,127,0.10)]',
};

export default function TraceCard({
  variant = 'default',
  icon = null,
  title = null,
  titleRight = null,
  children,
  footer = null,
  noPadding = false,
  onClick,
  className = '',
}) {
  const hasHeader  = icon || title || titleRight;
  const isClickable = typeof onClick === 'function';

  return (
    <div
      className={[
        'overflow-hidden flex flex-col w-full rounded-card',
        'transition-all duration-150',
        VARIANT_CLS[variant],
        isClickable
          ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(34,128,127,0.15)] active:scale-[0.99]'
          : '',
        className,
      ].join(' ')}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? e => e.key === 'Enter' && onClick(e) : undefined}
    >
      {/* ── ヘッダー ── */}
      {hasHeader && (
        <div className="flex items-center gap-2.5 px-5 py-[14px] border-b border-brand-sand-mid max-sm:px-4 max-sm:py-3">
          {icon && (
            <span className="flex-shrink-0 flex items-center text-brand-teal" aria-hidden="true">
              {icon}
            </span>
          )}
          {title && (
            <span className="flex-1 font-ui text-[15px] font-bold leading-5 text-brand-dark tracking-[0.2px]">
              {title}
            </span>
          )}
          {titleRight && (
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {titleRight}
            </div>
          )}
        </div>
      )}

      {/* ── ボディ ── */}
      <div className={`flex-1 ${noPadding ? '' : 'px-5 py-4 max-sm:px-4 max-sm:py-3'}`}>
        {children}
      </div>

      {/* ── フッター ── */}
      {footer && (
        <div className="px-5 py-3 border-t border-brand-sand-mid flex items-center gap-2 max-sm:px-4 max-sm:py-2.5">
          {footer}
        </div>
      )}
    </div>
  );
}
