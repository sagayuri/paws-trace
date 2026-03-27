import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import {
  Map as MapIcon, FileText, Target, Plus, Camera,
  CheckCircle2, Circle, X, MapPin, Image as ImageIcon,
  Download, Printer, Trash2, ChevronRight, FileDown, ClipboardList, Share2, ChevronLeft, Calendar,
  ChevronUp, ChevronDown, CircleAlert, Crosshair, Clock,
} from 'lucide-react';
import { colors, typography, FIGMA_PAWS, PAW_ANIM_ORDER } from './tokens';
import PawTraceLogo from './components/PawTraceLogo';
import MapPinIcon from './components/icons/MapPinIcon';
import MissingPosterIcon from './components/icons/MissingPosterIcon';
import PawPrintIcon from './components/icons/PawPrintIcon';
import NoteIcon from './components/icons/NoteIcon';
// LostPetRegistrationModal and PetRegistrationScreen replaced by unified FlyerEditModal

const GMAPS_LIBRARIES = []; // stable reference — avoids re-load warning
const GMAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ─── Datetime helpers ─────────────────────────────────────────────────────────
const fmtDatetime = (val) => {
  if (!val) return '';
  if (!val.includes('T')) return val;
  const d = new Date(val);
  if (isNaN(d)) return val;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Storage ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'pawstrace_v3';

const EMPTY_PET_DATA = {
  name: '', type: '犬', breed: '', gender: '', age: '', color: '',
  size: '', collar: '', features: '', lostDate: '', lostLocation: '',
  lostLat: null, lostLng: null,
  memo: '', ownerName: '', contact: '', email: '', images: [null, null],
};

const INITIAL_PET_DATA = {
  name: 'コタロウ', type: '犬', breed: '柴犬',
  gender: 'オス（去勢済）', age: '5歳', color: '茶色',
  size: '60cm 約15kg の中型', collar: '緑と赤の三角模様',
  features: '右耳に傷跡があります。人懐っこい性格です。',
  lostDate: '2019年4月1日', lostLocation: '大阪市北区●●●●●',
  lostLat: 34.7055, lostLng: 135.5015,
  memo: '人見知りで自分からはあまり近寄って来ません。同じ場所でぐるぐる回る癖があります。あまりほえずに静かです。目撃した場所をご連絡ください！',
  ownerName: 'ササキ', contact: '080-0000-1234',
  email: 'zaqwsxedc_o@mail.com', images: [null, null],
};

const INITIAL_SIGHTINGS = [
  { id: 1, lat: 34.7055, lng: 135.5015, time: '14:30', address: '大阪市北区中津1丁目', note: '北に向かって走っていた', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, lat: 34.7080, lng: 135.5040, time: '15:15', address: '大阪市北区芝田付近',  note: '路地裏でじっとしていました', createdAt: new Date(Date.now() - 1800000).toISOString() },
];

const INITIAL_AREAS = [
  { id: 101, name: '中津駅 周辺',        status: '確認済み', time: '1時間前', note: '付近の店舗へ聞き込み完了。有力情報なし。', lat: 34.7037, lng: 135.4983 },
  { id: 102, name: '芝田・ヨドバシ裏',    status: '捜索中',   time: '現在',   note: 'ボランティア2名で捜索中。',               lat: 34.7048, lng: 135.5006 },
  { id: 103, name: '豊崎2丁目 住宅街',    status: '未着手',   time: '-',     note: '',                                    lat: 34.7120, lng: 135.5008 },
];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.registered === undefined) parsed.registered = !!(parsed.petData?.name);
      return parsed;
    }
  } catch {}
  return { registered: false, petData: EMPTY_PET_DATA, sightings: [], areas: [] };
}
function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ─── Google Maps icon helpers ─────────────────────────────────────────────────
// Status colors: 未着手=slate, 捜索中=blue, 確認済み=green, 発見=amber
const AREA_STATUS_STYLE = {
  '未着手':  { bg: '#94A3B8', symbol: '–',  badge: 'bg-slate-100 text-slate-500' },
  '捜索中':  { bg: '#3B82F6', symbol: '▶', badge: 'bg-blue-100  text-blue-600'  },
  '確認済み': { bg: '#22C55E', symbol: '✓',  badge: 'bg-green-100 text-green-600' },
  '発見':    { bg: '#F59E0B', symbol: '★',  badge: 'bg-amber-100 text-amber-600' },
};

// ── Figma node 25-605 準拠ピン SVG パーツ ──
// ティアドロップ本体（Figma path 正規化: 25.53×34 viewBox）
const PIN_TEARDROP = 'M25.527 12.763C25.527 5.715 19.813 0 12.763 0C5.697 0 0.003 5.69 0 12.757C-0.002 17.165 2.232 21.053 5.629 23.347C8.279 25.136 10.634 27.325 12.685 29.777L12.764 29.872L13.033 29.55C15.005 27.192 17.278 25.095 19.836 23.39C23.268 21.102 25.528 17.197 25.528 12.764L25.527 12.763Z';
const PIN_CIRCLE   = 'M12.763 20.949C17.455 20.949 21.258 17.146 21.258 12.454C21.258 7.763 17.455 3.96 12.763 3.96C8.072 3.96 4.269 7.763 4.269 12.454C4.269 17.146 8.072 20.949 12.763 20.949Z';
const PIN_DOT      = 'M14.184 32.871C14.369 32.087 13.883 31.3 13.099 31.115C12.314 30.93 11.528 31.416 11.342 32.201C11.157 32.985 11.643 33.772 12.428 33.957C13.213 34.142 13.999 33.656 14.184 32.871Z';

// 失踪場所ピン — 赤いティアドロップ（大きめ・「失」表示）Figma準拠
function mkLostIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="35" viewBox="0 0 26 35"><path d="${PIN_TEARDROP}" fill="#D97757"/><path d="${PIN_CIRCLE}" fill="white"/><path d="${PIN_DOT}" fill="#D97757"/><text x="12.76" y="16" text-anchor="middle" font-size="11" font-weight="900" fill="#D97757" font-family="sans-serif">\u5931</text></svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(36, 48),
    anchor: new window.google.maps.Point(18, 43),
  };
}

// 目撃情報ピン — 赤いティアドロップ・番号表示（1-10）Figma node 25-605 完全準拠
function mkSightingIcon(num) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="35" viewBox="0 0 26 35"><path d="${PIN_TEARDROP}" fill="#D97757"/><path d="${PIN_CIRCLE}" fill="white"/><path d="${PIN_DOT}" fill="#D97757"/><text x="12.76" y="${num >= 10 ? '15' : '16'}" text-anchor="middle" font-size="${num >= 10 ? '9' : '11'}" font-weight="900" fill="#D97757" font-family="sans-serif">${num}</text></svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(30, 40),
    anchor: new window.google.maps.Point(15, 36),
  };
}

// マップタップ時の仮ピン — グレー #D6D3D0
function mkTapIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="35" viewBox="0 0 26 35"><path d="${PIN_TEARDROP}" fill="#D6D3D0"/><path d="${PIN_CIRCLE}" fill="white"/><path d="${PIN_DOT}" fill="#D6D3D0"/><text x="12.76" y="16" text-anchor="middle" font-size="11" font-weight="900" fill="#D6D3D0" font-family="sans-serif">+</text></svg>`;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(30, 40),
    anchor: new window.google.maps.Point(15, 36),
  };
}

function mkAreaIcon(status, num) {
  const { symbol } = AREA_STATUS_STYLE[status] || AREA_STATUS_STYLE['未着手'];
  const label = num != null ? num : symbol;
  const AREA_COLOR = '#406D1F';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="35" viewBox="0 0 26 35"><path d="${PIN_TEARDROP}" fill="${AREA_COLOR}"/><path d="${PIN_CIRCLE}" fill="white"/><path d="${PIN_DOT}" fill="${AREA_COLOR}"/><text x="12.76" y="16" text-anchor="middle" font-size="11" font-weight="900" fill="${AREA_COLOR}" font-family="sans-serif">${label}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(30, 40),
    anchor: new window.google.maps.Point(15, 36),
  };
}

// ─── Google Maps options ──────────────────────────────────────────────────────
const MAP_OPTIONS = {
  gestureHandling: 'greedy',
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

// ─── Logo / decoration ────────────────────────────────────────────────────────
const LogoIcon = () => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
    <path d="M5 12C5 8 8 5 12 5C16 5 19 8 19 12" stroke="#73351F" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9"  cy="15" r="3" stroke="#73351F" strokeWidth="1.2"/>
    <circle cx="15" cy="15" r="3" stroke="#73351F" strokeWidth="1.2"/>
    <path d="M10 15H14" stroke="#73351F" strokeWidth="1"/>
    <path d="M6 8L8 6M18 8L16 6" stroke="#73351F" strokeWidth="1.2"/>
  </svg>
);
const MissingFamilyLogo = () => (
  <div className="flex items-center gap-1"><LogoIcon /><LogoIcon /></div>
);
const PawPrint = ({ className, fill = '#A65A2E', style }) => (
  <svg viewBox="0 0 24 24" className={className} fill={fill} style={style}>
    {/* Main pad – wider oval */}
    <ellipse cx="12" cy="16.5" rx="4.8" ry="4.2"/>
    {/* 4 toe pads */}
    <ellipse cx="5.5"  cy="9.5" rx="2.1" ry="2.6"/>
    <ellipse cx="9.5"  cy="6.5" rx="2.1" ry="2.6"/>
    <ellipse cx="14.5" cy="6.5" rx="2.1" ry="2.6"/>
    <ellipse cx="18.5" cy="9.5" rx="2.1" ry="2.6"/>
  </svg>
);

// ─── Brand icon mark (Adventure Experiment style geometric paw) ───────────────
const PawTraceIconMark = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer circle border */}
    <circle cx="50" cy="50" r="46" stroke="#3A8B8B" strokeWidth="2.5"/>
    {/* Dog silhouette - larger, back-left */}
    <ellipse cx="41" cy="70" rx="19" ry="13" fill="#3A8B8B"/>
    <circle cx="37" cy="49" r="13.5" fill="#3A8B8B"/>
    {/* Dog floppy ears */}
    <ellipse cx="26.5" cy="42" rx="5.5" ry="9" fill="#3A8B8B" transform="rotate(-12 26.5 42)"/>
    <ellipse cx="47" cy="41" rx="5" ry="8" fill="#3A8B8B" transform="rotate(18 47 41)"/>
    {/* Cat silhouette - smaller, front-right */}
    <ellipse cx="65" cy="73" rx="12" ry="9.5" fill="#3A8B8B"/>
    <circle cx="67" cy="56" r="9.5" fill="#3A8B8B"/>
    {/* Cat pointy ears */}
    <polygon points="60,52 63,40 67,52" fill="#3A8B8B"/>
    <polygon points="67,52 71,40 74,52" fill="#3A8B8B"/>
    {/* Subtle depth separator */}
    <ellipse cx="53" cy="63" rx="2" ry="10" fill="#F2D3AC" opacity="0.45"/>
  </svg>
);

// ─── Flyer Preview ────────────────────────────────────────────────────────────
const DAY_NAMES_JP = ['日', '月', '火', '水', '木', '金', '土'];
const formatFlyerDate = (dateStr) => {
  if (!dateStr) return '{発生日}';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES_JP[d.getDay()]})`;
};

const FlyerPreview = ({ petData }) => (
  <div className="w-full aspect-[210/297] bg-[#E6D6B5] flex flex-col overflow-hidden" style={{ fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' }}>
    {/* Header banner */}
    <div className="bg-[#22807F] py-3 px-4 text-center">
      <h1 className="text-[28px] font-black text-white tracking-[4px]">{petData.type || '犬'}を探しています</h1>
    </div>

    {/* Body area */}
    <div className="bg-[#ECE2CE] flex-1 flex flex-col">
      {/* Photos — 1 photo full width, 2 photos side-by-side */}
      {(() => {
        const filled = petData.images.filter(Boolean);
        const count = filled.length;
        return (
          <div className={`grid ${count <= 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 px-3 pt-3`}>
            {count === 0 ? (
              <div className="aspect-[4/3] bg-[#FCF1D8] rounded-lg" />
            ) : filled.map((src, i) => (
              <div key={i} className={`${count === 1 ? 'aspect-[4/3]' : 'aspect-[4/5]'} bg-[#FCF1D8] rounded-lg overflow-hidden`}>
                <img src={src} className="w-full h-full object-cover" alt=""/>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Date & location */}
      <div className="px-3 pt-2 flex items-baseline gap-2">
        <span className="text-[14px] font-bold text-[#1A2E2D] whitespace-nowrap">{formatFlyerDate(petData.lostDate)}</span>
        <span className="text-[12px] font-bold text-[#1A2E2D] flex-1">{petData.lostLocation || '{住所}'}</span>
      </div>
      <div className="px-3 text-right">
        <span className="text-[12px] font-bold text-[#1A2E2D]">付近で行方不明</span>
      </div>

      {/* Info heading */}
      <div className="px-3 pt-1.5">
        <div className="text-[12px] font-bold text-[#22807F] border-b-2 border-[#22807F]/50 pb-0.5 mb-1.5">情報</div>
      </div>

      {/* Info grid + features side by side */}
      <div className="px-3 grid grid-cols-2 gap-2 flex-1">
        {/* Left: pet details */}
        <div className="text-[9px] text-[#1A2E2D] leading-relaxed space-y-0.5">
          <div className="flex"><span className="text-[#1A2E2D]/60 w-8 shrink-0">名前：</span><span className="font-bold">{petData.name || '—'}</span></div>
          <div className="flex"><span className="text-[#1A2E2D]/60 w-8 shrink-0">種類：</span><span className="font-bold">{petData.type}{petData.breed ? `／${petData.breed}` : ''}</span></div>
          <div className="flex gap-2">
            <span><span className="text-[#1A2E2D]/60">毛色：</span><span className="font-bold">{petData.color || '—'}</span></span>
            <span><span className="text-[#1A2E2D]/60">性別：</span><span className="font-bold">{petData.gender || '—'}</span></span>
          </div>
          <div className="flex"><span className="text-[#1A2E2D]/60 w-8 shrink-0">首輪：</span><span className="font-bold">{petData.collar || '—'}</span></div>
        </div>

        {/* Right: features / circumstances */}
        <div>
          <div className="text-[9px] font-bold text-[#1A2E2D] mb-0.5">特徴・いなくなった経緯</div>
          <div className="border border-[#22807F] rounded px-1.5 py-1 text-[8px] text-[#1A2E2D] leading-relaxed min-h-[60px] whitespace-pre-wrap">
            {[petData.features, petData.memo].filter(Boolean).join('\n') || ''}
          </div>
        </div>
      </div>
    </div>

    {/* Contact footer */}
    <div className="bg-[#22807F] py-2.5 px-3 flex items-center gap-2">
      <span className="text-[12px] font-bold text-white whitespace-nowrap">連絡先</span>
      <div className="flex-1">
        <div className="text-[16px] font-black text-white tracking-wide">{petData.contact || 'XXX-XXXX-XXXX'}</div>
        {petData.email && <div className="text-[9px] text-white/90">{petData.email}</div>}
      </div>
      <span className="text-[14px] font-bold text-white whitespace-nowrap">{petData.ownerName || '飼主 太郎'}</span>
    </div>
  </div>
);

// ─── Crop Modal ───────────────────────────────────────────────────────────────
const CropModal = ({ src, onCrop, onCancel }) => {
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
  const imgTop = (containerSize.h - imgH) / 2 + cy;
  const cropLeft = (containerSize.w - CROP_SIZE) / 2;
  const cropTop = (containerSize.h - CROP_SIZE) / 2;

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
      const sy = (cropTop - imgTop) / scale;
      const sw = CROP_SIZE / scale;
      ctx.drawImage(img, sx, sy, sw, sw, 0, 0, OUT, OUT);
      onCrop(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = src;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col select-none">
      <div className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0">
        <button onClick={onCancel} className="text-white/70 text-[15px] font-medium">キャンセル</button>
        <span className="text-white font-semibold text-[15px]">写真を切り取る</span>
        <button onClick={handleCrop} className="relative z-10 text-[#73351F] font-bold text-[16px] opacity-100">完了</button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onMouseMove={e => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
      >
        {containerSize.w > 0 && (
          <>
            <img
              src={src}
              onLoad={e => setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
              draggable={false}
              style={{ position: 'absolute', width: imgW, height: imgH, left: imgLeft, top: imgTop, pointerEvents: 'none', userSelect: 'none' }}
            />
            <div style={{
              position: 'absolute', left: cropLeft, top: cropTop,
              width: CROP_SIZE, height: CROP_SIZE,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: 12, pointerEvents: 'none',
            }}/>
          </>
        )}
      </div>
      <div className="shrink-0 pt-3 pb-8 text-center">
        <p className="text-white/40 text-[13px]">ドラッグして位置を調整</p>
      </div>
    </div>
  );
};

// ─── Onboarding Screen ───────────────────────────────────────────────────────
const OnboardingScreen = ({ onComplete, isLoaded }) => {
  const [step, setStep] = useState('landing'); // 'landing' | 'form' | 'locationMap'
  const [form, setForm] = useState({ ...EMPTY_PET_DATA });
  const [pawStep, setPawStep] = useState(0);
  useEffect(() => {
    if (step !== 'landing') return;
    setPawStep(0);
    let count = 0;
    const iv = setInterval(() => {
      count++;
      setPawStep(count);
      if (count >= PAW_ANIM_ORDER.length) clearInterval(iv);
    }, 167);
    return () => clearInterval(iv);
  }, [step]);
  const [locationPin, setLocationPin] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const locationMapRef = useRef(null);

  const handleLocationMapClick = async (latlng) => {
    setLocationPin(latlng);
    setIsGeocoding(true);
    setLocationAddress('住所を取得中…');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=ja`,
        { headers: { 'Accept-Language': 'ja' } }
      );
      const json = await res.json();
      const a = json.address || {};
      const parts = [
        a.state,
        a.city || a.town || a.village,
        a.city_district,
        a.suburb,
        a.quarter || a.neighbourhood,
        a.road,
        a.house_number,
      ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
      setLocationAddress(parts.join('') || json.display_name || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    } catch {
      setLocationAddress(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationSearch = () => {
    if (!locationSearchQuery.trim() || !window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: locationSearchQuery, language: 'ja', region: 'JP' }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        const latlng = { lat: loc.lat(), lng: loc.lng() };
        locationMapRef.current?.panTo(latlng);
        locationMapRef.current?.setZoom(17);
        setLocationPin(latlng);
        // Google の formatted_address から国名・郵便番号を除去
        const formatted = results[0].formatted_address
          .replace(/^日本、/, '')
          .replace(/〒\d{3}-\d{4}\s*/, '');
        setLocationAddress(formatted);
      }
    });
  };

  // ── Landing step ──
  if (step === 'landing') {
    // ─ Paw-print SVG paths (Figma node 8:511, 18×18 local coordinate space) ─
    const PAW_D = [
      // Main pad
      "M3.84859 9.3864C4.44638 9.10272 4.93331 8.64079 5.30937 8.09952C6.03107 7.06045 7.40599 6.24637 9.09936 6.45397C10.7927 6.66156 11.9307 7.78323 12.3796 8.96577C12.6133 9.58095 12.9752 10.1472 13.4861 10.5668C14.4849 11.3852 15.0555 12.7003 14.8849 14.0992C14.6219 16.249 12.7057 17.7837 10.6047 17.5272C10.1569 17.4729 9.73737 17.3403 9.35696 17.1468C8.4081 16.6631 7.30491 16.5284 6.26801 16.7686C5.85173 16.8653 5.41263 16.8914 4.96483 16.837C2.86496 16.5794 1.37483 14.6285 1.63894 12.4775C1.81067 11.0787 2.68236 9.94071 3.84859 9.3864Z",
      // Top-right toe
      "M17.9998 8.05053C18.0423 6.61891 17.1857 5.43191 16.0865 5.39928C14.9873 5.36666 14.0617 6.50077 14.0192 7.93239C13.9767 9.36401 14.8334 10.551 15.9326 10.5836C17.0318 10.6163 17.9574 9.48216 17.9998 8.05053Z",
      // Top-left toe
      "M3.96913 6.70109C4.27351 5.30155 3.64914 3.97755 2.57456 3.74384C1.49998 3.51013 0.382115 4.45523 0.0777347 5.85476C-0.226646 7.25429 0.397724 8.5783 1.4723 8.81201C2.54688 9.04571 3.66475 8.10062 3.96913 6.70109Z",
      // Upper-right toe
      "M14.1421 3.27035C14.1845 1.83873 13.3279 0.651722 12.2287 0.619098C11.1295 0.586474 10.2039 1.72059 10.1614 3.15221C10.119 4.58383 10.9756 5.77083 12.0748 5.80346C13.174 5.83608 14.0996 4.70197 14.1421 3.27035Z",
      // Upper-left toe
      "M8.86487 2.9924C9.16925 1.59286 8.54488 0.268857 7.4703 0.0351502C6.39572 -0.198557 5.27785 0.746533 4.97347 2.14607C4.66909 3.5456 5.29346 4.86961 6.36804 5.10331C7.44262 5.33702 8.56049 4.39193 8.86487 2.9924Z",
    ];

    // ─ Shared typography style helper ─
    const uiFont = typography.fontFamily.ui;

    return (
      <>
      {/* ── Outer: beige background, fills screen ── */}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: colors.brand.sand }}>

        {/*
          ══════════════════════════════════════════════════════
          SVG BACKGROUND LAYER
          viewBox="0 0 390 844" matches the Figma frame exactly.
          preserveAspectRatio="xMidYMid slice" fills the screen
          without black bars (crops symmetrically on tall screens).
          Contains:
            1. White surface area (wave path — exact Figma trace)
            2. 12 paw prints at exact Figma clipPath positions
          ══════════════════════════════════════════════════════
        */}
        <svg
          viewBox="0 0 390 844"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          {/* ── Wave / white area ── */}
          {/*
            Exact Figma path from node 8:471 "Vector 4", SVG export 390×844px.
            Wave top ranges from y=418.78 (right) to y=491.58 (left).
          */}
          <path
            d="M-13.7877 855.839V491.578C70.0345 447.696 146.436 500.48 212.663 491.578C278.889 482.676 320.704 437.697 419.033 418.78V855.839H-13.7877Z"
            fill={colors.brand.surface}
          />

          {/* ── 12 Paw prints ── */}
          {/*
            Positions from Figma clipPath defs (frame SVG defs section).
            transform="translate(x y) rotate(r)" places local 18×18 paths
            at the exact frame coordinates verified against Figma paths.
          */}
          {FIGMA_PAWS.map((p, i) => (
            <g
              key={i}
              transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}
              style={{
                opacity: PAW_ANIM_ORDER.slice(0, pawStep).includes(i) ? 1 : 0,
                transition: 'opacity 0.3s ease-out',
              }}
            >
              {PAW_D.map((d, j) => (
                <path key={j} d={d} fill={colors.brand.teal} />
              ))}
            </g>
          ))}
        </svg>

        {/*
          ══════════════════════════════════════════════════════
          CONTENT OVERLAY
          All elements positioned using top/left derived from
          Figma 390×844 pixel coordinates:
            top  = figma_y / 844 * 100 + '%'
            left = figma_x (px, direct)
          ══════════════════════════════════════════════════════
        */}

        {/* ── ロゴ (PawTraceLogo — Figma node 11:2) ── */}
        {/*
          Logo bounding box in Figma 390×844 frame:
            circle top:   y=169.44 → 20.08%
            logo bottom:  y=350    → 41.47%  (circle 115px + PAW TRACE 23px + tagline 13px + gaps)
            left:         x=102.5  centered at x=194.5
          Width 185px = exact width of PAW TRACE lettering span (x=97–282)
        */}
        <div
          style={{
            position: 'absolute',
            top: '20.08%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '185px',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <PawTraceLogo color={colors.brand.teal} width={185} />
        </div>

        {/* ── White area: Features + CTA (Figma node 21-11) ── */}
        {/*
          Flex column in white surface (below wave top ≈55%).
          space-between distributes Features and CTA regardless of screen height.
          Feature 1: gap 9.5px (Figma node 8-470)
          Feature 2: gap 14px  (Figma node 8-470 comment: 155-101-40=14)
        */}
        <div
          style={{
            position: 'absolute',
            top: '57%',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: '24px',
            paddingLeft: '23.5px',
            paddingRight: '23.5px',
            paddingTop: '8px',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
          }}
        >
          {/* Feature 1: 目撃情報を一括管理 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9.5px' }}>
            <div style={{ flexShrink: 0, width: 40, height: 40 }}>
              <MapPinIcon size={40} />
            </div>
            <div>
              <p style={{
                ...typography.styles.uiLarge,
                fontFamily: uiFont,
                color: colors.brand.dark,
                margin: 0,
              }}>
                目撃情報を一括管理
              </p>
              <p style={{
                ...typography.styles.uiBody,
                fontFamily: uiFont,
                color: colors.brand.dark,
                margin: 0,
                marginTop: '4px',
              }}>
                様々な媒体から得た目撃情報を<br />地図上にまとめます
              </p>
            </div>
          </div>

          {/* Feature 2: 捜索用チラシ自動生成 */}
          {/* Figma node 8-686: icon x=101px in frame → offset = 101 - 23.5(container pad) = 77.5px */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingLeft: '77.5px' }}>
            <div style={{ flexShrink: 0, width: 40, height: 40 }}>
              <MissingPosterIcon size={40} />
            </div>
            <div>
              <p style={{
                ...typography.styles.uiMedium,
                fontFamily: uiFont,
                color: colors.brand.dark,
                margin: 0,
              }}>
                捜索用チラシ自動生成
              </p>
              <p style={{
                ...typography.styles.uiBody,
                fontFamily: uiFont,
                color: colors.brand.dark,
                margin: 0,
                marginTop: '4px',
              }}>
                項目に記載するだけでチラシを<br />自動生成。
              </p>
            </div>
          </div>

          {/* CTA ボタン — Figma: rx=8, fill=#22807F, 56px tall */}
          <button
            onClick={() => setStep('form')}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '8px',
              background: colors.brand.cta,
              color: '#FFFFFF',
              fontFamily: uiFont,
              ...typography.styles.uiMedium,
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '0.32px',
              flexShrink: 0,
            }}
          >
            搜索をはじめる
          </button>
        </div>
      </div>
      </>
    );
  }

  // ── Form step（FlyerEditModal fullscreen を使用、地図はオーバーレイ表示） ──
  return (
    <div className="relative h-full">
      <FlyerEditModal
        isOpen={true}
        variant="fullscreen"
        petData={form}
        setPetData={setForm}
        onBack={() => setStep('landing')}
        onSave={(formData) => {
          setForm(f => ({ ...f, ...formData }));
          onComplete({ ...form, ...formData });
        }}
        onMapOpen={(cb) => {
          setStep('locationMap');
          window.__mapPickerCallback = cb;
        }}
      />

      {/* 地図ピッカー — フォームの上にオーバーレイ（フォームはアンマウントしない） */}
      {step === 'locationMap' && (
        <div className="absolute inset-0 z-50 overflow-hidden bg-slate-100">
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-cta border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              center={locationPin || { lat: 34.7055, lng: 135.5015 }}
              zoom={15}
              options={MAP_OPTIONS}
              onLoad={map => { locationMapRef.current = map; }}
              onClick={(e) => handleLocationMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
            >
              {locationPin && <Marker position={locationPin}/>}
            </GoogleMap>
          )}

          {/* 戻るボタン */}
          <button
            onClick={() => setStep('form')}
            className="absolute top-12 left-4 z-10 bg-white w-10 h-10 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-[#1C1C1E]"/>
          </button>

          {/* 検索バー */}
          <div className="absolute top-12 left-16 right-4 z-10">
            <div className="bg-white rounded-2xl shadow-md flex items-center px-3 gap-2">
              <input
                type="text"
                placeholder="場所を検索…"
                className="flex-1 py-3 text-[14px] font-medium outline-none text-[#1C1C1E] bg-transparent"
                value={locationSearchQuery}
                onChange={e => setLocationSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLocationSearch()}
              />
              <button onClick={handleLocationSearch} className="text-brand-cta shrink-0 p-1">
                <MapPin className="w-5 h-5"/>
              </button>
            </div>
            {!locationPin && (
              <p className="text-[11px] text-white font-semibold text-center mt-2 drop-shadow">
                地図をタップして失踪場所を選択
              </p>
            )}
          </div>

          {/* 選択確認パネル */}
          {locationPin && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-xl px-4 pt-4 pb-6">
              <div className="w-8 h-1 bg-[#C6C6C8] rounded-full mx-auto mb-4"/>
              <p className="text-[13px] text-[#8E8E93] font-medium mb-1">選択中の場所</p>
              <p className="text-[15px] text-[#1C1C1E] font-semibold mb-4 leading-snug">
                {isGeocoding ? '住所を取得中…' : locationAddress}
              </p>
              <button
                onClick={() => {
                  if (typeof window.__mapPickerCallback === 'function') {
                    window.__mapPickerCallback(locationPin.lat, locationPin.lng, locationAddress);
                    window.__mapPickerCallback = null;
                  }
                  setStep('form');
                }}
                disabled={isGeocoding}
                className="w-full bg-brand-cta disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold text-[15px] active:scale-95 transition-all"
              >
                この場所を選択
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Date Picker (Material-inspired, brand トンマナ) ──────────────────────────
const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];

const DatePickerField = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const isSelected = (day) => {
    if (!parsed) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  };
  const isToday = (day) => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  const displayValue = parsed
    ? `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日 (${WEEKDAY_JP[parsed.getDay()]})`
    : '';

  return (
    <div className="col-span-2 relative">
      {label && <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium text-left text-[#1C1C1E] flex items-center gap-2"
      >
        <Calendar className="w-4 h-4 text-[#22807F] shrink-0"/>
        <span className={displayValue ? '' : 'text-[#C6C6C8]'}>{displayValue || '日付を選択'}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#ECE2CE] overflow-hidden w-[320px]" onClick={e => e.stopPropagation()} style={{ fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", sans-serif' }}>
          {/* Header */}
          <div className="bg-[#E6D6B5] px-4 py-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="p-1 rounded-full hover:bg-white/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#1A2E2D]"/>
            </button>
            <span className="text-[15px] font-bold text-[#1A2E2D]">{viewYear}年 {viewMonth + 1}月</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded-full hover:bg-white/30 transition-colors">
              <ChevronRight className="w-5 h-5 text-[#1A2E2D]"/>
            </button>
          </div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {WEEKDAY_JP.map((d, i) => (
              <div key={d} className={`text-center text-[11px] font-bold py-1 ${i === 0 ? 'text-[#22807F]' : i === 6 ? 'text-[#22807F]' : 'text-[#1A2E2D]/50'}`}>{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`w-9 h-9 rounded-full text-[13px] font-medium transition-all
                      ${isSelected(day) ? 'bg-[#22807F] text-white font-bold shadow-sm' : ''}
                      ${isToday(day) && !isSelected(day) ? 'border-2 border-[#22807F] text-[#22807F] font-bold' : ''}
                      ${!isSelected(day) && !isToday(day) ? 'text-[#1A2E2D] hover:bg-[#E6D6B5]/50' : ''}
                    `}
                  >
                    {day}
                  </button>
                ) : <div className="w-9 h-9"/>}
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="border-t border-[#ECE2CE] px-4 py-2 flex justify-between">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-[12px] font-bold text-[#22807F]">クリア</button>
            <button type="button" onClick={() => selectDay(today.getDate())} className="text-[12px] font-bold text-[#22807F]"
              style={{ display: viewYear === today.getFullYear() && viewMonth === today.getMonth() ? '' : 'none' }}
            >今日</button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FlyerEditModal = ({ isOpen, onClose, petData, setPetData, variant = 'modal', onSave, onMapOpen, onBack }) => {
  const r0 = useRef(null), r1 = useRef(null);
  const fileRefs = [r0, r1];
  const animalOptions = ['犬', '猫', '鳥', 'その他'];
  const [localData, setLocalData] = useState({ ...petData });
  const isOther = !['犬', '猫', '鳥'].includes(localData.type);
  const [cropModal, setCropModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalData({ ...petData });
      setSubmitting(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const setField = (key, val) => setLocalData(d => ({ ...d, [key]: val }));

  const handleImage = (i, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropModal({ index: i, src: reader.result });
    reader.readAsDataURL(file);
  };
  const handleCropDone = (croppedSrc) => {
    const imgs = [...localData.images];
    imgs[cropModal.index] = croppedSrc;
    setLocalData(d => ({ ...d, images: imgs }));
    setCropModal(null);
  };
  const handleMapOpenClick = () => {
    onMapOpen?.((lat, lng, address) => {
      setLocalData(d => ({ ...d, lostLat: lat, lostLng: lng, lostLocation: address }));
    });
  };

  const FIELD_MAX = {
    name: 10, breed: 10, gender: 4, age: 6, color: 8, size: 6,
    collar: 15, lostDate: 12, lostLocation: 20,
    features: 80, memo: 80,
    ownerName: 10, contact: 15, email: 30,
  };
  const canSave = localData.name?.trim().length > 0;

  const handleSave = async () => {
    if (variant === 'fullscreen') {
      if (!canSave) return;
      setSubmitting(true);
      await new Promise(r => setTimeout(r, 300));
      onSave?.(localData);
    } else {
      setPetData(localData);
      onClose();
    }
  };

  const inp = (label, key, col2 = false) => {
    const max = FIELD_MAX[key];
    const val = localData[key] || '';
    return (
      <div className={col2 ? 'col-span-2' : ''}>
        <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 flex justify-between">
          <span>{label}</span>
          {max && <span className={`text-[10px] ${val.length > max ? 'text-red-500 font-bold' : 'text-[#C6C6C8]'}`}>{val.length}/{max}</span>}
        </label>
        <input type="text" maxLength={max} className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium outline-none text-[#1C1C1E]" value={val} onChange={e => setField(key, e.target.value)}/>
      </div>
    );
  };
  const ta = (label, key) => {
    const max = FIELD_MAX[key];
    const val = localData[key] || '';
    return (
      <div className="col-span-2">
        <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 flex justify-between">
          <span>{label}</span>
          {max && <span className={`text-[10px] ${val.length > max ? 'text-red-500 font-bold' : 'text-[#C6C6C8]'}`}>{val.length}/{max}</span>}
        </label>
        <textarea maxLength={max} className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium h-20 outline-none resize-none text-[#1C1C1E]" value={val} onChange={e => setField(key, e.target.value)}/>
      </div>
    );
  };

  // Location field — map picker (when onMapOpen available) or text input
  const locationField = onMapOpen ? (
    <div className="col-span-2">
      <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">失踪場所</label>
      {localData.lostLocation ? (
        <div className="flex items-center gap-2.5 p-3 bg-[#22807F]/5 border-[1.5px] border-[#22807F]/20 rounded-xl">
          <MapPin className="w-4 h-4 text-[#22807F] shrink-0"/>
          <span className="flex-1 text-[13px] font-medium text-[#1C1C1E] leading-relaxed">{localData.lostLocation}</span>
          <button type="button" onClick={handleMapOpenClick} className="text-[11px] font-bold text-[#22807F] bg-transparent border-none cursor-pointer shrink-0">変更</button>
        </div>
      ) : (
        <button type="button" onClick={handleMapOpenClick} className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium text-left text-[#C6C6C8] flex items-center gap-2 border-none cursor-pointer">
          <MapPin className="w-4 h-4 text-[#22807F] shrink-0"/>
          <span>地図を開いて場所を選択</span>
        </button>
      )}
    </div>
  ) : inp('失踪場所', 'lostLocation', true);

  // ── Shared form body ──
  const formBody = (
    <div className="space-y-6">
      <section>
        <h4 className="text-[13px] font-semibold text-[#8E8E93] uppercase mb-3">写真 (最大2枚)</h4>
        <div className="grid grid-cols-2 gap-3">
          {localData.images.slice(0, 2).map((img, i) => (
            <div key={i} className="relative">
              <div onClick={() => fileRefs[i].current.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${img ? 'border-[#22807F]' : 'border-[#ECE2CE] bg-[#FCF1D8]/50 hover:bg-[#E6D6B5]/30'}`}>
                {img ? <img src={img} className="w-full h-full object-cover" alt=""/> : <Camera className="w-6 h-6 text-[#22807F]/40"/>}
                <input type="file" ref={fileRefs[i]} onChange={e => handleImage(i, e)} className="hidden" accept="image/*"/>
              </div>
              {img && <button onClick={() => { const imgs = [...localData.images]; imgs[i] = null; setLocalData(d => ({ ...d, images: imgs })); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-3 h-3"/></button>}
            </div>
          ))}
        </div>
      </section>
      <section>
        <h4 className="text-[13px] font-semibold text-[#8E8E93] uppercase mb-3">基本情報</h4>
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-[#8E8E93] mb-2 block">動物の種類</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {animalOptions.map(opt => (
              <button key={opt} onClick={() => setField('type', opt === 'その他' ? '' : opt)} className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${localData.type === opt || (opt === 'その他' && isOther) ? 'bg-[#22807F] text-white shadow-sm' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>{opt}</button>
            ))}
          </div>
          {isOther && <input type="text" placeholder="ウサギ、フェレットなど" className="w-full p-3 border-2 border-[#22807F] rounded-xl font-bold outline-none" value={localData.type} onChange={e => setField('type', e.target.value)}/>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {inp('名前', 'name')} {inp('品種', 'breed')}
          {inp('性別', 'gender')} {inp('年齢', 'age')}
          {inp('毛色', 'color')} {inp('大きさ', 'size')}
          {inp('首輪', 'collar', true)}
          <DatePickerField label="失踪日" value={localData.lostDate} onChange={v => setField('lostDate', v)}/>
          {locationField}
          {ta('特徴', 'features')}
          {ta('メモ', 'memo')}
        </div>
      </section>
      <section>
        <h4 className="text-[13px] font-semibold text-[#8E8E93] uppercase mb-3">連絡先</h4>
        <div className="grid grid-cols-2 gap-4">
          {inp('飼い主名', 'ownerName')} {inp('電話番号', 'contact')}
          {inp('メールアドレス', 'email', true)}
        </div>
      </section>
    </div>
  );

  const BRAND_FONT = '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif';

  // ── Fullscreen variant (registration) ──
  if (variant === 'fullscreen') {
    return (
      <>
        <div className="flex flex-col h-full bg-white overflow-hidden" style={{ fontFamily: BRAND_FONT }}>
          {/* Header */}
          <div className="bg-[#E6D6B5] border-b border-[#ECE2CE] flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}>
            <div className="flex items-center gap-2 px-5 py-[14px] relative">
              <button type="button" onClick={onBack} aria-label="戻る" className="flex items-center justify-center w-8 h-8 rounded-full -ml-1.5 bg-transparent border-none cursor-pointer shrink-0 text-[#22807F] hover:bg-[#22807F]/10 transition-colors">
                <ChevronLeft className="w-[22px] h-[22px]"/>
              </button>
              <h1 className="flex-1 text-center text-[17px] font-bold text-[#1A2E2D] leading-[22px] tracking-[0.2px] m-0">いなくなった子の情報登録</h1>
              <div className="w-8 shrink-0"/>
            </div>
          </div>
          {/* Scroll body */}
          <div className="flex-1 overflow-y-auto bg-[#FAFAF5] p-6">
            {formBody}
            <p className="text-[11px] text-[#AEAEB2] text-center mt-4">* は必須項目です。登録後もいつでも編集できます。</p>
          </div>
          {/* Footer CTA */}
          <div className="bg-white border-t border-[#ECE2CE] pt-3 px-5 flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
            {!canSave && (
              <p className="text-[12px] font-semibold text-[#22807F] text-center mb-2">お名前を入力してください</p>
            )}
            <button onClick={handleSave} disabled={!canSave || submitting} className="w-full bg-[#22807F] disabled:opacity-40 text-white py-4 rounded-2xl font-bold text-[15px] active:scale-[0.98] transition-all shadow-sm">
              {submitting ? '登録中…' : '登録し捜索を始める'}
            </button>
          </div>
        </div>
        {cropModal && <CropModal src={cropModal.src} onCrop={handleCropDone} onCancel={() => setCropModal(null)}/>}
      </>
    );
  }

  // ── Modal variant (edit) ──
  return (
    <>
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden text-left" style={{ fontFamily: BRAND_FONT }}>
        <div className="px-5 pt-3 pb-4 border-b border-[#ECE2CE] flex justify-between items-center bg-[#E6D6B5]">
          <h3 className="font-bold text-[17px] text-[#1A2E2D]">ポスター情報の編集</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1A2E2D]/10 flex items-center justify-center border-none cursor-pointer"><X className="w-4 h-4 text-[#1A2E2D]"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {formBody}
        </div>
        <div className="px-5 py-4 border-t border-[#ECE2CE]">
          <button onClick={handleSave} className="w-full bg-[#22807F] text-white py-4 rounded-2xl font-bold shadow-sm active:scale-[0.98] transition-all">変更を保存</button>
        </div>
      </div>
    </div>
    {cropModal && <CropModal src={cropModal.src} onCrop={handleCropDone} onCancel={() => setCropModal(null)}/>}
    </>
  );
};

// ─── Add Sighting Modal ───────────────────────────────────────────────────────
const nowDatetime = () => {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 16);
};

const AddSightingModal = ({ isOpen, onClose, onSave, initialAddress, isLoadingAddress }) => {
  const [form, setForm] = useState({ address: '', time: '', note: '', images: [] });
  const [cropModal, setCropModal] = useState(null);
  const imgInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ address: initialAddress || '', time: nowDatetime(), note: '', images: [] });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({ ...prev, address: initialAddress || prev.address }));
    }
  }, [initialAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageAdd = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCropModal({ src: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const handleCropDone = (croppedSrc) => {
    setForm(prev => ({ ...prev, images: [...prev.images, croppedSrc] }));
    setCropModal(null);
  };

  const removeImage = (idx) => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  if (!isOpen) return null;
  return (
    <>
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" style={{ fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' }}>
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header — matches FlyerEditModal */}
        <div className="px-5 pt-3 pb-4 border-b border-[#ECE2CE] flex justify-between items-center bg-[#E6D6B5] shrink-0">
          <h3 className="font-bold text-[17px] text-[#1A2E2D]">目撃情報を登録</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1A2E2D]/10 flex items-center justify-center"><X className="w-4 h-4 text-[#1A2E2D]"/></button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">場所</label>
            <div className="relative">
              {isLoadingAddress
                ? <div className="absolute left-3 top-3.5 w-4 h-4 border-2 border-[#22807F] border-t-transparent rounded-full animate-spin"/>
                : <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#22807F]"/>
              }
              <input type="text" className="w-full pl-9 pr-4 py-3 bg-[#F2F2F7] rounded-xl outline-none text-sm font-medium text-[#1C1C1E]" placeholder={isLoadingAddress ? '住所を取得中…' : '場所を入力'} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">日時</label>
            <div className="space-y-2">
              <div className="flex gap-2 items-stretch">
                <div className="flex-1 min-w-0">
                  <DatePickerField label="" value={form.time?.slice(0, 10) || ''} onChange={dateStr => {
                    const timePart = form.time?.slice(11, 16) || nowDatetime().slice(11, 16);
                    setForm(prev => ({ ...prev, time: dateStr ? `${dateStr}T${timePart}` : '' }));
                  }}/>
                </div>
                <div className="relative shrink-0">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22807F] pointer-events-none"/>
                  <input type="time" className="pl-9 pr-3 py-3 bg-[#F2F2F7] rounded-xl outline-none text-sm font-medium text-[#1C1C1E] w-[115px] h-full [&::-webkit-calendar-picker-indicator]:hidden" value={form.time?.slice(11, 16) || ''} onChange={e => {
                    const datePart = form.time?.slice(0, 10) || nowDatetime().slice(0, 10);
                    setForm(prev => ({ ...prev, time: `${datePart}T${e.target.value}` }));
                  }}/>
                </div>
              </div>
              <button onClick={() => setForm({ ...form, time: nowDatetime() })} className="px-4 py-2.5 text-[13px] font-semibold text-[#22807F] bg-transparent border border-[#22807F] rounded-xl">現在の日時を入力</button>
            </div>
          </div>
          {/* ── 写真アップロード ── */}
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">写真</label>
            <div className="flex gap-2 flex-wrap">
              {form.images.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#ECE2CE] shrink-0">
                  <img src={src} alt="" className="w-full h-full object-cover"/>
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white"/>
                  </button>
                </div>
              ))}
              {form.images.length < 2 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#ECE2CE] flex flex-col items-center justify-center cursor-pointer bg-[#FCF1D8]/50 hover:bg-[#E6D6B5]/30 active:opacity-70 shrink-0 transition-all">
                  <Camera className="w-6 h-6 text-[#22807F]/40 mb-1"/>
                  <span className="text-[10px] font-medium text-[#8E8E93] text-center leading-tight">写真を<br/>追加</span>
                  <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageAdd}/>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">メモ</label>
            <textarea placeholder="状況を入力してください" className="w-full p-3 bg-[#F2F2F7] rounded-xl h-24 outline-none text-sm font-medium resize-none text-[#1C1C1E]" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}/>
          </div>
        </div>
        {/* Footer CTA — matches FlyerEditModal */}
        <div className="px-5 py-4 border-t border-[#ECE2CE] shrink-0">
          <button onClick={() => onSave(form)} className="w-full bg-[#D97757] text-white py-4 rounded-2xl font-bold shadow-sm active:scale-[0.98] transition-all">登録</button>
        </div>
      </div>
    </div>
    {cropModal && <CropModal src={cropModal.src} onCrop={handleCropDone} onCancel={() => setCropModal(null)}/>}
    </>
  );
};

// ─── Area Detail Modal ────────────────────────────────────────────────────────
const AreaDetailModal = ({ area, isOpen, onClose, onUpdate, onDelete }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('未着手');

  useEffect(() => {
    if (area) { setName(area.name || ''); setNote(area.note || ''); setStatus(area.status || '未着手'); }
  }, [area, isOpen]);

  if (!isOpen || !area) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-lg overflow-hidden flex flex-col">
        <div className="px-5 pt-3 pb-4 border-b border-[#C6C6C8]/40 flex justify-between items-center">
          <h3 className="font-semibold text-[17px] text-[#1C1C1E]">捜索進捗：詳細更新</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">場所・名称</label>
            <div className="relative"><MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#73351F]"/>
              <input type="text" className="w-full pl-9 pr-4 py-3 bg-[#F2F2F7] rounded-xl outline-none text-base font-medium text-[#1C1C1E]" value={name} onChange={e => setName(e.target.value)}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#8E8E93] mb-2 block">ステータス</label>
              <div className="grid grid-cols-2 gap-2">
                {['未着手', '捜索中', '確認済み', '発見'].map(s => (
                  <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${status === s ? 'text-white shadow-sm' : 'bg-[#F2F2F7] text-[#8E8E93]'}`} style={status === s ? {background: AREA_STATUS_STYLE[s]?.bg} : {}}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#8E8E93] mb-2 block">最終更新</label>
              <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-center h-[76px]">
                <p className="text-xs font-bold text-slate-600">{area.time}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">捜索メモ (任意)</label>
            <textarea className="w-full p-3 bg-[#F2F2F7] rounded-xl h-20 text-sm font-medium outline-none resize-none text-[#1C1C1E]" value={note} onChange={e => setNote(e.target.value)} placeholder="状況を入力してください"/>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#C6C6C8]/40 flex gap-3">
          <button onClick={() => onDelete(area.id)} className="px-5 py-4 rounded-2xl font-semibold text-[#FF3B30] bg-[#FFF2F1] active:scale-95 transition-all">削除</button>
          <button onClick={() => onUpdate(area.id, { name, status, note })} className="flex-1 bg-[#73351F] text-white py-4 rounded-2xl font-semibold shadow-sm">変更を保存</button>
        </div>
      </div>
    </div>
  );
};

// ─── Add Area Modal ───────────────────────────────────────────────────────────
const AddAreaModal = ({ isOpen, onClose, onSave, initialAddress, isLoadingAddress }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => { if (isOpen) { setName(initialAddress || ''); setNote(''); } }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (isOpen && initialAddress) setName(initialAddress); }, [initialAddress]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" style={{ fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' }}>
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header — matches AddSightingModal */}
        <div className="px-5 pt-3 pb-4 border-b border-[#ECE2CE] flex justify-between items-center bg-[#E6D6B5] shrink-0">
          <h3 className="font-bold text-[17px] text-[#1A2E2D]">捜索ポイントを追加</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1A2E2D]/10 flex items-center justify-center"><X className="w-4 h-4 text-[#1A2E2D]"/></button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">場所</label>
            <div className="relative">
              {isLoadingAddress
                ? <div className="absolute left-3 top-3.5 w-4 h-4 border-2 border-[#22807F] border-t-transparent rounded-full animate-spin"/>
                : <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#22807F]"/>
              }
              <input autoFocus type="text" className="w-full pl-9 pr-4 py-3 bg-[#F2F2F7] rounded-xl outline-none text-sm font-medium text-[#1C1C1E]" value={name} onChange={e => setName(e.target.value)} placeholder={isLoadingAddress ? '住所を取得中…' : '例: ○○公園、駅前商店街'}/>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1.5 block">メモ (任意)</label>
            <textarea className="w-full p-3 bg-[#F2F2F7] rounded-xl h-24 outline-none text-sm font-medium resize-none text-[#1C1C1E]" value={note} onChange={e => setNote(e.target.value)} placeholder="捜索の注意点など"/>
          </div>
        </div>
        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-[#ECE2CE] shrink-0">
          <button onClick={() => { if (name.trim()) onSave({ name, note }); }} disabled={!name.trim()} className="w-full bg-[#D97757] disabled:opacity-40 text-white py-4 rounded-2xl font-bold shadow-sm active:scale-[0.98] transition-all">追加する</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]                   = useState('map');   // 'map' | 'info'
  const [mapSubTab, setMapSubTab]                   = useState('sightings'); // 'sightings' | 'areas'
  const [sheetExpanded, setSheetExpanded]            = useState(false);
  const [data, setData]                             = useState(loadData);
  const mapCenter                                   = (data.petData?.lostLat && data.petData?.lostLng)
                                                      ? { lat: data.petData.lostLat, lng: data.petData.lostLng }
                                                      : { lat: 34.7055, lng: 135.5015 }; // Osaka default

  // Google Maps API loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GMAPS_API_KEY,
    libraries: GMAPS_LIBRARIES,
  });

  // Map state
  const [isMapMenuOpen, setIsMapMenuOpen]           = useState(false); // legacy — kept for compat
  const [isSightingOpen, setIsSightingOpen]         = useState(false);
  const [pendingAddress, setPendingAddress]         = useState('');
  const [pendingLatLng, setPendingLatLng]           = useState(null);
  const [isAddressLoading, setIsAddressLoading]     = useState(false);
  const [mapTapMenu, setMapTapMenu]                 = useState(null); // { lat, lng } — shown on map tap

  // InfoWindow state for main map
  const [selectedSightingId, setSelectedSightingId] = useState(null);
  const [isLostInfoOpen, setIsLostInfoOpen]         = useState(false);
  const [showEndConfirm, setShowEndConfirm]         = useState(false);
  // InfoWindow state for tracker map
  const [trackerSightingId, setTrackerSightingId]   = useState(null);
  const [trackerAreaId, setTrackerAreaId]           = useState(null);

  // Flyer state
  const [isEditOpen, setIsEditOpen]                 = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen]         = useState(false);
  const flyerRef = useRef(null);

  // Edit map picker state
  const [isEditMapOpen, setIsEditMapOpen]           = useState(false);
  const [editMapPin, setEditMapPin]                 = useState(null);
  const [editMapAddress, setEditMapAddress]         = useState('');
  const [editMapGeocoding, setEditMapGeocoding]     = useState(false);
  const [editMapSearchQuery, setEditMapSearchQuery] = useState('');
  const editMapRef = useRef(null);

  // Tracker state
  const [isTrackerMenuOpen, setIsTrackerMenuOpen]   = useState(false);
  const [isDetailOpen, setIsDetailOpen]             = useState(false);
  const [isAddAreaOpen, setIsAddAreaOpen]           = useState(false);
  const [selectedArea, setSelectedArea]             = useState(null);

  useEffect(() => saveData(data), [data]);

  // Geocode lostLocation text → lostLat/lostLng when coordinates are missing
  useEffect(() => {
    if (!isLoaded) return;
    if (!data.registered) return;
    if (data.petData?.lostLat && data.petData?.lostLng) return;
    if (!data.petData?.lostLocation) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: data.petData.lostLocation, language: 'ja', region: 'JP' }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        setData(p => ({ ...p, petData: { ...p.petData, lostLat: loc.lat(), lostLng: loc.lng() } }));
      }
    });
  }, [isLoaded, data.registered]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOnboardingComplete = useCallback((formData) => {
    setData(p => ({ ...p, registered: true, petData: formData }));
  }, []);

  const handleEndSearch = useCallback(() => {
    setData({ registered: false, petData: EMPTY_PET_DATA, sightings: [], areas: [] });
    setActiveTab('map');
    setShowEndConfirm(false);
  }, []);

  const { petData, sightings, areas } = data;
  const setPetData   = useCallback(d => setData(p => ({ ...p, petData:   typeof d === 'function' ? d(p.petData)   : d })), []);
  const setSightings = useCallback(d => setData(p => ({ ...p, sightings: typeof d === 'function' ? d(p.sightings) : d })), []);
  const setAreas     = useCallback(d => setData(p => ({ ...p, areas:     typeof d === 'function' ? d(p.areas)     : d })), []);

  const latestSighting = sightings.length > 0
    ? sightings.reduce((a, b) => new Date(b.createdAt || 0) > new Date(a.createdAt || 0) ? b : a)
    : null;

  // Resolve address from latlng (shared helper)
  const resolveAddress = async (latlng) => {
    setPendingLatLng(latlng);
    setPendingAddress(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    setIsAddressLoading(true);
    setSelectedSightingId(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=ja`,
        { headers: { 'Accept-Language': 'ja' } }
      );
      const json = await res.json();
      if (json?.display_name) {
        const a = json.address || {};
        const parts = [a.state, a.city || a.town || a.village || a.county, a.city_district || a.suburb || a.neighbourhood, a.quarter, a.road || a.pedestrian || a.footway, a.house_number, a.building || a.amenity].filter(Boolean);
        setPendingAddress(parts.length ? parts.join('') : json.display_name);
      }
    } catch { /* keep coords */ } finally { setIsAddressLoading(false); }
  };

  const handleMapClick = (latlng) => {
    setPendingLatLng(latlng);
    setMapTapMenu(latlng);
    setIsMapMenuOpen(false);
    setSelectedSightingId(null);
  };

  // Choose "目撃情報を追加" from map tap menu
  const handleMapTapSighting = () => {
    if (!mapTapMenu) return;
    resolveAddress(mapTapMenu);
    setIsSightingOpen(true);
    setMapTapMenu(null);
  };

  // Choose "捜索ポイントを追加" from map tap menu
  const handleMapTapArea = () => {
    if (!mapTapMenu) return;
    resolveAddress(mapTapMenu);
    setIsAddAreaOpen(true);
    setMapTapMenu(null);
  };

  const handleSaveSighting = (form) => {
    setSightings(prev => [...prev, {
      id: Date.now(),
      lat: pendingLatLng?.lat ?? mapCenter.lat,
      lng: pendingLatLng?.lng ?? mapCenter.lng,
      address: form.address, time: form.time, note: form.note, images: form.images || [],
      createdAt: new Date().toISOString(),
    }]);
    setIsSightingOpen(false);
    setPendingLatLng(null);
  };

  const handleExport = async () => {
    if (!flyerRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(flyerRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const a = document.createElement('a');
      a.download = `迷子ポスター_${petData.name}_${new Date().toISOString().slice(0, 10)}.png`;
      a.href = canvas.toDataURL('image/png'); a.click();
    } catch { alert('エクスポートに失敗しました。'); }
    setIsSaveMenuOpen(false);
  };

  // ── Edit map picker handlers ──
  const handleEditMapClick = (latlng) => {
    setEditMapPin(latlng);
    setEditMapGeocoding(true);
    setEditMapAddress('住所を取得中…');
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: latlng, language: 'ja' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const formatted = results[0].formatted_address
            .replace(/^日本、\s*/, '')
            .replace(/〒\d{3}-\d{4}\s*/, '');
          setEditMapAddress(formatted);
        } else {
          setEditMapAddress(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
        }
        setEditMapGeocoding(false);
      });
    } else {
      setEditMapAddress(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
      setEditMapGeocoding(false);
    }
  };

  const handleEditMapSearch = () => {
    if (!editMapSearchQuery.trim() || !window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: editMapSearchQuery, language: 'ja', region: 'JP' }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        const latlng = { lat: loc.lat(), lng: loc.lng() };
        editMapRef.current?.panTo(latlng);
        editMapRef.current?.setZoom(17);
        setEditMapPin(latlng);
        const formatted = results[0].formatted_address
          .replace(/^日本、\s*/, '')
          .replace(/〒\d{3}-\d{4}\s*/, '');
        setEditMapAddress(formatted);
        setEditMapGeocoding(false);
      }
    });
  };

  const handleEditMapOpen = useCallback((cb) => {
    setIsEditMapOpen(true);
    setEditMapPin(null);
    setEditMapAddress('');
    setEditMapSearchQuery('');
    window.__editMapPickerCallback = cb;
  }, []);

  const handleEditMapConfirm = () => {
    if (typeof window.__editMapPickerCallback === 'function') {
      window.__editMapPickerCallback(editMapPin.lat, editMapPin.lng, editMapAddress);
      window.__editMapPickerCallback = null;
    }
    setIsEditMapOpen(false);
  };

  // Tracker map: auto-fit bounds when map loads
  const handleTrackerMapLoad = useCallback((map) => {
    const allPoints = [...sightings, ...areas.filter(a => a.lat && a.lng)];
    if (allPoints.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    allPoints.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, 40);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmedCount = areas.filter(a => a.status === '確認済み').length;
  const progress = areas.length > 0 ? Math.round((confirmedCount / areas.length) * 100) : 0;

  // Loading placeholder for when Google Maps API isn't ready
  const MapLoading = () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#73351F] border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }}/>
        <span className="text-sm font-medium text-[#8E8E93]">マップを読み込み中…</span>
      </div>
    </div>
  );

  if (!data.registered) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden font-sans text-[#1C1C1E] border-x border-[#C6C6C8]/30">
        <OnboardingScreen onComplete={handleOnboardingComplete} isLoaded={isLoaded}/>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F2F2F7] shadow-xl overflow-hidden font-sans text-[#1C1C1E] border-x border-[#C6C6C8]/30">

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header
        className="bg-[#E6D6B5] flex items-center justify-between shrink-0"
        style={{
          height: '68px',
          maxHeight: '68px',
          paddingLeft: '23.5px',
          paddingRight: '23.5px',
          fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
        }}
      >
        <div className="flex items-center gap-[8px] min-w-0">
          <PawPrintIcon color="#22807F" size={20} />
          <span
            className="font-bold text-[#1A2E2D] truncate"
            style={{ fontSize: '16px', lineHeight: '20.8px', letterSpacing: '0.32px' }}
          >
            {petData.name || 'ペット'}を捜索中
          </span>
        </div>
        <button
          onClick={() => setActiveTab('info')}
          className="shrink-0 flex items-center justify-center active:opacity-70 transition-opacity"
          style={{ width: '40px', height: '40px' }}
        >
          <NoteIcon size={40} />
        </button>
      </header>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden">

        {/* INFO SCREEN (迷子情報画面) ────────────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="h-full flex flex-col overflow-y-auto bg-[#F2F2F7]">
            {/* Sub-header with back */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#C6C6C8]/40 shrink-0" style={{ fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' }}>
              <button onClick={() => setActiveTab('map')} className="w-9 h-9 flex items-center justify-center rounded-full active:bg-[#F2F2F7] transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#1A2E2D]"/>
              </button>
              <span className="font-bold text-[17px] text-[#1A2E2D] flex-1">迷子情報</span>
              <button
                onClick={() => setShowEndConfirm(true)}
                className="shrink-0 text-[12px] font-bold text-[#22807F] px-3 py-1.5 rounded-full border border-[#22807F]/40 bg-white/80 active:opacity-60 transition-opacity"
              >
                捜索終了
              </button>
            </div>
            <div className="p-6 flex-1 flex flex-col items-center">
              <div ref={flyerRef}><FlyerPreview petData={petData}/></div>
            </div>
            <div className="px-6 pb-12 space-y-4">
              <button onClick={() => setIsEditOpen(true)} className="w-full bg-white border border-[#C6C6C8]/50 text-[#1C1C1E] py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all">
                情報を編集
              </button>
              <div className="relative">
                <button onClick={() => setIsSaveMenuOpen(v => !v)} className="w-full bg-[#22807F] text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all">
                  画像を保存
                </button>
                {isSaveMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-3 bg-white rounded-2xl shadow-lg border border-[#C6C6C8]/40 overflow-hidden z-50">
                    <button onClick={handleExport} className="w-full p-4 text-left flex items-center justify-between active:bg-[#F2F2F7] border-b border-[#C6C6C8]/40">
                      <div className="flex items-center gap-3"><ImageIcon className="w-6 h-6 text-indigo-500"/>
                        <div><p className="font-semibold text-[#1C1C1E]">画像形式で保存</p><p className="text-[11px] text-[#8E8E93]">SNS共有用</p></div>
                      </div><Download className="w-4 h-4 text-slate-300"/>
                    </button>
                    <button className="w-full p-4 text-left flex items-center justify-between active:bg-[#F2F2F7]">
                      <div className="flex items-center gap-3"><FileDown className="w-6 h-6 text-red-500"/>
                        <div><p className="font-semibold text-[#1C1C1E]">PDF形式で保存</p><p className="text-[11px] text-[#8E8E93]">印刷用</p></div>
                      </div><Printer className="w-5 h-5 text-slate-300"/>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED MAP SCREEN ─────────────────────────────────────────────── */}
        {activeTab === 'map' && (
          <div className="h-full relative">
            {!isLoaded ? <MapLoading/> : (
              <GoogleMap
                mapContainerStyle={{ height: '100%', width: '100%' }}
                center={mapCenter}
                zoom={12}
                options={MAP_OPTIONS}
                onClick={(e) => handleMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
              >
                {/* 失踪地点ピン */}
                {data.petData?.lostLat && data.petData?.lostLng && (
                  <Marker
                    position={{ lat: data.petData.lostLat, lng: data.petData.lostLng }}
                    icon={mkLostIcon()}
                    onClick={() => { setIsLostInfoOpen(true); setSelectedSightingId(null); }}
                    zIndex={999}
                  />
                )}
                {isLostInfoOpen && data.petData?.lostLat && (
                  <InfoWindow
                    position={{ lat: data.petData.lostLat, lng: data.petData.lostLng }}
                    onCloseClick={() => setIsLostInfoOpen(false)}
                  >
                    <div style={{ fontFamily: 'system-ui', textAlign: 'left', maxWidth: 180 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#EF4444', marginBottom: 4 }}>📍 失踪場所</p>
                      <p style={{ fontSize: 11, color: '#1C1C1E', lineHeight: 1.4 }}>{data.petData.lostLocation}</p>
                      {data.petData.lostDate && <p style={{ fontSize: 11, color: '#8E8E93', marginTop: 4 }}>🗓 {data.petData.lostDate}</p>}
                    </div>
                  </InfoWindow>
                )}

                {/* Temporary pin for map tap */}
                {mapTapMenu && (
                  <Marker
                    position={{ lat: mapTapMenu.lat, lng: mapTapMenu.lng }}
                    icon={mkTapIcon()}
                    zIndex={1000}
                  />
                )}

                {/* 目撃情報ピン — sightingsタブ時のみ表示 */}
                {mapSubTab === 'sightings' && sightings.map((s, i) => (
                  <Marker
                    key={s.id}
                    position={{ lat: s.lat, lng: s.lng }}
                    icon={mkSightingIcon(i + 1)}
                    onClick={() => { setSelectedSightingId(s.id); setIsLostInfoOpen(false); setTrackerAreaId(null); }}
                  />
                ))}
                {mapSubTab === 'sightings' && selectedSightingId !== null && (() => {
                  const s = sightings.find(x => x.id === selectedSightingId);
                  const i = sightings.findIndex(x => x.id === selectedSightingId);
                  if (!s) return null;
                  return (
                    <InfoWindow
                      position={{ lat: s.lat, lng: s.lng }}
                      onCloseClick={() => setSelectedSightingId(null)}
                    >
                      <div style={{ minWidth: 160, fontFamily: 'system-ui', textAlign: 'left' }}>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>目撃情報 #{i + 1}</p>
                        {s.time    && <p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>🕐 {fmtDatetime(s.time)}</p>}
                        {s.address && <p style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>📍 {s.address}</p>}
                        {s.note    && <p style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginBottom: 4 }}>{s.note}</p>}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => {
                              const exists = areas.some(a => a.lat === s.lat && a.lng === s.lng);
                              if (!exists) {
                                setAreas(p => [...p, { id: Date.now(), name: s.address || `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`, note: '', status: '未着手', time: '今すぐ', lat: s.lat, lng: s.lng }]);
                              }
                              setSelectedSightingId(null);
                              setMapSubTab('areas');
                            }}
                            style={{ fontSize: 11, color: '#406D1F', fontWeight: 700, flex: 1, textAlign: 'center', background: '#F0F7EC', padding: '5px 0', borderRadius: 6, border: '1px solid #406D1F40', cursor: 'pointer' }}
                          >捜索ポイントに追加</button>
                          <button
                            onClick={() => { setSightings(p => p.filter(x => x.id !== s.id)); setSelectedSightingId(null); }}
                            style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, flex: 1, textAlign: 'center', background: '#FEF2F2', padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                          >削除</button>
                        </div>
                      </div>
                    </InfoWindow>
                  );
                })()}

                {/* 捜索エリアピン — areasタブ時のみ表示 */}
                {mapSubTab === 'areas' && areas.filter(a => a.lat && a.lng).map((area, idx) => (
                  <Marker
                    key={`area-${area.id}`}
                    position={{ lat: area.lat, lng: area.lng }}
                    icon={mkAreaIcon(area.status, idx + 1)}
                    onClick={() => { setTrackerAreaId(area.id); setSelectedSightingId(null); setIsLostInfoOpen(false); }}
                  />
                ))}
                {trackerAreaId !== null && (() => {
                  const area = areas.find(a => a.id === trackerAreaId);
                  if (!area) return null;
                  return (
                    <InfoWindow
                      position={{ lat: area.lat, lng: area.lng }}
                      onCloseClick={() => setTrackerAreaId(null)}
                    >
                      <div style={{ minWidth: 140, fontFamily: 'system-ui', textAlign: 'left' }}>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{area.name}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: AREA_STATUS_STYLE[area.status]?.bg || '#94A3B8', color: 'white' }}>{area.status}</span>
                        {area.note && <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{area.note}</p>}
                      </div>
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>
            )}

            {/* FAB — Share button */}
            <div className="absolute right-4" style={{ zIndex: 10, bottom: sheetExpanded ? 'calc(50vh + 140px)' : '160px', transition: 'bottom 0.3s ease' }}>
              <button onClick={() => {
                const lines = sightings.map(s =>
                  `${fmtDatetime(s.time || s.createdAt)} / ${s.address || `${s.lat?.toFixed(4)}, ${s.lng?.toFixed(4)}`}${s.note ? ' — ' + s.note : ''}`
                );
                const text = lines.length > 0
                  ? `【${petData.name}の目撃情報】\n` + lines.join('\n')
                  : `【${petData.name}の目撃情報】\nまだ目撃情報はありません`;
                if (navigator.share) {
                  navigator.share({ title: `${petData.name}の目撃情報`, text });
                } else {
                  navigator.clipboard?.writeText(text);
                  alert('共有リンクをコピーしました');
                }
              }} className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-all bg-[#D97757] text-white">
                <Share2 className="w-7 h-7"/>
              </button>
            </div>

            {/* Map tap menu — choose sighting or search point */}
            {mapTapMenu && (
              <div className="fixed inset-0 z-[100]" onClick={() => setMapTapMenu(null)}>
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg pb-6 pt-2 px-5" onClick={e => e.stopPropagation()} style={{ fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' }}>
                  <div className="w-9 h-1 bg-[#1A2E2D]/20 rounded-full mx-auto mb-4"/>
                  <p className="text-[13px] text-[#8E8E93] font-medium mb-3">この地点に追加</p>
                  <div className="flex gap-3">
                    <button onClick={handleMapTapSighting} className="flex-1 py-4 rounded-2xl border-2 border-[#ECE2CE] flex flex-col items-center gap-2 active:scale-95 transition-all bg-white">
                      <CircleAlert className="w-6 h-6 text-[#D97757]"/>
                      <span className="text-[13px] font-semibold text-[#1A2E2D]">目撃情報</span>
                    </button>
                    <button onClick={handleMapTapArea} className="flex-1 py-4 rounded-2xl border-2 border-[#ECE2CE] flex flex-col items-center gap-2 active:scale-95 transition-all bg-white">
                      <Crosshair className="w-6 h-6 text-[#22807F]"/>
                      <span className="text-[13px] font-semibold text-[#1A2E2D]">捜索ポイント</span>
                    </button>
                  </div>
                  <button onClick={() => { setMapTapMenu(null); setPendingLatLng(null); }} className="w-full mt-3 py-3.5 rounded-2xl text-[15px] font-semibold text-[#22807F] border-2 border-[#22807F]/40 bg-transparent active:scale-[0.98] transition-all">
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* ── Bottom Sheet + Nav ── */}
            <div className="absolute bottom-0 left-0 right-0" style={{ zIndex: 20 }}>
              {/* Bottom Sheet */}
              <div className="shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ background: '#EEE1C6', borderRadius: '24px 24px 0 0', fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' }}>
                {/* Handle bar + title — tap to expand/collapse */}
                <button
                  onClick={() => setSheetExpanded(v => !v)}
                  className="w-full flex flex-col items-center active:opacity-80 transition-opacity"
                  style={{ padding: '10px 16px 0 16px' }}
                >
                  {/* Drag handle */}
                  <div className="w-9 h-1 bg-[#1A2E2D]/20 rounded-full mb-3"/>
                  {/* Title row */}
                  <div className="w-full flex items-center justify-between" style={{ height: '36px' }}>
                    <span className="font-bold text-[#1A2E2D]" style={{ fontSize: '16px', lineHeight: '20.8px', letterSpacing: '0.32px' }}>
                      {mapSubTab === 'sightings' ? '目撃情報' : '捜索ポイント'}
                    </span>
                    {!sheetExpanded && (
                      <span className="bg-[#D97757] text-white text-[12px] font-bold min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center">
                        {mapSubTab === 'sightings' ? sightings.length : areas.length}
                      </span>
                    )}
                  </div>
                </button>

                {/* Sheet content */}
                <div
                  className="overflow-y-auto transition-all duration-300 ease-in-out"
                  style={{ maxHeight: sheetExpanded ? '50vh' : '0px', opacity: sheetExpanded ? 1 : 0, borderTop: sheetExpanded ? '1px solid #E6D6B5' : 'none' }}
                >
                  {mapSubTab === 'sightings' ? (
                    /* ─── Sightings list ─── */
                    sightings.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="font-semibold text-[#8E8E93]">目撃情報なし</p>
                        <p className="text-sm text-[#8E8E93] mt-1">マップをタップしてピンを追加</p>
                      </div>
                    ) : (
                      sightings.map((s, i) => (
                        <div
                          key={s.id}
                          onClick={() => { setSelectedSightingId(s.id); setSheetExpanded(false); }}
                          className={`flex items-center gap-3 px-5 py-3.5 active:bg-[#F2F2F7] cursor-pointer transition-colors ${i > 0 ? 'border-t border-[#ECE2CE]/60' : ''}`}
                        >
                          <span className="bg-[#D97757] text-white text-[12px] font-bold min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1A2E2D] text-[15px] leading-tight truncate">{s.address || `${s.lat?.toFixed(4)}, ${s.lng?.toFixed(4)}`}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {s.time && <span className="text-[12px] text-[#8E8E93]">{fmtDatetime(s.time)}</span>}
                              {s.note && <span className="text-[12px] text-[#8E8E93] truncate">— {s.note}</span>}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#1A2E2D] shrink-0"/>
                        </div>
                      ))
                    )
                  ) : (
                    /* ─── Areas list ─── */
                    <>
                      {/* Progress bar */}
                      <div className="px-5 py-3 bg-[#F9F9F9] border-b border-[#ECE2CE]/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-[#8E8E93]">捜索進捗</span>
                          <span className="text-sm font-bold text-[#73351F]">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#22807F] rounded-full transition-all duration-700" style={{ width: `${progress}%` }}/>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-[#8E8E93]">{confirmedCount}/{areas.length} エリア</span>
                          <span className="text-[11px] text-[#8E8E93]">目撃 {sightings.length}件</span>
                        </div>
                      </div>
                      {areas.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="font-semibold text-[#8E8E93]">捜索エリアがありません</p>
                          <p className="text-sm text-[#8E8E93] mt-1">下のボタンでエリアを追加</p>
                        </div>
                      ) : areas.map((area, idx) => (
                        <div key={area.id} onClick={() => { setSelectedArea(area); setIsTrackerMenuOpen(true); }} className={`flex items-center gap-3 px-5 py-3.5 active:bg-[#F2F2F7] cursor-pointer transition-colors ${idx > 0 ? 'border-t border-[#ECE2CE]/60' : ''}`}>
                          <span className="bg-[#406D1F] text-white text-[12px] font-bold min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1A2E2D] text-[15px] leading-tight">{area.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[12px] font-medium text-[#8E8E93]">{area.status}</span>
                              <span className="text-[11px] text-[#8E8E93]">{area.time}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#1A2E2D] shrink-0"/>
                        </div>
                      ))}
                      <button onClick={() => setIsAddAreaOpen(true)} className="mx-5 my-3 bg-white text-[#73351F] py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 border border-[#73351F]/30 active:scale-95 transition-all w-[calc(100%-40px)]">
                        <Plus className="w-5 h-5"/> エリアを追加
                      </button>
                    </>
                  )}
                  {/* ── 捜索を終了する ── */}
                  <div className="px-5 py-4">
                    <button onClick={() => setShowEndConfirm(true)} className="w-full py-3.5 rounded-2xl font-semibold text-[15px] text-[#22807F] border-2 border-[#22807F]/40 bg-transparent active:scale-[0.98] transition-all">
                      捜索を終了する
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Bottom Nav (2 tabs) — h:78px, Figma node 25-654 ── */}
              <nav className="bg-[#E6D6B5] flex items-center shrink-0 px-4 gap-2" style={{ height: '78px', fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'}}>
                {[
                  { id: 'sightings', icon: CircleAlert, label: '目撃情報' },
                  { id: 'areas',     icon: Crosshair,   label: '捜索ポイント' },
                ].map(({ id, icon: Icon, label }) => {
                  const isActive = mapSubTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setMapSubTab(id); if (mapSubTab !== id) setSheetExpanded(false); }}
                      className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all active:opacity-80 ${isActive ? 'bg-white rounded-2xl text-[#22807F]' : 'text-[#1A2E2D]'}`}
                      style={{ height: '56px' }}
                    >
                      <Icon className="w-5 h-5 stroke-[2px]"/>
                      <span className={`text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`} style={{ letterSpacing: '0.26px' }}>{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}


      </div>

      {/* ══ MODALS ═══════════════════════════════════════════════════════════ */}
      <FlyerEditModal   isOpen={isEditOpen}    onClose={() => setIsEditOpen(false)}    petData={petData} setPetData={setPetData} onMapOpen={handleEditMapOpen}/>

      {/* ── Edit map picker overlay ── */}
      {isEditMapOpen && (
        <div className="fixed inset-0 z-[250] overflow-hidden bg-slate-100" style={{ fontFamily: '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' }}>
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#22807F] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ height: '100%', width: '100%' }}
              center={editMapPin || mapCenter}
              zoom={15}
              options={MAP_OPTIONS}
              onLoad={map => { editMapRef.current = map; }}
              onClick={(e) => handleEditMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
            >
              {editMapPin && <Marker position={editMapPin}/>}
            </GoogleMap>
          )}

          {/* 戻るボタン */}
          <button
            onClick={() => { setIsEditMapOpen(false); window.__editMapPickerCallback = null; }}
            className="absolute top-12 left-4 z-10 bg-white w-10 h-10 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-[#1A2E2D]"/>
          </button>

          {/* 検索バー */}
          <div className="absolute top-12 left-16 right-4 z-10">
            <div className="bg-white rounded-2xl shadow-md flex items-center px-3 gap-2">
              <input
                type="text"
                placeholder="住所を入力して検索…"
                className="flex-1 py-3 text-[14px] font-medium outline-none text-[#1C1C1E] bg-transparent"
                value={editMapSearchQuery}
                onChange={e => setEditMapSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEditMapSearch()}
              />
              <button onClick={handleEditMapSearch} className="text-[#22807F] shrink-0 p-1">
                <MapPin className="w-5 h-5"/>
              </button>
            </div>
            {!editMapPin && (
              <p className="text-[11px] text-white font-semibold text-center mt-2 drop-shadow">
                地図をタップして失踪場所を選択
              </p>
            )}
          </div>

          {/* 選択確認パネル */}
          {editMapPin && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-3xl shadow-xl px-4 pt-4 pb-6">
              <div className="w-8 h-1 bg-[#C6C6C8] rounded-full mx-auto mb-4"/>
              <p className="text-[13px] text-[#8E8E93] font-medium mb-1">選択中の場所</p>
              <p className="text-[15px] text-[#1C1C1E] font-semibold mb-4 leading-snug">
                {editMapGeocoding ? '住所を取得中…' : editMapAddress}
              </p>
              <button
                onClick={handleEditMapConfirm}
                disabled={editMapGeocoding}
                className="w-full bg-[#22807F] disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold text-[15px] active:scale-95 transition-all"
              >
                この場所を選択
              </button>
            </div>
          )}
        </div>
      )}
      <AddSightingModal isOpen={isSightingOpen} onClose={() => setIsSightingOpen(false)} onSave={handleSaveSighting} initialAddress={pendingAddress} isLoadingAddress={isAddressLoading}/>
      <AddAreaModal     isOpen={isAddAreaOpen} onClose={() => setIsAddAreaOpen(false)} initialAddress={pendingAddress} isLoadingAddress={isAddressLoading} onSave={({ name, note }) => { setAreas(p => [...p, { id: Date.now(), name, note, status: '未着手', time: '今すぐ', lat: pendingLatLng?.lat ?? null, lng: pendingLatLng?.lng ?? null }]); setIsAddAreaOpen(false); setPendingLatLng(null); }}/>

      {/* Tracker area bottom sheet */}
      {isTrackerMenuOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsTrackerMenuOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl pt-3 px-6 pb-6 font-sans" onClick={e => e.stopPropagation()}><div className="w-9 h-1 bg-[#C6C6C8] rounded-full mx-auto mb-4"/>
            <h3 className="font-semibold text-[17px] text-[#1C1C1E] mb-4">{selectedArea?.name}</h3>
            <div className="grid grid-cols-2 gap-4 pb-2">
              <button onClick={() => { setIsTrackerMenuOpen(false); setPendingAddress(selectedArea?.name || ''); setIsSightingOpen(true); }} className="p-5 bg-[#FFF3E0] border border-[#73351F]/20 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all">
                <Camera className="w-8 h-8 text-[#73351F]"/><span className="text-xs font-medium text-[#1C1C1E]">目撃情報を登録</span>
              </button>
              <button onClick={() => { setIsTrackerMenuOpen(false); setIsDetailOpen(true); }} className="p-5 bg-[#E8F0FE] border border-[#3B82F6]/20 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all">
                <ClipboardList className="w-8 h-8 text-indigo-600"/><span className="text-xs font-medium text-[#1C1C1E]">詳細を確認</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AreaDetailModal
        area={selectedArea} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}
        onUpdate={(id, upd) => { setAreas(p => p.map(a => a.id === id ? { ...a, ...upd, time: '今すぐ' } : a)); setIsDetailOpen(false); }}
        onDelete={(id) => { setAreas(p => p.filter(a => a.id !== id)); setIsDetailOpen(false); }}
      />

      {/* ══ 捜索終了 確認ダイアログ ══════════════════════════════════════════ */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowEndConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl mx-6 w-full max-w-xs overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-7 pb-5 text-center">
              <div className="w-14 h-14 bg-[#FFF2F1] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔚</span>
              </div>
              <p className="text-[17px] font-bold text-[#1C1C1E] mb-2">捜索を終了しますか？</p>
              <p className="text-[13px] text-[#8E8E93] leading-snug">
                登録した情報・目撃情報・捜索エリアがすべて削除されます。この操作は取り消せません。
              </p>
            </div>
            <div className="border-t border-[#C6C6C8]/40">
              <button
                onClick={handleEndSearch}
                className="w-full py-4 text-[17px] font-semibold text-[#FF3B30] border-b border-[#C6C6C8]/40 active:bg-[#F2F2F7] transition-colors"
              >
                捜索を終了する
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="w-full py-4 text-[17px] font-medium text-[#007AFF] active:bg-[#F2F2F7] transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
