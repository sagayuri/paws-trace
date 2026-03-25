/**
 * PetRegistrationScreen
 *
 * 迷子ペット登録フルスクリーン。DESIGN_SYSTEM.md に準拠。
 * Figma node 17:118「いなくなった子の情報登録」を pixel-perfect に再現。
 *
 * レイアウト:
 *   ┌─────────────────────────────┐
 *   │ Header（sticky / 固定）      │
 *   ├─────────────────────────────┤
 *   │ ScrollBody（flex-1 / 全域）  │
 *   │  写真 / 種類 / 場所 / 状況   │
 *   │  この子のこと / ご連絡先      │
 *   ├─────────────────────────────┤
 *   │ Footer CTA（固定）           │
 *   └─────────────────────────────┘
 *
 * Props:
 *   onBack       () => void
 *   onSave       (formData) => void
 *   onMapOpen    (cb) => void      — 地図ピッカー起動
 *   initialData  object
 */
import { useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import {
  PrimaryButton,
  FormField,
  FormTextarea,
  RadioGroup,
  PhotoUploadGrid,
} from './ui';

// ── 初期値 ──────────────────────────────────────────────────────────────────
const EMPTY = {
  images:      [null, null, null],
  type:        '犬',
  otherType:   '',
  name:        '',
  breed:       '',
  gender:      '',
  age:         '',
  color:       '',
  size:        '',
  collar:      '',
  lostDate:    '',
  lostDateRaw: '',
  lostLocation:'',
  lostLat:     null,
  lostLng:     null,
  features:    '',
  memo:        '',
  ownerName:   '',
  contact:     '',
  email:       '',
};

const ANIMAL_OPTIONS = ['犬', '猫', '鳥', 'その他'];

// ── セクション見出し ─────────────────────────────────────────────────────────
function SectionHeading({ children, className = '' }) {
  return (
    <h2 className={`font-ui text-ui-md font-bold text-brand-dark mb-[14px] ${className}`}>
      {children}
    </h2>
  );
}

// ── セクション区切り線 ────────────────────────────────────────────────────────
function Divider({ className = '' }) {
  return <div className={`h-px bg-brand-sand-mid -mx-5 ${className}`} />;
}

// ── 選択済み場所 ─────────────────────────────────────────────────────────────
function LocationSelected({ address, onClear }) {
  return (
    <div className="flex items-center gap-2.5 px-[14px] py-3 bg-brand-red/5 border-[1.5px] border-brand-red/20 rounded-input">
      <MapPin size={16} className="text-brand-red flex-shrink-0" />
      <span className="flex-1 font-ui text-ui-caption font-medium text-brand-dark leading-relaxed">
        {address}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="font-ui text-ui-label font-bold text-brand-teal bg-transparent border-none cursor-pointer flex-shrink-0 py-1"
      >
        変更
      </button>
    </div>
  );
}

// ── メイン ───────────────────────────────────────────────────────────────────
export default function PetRegistrationScreen({
  onBack,
  onSave,
  onMapOpen,
  initialData,
}) {
  const [form, setForm]           = useState({ ...EMPTY, ...(initialData || {}) });
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const isOtherType = !['犬', '猫', '鳥'].includes(form.type);
  const canSave     = form.name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 300));
    onSave?.({
      ...form,
      type: isOtherType ? (form.otherType.trim() || 'その他') : form.type,
    });
  };

  const handleMapOpen = () => {
    onMapOpen?.((lat, lng, address) => {
      set('lostLat', lat);
      set('lostLng', lng);
      set('lostLocation', address);
    });
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface overflow-hidden">

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div
        className="bg-white border-b border-brand-sand-mid flex-shrink-0 z-10"
        style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
      >
        <div className="flex items-center gap-2 px-5 py-[14px] relative">
          {/* 戻るボタン */}
          <button
            type="button"
            onClick={onBack}
            aria-label="戻る"
            className={[
              'flex items-center justify-center w-8 h-8 rounded-full -ml-1.5',
              'bg-transparent border-none cursor-pointer flex-shrink-0',
              'text-brand-teal transition-colors duration-150',
              'hover:bg-brand-teal/10',
            ].join(' ')}
          >
            <ChevronLeft size={22} />
          </button>

          {/* タイトル（中央寄せ） */}
          <h1 className="flex-1 text-center font-ui text-[17px] font-bold text-brand-dark leading-[22px] tracking-[0.2px] m-0">
            いなくなった子の情報登録
          </h1>

          {/* スペーサー（左ボタンと対称） */}
          <div className="w-8 flex-shrink-0" />
        </div>
      </div>

      {/* ══ SCROLL BODY ═════════════════════════════════════════════ */}
      <div className="prs-scroll flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch] scrollbar-none bg-brand-surface">

        {/* ① この子のこと（お名前 / 写真 / 種類 / 詳細） ─────────── */}
        <section className="bg-white px-5 pt-5 pb-5 mt-0">
          <SectionHeading>この子のこと</SectionHeading>

          {/* お名前 */}
          <FormField
            label="お名前"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="ポチ"
          />

          <Divider className="my-5" />

          {/* 写真 */}
          <p className="block font-ui text-ui-label font-bold tracking-[0.2px] mb-1.5 text-brand-label">写真</p>
          <PhotoUploadGrid
            images={form.images}
            onChange={imgs => set('images', imgs)}
            max={2}
            hint="※最低1枚必須"
          />

          <Divider className="my-5" />

          {/* 種類 */}
          <p className="block font-ui text-ui-label font-bold tracking-[0.2px] mb-1.5 text-brand-label">種類</p>
          <RadioGroup
            variant="radio"
            name="pet-type"
            options={ANIMAL_OPTIONS}
            value={isOtherType ? 'その他' : form.type}
            onChange={val => {
              if (val === 'その他') {
                set('type', '');
              } else {
                set('type', val);
                set('otherType', '');
              }
            }}
            otherLabel="その他"
            otherValue={form.otherType}
            onOtherChange={val => set('otherType', val)}
            otherPlaceholder="うさぎ等"
          />

          <Divider className="my-5" />

          {/* 品種・性別・年齢・毛色・大きさ */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
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

          {/* 首輪・タグ */}
          <FormField
            label="首輪・タグの特徴"
            value={form.collar}
            onChange={e => set('collar', e.target.value)}
            placeholder="赤い首輪、迷子札あり"
            className="mb-2.5"
          />

          {/* 見た目の特徴 */}
          <FormTextarea
            label="見た目の特徴・性格"
            value={form.features}
            onChange={e => set('features', e.target.value)}
            placeholder="左耳に小さな傷跡あり、人懐っこい性格です"
            rows={3}
            maxLength={200}
          />
        </section>

        {/* ⑤ いなくなった時のこと（日・場所・状況） ──────────────── */}
        <section className="bg-white px-5 pt-5 pb-5 mt-3">
          <SectionHeading>いなくなった時のこと</SectionHeading>

          {/* いなくなった日 */}
          <FormField
            label="いなくなった日"
            type="date"
            value={form.lostDateRaw}
            onChange={e => {
              set('lostDateRaw', e.target.value);
              const [y, m, d] = e.target.value.split('-');
              if (y && m && d) set('lostDate', `${y}年${parseInt(m)}月${parseInt(d)}日`);
            }}
            className="mb-5"
          />

          <Divider className="mb-5" />

          {/* いなくなった場所 */}
          <p className="block font-ui text-ui-label font-bold tracking-[0.2px] mb-1.5 text-brand-label">いなくなった場所</p>
          {form.lostLocation ? (
            <LocationSelected
              address={form.lostLocation}
              onClear={() => { set('lostLocation', ''); set('lostLat', null); set('lostLng', null); }}
            />
          ) : (
            <PrimaryButton variant="outline" onClick={handleMapOpen}>
              地図を開いて場所を選択
            </PrimaryButton>
          )}
          <p className="font-ui text-ui-label font-normal text-brand-muted mt-2 mb-5 leading-relaxed tracking-[0.1px]">
            選択された住所が入ります。未選択の場合は非表示。
          </p>

          <Divider className="mb-5" />

          {/* いなくなった状況 */}
          <FormTextarea
            label="いなくなった状況"
            value={form.memo}
            onChange={e => set('memo', e.target.value)}
            placeholder="いなくなった時の状況を入力"
            rows={4}
            maxLength={300}
          />
        </section>

        <Divider />

        {/* ⑥ ご連絡先 ─────────────────────────────────────────────── */}
        <section className="bg-white px-5 pt-5 pb-5">
          <SectionHeading>ご連絡先</SectionHeading>
          <p className="font-ui text-ui-label font-normal text-brand-muted mb-[14px] leading-relaxed">
            目撃情報が届いたとき、こちらにご連絡します。
          </p>
          <div className="flex flex-col gap-2.5">
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
        </section>

        {/* 必須メモ */}
        <div className="bg-white px-5 py-3 text-center">
          <p className="font-ui text-ui-label font-normal text-brand-muted">
            * は必須項目です。登録後もいつでも編集できます。
          </p>
        </div>

        {/* iOS safe-area 下余白 */}
        <div className="bg-white" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>

      {/* ══ FOOTER CTA ══════════════════════════════════════════════ */}
      <div
        className="bg-white border-t border-brand-sand-mid pt-3 px-5 flex-shrink-0"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        {!canSave && (
          <p className="font-ui text-[12px] font-semibold text-brand-cta text-center mb-2">
            「この子のこと」にお名前を入力してください
          </p>
        )}
        <PrimaryButton
          variant="full"
          disabled={!canSave}
          loading={submitting}
          onClick={handleSave}
        >
          {submitting ? '登録中…' : '登録し捜索を始める'}
        </PrimaryButton>
      </div>

    </div>
  );
}
