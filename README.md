# Mockup Studio 📱

**Transform screenshots into beautiful, realistic device mockups — right in your browser.**

A privacy-friendly Progressive Web App that lets you wrap your screenshots in accurate device frames for iPhone, iPad, Android, MacBook, Apple Watch, iMac, Smart TV, and more. No servers, no uploads, no tracking.

![Version](https://img.shields.io/badge/Version-2.5.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![PWA](https://img.shields.io/badge/PWA-Installable-purple)

---

## ✨ Features

- 📱 **9 device types** — iPhone, iPhone Pro, iPad, Android, Apple Watch, MacBook, Laptop, iMac, Smart TV
- 🎨 **5 frame colors** + **7 background gradients**
- 📦 **Batch export** — process multiple screenshots at once
- 💾 **Multi-format export** — PNG (lossless), JPEG (quality slider), WebP
- 🌗 **8 color themes** + custom accent color
- 📲 **Installable PWA** — works offline once installed
- 🔒 **100% private** — everything runs in your browser, nothing is uploaded
- 📱 **Fully responsive** — works on phones, tablets, and desktops

---

## 🚀 Quick Start

### Local Development

```bash
# Clone or download this repo
# Serve the folder with any static server
python -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

### Deploy to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to `main` branch / `root`
4. Your app will be live at `https://<username>.github.io/<repo>/`

---

## 📁 Project Structure

```
mockup-studio/
├── index.html         # Main app (upload, preview, export)
├── about.html         # About page with developer info
├── help.html          # User guide
├── settings.html      # Settings (themes, defaults)
├── styles.css         # All styles + device mockups
├── app.js             # Application logic
├── manifest.json      # PWA manifest
├── service-worker.js  # Offline support
├── icon.png           # App icon (add your own)
└── README.md          # You are here
```

---

## 🎯 Usage

1. **Upload** one or more screenshots (drag & drop or browse)
2. **Select a device** from the grid (iPhone, iPad, Watch, MacBook, etc.)
3. **Customize** — frame color, background, scale, orientation
4. **Export** as PNG / JPEG / WebP — single image or ZIP batch

---

## 🛠️ Tech Stack

- Vanilla **HTML5**, **CSS3**, **JavaScript** (no frameworks)
- **[html2canvas](https://html2canvas.hertzen.com/)** — DOM-to-image rendering
- **[JSZip](https://stuk.github.io/jszip/)** — batch ZIP exports
- **Service Worker** — offline support
- **Web App Manifest** — PWA installability

---

##  ️ Supported Devices

| Device       | Orientation | Colors                |
| ------------ | ----------- | --------------------- |
| iPhone       | Portrait/Landscape | Dark, Silver, Gold, Blue, Red |
| iPhone Pro   | Portrait/Landscape | Default, Titanium, Gold, Blue |
| iPad         | Portrait/Landscape | Silver, Dark, Gold, Blue, Red |
| Android      | Portrait/Landscape | Dark, Silver, Gold, Blue, Red |
| Apple Watch  | —           | Dark, Silver, Gold    |
| MacBook      | —           | Dark, Silver, Gold    |
| Laptop       | —           | Dark, Silver          |
| iMac         | —           | Dark, Silver          |
| Smart TV     | —           | Dark, Silver          |

---

## 🤝 Contributing

Pull requests welcome! For major changes, please open an issue first.

## 📄 License

MIT License — feel free to use, modify, and distribute.
