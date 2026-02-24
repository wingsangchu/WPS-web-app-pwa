# Tetris PWA

經典俄羅斯方塊遊戲，以 Progressive Web App (PWA) 形式實現，支援離線遊玩及安裝至主畫面。

## 功能特色

- 經典俄羅斯方塊遊戲玩法
- 支援鍵盤及觸控操作
- 響應式設計，適配手機與桌面
- PWA 離線支援，可安裝至主畫面
- 漸進式難度提升（每消除 10 行升一級）
- Ghost piece 預覽落點
- 下一個方塊預覽

## 程式架構

```
WPS-web app pwa/
├── index.html          # 主 HTML 頁面
├── style.css           # 樣式表（響應式 UI）
├── game.js             # 遊戲核心邏輯
├── manifest.json       # PWA Manifest
├── sw.js               # Service Worker（離線快取）
├── gen_icons.py        # PNG 圖示生成腳本
├── generate-icons.html # 瀏覽器端圖示生成工具
├── icons/
│   ├── icon.svg        # SVG 圖示
│   ├── icon-192.png    # 192x192 PNG 圖示
│   └── icon-512.png    # 512x512 PNG 圖示
└── README.md           # 本文件
```

## 程式邏輯

### 遊戲核心 (`game.js`)

```
┌─────────────────────────────────────────┐
│              Game Loop                   │
│  requestAnimationFrame → loop()          │
│    ├─ 計算 delta time                    │
│    ├─ dropTimer 累加                     │
│    ├─ 達到 getSpeed() → moveDown()       │
│    └─ draw() 重繪畫面                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           Piece Management               │
│  randomPiece() → 7 種方塊 (I,O,T,S,Z,J,L)│
│  rotate()      → 旋轉計算               │
│  valid()       → 碰撞檢測               │
│  lock()        → 鎖定方塊至棋盤          │
│  ghostY()      → 計算 ghost 落點         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           Row Clearing                   │
│  clearRows()                             │
│    ├─ 檢測滿行                           │
│    ├─ 閃爍動畫 (6 幀)                    │
│    ├─ 移除行 & 插入空行                  │
│    └─ 計分: 1行=100, 2行=300,            │
│            3行=500, 4行=800 (×level)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             Controls                     │
│  鍵盤: ←→ 移動, ↑ 旋轉, ↓ 軟降,        │
│        Space 硬降, P 暫停                │
│  觸控: 按鈕操控 + 畫布滑動/點擊         │
└─────────────────────────────────────────┘
```

### 渲染流程

1. Canvas 使用 `setTransform` 進行縮放以適配不同螢幕尺寸
2. 依序繪製：網格 → 已鎖定方塊 → Ghost piece → 當前方塊
3. 下一個方塊在獨立 canvas 上繪製

### PWA 架構

- **manifest.json**: 定義應用名稱、圖示、啟動 URL、顯示模式
- **sw.js**: Service Worker 使用 Cache-First 策略快取所有靜態資源

## 操作方式

### 鍵盤

| 按鍵 | 功能 |
|------|------|
| ← → | 左右移動 |
| ↑ | 旋轉 |
| ↓ | 軟降（加速下落） |
| Space | 硬降（直接落底） |
| P | 暫停/繼續 |

### 觸控（手機）

畫面下方提供方向按鈕及 DROP 按鈕。也可在遊戲畫布上：
- 點擊：旋轉
- 向下滑動：硬降

## 計分規則

| 消除行數 | 基礎分數 |
|----------|----------|
| 1 行 | 100 |
| 2 行 | 300 |
| 3 行 | 500 |
| 4 行 (Tetris) | 800 |

實際得分 = 基礎分數 × 當前等級。軟降每格 +1 分，硬降每格 +2 分。

## 開發 & 部署

### 本機開發

使用任何靜態伺服器即可：

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx serve .
```

然後在瀏覽器開啟 `http://localhost:8080`

### 重新生成圖示

```bash
python gen_icons.py
```

## 技術棧

- HTML5 Canvas
- Vanilla JavaScript (ES6+)
- CSS3 (Custom Properties, Flexbox, Media Queries)
- Service Worker API
- Web App Manifest
