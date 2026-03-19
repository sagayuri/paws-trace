# PAW TRACE — Design System

> Figma file: `tRWTL5cnaUKCXWKkbaTSWv` (auto-mapped 2026-03-18)
> Source of truth: `src/tokens.js`

---

## 1. カラー

### 役割定義

| Token | Hex | 役割 |
|---|---|---|
| `brand.teal` | `#22807F` | **Primary** — ロゴ・アイコン・アクセントストローク・足跡の塗り |
| `brand.dark` | `#1A2E2D` | **Text** — 本文・見出しテキスト（最も濃い前景色） |
| `brand.cta` | `#D97757` | **CTA** — 行動喚起ボタン（テラコッタ/オレンジサーモン） |
| `brand.sand` | `#E6D6B5` | **Hero BG** — ランディングスクリーン上部のベージュ背景 |
| `brand.sandMid` | `#ECE2CE` | **Divider** — カード内の区切り線・フォーム枠線 |
| `brand.cream` | `#FCF1D8` | **Icon BG** — MissingPosterアイコン本体の背景色 |
| `brand.surface` | `#F6F6F6` | **Surface** — ランディング下部の白面（波形以下のカード領域） |
| `brand.green` | `#406D1F` | **Accent (Danger/Status)** — 「MISSING」テキスト・タグライン強調 |
| `brand.yellow` | `#EBC04D` | **Amber** — アンバーアクセント（将来の警告バッジ等） |
| `brand.red` | `#ED1C24` | **Danger/Pin** — 地図のロケーションピン・削除系アクション |
| `brand.charcoal` | `#444444` | **Overlay** — 汎用ダークオーバーレイ |
| `brand.white` | `#FFFFFF` | **White** — ボタンラベル・サークル内塗り |

### 使用ルール

```
背景の積み重ね（上→下）:
  sand (#E6D6B5)        → Hero エリア（ランディング上半分）
  surface (#F6F6F6)     → カードエリア（ランディング下半分・波形以下）
  white (#FFFFFF)       → シート/モーダル（フォーム画面・バトムシート）

前景色:
  teal  (#22807F)  → ロゴ・アイコン・タブアクティブ・プライマリボタン
  cta   (#D97757)  → ランディング唯一のCTAボタン（1画面に1つ）
  dark  (#1A2E2D)  → すべての本文・見出し（teal背景上でもdarkを使う）

禁止:
  - teal と cta を同一エリアに並置しない（Primary が競合する）
  - sand/surface 以外の背景色を新規に追加しない（ブランド統一）
```

---

## 2. タイポグラフィ

### フォントファミリー

| Token | 値 | 用途 |
|---|---|---|
| `fontFamily.brand` | `"Inria Sans", Georgia, serif` | ロゴレタリング（**PAW TRACE**）のみ |
| `fontFamily.ui` | `"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif` | すべてのUI文字（日本語・英語問わず） |

> **原則**: 日本語UIには常に `fontFamily.ui` を使う。`fontFamily.brand` はロゴSVGの中にのみ封じる。

### テキストスタイル

| Token | fontSize | lineHeight | letterSpacing | fontWeight | 用途 |
|---|---|---|---|---|---|
| `pawLogo` | 32.9px | 39.5px | 3.29px | 700 | ロゴ内の「PAW TRACE」（SVG paths） |
| `uiLarge` | 18px | 23.4px | 0.36px | 700 | フィーチャー見出し（「目撃情報を一括管理」） |
| `uiMedium` | 16px | 20.8px | 0.32px | 700 | CTAボタンラベル・セカンダリ見出し |
| `uiTagline` | 13px | 16.9px | 1.3px | 700 | タグライン（つながる手がかりレポート）・ラベル上部キャプション |
| `uiBody` | 14px | 21px | 0.28px | 400 | フィーチャー説明文・フォームヘルプテキスト |
| `uiCaption` | 13px | 16.9px | 0.26px | 400 | 補足情報・タイムスタンプ |

### 使用ルール

```
見出し階層:
  H1相当  → uiLarge  (18px / 700)  — 各セクション最初の見出し
  H2相当  → uiMedium (16px / 700)  — サブ見出し・ボタンラベル
  Body    → uiBody   (14px / 400)  — 説明文・入力値
  Caption → uiCaption(13px / 400)  — ラベル・日時・補足
  Tag     → uiTagline(13px / 700)  — 上部キャプション（ALL CAPS 推奨）

lineHeight はフォントサイズの 1.3 倍に統一:
  18px → 23.4px、16px → 20.8px、14px → 21px（≈1.5 / reading用）、13px → 16.9px
```

---

## 3. 形状（Border Radius）

### 共通値

| 値 | 用途 |
|---|---|
| `4px` | インプット・セレクト・小ボタン（`--radius-sm`） |
| `8px` | CTAボタン（Figma node: `rx=8`）・メインカード |
| `12px` | ステータスバッジ・動物種別トグルボタン（`rounded-xl`） |
| `16px` | フォームセクションカード（`rounded-2xl`）・検索バー |
| `20px` | ピルバッジ（ヘッダーペットバッジ） |
| `24px` | ボトムシート上端（`rounded-t-3xl`） |
| `50%` | アバター・ドットインジケーター（完全円形） |

### 使用ルール

```
- ランディング画面のメインCTAは必ず 8px（Figma仕様を守る）
- フォーム画面のカードは 16px（iOS風の大きめ角丸）
- ボトムシートは上端のみ 24px（下端は 0）
- インタラクティブな選択肢（チップ/トグル）は 12px で統一
```

---

## 4. 余白（Spacing）

### 基本単位

フレームサイズ: **390 × 844px**（iPhone 13/14 — Figma設計基準）

| Token | 値 | 用途 |
|---|---|---|
| `layout.padX` | `23.5px` | 画面端の水平パディング（全要素共通） |
| — | `9.5px` | アイコン↔テキスト gap（フィーチャー1: MapPin → テキスト） |
| — | `14px` | アイコン↔テキスト gap（フィーチャー2: MissingPoster → テキスト） |
| — | `4px` | 見出し↔本文 marginTop（フィーチャーテキスト内） |

### カード・コンポーネント内パディング

| 箇所 | padding |
|---|---|
| カードヘッダー | `16px 20px` |
| カードボディ | `20px` |
| フォームセクション | `16px` |
| ヘッダーバー内 | `12px 20px` |
| タブボタン | `14px 24px` |
| ボタン（通常） | `9px 18px` |
| ボタン（小） | `5px 10px` |
| インプットフィールド | `9px 12px`（デスクトップ）/ `12px`（モバイルフォーム） |

### レイアウトグリッド

```
水平:
  左右余白  = 23.5px（layout.padX）
  コンテンツ幅 = 390 - 23.5 × 2 = 343px（= CTAボタン幅に一致）

垂直（ランディング画面 / Figma y座標 → %）:
  ロゴ上端   y=169.44 → 20.08%
  フィーチャー1 y=565   → 66.94%
  フィーチャー2 y=657   → 77.84%
  CTAボタン  y=756   → 89.57%
  波境界     y≈419–492（右→左に上昇するS字カーブ）
```

### スペーシング原則

```
- コンポーネント間の gap は 8px の倍数（8 / 16 / 24 / 32）を基本とする
- アイコンとテキストのペアは gap を固定（9.5px または 14px）し混在させない
- 垂直方向の要素配置は Figma の絶対座標（px → %変換）を優先する
- 新規画面を追加する場合は layout.padX (23.5px) を左右余白の基準に使う
```

---

## 5. アニメーション

| Token | 値 | 用途 |
|---|---|---|
| `animation.pawTrail.totalMs` | `2000ms` | 足跡トレイル全体の所要時間 |
| `animation.pawTrail.stepMs` | `167ms` | 足跡1個あたりの遅延（2000 ÷ 12） |
| — | `0.3s ease-out` | 各足跡のフェードイン transition |

**再生順**: 左下（y大）→ 右上（y小）の対角トレイル
`PAW_ANIM_ORDER = [1, 11, 0, 10, 2, 3, 6, 7, 4, 8, 5, 9]`

---

## 6. アイコン

| コンポーネント | Figma Node | サイズ | 使用場所 |
|---|---|---|---|
| `PawTraceLogo` | 11:2 | 185×179px | ランディング中央 |
| `PawPrintIcon` | 8:511 | 18×18px | 背景足跡トレイル（SVG直接描画） |
| `MapPinIcon` | 8:689 | 40×40px | フィーチャー1アイコン |
| `MissingPosterIcon` | 8:698 | 40×40px | フィーチャー2アイコン |

---

## 7. フォームコンポーネント（Figma node 17:118 より抽出）

登録モーダルから抽出した再利用可能フォーム部品。すべて `src/components/ui/` に格納。

### FormField

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `label` | string | — | ラベルテキスト |
| `value` | string | — | 入力値 |
| `onChange` | func | — | 変更ハンドラ |
| `type` | string | `"text"` | `text / tel / email / date / number` |
| `required` | boolean | `false` | ラベルに `*` を付与 |
| `hint` | string | — | フィールド下部のヘルプテキスト |
| `error` | string | — | エラーメッセージ（赤表示） |

**スタイル規則**:
- 通常: `background: #F6F6F6`, `border: 1.5px solid transparent`
- フォーカス: `border-color: #22807F`, `background: #FFFFFF`
- エラー: `border-color: #ED1C24`, `background: rgba(237,28,36,0.03)`
- `border-radius: 12px`, `padding: 11px 14px`

---

### FormTextarea

FormField の複数行版。同一スタイル規則を適用。

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `rows` | number | `3` | 表示行数 |
| `maxLength` | number | — | 文字数制限（残数カウンター表示） |

---

### RadioGroup

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `options` | `string[]` または `{label, value}[]` | — | 選択肢 |
| `value` | string | — | 選択中の値 |
| `onChange` | `(value) => void` | — | 選択変更ハンドラ |
| `variant` | `"radio"` \| `"chip"` | `"radio"` | 表示スタイル |
| `otherLabel` | string | `"その他"` | 「その他」を示すラベル |
| `onOtherChange` | func | — | 指定すると「その他」選択時にテキスト入力を展開 |

**スタイル規則**:
- `radio` variant: 円形ラジオ（選択中: `background: #22807F` 塗りつぶし）
- `chip` variant: `border-radius: 12px`、選択中: `background: rgba(34,128,127,0.1)`, `border-color: #22807F`, `color: #22807F`

---

### PhotoUploadGrid

| Prop | 型 | デフォルト | 説明 |
|---|---|---|---|
| `images` | `(string\|null)[]` | — | base64 または URL の配列。null = 空スロット |
| `onChange` | `(images) => void` | — | 画像変更ハンドラ |
| `max` | number | `3` | 最大枚数（グリッド列数） |
| `hint` | string | — | 下部ヒント（例: `"※最低1枚必須"`） |

**スタイル規則**（Figma node 17:118 より）:
- 空セル: `border: 1.5px dashed #D97757`（テラコッタ）、`border-radius: 14px`
- 「＋」アイコン + 「写真を選択」ラベル: `color: #D97757`
- 選択済みセル: `border: 2px solid #22807F`（ティール）
- 削除ボタン: `background: #ED1C24`（赤丸）、右上に重ねる

---

### PrimaryButton — outline variant（追加）

地図選択ボタン等のセカンダリアクション用。

```jsx
<PrimaryButton variant="outline" leftIcon={<MapPin />} rightIcon={<ChevronRight />}>
  地図を開いて場所を選択
</PrimaryButton>
```

**スタイル規則**:
- `background: transparent`
- `border: 1.5px solid #D97757`
- `color: #D97757`
- hover: `background: rgba(217,119,87,0.08)`

---

## 8. 背景波形（Wave Boundary）

ランディング画面のベージュ↔サーフェス境界は Figma node `8:471` の SVG pathを正確にトレースした値を使用する。

```
/* Figma node 8:471 "Vector 4" — 390×844 coordinate system */
/* 波の頂点: y≈419 (右端) → y≈492 (左端) */
M-13.7877 855.839
V491.578
C70.0345 447.696 146.436 500.48 212.663 491.578
C278.889 482.676 320.704 437.697 419.033 418.78
V855.839
H-13.7877Z
```

> **注意**: この波形は推測・変更禁止。Figmaから再エクスポートした値のみ使用すること。
