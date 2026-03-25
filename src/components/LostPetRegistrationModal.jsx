/**
 * LostPetRegistrationModal
 *
 * 迷子登録モーダル。DESIGN_SYSTEM.md に準拠。
 * - モバイル: ボトムシート（border-radius: 28px 28px 0 0）
 * - デスクトップ(≥640px): 中央モーダル（max-w-520px / rounded-24px）
 * - ベージュ×ティール×テラコッタのブランドカラーを使用
 * - 足跡（Paw）モチーフをセクション区切りにさりげなく使用
 * - 柔らかい日本語表現
 *
 * components/ui から共通コンポーネントを使用:
 *   PrimaryButton, TraceCard, FormField, FormTextarea, RadioGroup, PhotoUploadGrid
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   onSave       (formData) => void
 *   initialData  object  — 初期フォーム値（省略時は空）
 */
import { useState, useRef, useEffect } from 'react';
import { X, MapPin, ChevronRight } from 'lucide-react';
import { colors } from '../tokens';
import {
  PrimaryButton,
  TraceCard,
  FormField,
  FormTextarea,
  RadioGroup,
  PhotoUploadGrid,
} from './ui';
import PawPrintIcon from './icons/PawPrintIcon';

// ── フォント ────────────────────────────────────────────────────────────────
const FONT = '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif';

// ── 動物種別 ─────────────────────────────────────────────────────────────────
const ANIMAL_OPTIONS = ['犬', '猫', '鳥', 'その他'];

// ── 初期フォーム値 ──────────────────────────────────────────────────────────
const EMPTY = {
  images: [null, null, null],
  type: '犬',
  otherType: '',
  name: '', breed: '', gender: '', age: '', color: '', size: '', collar: '',
  lostDate: '', lostLocation: '', lostLat: null, lostLng: null,
  features: '', memo: '',
  ownerName: '', contact: '', email: '',
};

// ── 足跡区切り線 ────────────────────────────────────────────────────────────
function PawDivider() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 0',
      opacity: 0.18,
    }}>
      <div style={{ flex: 1, height: '1px', background: colors.brand.teal }} />
      <PawPrintIcon color={colors.brand.teal} size={13} />
      <PawPrintIcon color={colors.brand.teal} size={13} />
      <PawPrintIcon color={colors.brand.teal} size={13} />
      <div style={{ flex: 1, height: '1px', background: colors.brand.teal }} />
    </div>
  );
}

// ── セクションラベル ─────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '14px',
    }}>
      <PawPrintIcon color={colors.brand.teal} size={14} />
      <span style={{
        fontFamily: FONT,
        fontSize: '11px',
        fontWeight: 700,
        color: colors.brand.teal,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
      }}>
        {children}
      </span>
    </div>
  );
}

// ── メインモーダル ───────────────────────────────────────────────────────────
export default function LostPetRegistrationModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialData });
  const [lostDateRaw, setLostDateRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // 開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY, ...(initialData || {}) });
      setLostDateRaw('');
      setSubmitting(false);
      setTimeout(() => scrollRef.current?.scrollTo(0, 0), 50);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 背景スクロールロック
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOtherType = !['犬', '猫', '鳥'].includes(form.type);
  const canSave = form.name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 400));
    onSave?.({ ...form, type: isOtherType ? form.otherType || 'その他' : form.type });
    onClose();
  };

  return (
    <>
      <style>{`
        .lpr-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(26, 46, 45, 0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 0;
          animation: lpr-fade-in 0.2s ease;
        }
        @media (min-width: 640px) {
          .lpr-overlay {
            align-items: center;
            padding: 24px;
          }
        }
        @keyframes lpr-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .lpr-sheet {
          background: ${colors.brand.surface};
          width: 100%;
          max-height: 94dvh;
          border-radius: 28px 28px 0 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: lpr-slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
          box-shadow: 0 -8px 40px rgba(26,46,45,0.18);
        }
        @media (min-width: 640px) {
          .lpr-sheet {
            max-width: 520px;
            max-height: 88vh;
            border-radius: 24px;
            animation: lpr-scale-in 0.22s cubic-bezier(0.32, 0.72, 0, 1);
          }
        }
        @keyframes lpr-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes lpr-scale-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .lpr-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          -webkit-overflow-scrolling: touch;
        }
        .lpr-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
      `}</style>

      <div className="lpr-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="lpr-sheet" role="dialog" aria-modal="true" aria-label="迷子のコを登録">

          {/* ── ヘッダー ──────────────────────────────────────────────────── */}
          <div style={{
            background: colors.brand.sand,
            padding: '16px 20px 18px',
            borderBottom: `1px solid ${colors.brand.sandMid}`,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* ドラッグハンドル（モバイル） */}
            <div style={{
              width: '36px', height: '4px',
              background: 'rgba(26,46,45,0.2)',
              borderRadius: '2px',
              margin: '0 auto 14px',
            }} />

            {/* 背景の薄い足跡 */}
            <div style={{
              position: 'absolute', right: '16px', bottom: '-4px',
              display: 'flex', gap: '6px', opacity: 0.12, pointerEvents: 'none',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ transform: `rotate(${-15 + i * 15}deg) translateY(${i * -4}px)` }}>
                  <PawPrintIcon color={colors.brand.teal} size={28} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{
                  fontFamily: FONT,
                  fontSize: '19px',
                  fontWeight: 700,
                  color: colors.brand.dark,
                  lineHeight: '1.3',
                  letterSpacing: '0.2px',
                }}>
                  いなくなったコを登録
                </p>
                <p style={{
                  fontFamily: FONT,
                  fontSize: '12px',
                  color: colors.brand.teal,
                  fontWeight: 600,
                  marginTop: '4px',
                  letterSpacing: '0.5px',
                }}>
                  一緒に探しましょう 🐾
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(26,46,45,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
                aria-label="閉じる"
              >
                <X size={16} color={colors.brand.dark} />
              </button>
            </div>
          </div>

          {/* ── ボディ（スクロール） ──────────────────────────────────────── */}
          <div className="lpr-body" ref={scrollRef}>

            {/* ① 写真 */}
            <TraceCard
              icon={<PawPrintIcon color={colors.brand.teal} size={16} />}
              title="写真"
              variant="default"
            >
              <PhotoUploadGrid
                images={form.images}
                onChange={imgs => set('images', imgs)}
                max={2}
                hint="※最低1枚必須"
              />
            </TraceCard>

            <PawDivider />

            {/* ② このコのこと */}
            <TraceCard
              icon={<PawPrintIcon color={colors.brand.teal} size={16} />}
              title="このコのこと"
              variant="default"
            >
              {/* 動物種別 */}
              <SectionLabel>どんな動物ですか？</SectionLabel>
              <RadioGroup
                variant="chip"
                options={ANIMAL_OPTIONS}
                value={isOtherType ? 'その他' : form.type}
                onChange={val => set('type', val === 'その他' ? '' : val)}
                otherLabel="その他"
                otherValue={form.otherType}
                onOtherChange={val => set('otherType', val)}
                otherPlaceholder="ウサギ、フェレット、ハムスターなど"
                style={{ marginBottom: '16px' }}
              />

              {/* 名前・品種 */}
              <div className="lpr-grid2">
                <FormField
                  label="お名前"
                  required
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="ポチ"
                />
                <FormField
                  label="品種"
                  value={form.breed}
                  onChange={e => set('breed', e.target.value)}
                  placeholder="柴犬"
                />
                <FormField
                  label="性別"
                  value={form.gender}
                  onChange={e => set('gender', e.target.value)}
                  placeholder="オス"
                />
                <FormField
                  label="年齢"
                  value={form.age}
                  onChange={e => set('age', e.target.value)}
                  placeholder="3歳"
                />
                <FormField
                  label="毛の色"
                  value={form.color}
                  onChange={e => set('color', e.target.value)}
                  placeholder="茶色"
                />
                <FormField
                  label="大きさ"
                  value={form.size}
                  onChange={e => set('size', e.target.value)}
                  placeholder="中型"
                />
              </div>
              <FormField
                label="首輪・タグの特徴"
                value={form.collar}
                onChange={e => set('collar', e.target.value)}
                placeholder="赤い首輪、迷子札あり"
                style={{ marginTop: '10px' }}
              />
              <FormTextarea
                label="見た目の特徴・性格"
                value={form.features}
                onChange={e => set('features', e.target.value)}
                placeholder="左耳に小さな傷跡あり、人懐っこい性格です"
                rows={3}
                maxLength={200}
                style={{ marginTop: '10px' }}
              />
            </TraceCard>

            <PawDivider />

            {/* ③ いなくなった状況 */}
            <TraceCard
              icon={<MapPin size={16} color={colors.brand.red} />}
              title="いなくなった状況"
              variant="default"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* いなくなった日 */}
                <FormField
                  label="いなくなった日"
                  type="date"
                  value={lostDateRaw}
                  onChange={e => {
                    setLostDateRaw(e.target.value);
                    const [y, m, d] = e.target.value.split('-');
                    if (y && m && d) set('lostDate', `${y}年${parseInt(m)}月${parseInt(d)}日`);
                  }}
                />

                {/* 最後に見かけた場所 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: FONT,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#8E8E93',
                    marginBottom: '6px',
                    letterSpacing: '0.2px',
                  }}>
                    最後に見かけた場所
                  </label>
                  {form.lostLocation ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 14px',
                      background: 'rgba(237,28,36,0.05)',
                      border: `1.5px solid rgba(237,28,36,0.2)`,
                      borderRadius: '12px',
                    }}>
                      <MapPin size={16} color={colors.brand.red} style={{ flexShrink: 0 }} />
                      <span style={{
                        flex: 1, fontFamily: FONT, fontSize: '13px',
                        fontWeight: 500, color: colors.brand.dark, lineHeight: '1.5',
                      }}>
                        {form.lostLocation}
                      </span>
                      <button
                        onClick={() => set('lostLocation', '')}
                        style={{
                          fontFamily: FONT, fontSize: '11px', fontWeight: 700,
                          color: colors.brand.teal, background: 'none',
                          border: 'none', cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        変更
                      </button>
                    </div>
                  ) : (
                    <PrimaryButton
                      variant="outline"
                      leftIcon={<MapPin size={16} color={colors.brand.cta} />}
                      rightIcon={<ChevronRight size={16} color={colors.brand.cta} />}
                      onClick={() => { /* TODO: マップ選択 */ }}
                      style={{ justifyContent: 'space-between' }}
                    >
                      地図を開いて場所を選択
                    </PrimaryButton>
                  )}
                </div>

                <FormTextarea
                  label="状況・メモ（任意）"
                  value={form.memo}
                  onChange={e => set('memo', e.target.value)}
                  placeholder="散歩中に首輪が外れて逃走。近くの公園付近で最後に目撃。"
                  rows={3}
                  maxLength={300}
                />
              </div>
            </TraceCard>

            <PawDivider />

            {/* ④ ご連絡先 */}
            <TraceCard
              icon={<PawPrintIcon color={colors.brand.teal} size={16} />}
              title="ご連絡先"
              variant="default"
            >
              <p style={{
                fontFamily: FONT,
                fontSize: '12px',
                color: '#8E8E93',
                marginBottom: '14px',
                lineHeight: '1.7',
              }}>
                目撃情報が届いたとき、こちらにご連絡します。
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <FormField
                  label="飼い主のお名前"
                  value={form.ownerName}
                  onChange={e => set('ownerName', e.target.value)}
                  placeholder="山田 太郎"
                />
                <FormField
                  label="電話番号"
                  value={form.contact}
                  onChange={e => set('contact', e.target.value)}
                  placeholder="090-0000-0000"
                  type="tel"
                />
                <FormField
                  label="メールアドレス"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="example@mail.com"
                  type="email"
                />
              </div>
            </TraceCard>

            {/* 必須メモ */}
            <p style={{
              fontFamily: FONT,
              fontSize: '11px',
              color: '#AEAEB2',
              textAlign: 'center',
              padding: '4px 0 8px',
              lineHeight: '1.7',
            }}>
              * は必須項目です。登録後もいつでも編集できます。
            </p>

          </div>

          {/* ── フッター CTA ───────────────────────────────────────────── */}
          <div style={{
            padding: '12px 20px 20px',
            background: colors.brand.white,
            borderTop: `1px solid ${colors.brand.sandMid}`,
            flexShrink: 0,
          }}>
            {!canSave && (
              <p style={{
                fontFamily: FONT,
                fontSize: '12px',
                color: colors.brand.cta,
                textAlign: 'center',
                marginBottom: '8px',
                fontWeight: 600,
              }}>
                お名前を入力してください
              </p>
            )}
            <PrimaryButton
              variant="full"
              disabled={!canSave}
              loading={submitting}
              onClick={handleSave}
            >
              {submitting ? '登録中…' : '一緒に探し始める 🐾'}
            </PrimaryButton>
          </div>

        </div>
      </div>
    </>
  );
}
