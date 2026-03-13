import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import {
  Map as MapIcon, FileText, Target, Plus, Camera,
  CheckCircle2, Circle, X, MapPin, Image as ImageIcon,
  Download, Printer, Trash2, ChevronRight, FileDown, ClipboardList, Share2, ChevronLeft,
} from 'lucide-react';

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
  memo: '', ownerName: '', contact: '', email: '', images: [null, null, null],
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
  email: 'zaqwsxedc_o@mail.com', images: [null, null, null],
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

function mkSightingIcon(num, isLatest) {
  const bg = isLatest ? '#f97316' : '#475569';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="13" fill="${bg}" stroke="white" stroke-width="3"/>
    <text x="16" y="21" text-anchor="middle" font-size="12" font-weight="900" fill="white" font-family="system-ui,-apple-system,sans-serif">${num}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 16),
  };
}

function mkAreaIcon(status) {
  const { bg, symbol } = AREA_STATUS_STYLE[status] || AREA_STATUS_STYLE['未着手'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <rect x="2" y="2" width="26" height="26" rx="7" fill="${bg}" stroke="white" stroke-width="3"/>
    <text x="15" y="21" text-anchor="middle" font-size="14" font-weight="900" fill="white" font-family="system-ui,-apple-system,sans-serif">${symbol}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(30, 30),
    anchor: new window.google.maps.Point(15, 15),
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
    <path d="M5 12C5 8 8 5 12 5C16 5 19 8 19 12" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9"  cy="15" r="3" stroke="#F97316" strokeWidth="1.2"/>
    <circle cx="15" cy="15" r="3" stroke="#F97316" strokeWidth="1.2"/>
    <path d="M10 15H14" stroke="#F97316" strokeWidth="1"/>
    <path d="M6 8L8 6M18 8L16 6" stroke="#F97316" strokeWidth="1.2"/>
  </svg>
);
const MissingFamilyLogo = () => (
  <div className="flex items-center gap-1"><LogoIcon /><LogoIcon /></div>
);
const PawPrint = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#F97316">
    <circle cx="12" cy="16" r="4"/><circle cx="7" cy="8" r="2.5"/>
    <circle cx="12" cy="5" r="2.5"/><circle cx="17" cy="8" r="2.5"/>
  </svg>
);

// ─── Flyer Preview ────────────────────────────────────────────────────────────
const FlyerPreview = ({ petData }) => (
  <div className="w-full aspect-[1/1.414] bg-white shadow-2xl rounded-sm border-[6px] border-[#F97316] p-3 flex flex-col items-center relative overflow-hidden font-sans">
    <div className="w-full flex justify-between items-start mb-1">
      <div className="flex flex-col gap-0.5 mt-1">
        <div className="flex gap-1"><PawPrint className="w-4 h-4 -rotate-12"/><PawPrint className="w-3 h-3 rotate-12 mt-1"/></div>
      </div>
      <div className="flex flex-col items-center">
        <MissingFamilyLogo/>
        <span className="text-[9px] font-black text-[#F97316] uppercase tracking-tighter -mt-1">Missing Family</span>
      </div>
      <div className="relative">
        <div className="bg-white border-2 border-[#F97316] rounded-full px-4 py-1 flex flex-col items-center min-w-[70px]">
          <span className="text-[7px] font-bold text-slate-400 -mb-1">NAME</span>
          <span className="text-[11px] font-black text-slate-800">{petData.name}</span>
        </div>
        <div className="absolute -left-1 bottom-0 w-2 h-2 bg-white border-l-2 border-b-2 border-[#F97316] rotate-45"></div>
      </div>
    </div>
    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter italic">{petData.type}を探しています</h1>
    <div className="w-full grid grid-cols-5 gap-1.5 px-1 mb-2 h-44">
      <div className="col-span-3 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        {petData.images[0] ? <img src={petData.images[0]} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[10px] uppercase italic">sample</div>}
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
          {petData.images[1] ? <img src={petData.images[1]} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-slate-200 font-black text-[10px] uppercase italic">sample</div>}
        </div>
        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
          {petData.images[2] ? <img src={petData.images[2]} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-slate-200 font-black text-[10px] uppercase italic">sample</div>}
        </div>
      </div>
    </div>
    <div className="w-full flex items-center gap-1.5 mb-2">
      <div className="h-1 flex-1 bg-[#F97316] rounded-full"></div>
      <p className="text-[9px] font-black text-slate-800 whitespace-nowrap">{petData.lostDate}　{petData.lostLocation}　付近で行方不明</p>
      <div className="h-1 flex-1 bg-[#F97316] rounded-full"></div>
    </div>
    <div className="w-full grid grid-cols-2 gap-3 px-1 mb-2 text-left">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-black text-[#F97316]">情報</span>
          <span className="text-[7px] text-orange-400 italic">＼こんな子です！／</span>
        </div>
        <div className="text-[8px] font-bold text-slate-700 leading-tight">
          <div className="flex border-b border-dotted border-slate-300 py-0.5"><span className="w-10 text-slate-400">種：</span><span>{petData.breed}</span></div>
          <div className="flex border-b border-dotted border-slate-300 py-0.5"><span className="w-10 text-slate-400">性別：</span><span>{petData.gender}</span><span className="ml-2 w-10 text-slate-400">年齢：</span><span>{petData.age}</span></div>
          <div className="flex border-b border-dotted border-slate-300 py-0.5"><span className="w-10 text-slate-400">毛色：</span><span>{petData.color}</span><span className="ml-2 w-10 text-slate-400">大きさ：</span><span>{petData.size}</span></div>
          <div className="flex border-b border-dotted border-slate-300 py-0.5"><span className="w-10 text-slate-400">首輪：</span><span>{petData.collar}</span></div>
          <div className="flex py-0.5 leading-tight"><span className="w-10 text-slate-400 shrink-0">特徴：</span><span className="flex-1">{petData.features}</span></div>
        </div>
      </div>
      <div className="border border-[#F97316]/30 rounded-lg p-1.5 relative flex flex-col bg-slate-50/50">
        <span className="text-[9px] font-black text-[#F97316]/50 absolute -top-2 left-2 bg-white px-1">MEMO</span>
        <p className="text-[8px] font-bold text-slate-600 leading-relaxed flex-1 overflow-hidden">{petData.memo}</p>
      </div>
    </div>
    <div className="w-[calc(100%+24px)] bg-[#FCD34D] -mx-3 mt-auto p-1.5 px-4 flex justify-between items-center text-slate-900">
      <span className="text-[11px] font-black uppercase tracking-tighter">連絡先</span>
      <div className="flex-1 text-[8px] font-bold tracking-tighter leading-none text-left ml-4">
        <div>飼い主：{petData.ownerName}　電話番号：{petData.contact}</div>
        <div className="mt-0.5">mail：{petData.email}</div>
      </div>
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
        <button onClick={handleCrop} className="text-[#F97316] font-bold text-[16px]">完了</button>
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

// ─── Flyer Edit Modal ─────────────────────────────────────────────────────────
// ─── Onboarding Screen ───────────────────────────────────────────────────────
const OnboardingScreen = ({ onComplete, isLoaded }) => {
  const [step, setStep] = useState('landing'); // 'landing' | 'form' | 'locationMap'
  const [form, setForm] = useState({ ...EMPTY_PET_DATA });
  const [lostDateRaw, setLostDateRaw] = useState('');
  const [locationPin, setLocationPin] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [cropModal, setCropModal] = useState(null);
  const locationMapRef = useRef(null);
  const r0 = useRef(null), r1 = useRef(null), r2 = useRef(null);
  const fileRefs = [r0, r1, r2];
  const animalOptions = ['犬', '猫', '鳥', 'その他'];
  const isOther = !['犬', '猫', '鳥'].includes(form.type);

  const handleImage = (i, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropModal({ index: i, src: reader.result });
    reader.readAsDataURL(file);
  };
  const handleCropDone = (croppedSrc) => {
    const imgs = [...form.images];
    imgs[cropModal.index] = croppedSrc;
    setForm(f => ({ ...f, images: imgs }));
    setCropModal(null);
  };

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

  const inp = (label, key, placeholder = '') => (
    <div>
      <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">{label}</label>
      <input type="text" placeholder={placeholder} className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium outline-none text-[#1C1C1E]" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/>
    </div>
  );

  // ── Location map step ──
  if (step === 'locationMap') {
    return (
      <div className="h-full relative overflow-hidden bg-slate-100">
        {!isLoaded ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"/>
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
            <button onClick={handleLocationSearch} className="text-[#F97316] shrink-0 p-1">
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
              onClick={() => { setForm(f => ({ ...f, lostLocation: locationAddress, lostLat: locationPin.lat, lostLng: locationPin.lng })); setStep('form'); }}
              disabled={isGeocoding}
              className="w-full bg-[#F97316] disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold text-[15px] active:scale-95 transition-all"
            >
              この場所を選択
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Landing step ──
  if (step === 'landing') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white px-8 gap-10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-[#F97316] rounded-3xl flex items-center justify-center shadow-lg shadow-orange-200">
            <span className="text-4xl select-none">🐾</span>
          </div>
          <h1 className="text-3xl font-black text-[#1C1C1E] tracking-tight">PawsTrace</h1>
          <p className="text-[#8E8E93] text-center text-[15px] leading-relaxed">迷子のペットを、みんなで探す</p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {[
            { icon: '📍', text: '目撃情報をリアルタイムで共有' },
            { icon: '📋', text: '捜索ポスターを自動生成' },
            { icon: '✅', text: '捜索エリアの進捗を管理' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-[14px] text-[#3C3C3E] font-medium bg-[#F2F2F7] rounded-2xl px-4 py-3">
              <span className="text-xl">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStep('form')}
          className="w-full max-w-xs bg-[#F97316] text-white py-4 rounded-2xl font-bold text-[17px] shadow-md shadow-orange-200 active:scale-95 transition-all"
        >
          迷子ペットを登録する
        </button>
      </div>
    );
  }

  // ── Form step ──
  return (
    <>
    <div className="h-full flex flex-col bg-[#F2F2F7] overflow-hidden">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-[#C6C6C8]/40 flex items-center gap-2 shrink-0">
        <button onClick={() => setStep('landing')} className="text-[#F97316] p-1 -ml-1">
          <ChevronLeft className="w-6 h-6"/>
        </button>
        <h2 className="font-semibold text-[17px] text-[#1C1C1E]">ペット情報を登録</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 写真 */}
        <section className="bg-white rounded-2xl p-4">
          <h4 className="text-[12px] font-semibold text-[#8E8E93] uppercase mb-3">写真（最大3枚）</h4>
          <div className="grid grid-cols-3 gap-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative">
                <div onClick={() => fileRefs[i].current.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${img ? 'border-orange-400' : 'border-slate-200 bg-slate-50'}`}>
                  {img ? <img src={img} className="w-full h-full object-cover" alt=""/> : <Camera className="w-6 h-6 text-slate-300"/>}
                  <input type="file" ref={fileRefs[i]} onChange={e => handleImage(i, e)} className="hidden" accept="image/*"/>
                </div>
                {img && <button onClick={() => { const imgs = [...form.images]; imgs[i] = null; setForm(f => ({ ...f, images: imgs })); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-3 h-3"/></button>}
              </div>
            ))}
          </div>
        </section>

        {/* 基本情報 */}
        <section className="bg-white rounded-2xl p-4 space-y-4">
          <h4 className="text-[12px] font-semibold text-[#8E8E93] uppercase">基本情報</h4>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-2 block">動物の種類</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {animalOptions.map(opt => (
                <button key={opt} onClick={() => setForm(f => ({ ...f, type: opt === 'その他' ? '' : opt }))} className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${form.type === opt || (opt === 'その他' && isOther) ? 'bg-[#F97316] text-white shadow-sm' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>{opt}</button>
              ))}
            </div>
            {isOther && <input type="text" placeholder="ウサギ、フェレットなど" className="w-full p-3 border-2 border-[#F97316] rounded-xl font-bold outline-none" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}/>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inp('名前 *', 'name', 'ポチ')}
            {inp('品種', 'breed', '柴犬')}
            {inp('性別', 'gender', 'オス')}
            {inp('年齢', 'age', '3歳')}
            {inp('毛色', 'color', '茶色')}
            {inp('大きさ', 'size', '中型')}
            <div className="col-span-2">
              {inp('首輪の特徴', 'collar', '赤い首輪')}
            </div>
            {/* 失踪日 — date picker */}
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">失踪日</label>
              <input
                type="date"
                className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium outline-none text-[#1C1C1E]"
                value={lostDateRaw}
                onChange={e => {
                  setLostDateRaw(e.target.value);
                  const [y, m, d] = e.target.value.split('-');
                  if (y && m && d) setForm(f => ({ ...f, lostDate: `${y}年${parseInt(m)}月${parseInt(d)}日` }));
                }}
              />
            </div>
            {/* 失踪場所 — map picker only */}
            <div className="col-span-2 space-y-2">
              <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">失踪場所</label>
              {form.lostLocation ? (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-3">
                  <MapPin className="w-4 h-4 text-[#F97316] shrink-0"/>
                  <span className="flex-1 text-[13px] font-medium text-[#1C1C1E] leading-snug">{form.lostLocation}</span>
                  <button onClick={() => setStep('locationMap')} className="text-[11px] text-[#F97316] font-semibold shrink-0">変更</button>
                </div>
              ) : (
                <button
                  onClick={() => setStep('locationMap')}
                  className="flex items-center justify-center gap-2 w-full border border-[#F97316] text-[#F97316] bg-orange-50 py-3 rounded-xl text-[13px] font-medium active:scale-95 transition-all"
                >
                  <MapPin className="w-4 h-4"/>
                  マップで地点を指定する
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">外見の特徴</label>
            <textarea placeholder="首輪の色、傷跡、毛の模様など" className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium h-20 outline-none resize-none text-[#1C1C1E]" value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}/>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">メモ・性格・備考</label>
            <textarea placeholder="性格や癖、目撃者へのメッセージなど" className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium h-20 outline-none resize-none text-[#1C1C1E]" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}/>
          </div>
        </section>

        {/* 連絡先 */}
        <section className="bg-white rounded-2xl p-4 space-y-3">
          <h4 className="text-[12px] font-semibold text-[#8E8E93] uppercase">飼い主の連絡先</h4>
          <div className="space-y-3">
            {inp('飼い主名', 'ownerName', '山田 太郎')}
            {inp('電話番号', 'contact', '090-0000-0000')}
            {inp('メールアドレス', 'email', 'example@mail.com')}
          </div>
        </section>
        <div className="h-2"/>
      </div>

      <div className="bg-white border-t border-[#C6C6C8]/40 px-4 py-4 shrink-0">
        <button
          onClick={() => { if (form.name.trim()) onComplete(form); }}
          disabled={!form.name.trim()}
          className="w-full bg-[#F97316] disabled:opacity-40 text-white py-4 rounded-2xl font-bold text-[17px] shadow-md shadow-orange-200 active:scale-95 transition-all"
        >
          登録して捜索開始
        </button>
      </div>
    </div>
    {cropModal && <CropModal src={cropModal.src} onCrop={handleCropDone} onCancel={() => setCropModal(null)}/>}
    </>
  );
};

const FlyerEditModal = ({ isOpen, onClose, petData, setPetData }) => {
  const r0 = useRef(null), r1 = useRef(null), r2 = useRef(null);
  const fileRefs = [r0, r1, r2];
  const animalOptions = ['犬', '猫', '鳥', 'その他'];
  const isOther = !['犬', '猫', '鳥'].includes(petData.type);
  const [cropModal, setCropModal] = useState(null);

  if (!isOpen) return null;

  const handleImage = (i, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropModal({ index: i, src: reader.result });
    reader.readAsDataURL(file);
  };
  const handleCropDone = (croppedSrc) => {
    const imgs = [...petData.images];
    imgs[cropModal.index] = croppedSrc;
    setPetData({ ...petData, images: imgs });
    setCropModal(null);
  };
  const inp = (label, key, col2 = false) => (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">{label}</label>
      <input type="text" className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium outline-none text-[#1C1C1E]" value={petData[key]} onChange={e => setPetData({ ...petData, [key]: e.target.value })}/>
    </div>
  );
  const ta = (label, key) => (
    <div className="col-span-2">
      <label className="text-[11px] font-semibold text-[#8E8E93] mb-1 block">{label}</label>
      <textarea className="w-full p-3 bg-[#F2F2F7] rounded-xl font-medium h-20 outline-none resize-none text-[#1C1C1E]" value={petData[key]} onChange={e => setPetData({ ...petData, [key]: e.target.value })}/>
    </div>
  );

  return (
    <>
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-lg flex flex-col max-h-[90vh] overflow-hidden text-left">
        <div className="px-5 pt-3 pb-4 border-b border-[#C6C6C8]/40 flex justify-between items-center bg-white">
          <h3 className="font-semibold text-[17px] text-[#1C1C1E]">ポスター情報の編集</h3>
          <button onClick={onClose}><X className="w-6 h-6 text-slate-400"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h4 className="text-[13px] font-semibold text-[#8E8E93] uppercase mb-3">写真 (最大3枚)</h4>
            <div className="grid grid-cols-3 gap-3">
              {petData.images.map((img, i) => (
                <div key={i} className="relative">
                  <div onClick={() => fileRefs[i].current.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${img ? 'border-indigo-600' : 'border-slate-200 bg-slate-50 hover:bg-indigo-50'}`}>
                    {img ? <img src={img} className="w-full h-full object-cover" alt=""/> : <Camera className="w-6 h-6 text-slate-300"/>}
                    <input type="file" ref={fileRefs[i]} onChange={e => handleImage(i, e)} className="hidden" accept="image/*"/>
                  </div>
                  {img && <button onClick={() => { const imgs = [...petData.images]; imgs[i] = null; setPetData({ ...petData, images: imgs }); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 className="w-3 h-3"/></button>}
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
                  <button key={opt} onClick={() => setPetData({ ...petData, type: opt === 'その他' ? '' : opt })} className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${petData.type === opt || (opt === 'その他' && isOther) ? 'bg-[#F97316] text-white shadow-sm' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>{opt}</button>
                ))}
              </div>
              {isOther && <input type="text" placeholder="ウサギ、フェレットなど" className="w-full p-3 border-2 border-[#F97316] rounded-xl font-bold outline-none" value={petData.type} onChange={e => setPetData({ ...petData, type: e.target.value })}/>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {inp('名前', 'name')} {inp('品種', 'breed')}
              {inp('性別', 'gender')} {inp('年齢', 'age')}
              {inp('毛色', 'color')} {inp('大きさ', 'size')}
              {inp('首輪', 'collar', true)}
              {inp('失踪日', 'lostDate', true)}
              {inp('失踪場所', 'lostLocation', true)}
              {ta('特徴', 'features')}
              {ta('メモ', 'memo')}
              {inp('飼い主名', 'ownerName')} {inp('電話番号', 'contact')}
              {inp('メールアドレス', 'email', true)}
            </div>
          </section>
        </div>
        <div className="px-5 py-4 border-t border-[#C6C6C8]/40">
          <button onClick={onClose} className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-semibold shadow-sm">変更を保存</button>
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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.slice(0, 3 - form.images.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setForm(prev => ({ ...prev, images: [...prev.images, ev.target.result] }));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx) => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="pt-3 px-6 pb-6"><div className="w-9 h-1 bg-[#C6C6C8] rounded-full mx-auto mb-4"/>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[17px] font-semibold text-[#1C1C1E]">目撃情報を登録</h3>
            <button onClick={onClose}><X className="w-6 h-6 text-slate-400"/></button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1.5">場所</label>
              <div className="relative">
                {isLoadingAddress
                  ? <div className="absolute left-3 top-3.5 w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"/>
                  : <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-orange-500"/>
                }
                <input type="text" className="w-full pl-9 pr-4 py-3 bg-[#F2F2F7] rounded-xl outline-none text-sm font-medium text-[#1C1C1E]" placeholder={isLoadingAddress ? '住所を取得中…' : '場所を入力'} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1.5">日時</label>
              <div className="flex gap-2">
                <input type="datetime-local" className="flex-1 p-3 bg-[#F2F2F7] rounded-xl outline-none text-sm font-medium text-[#1C1C1E]" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}/>
                <button onClick={() => setForm({ ...form, time: nowDatetime() })} className="shrink-0 px-4 py-3 text-[13px] font-semibold text-[#007AFF] bg-[#EBF5FF] rounded-xl">現在</button>
              </div>
            </div>
            {/* ── 写真アップロード ── */}
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1.5">写真</label>
              <div className="flex gap-2 flex-wrap">
                {form.images.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <img src={src} alt="" className="w-full h-full object-cover"/>
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white"/>
                    </button>
                  </div>
                ))}
                {form.images.length < 3 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#C6C6C8] flex flex-col items-center justify-center cursor-pointer bg-[#F2F2F7] active:opacity-70 shrink-0">
                    <Camera className="w-6 h-6 text-slate-300 mb-1"/>
                    <span className="text-[10px] font-medium text-[#8E8E93] text-center leading-tight">写真を<br/>追加</span>
                    <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd}/>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1.5">メモ</label>
              <textarea placeholder="状況を入力してください" className="w-full p-3 bg-[#F2F2F7] rounded-xl h-24 outline-none text-sm font-medium resize-none text-[#1C1C1E]" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}/>
            </div>
            <button onClick={() => onSave(form)} className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-semibold text-base shadow-sm active:scale-95 transition-all">登録</button>
          </div>
        </div>
      </div>
    </div>
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
            <div className="relative"><MapPin className="absolute left-3 top-3.5 w-4 h-4 text-orange-500"/>
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
          <button onClick={() => onUpdate(area.id, { name, status, note })} className="flex-1 bg-[#F97316] text-white py-4 rounded-2xl font-semibold shadow-sm">変更を保存</button>
        </div>
      </div>
    </div>
  );
};

// ─── Add Area Modal ───────────────────────────────────────────────────────────
const AddAreaModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => { if (isOpen) { setName(''); setNote(''); setIsGeocoding(false); } }, [isOpen]);
  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsGeocoding(true);
    let lat = null, lng = null;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1&accept-language=ja`,
        { headers: { 'Accept-Language': 'ja' } }
      );
      const results = await res.json();
      if (results[0]) { lat = parseFloat(results[0].lat); lng = parseFloat(results[0].lon); }
    } catch {}
    setIsGeocoding(false);
    onSave({ name, note, lat, lng });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-lg">
        <div className="pt-3 px-6 pb-6"><div className="w-9 h-1 bg-[#C6C6C8] rounded-full mx-auto mb-4"/>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[17px] font-semibold text-[#1C1C1E]">捜索エリアを追加</h3>
            <button onClick={onClose}><X className="w-6 h-6 text-slate-400"/></button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1.5">場所・エリア名</label>
              <div className="relative"><MapPin className="absolute left-3 top-3.5 w-4 h-4 text-orange-500"/>
                <input autoFocus type="text" className="w-full pl-9 pr-4 py-3 bg-[#F2F2F7] rounded-xl outline-none text-sm font-medium text-[#1C1C1E]" value={name} onChange={e => setName(e.target.value)} placeholder="例: ○○公園、駅前商店街" onKeyDown={e => e.key === 'Enter' && name.trim() && handleSave()}/>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1.5">メモ (任意)</label>
              <textarea className="w-full p-3 bg-[#F2F2F7] rounded-xl h-20 outline-none text-sm font-medium resize-none text-[#1C1C1E]" value={note} onChange={e => setNote(e.target.value)} placeholder="捜索の注意点など"/>
            </div>
            <button onClick={handleSave} disabled={!name.trim() || isGeocoding} className="w-full bg-[#F97316] disabled:opacity-40 text-white py-4 rounded-2xl font-semibold text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
              {isGeocoding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
              {isGeocoding ? '場所を取得中…' : '追加する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]                   = useState('map');
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
  const [isMapMenuOpen, setIsMapMenuOpen]           = useState(false);
  const [isSightingOpen, setIsSightingOpen]         = useState(false);
  const [pendingAddress, setPendingAddress]         = useState('');
  const [pendingLatLng, setPendingLatLng]           = useState(null);
  const [isAddressLoading, setIsAddressLoading]     = useState(false);

  // InfoWindow state for main map
  const [selectedSightingId, setSelectedSightingId] = useState(null);
  // InfoWindow state for tracker map
  const [trackerSightingId, setTrackerSightingId]   = useState(null);
  const [trackerAreaId, setTrackerAreaId]           = useState(null);

  // Flyer state
  const [isEditOpen, setIsEditOpen]                 = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen]         = useState(false);
  const flyerRef = useRef(null);

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

  const { petData, sightings, areas } = data;
  const setPetData   = useCallback(d => setData(p => ({ ...p, petData:   typeof d === 'function' ? d(p.petData)   : d })), []);
  const setSightings = useCallback(d => setData(p => ({ ...p, sightings: typeof d === 'function' ? d(p.sightings) : d })), []);
  const setAreas     = useCallback(d => setData(p => ({ ...p, areas:     typeof d === 'function' ? d(p.areas)     : d })), []);

  const latestSighting = sightings.length > 0
    ? sightings.reduce((a, b) => new Date(b.createdAt || 0) > new Date(a.createdAt || 0) ? b : a)
    : null;

  const handleMapClick = async (latlng) => {
    setPendingLatLng(latlng);
    setPendingAddress(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    setIsAddressLoading(true);
    setIsSightingOpen(true);
    setIsMapMenuOpen(false);
    setSelectedSightingId(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=ja`,
        { headers: { 'Accept-Language': 'ja' } }
      );
      const json = await res.json();
      if (json?.display_name) {
        const a = json.address || {};
        const parts = [
          a.state,
          a.city || a.town || a.village || a.county,
          a.city_district || a.suburb || a.neighbourhood,
          a.quarter,
          a.road || a.pedestrian || a.footway,
          a.house_number,
          a.building || a.amenity,
        ].filter(Boolean);
        setPendingAddress(parts.length ? parts.join('') : json.display_name);
      }
    } catch {
      // keep coords as fallback
    } finally {
      setIsAddressLoading(false);
    }
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
        <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }}/>
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

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden">

        {/* MAP TAB ─────────────────────────────────────────────────────────── */}
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
                {sightings.map((s, i) => (
                  <Marker
                    key={s.id}
                    position={{ lat: s.lat, lng: s.lng }}
                    icon={mkSightingIcon(i + 1, s.id === latestSighting?.id)}
                    onClick={() => setSelectedSightingId(s.id)}
                  />
                ))}
                {selectedSightingId !== null && (() => {
                  const s = sightings.find(x => x.id === selectedSightingId);
                  const i = sightings.findIndex(x => x.id === selectedSightingId);
                  if (!s) return null;
                  return (
                    <InfoWindow
                      position={{ lat: s.lat, lng: s.lng }}
                      onCloseClick={() => setSelectedSightingId(null)}
                    >
                      <div style={{ minWidth: 150, fontFamily: 'system-ui', textAlign: 'left' }}>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>目撃情報 #{i + 1}</p>
                        {s.time    && <p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>🕐 {fmtDatetime(s.time)}</p>}
                        {s.address && <p style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>📍 {s.address}</p>}
                        {s.note    && <p style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginBottom: 4 }}>{s.note}</p>}
                        <button
                          onClick={() => { setSightings(p => p.filter(x => x.id !== s.id)); setSelectedSightingId(null); }}
                          style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, width: '100%', textAlign: 'center', background: '#FEF2F2', padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                        >削除</button>
                      </div>
                    </InfoWindow>
                  );
                })()}
              </GoogleMap>
            )}

            {/* 最新の目撃状況 */}
            <div className="absolute top-4 left-4 right-4 bg-white/96 backdrop-blur-xl shadow-md rounded-2xl px-4 py-3" style={{ zIndex: 10 }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0"/>
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wide">最新の目撃状況</span>
                {sightings.length > 0 && (
                  <span className="ml-auto text-[11px] font-medium text-[#8E8E93] bg-[#F2F2F7] px-2 py-0.5 rounded-full shrink-0">{sightings.length}件</span>
                )}
              </div>
              {latestSighting ? (
                <p className="text-[14px] text-[#1C1C1E] leading-snug font-semibold">
                  {latestSighting.time && `${fmtDatetime(latestSighting.time)} / `}
                  {latestSighting.address || `${latestSighting.lat?.toFixed(4)}, ${latestSighting.lng?.toFixed(4)}`}
                  {latestSighting.note && ` — ${latestSighting.note}`}
                </p>
              ) : (
                <p className="text-[14px] text-[#8E8E93] leading-snug">目撃情報なし。マップをタップしてピンを追加。</p>
              )}
            </div>

            {/* FAB */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3" style={{ zIndex: 10 }}>
              {isMapMenuOpen && (
                <div className="flex flex-col items-end gap-3 mb-2">
                  <button onClick={() => { setIsSightingOpen(true); setIsMapMenuOpen(false); }} className="bg-white px-5 py-3 rounded-2xl shadow-md border border-[#C6C6C8]/40 flex items-center gap-3 font-medium text-sm text-[#1C1C1E] active:scale-95 transition-all">
                    <Plus className="w-5 h-5 text-orange-500"/> 目撃情報を追加
                  </button>
                  <button onClick={() => {
                    setIsMapMenuOpen(false);
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
                      alert('目撃情報をコピーしました');
                    }
                  }} className="bg-white px-5 py-3 rounded-2xl shadow-md border border-[#C6C6C8]/40 flex items-center gap-3 font-medium text-sm text-[#1C1C1E] active:scale-95 transition-all">
                    <Share2 className="w-5 h-5 text-orange-500"/> 目撃情報を共有
                  </button>
                </div>
              )}
              <button onClick={() => setIsMapMenuOpen(v => !v)} className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-all ${isMapMenuOpen ? 'bg-[#1C1C1E] text-white' : 'bg-[#F97316] text-white'}`}>
                {isMapMenuOpen ? <X className="w-8 h-8"/> : <Plus className="w-8 h-8"/>}
              </button>
            </div>
          </div>
        )}

        {/* FLYER TAB ───────────────────────────────────────────────────────── */}
        {activeTab === 'flyer' && (
          <div className="h-full flex flex-col overflow-y-auto bg-[#F2F2F7]">
            <div className="p-6 flex-1 flex flex-col items-center">
              <div ref={flyerRef}><FlyerPreview petData={petData}/></div>
            </div>
            <div className="px-6 pb-12 space-y-4">
              <button onClick={() => setIsEditOpen(true)} className="w-full bg-white border border-[#C6C6C8]/50 text-[#1C1C1E] py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all">
                情報を編集 <ChevronRight className="w-5 h-5 text-slate-400"/>
              </button>
              <div className="relative">
                <button onClick={() => setIsSaveMenuOpen(v => !v)} className="w-full bg-[#F97316] text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all">
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

        {/* TRACKER TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'tracker' && (
          <div className="h-full flex flex-col overflow-hidden bg-[#F2F2F7]">
            {/* ── Mini map ── */}
            <div className="relative shrink-0" style={{ height: '50vh' }}>
              {!isLoaded ? <MapLoading/> : (
                <GoogleMap
                  mapContainerStyle={{ height: '100%', width: '100%' }}
                  center={latestSighting ? { lat: latestSighting.lat, lng: latestSighting.lng } : mapCenter}
                  zoom={14}
                  options={{ ...MAP_OPTIONS, zoomControl: false }}
                  onLoad={handleTrackerMapLoad}
                >
                  {/* 捜索エリアピン（四角・ステータスカラー） */}
                  {areas.filter(a => a.lat && a.lng).map(area => (
                    <Marker
                      key={`area-${area.id}`}
                      position={{ lat: area.lat, lng: area.lng }}
                      icon={mkAreaIcon(area.status)}
                      onClick={() => { setTrackerAreaId(area.id); setTrackerSightingId(null); }}
                    />
                  ))}
                  {/* 目撃情報ピン（円・日時表示） */}
                  {sightings.map((s, i) => (
                    <Marker
                      key={s.id}
                      position={{ lat: s.lat, lng: s.lng }}
                      icon={mkSightingIcon(i + 1, s.id === latestSighting?.id)}
                      onClick={() => { setTrackerSightingId(s.id); setTrackerAreaId(null); }}
                    />
                  ))}

                  {/* InfoWindow: エリア */}
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

                  {/* InfoWindow: 目撃情報 */}
                  {trackerSightingId !== null && (() => {
                    const s = sightings.find(x => x.id === trackerSightingId);
                    const i = sightings.findIndex(x => x.id === trackerSightingId);
                    if (!s) return null;
                    return (
                      <InfoWindow
                        position={{ lat: s.lat, lng: s.lng }}
                        onCloseClick={() => setTrackerSightingId(null)}
                      >
                        <div style={{ minWidth: 140, fontFamily: 'system-ui', textAlign: 'left' }}>
                          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>目撃情報 #{i + 1}</p>
                          {s.time    && <p style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>🕐 {fmtDatetime(s.time)}</p>}
                          {s.address && <p style={{ fontSize: 11, color: '#475569' }}>📍 {s.address}</p>}
                        </div>
                      </InfoWindow>
                    );
                  })()}
                </GoogleMap>
              )}

              {/* Progress overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3" style={{ zIndex: 10 }}>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[#8E8E93]">捜索進捗</span>
                    <span className="text-sm font-bold text-[#F97316]">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}/>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-medium text-[#8E8E93] leading-tight">{confirmedCount}/{areas.length} エリア</p>
                  <p className="text-[11px] font-medium text-[#8E8E93] leading-tight">目撃 {sightings.length}件</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-24">
              {areas.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🗺️</div>
                  <p className="font-semibold text-[#8E8E93]">捜索エリアがありません</p>
                  <p className="text-sm text-[#8E8E93] mt-1">下のボタンでエリアを追加してください</p>
                </div>
              ) : areas.map(area => (
                <div key={area.id} onClick={() => { setSelectedArea(area); setIsTrackerMenuOpen(true); }} className={`flex items-center gap-3 px-4 py-3.5 bg-white active:bg-[#F2F2F7] cursor-pointer transition-colors ${areas.indexOf(area) > 0 ? 'border-t border-[#C6C6C8]/40' : ''}`}>
                  <div className="flex items-center gap-4">
                    {<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-base font-bold" style={{background: AREA_STATUS_STYLE[area.status]?.bg || '#94A3B8'}}>{AREA_STATUS_STYLE[area.status]?.symbol || '–'}</div>}
                    <div>
                      <p className="font-semibold text-[#1C1C1E] text-[17px] leading-tight">{area.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] font-medium text-[#8E8E93]">{area.status}</span>
                        <span className="text-[11px] font-medium text-[#8E8E93]">{area.time}</span>
                      </div>
                      {area.note && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{area.note}</p>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#C6C6C8] shrink-0 ml-auto"/>
                </div>
              ))}
              <button onClick={() => setIsAddAreaOpen(true)} className="mx-4 my-3 bg-white text-[#F97316] py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 border border-[#F97316]/30 active:scale-95 transition-all w-[calc(100%-32px)]">
                <Plus className="w-5 h-5"/> エリアを追加
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ BOTTOM NAV ═══════════════════════════════════════════════════════ */}
      <nav className="bg-white/95 backdrop-blur-2xl border-t border-[#C6C6C8]/40 flex items-center justify-around px-2 pb-safe z-30 shrink-0" style={{paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))', paddingTop: '8px'}}>
        {[
          { id: 'map',     icon: MapIcon,  label: '目撃情報' },
          { id: 'flyer',   icon: FileText, label: '捜索ポスター' },
          { id: 'tracker', icon: Target,   label: '捜索進捗' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => { setActiveTab(id); setIsMapMenuOpen(false); setIsSaveMenuOpen(false); }} className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${activeTab === id ? 'text-[#F97316]' : 'text-[#8E8E93] active:opacity-70'}`}>
            <Icon className="w-6 h-6 stroke-[1.8px]"/>
            <span className="text-[10px] font-medium leading-none mt-0.5">{label}</span>
          </button>
        ))}
      </nav>

      {/* ══ MODALS ═══════════════════════════════════════════════════════════ */}
      <FlyerEditModal   isOpen={isEditOpen}    onClose={() => setIsEditOpen(false)}    petData={petData} setPetData={setPetData}/>
      <AddSightingModal isOpen={isSightingOpen} onClose={() => setIsSightingOpen(false)} onSave={handleSaveSighting} initialAddress={pendingAddress} isLoadingAddress={isAddressLoading}/>
      <AddAreaModal     isOpen={isAddAreaOpen} onClose={() => setIsAddAreaOpen(false)} onSave={({ name, note, lat, lng }) => { setAreas(p => [...p, { id: Date.now(), name, note, status: '未着手', time: '今すぐ', lat, lng }]); setIsAddAreaOpen(false); }}/>

      {/* Tracker area bottom sheet */}
      {isTrackerMenuOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsTrackerMenuOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl pt-3 px-6 pb-6 font-sans" onClick={e => e.stopPropagation()}><div className="w-9 h-1 bg-[#C6C6C8] rounded-full mx-auto mb-4"/>
            <h3 className="font-semibold text-[17px] text-[#1C1C1E] mb-4">{selectedArea?.name}</h3>
            <div className="grid grid-cols-2 gap-4 pb-2">
              <button onClick={() => { setIsTrackerMenuOpen(false); setPendingAddress(selectedArea?.name || ''); setIsSightingOpen(true); }} className="p-5 bg-[#FFF3E0] border border-[#F97316]/20 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all">
                <Camera className="w-8 h-8 text-orange-600"/><span className="text-xs font-medium text-[#1C1C1E]">目撃情報を登録</span>
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
    </div>
  );
}
