/**
 * PrimaryButton — DESIGN_SYSTEM.md §1 CTA / §3 Shape
 *
 * Variants:
 *   full    — 幅100%、高さ56px（ランディングCTAと同仕様）
 *   auto    — 内容幅に合わせる
 *   small   — 小サイズ（フォーム内など）
 *   outline — ティール枠線・背景透明（地図選択ボタン等）
 *
 * Props:
 *   variant   "full" | "auto" | "small" | "outline"   default: "full"
 *   disabled  boolean
 *   loading   boolean — ローディングスピナー表示
 *   leftIcon  ReactNode
 *   rightIcon ReactNode
 *   onClick   function
 *   type      "button" | "submit"                       default: "button"
 *   className 追加クラス
 */

// 共通ベースクラス
const BASE = [
  'inline-flex items-center justify-center gap-2',
  'rounded-btn font-ui text-ui-md font-bold tracking-[0.32px]',
  'transition-all duration-150 select-none',
  '[-webkit-tap-highlight-color:transparent]',
  'active:scale-[0.97]',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ');

// バリアント別クラス
const VARIANTS = {
  full:    'w-full h-14 px-4 bg-brand-cta text-white hover:bg-brand-cta-dark',
  auto:    'h-12 px-6 bg-brand-cta text-white hover:bg-brand-cta-dark',
  small:   'h-9 px-4 text-ui-caption bg-brand-cta text-white hover:bg-brand-cta-dark',
  outline: 'w-full h-12 px-4 bg-transparent border-[1.5px] border-brand-teal text-brand-teal hover:bg-brand-teal/10',
};

export default function PrimaryButton({
  children,
  variant = 'full',
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  onClick,
  type = 'button',
  className = '',
}) {
  const isDisabled = disabled || loading;
  const isOutline  = variant === 'outline';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
    >
      {/* ローディングスピナー */}
      {loading ? (
        <span className={[
          'w-[18px] h-[18px] rounded-full border-2 animate-spin flex-shrink-0',
          isOutline
            ? 'border-brand-teal/30 border-t-brand-teal'
            : 'border-white/40 border-t-white',
        ].join(' ')} />
      ) : leftIcon ? (
        <span className="flex items-center flex-shrink-0">{leftIcon}</span>
      ) : null}

      {children}

      {rightIcon && !loading && (
        <span className="flex items-center flex-shrink-0 ml-1">{rightIcon}</span>
      )}
    </button>
  );
}
