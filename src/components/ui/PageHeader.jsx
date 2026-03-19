/**
 * PageHeader — DESIGN_SYSTEM.md §1 Color / §2 Typography
 *
 * レスポンシブ対応:
 *   mobile  (< 640px): ロゴ中央 or 左、右端にアクション
 *   tablet+ (≥ 640px): ロゴ左、中央にnavItems、右端にactions
 *
 * Props:
 *   title       string
 *   showLogo    boolean        default: true
 *   logoColor   string         default: brand.teal
 *   navItems    [{label, onClick, active}]
 *   leftAction  ReactNode
 *   rightAction ReactNode
 *   sticky      boolean        default: true
 *   border      boolean        default: true
 *   className   string
 */
import PawTraceLogo from '../PawTraceLogo';
import { colors } from '../../tokens';

export default function PageHeader({
  title,
  showLogo = true,
  logoColor = colors.brand.teal,
  navItems = [],
  leftAction = null,
  rightAction = null,
  sticky = true,
  border = true,
  className = '',
}) {
  return (
    <header
      role="banner"
      className={[
        'bg-white w-full',
        sticky ? 'sticky top-0 z-[100]' : '',
        border ? 'border-b border-brand-sand-mid' : '',
        className,
      ].join(' ')}
    >
      {/* ── メインバー ── */}
      <div className={[
        'flex items-center justify-between gap-2 max-w-[1200px] mx-auto',
        'px-pad-x py-3 max-sm:px-4',
      ].join(' ')}>

        {/* 左スロット */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {leftAction}
        </div>

        {/* 中央: ロゴ / タイトル / デスクトップNav */}
        <div className="flex-1 flex items-center justify-center">
          {navItems.length > 0 ? (
            <nav className="hidden sm:flex items-center gap-1" aria-label="ページナビゲーション">
              {navItems.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={item.onClick}
                  aria-current={item.active ? 'page' : undefined}
                  className={[
                    'px-[14px] py-2 rounded-lg font-ui text-ui-body font-medium',
                    'border-none cursor-pointer transition-all duration-150 whitespace-nowrap',
                    item.active
                      ? 'text-brand-teal bg-brand-teal/10 font-bold'
                      : 'text-brand-charcoal bg-transparent hover:bg-brand-surface hover:text-brand-dark',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          ) : showLogo && !title ? (
            <PawTraceLogo color={logoColor} width={120} />
          ) : title ? (
            <span className="font-ui text-[17px] font-bold text-brand-dark tracking-[0.2px] whitespace-nowrap">
              {title}
            </span>
          ) : null}
        </div>

        {/* 右スロット */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {rightAction}
        </div>
      </div>

      {/* ── モバイル横スクロール Nav ── */}
      {navItems.length > 0 && (
        <nav
          className="flex overflow-x-auto border-t border-brand-sand-mid sm:hidden scrollbar-none"
          aria-label="モバイルナビゲーション"
        >
          {navItems.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={item.onClick}
              aria-current={item.active ? 'page' : undefined}
              className={[
                'flex-shrink-0 px-5 py-2.5 font-ui text-ui-caption border-b-2',
                'border-none cursor-pointer whitespace-nowrap bg-transparent transition-all duration-150',
                item.active
                  ? 'font-bold text-brand-teal border-b-2 border-brand-teal'
                  : 'font-medium text-brand-charcoal border-b-2 border-transparent',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
