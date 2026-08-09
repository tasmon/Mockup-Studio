/* ============================================
   MOCKUP STUDIO v2.5.0
   - FINAL working version
   - Uses <img> + object-fit (browser native)
   - Pre-loads images to calculate aspect-aware sizing
   - Reliable html2canvas export
   ============================================ */

const APP_VERSION = '2.5.0';

const DEFAULT_SETTINGS = {
  theme: 'light',
  accent: '#4f46e5',
  defaultDevice: 'iphone',
  defaultFormat: 'png',
  defaultQuality: 92,
  defaultPrefix: 'mockup',
  autoFit: true,
  hqExport: true,
  reduceMotion: false,
  frameColor: 'dark',
  background: 'white',
  customBgColor: '#6366f1',
  orientation: 'portrait',
  scale: 80,
  defaultFit: 'contain',
  defaultZoom: 100
};

const DEVICES = ['iphone', 'ipad', 'android', 'watch', 'macbook', 'laptop', 'imac', 'tv'];
const ORIENTABLE_DEVICES = ['iphone', 'ipad', 'android'];
const COLORS = ['dark', 'silver', 'gold', 'blue', 'red'];
const BACKGROUNDS = ['white', 'transparent', 'light', 'dark', 'sunset', 'ocean', 'forest', 'purple', 'custom'];
const FORMATS = ['png', 'jpeg', 'webp'];
const FIT_MODES = ['contain', 'cover', 'fill', 'none'];

let settings = { ...DEFAULT_SETTINGS };
let images = [];
let activeImageId = null;
let deferredPrompt = null;
let isExporting = false;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  loadSettings();
  applySettings();
  setupNavigation();
  setupUpload();
  setupDeviceSelector();
  setupOptions();
  setupAdjustments();
  setupExport();
  setupSettingsPage();
  setupPWA();
  setupServiceWorker();
  updateExportButtonState();
  console.log('Mockup Studio v' + APP_VERSION + ' initialized');
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('mockup-settings') || '{}');
    settings = { ...DEFAULT_SETTINGS, ...saved };
    if (!DEVICES.includes(settings.defaultDevice)) settings.defaultDevice = 'iphone';
    if (!FORMATS.includes(settings.defaultFormat)) settings.defaultFormat = 'png';
    if (!COLORS.includes(settings.frameColor)) settings.frameColor = 'dark';
    if (!BACKGROUNDS.includes(settings.background)) settings.background = 'white';
    if (!FIT_MODES.includes(settings.defaultFit)) settings.defaultFit = 'contain';
    if (typeof settings.scale !== 'number' || settings.scale < 40 || settings.scale > 100) settings.scale = 80;
    if (typeof settings.defaultZoom !== 'number' || settings.defaultZoom < 50 || settings.defaultZoom > 300) settings.defaultZoom = 100;
  } catch (e) {
    settings = { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try { localStorage.setItem('mockup-settings', JSON.stringify(settings)); } catch (e) {}
}

function applySettings() {
  document.documentElement.setAttribute('data-theme', settings.theme);
  document.documentElement.setAttribute('data-reduce-motion', settings.reduceMotion);

  if (settings.accent && settings.accent !== '#4f46e5') {
    document.documentElement.style.setProperty('--primary', settings.accent);
  } else {
    document.documentElement.style.removeProperty('--primary');
  }
  document.documentElement.style.setProperty('--custom-bg', settings.customBgColor);

  const accentPicker = document.getElementById('accentPicker');
  if (accentPicker) accentPicker.value = settings.accent;

  const themeGrid = document.getElementById('themeGrid');
  if (themeGrid) {
    themeGrid.querySelectorAll('.theme-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.theme === settings.theme);
    });
  }

  const defaultDevice = document.getElementById('defaultDevice');
  if (defaultDevice) defaultDevice.value = settings.defaultDevice;

  const defaultFormat = document.getElementById('defaultFormat');
  if (defaultFormat) defaultFormat.value = settings.defaultFormat;

  const defaultQuality = document.getElementById('defaultQuality');
  if (defaultQuality) {
    defaultQuality.value = settings.defaultQuality;
    const qv = document.getElementById('defaultQualityValue');
    if (qv) qv.textContent = settings.defaultQuality + '%';
  }

  const defaultPrefix = document.getElementById('defaultPrefix');
  if (defaultPrefix) defaultPrefix.value = settings.defaultPrefix;

  const autoFit = document.getElementById('autoFit');
  if (autoFit) autoFit.checked = settings.autoFit;

  const hqExport = document.getElementById('hqExport');
  if (hqExport) hqExport.checked = settings.hqExport;

  const reduceMotion = document.getElementById('reduceMotion');
  if (reduceMotion) reduceMotion.checked = settings.reduceMotion;

  const scaleRange = document.getElementById('scaleRange');
  if (scaleRange) {
    scaleRange.value = settings.scale;
    const sv = document.getElementById('scaleValue');
    if (sv) sv.textContent = settings.scale + '%';
  }

  const qualityRange = document.getElementById('qualityRange');
  if (qualityRange) {
    qualityRange.value = settings.defaultQuality;
    const qv = document.getElementById('qualityValue');
    if (qv) qv.textContent = settings.defaultQuality + '%';
  }

  document.querySelectorAll('.format-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.format === settings.defaultFormat);
  });

  const qualityGroup = document.getElementById('qualityGroup');
  if (qualityGroup) qualityGroup.hidden = settings.defaultFormat === 'png';

  const formatHint = document.getElementById('formatHint');
  if (formatHint) {
    if (settings.defaultFormat === 'png') formatHint.textContent = '✓ PNG supports transparency';
    else if (settings.defaultFormat === 'webp') formatHint.textContent = '✓ WebP supports transparency';
    else formatHint.textContent = '✗ JPEG does not support transparency';
  }

  document.querySelectorAll('#bgOptions .bg-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.bg === settings.background);
  });

  const customBgControls = document.getElementById('customBgControls');
  if (customBgControls) customBgControls.hidden = settings.background !== 'custom';

  const customBgColor = document.getElementById('customBgColor');
  if (customBgColor) customBgColor.value = settings.customBgColor;

  document.querySelectorAll('#frameColors .color-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.color === settings.frameColor);
  });

  document.querySelectorAll('.seg-btn[data-orient]').forEach(b => {
    b.classList.toggle('selected', b.dataset.orient === settings.orientation);
  });
}

// ============================================
// NAVIGATION
// ============================================
function setupNavigation() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target) && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ============================================
// UPLOAD
// ============================================
function setupUpload() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');
  const browse = document.getElementById('browseBtn');
  if (!zone || !input) return;

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(f => {
      if (!f.type.startsWith('image/')) return false;
      return /\.(png|jpe?g|webp|gif)$/i.test(f.name);
    });

    if (valid.length === 0) {
      showToast('Please select image files (PNG, JPEG, WebP)');
      return;
    }

    valid.forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        showToast('Skipped ' + file.name + ' - too large');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = {
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
          name: file.name.replace(/\.[^.]+$/, ''),
          dataUrl: e.target.result,
          naturalWidth: 0,
          naturalHeight: 0,
          device: settings.defaultDevice,
          frameColor: settings.frameColor,
          orientation: settings.orientation,
          fit: settings.defaultFit,
          zoom: settings.defaultZoom,
          posX: 0,
          posY: 0
        };
        // Pre-load to get dimensions
        const tempImg = new Image();
        tempImg.onload = function() {
          img.naturalWidth = this.naturalWidth;
          img.naturalHeight = this.naturalHeight;
        };
        tempImg.src = e.target.result;

        images.push(img);
        if (!activeImageId) activeImageId = img.id;
        updateUI();
      };
      reader.onerror = () => showToast('Failed to read ' + file.name);
      reader.readAsDataURL(file);
    });
  };

  browse.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', (e) => { if (e.target === zone) zone.classList.remove('dragover'); });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFiles(e.target.files);
    e.target.value = '';
  });
}

// ============================================
// DEVICE SELECTOR
// ============================================
function setupDeviceSelector() {
  const grid = document.getElementById('deviceGrid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.device-card');
  cards.forEach(card => {
    const handler = () => {
      cards.forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      const device = card.dataset.device;
      const img = getActiveImage();
      if (img) {
        img.device = device;
        if (!ORIENTABLE_DEVICES.includes(device)) img.orientation = 'portrait';
        updateOrientationVisibility(device);
        renderPreview();
        renderBatchList();
      } else {
        settings.defaultDevice = device;
        if (!ORIENTABLE_DEVICES.includes(device)) settings.orientation = 'portrait';
        saveSettings();
        updateOrientationVisibility(device);
      }
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });

  document.querySelectorAll('.seg-btn[data-orient]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn[data-orient]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const orient = btn.dataset.orient;
      const img = getActiveImage();
      if (img) {
        img.orientation = orient;
        renderPreview();
      } else {
        settings.orientation = orient;
        saveSettings();
      }
    });
  });
  updateOrientationVisibility(settings.defaultDevice);
}

function updateOrientationVisibility(device) {
  const toggle = document.getElementById('orientationToggle');
  if (!toggle) return;
  toggle.hidden = !ORIENTABLE_DEVICES.includes(device);
}

// ============================================
// OPTIONS BAR
// ============================================
function setupOptions() {
  document.querySelectorAll('#frameColors .color-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#frameColors .color-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      const color = pill.dataset.color;
      const img = getActiveImage();
      if (img) { img.frameColor = color; renderPreview(); }
      settings.frameColor = color;
      saveSettings();
    });
  });

  document.querySelectorAll('#bgOptions .bg-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#bgOptions .bg-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      settings.background = pill.dataset.bg;
      saveSettings();
      applySettings();
      renderPreview();
    });
  });

  const customBgColor = document.getElementById('customBgColor');
  if (customBgColor) {
    customBgColor.addEventListener('input', (e) => {
      settings.customBgColor = e.target.value;
      document.documentElement.style.setProperty('--custom-bg', e.target.value);
      saveSettings();
      renderPreview();
    });
  }
  const applyCustomBg = document.getElementById('applyCustomBg');
  if (applyCustomBg) {
    applyCustomBg.addEventListener('click', () => {
      document.querySelectorAll('#bgOptions .bg-pill').forEach(p => {
        p.classList.toggle('selected', p.dataset.bg === 'custom');
      });
      settings.background = 'custom';
      saveSettings();
      renderPreview();
      showToast('✓ Custom background applied');
    });
  }

  const scaleRange = document.getElementById('scaleRange');
  const scaleValue = document.getElementById('scaleValue');
  if (scaleRange) {
    scaleRange.value = settings.scale;
    if (scaleValue) scaleValue.textContent = settings.scale + '%';
    scaleRange.addEventListener('input', (e) => {
      const value = parseInt(e.target.value, 10);
      if (isNaN(value)) return;
      settings.scale = value;
      if (scaleValue) scaleValue.textContent = value + '%';
      saveSettings();
      const wrapper = document.getElementById('mockupWrapper');
      if (wrapper) wrapper.style.setProperty('--mockup-scale', value / 100);
    });
  }
}

// ============================================
// IMAGE ADJUSTMENTS
// ============================================
function setupAdjustments() {
  const fitMode = document.getElementById('fitMode');
  if (!fitMode) return;

  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  const zoomReset = document.getElementById('zoomReset');
  const positionPad = document.getElementById('positionPad');
  const positionDot = document.getElementById('positionDot');
  const positionValue = document.getElementById('positionValue');
  const resetPosition = document.getElementById('resetPosition');
  const resetAllAdjust = document.getElementById('resetAllAdjust');

  fitMode.addEventListener('change', () => {
    const img = getActiveImage();
    if (!img) return;
    img.fit = fitMode.value;
    applyImageAdjustmentsToUI();
    renderPreview();
  });

  zoomRange.addEventListener('input', (e) => {
    const img = getActiveImage();
    if (!img) return;
    img.zoom = parseInt(e.target.value, 10);
    if (zoomValue) zoomValue.textContent = img.zoom + '%';
    applyImageToPreview();
  });

  if (zoomIn) zoomIn.addEventListener('click', () => {
    const img = getActiveImage();
    if (!img) return;
    img.zoom = Math.min(300, img.zoom + 10);
    if (zoomRange) zoomRange.value = img.zoom;
    if (zoomValue) zoomValue.textContent = img.zoom + '%';
    applyImageToPreview();
  });

  if (zoomOut) zoomOut.addEventListener('click', () => {
    const img = getActiveImage();
    if (!img) return;
    img.zoom = Math.max(50, img.zoom - 10);
    if (zoomRange) zoomRange.value = img.zoom;
    if (zoomValue) zoomValue.textContent = img.zoom + '%';
    applyImageToPreview();
  });

  if (zoomReset) zoomReset.addEventListener('click', () => {
    const img = getActiveImage();
    if (!img) return;
    img.zoom = 100;
    if (zoomRange) zoomRange.value = 100;
    if (zoomValue) zoomValue.textContent = '100%';
    applyImageToPreview();
  });

  if (positionPad && positionDot) {
    let isDragging = false;
    const updatePosition = (clientX, clientY) => {
      const rect = positionPad.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = clientX - rect.left - cx;
      const dy = clientY - rect.top - cy;
      const normX = Math.max(-100, Math.min(100, (dx / cx) * 100));
      const normY = Math.max(-100, Math.min(100, (dy / cy) * 100));
      const img = getActiveImage();
      if (img) {
        img.posX = normX;
        img.posY = normY;
        if (positionValue) positionValue.textContent = Math.round(normX) + ', ' + Math.round(normY);
        applyImageToPreview();
      }
      positionDot.style.left = (50 + normX / 2) + '%';
      positionDot.style.top = (50 + normY / 2) + '%';
    };
    positionPad.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      updatePosition(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updatePosition(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
    positionPad.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      const t = e.touches[0];
      updatePosition(t.clientX, t.clientY);
    }, { passive: false });
    positionPad.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const t = e.touches[0];
      updatePosition(t.clientX, t.clientY);
    }, { passive: false });
    positionPad.addEventListener('touchend', () => { isDragging = false; });
    positionPad.addEventListener('keydown', (e) => {
      const img = getActiveImage();
      if (!img) return;
      const step = e.shiftKey ? 10 : 2;
      let changed = false;
      if (e.key === 'ArrowLeft') { img.posX = Math.max(-100, img.posX - step); changed = true; }
      else if (e.key === 'ArrowRight') { img.posX = Math.min(100, img.posX + step); changed = true; }
      else if (e.key === 'ArrowUp') { img.posY = Math.max(-100, img.posY - step); changed = true; }
      else if (e.key === 'ArrowDown') { img.posY = Math.min(100, img.posY + step); changed = true; }
      else if (e.key === 'Home') { img.posX = 0; img.posY = 0; changed = true; }
      if (changed) {
        e.preventDefault();
        positionDot.style.left = (50 + img.posX / 2) + '%';
        positionDot.style.top = (50 + img.posY / 2) + '%';
        if (positionValue) positionValue.textContent = Math.round(img.posX) + ', ' + Math.round(img.posY);
        applyImageToPreview();
      }
    });
  }

  if (resetPosition) resetPosition.addEventListener('click', () => {
    const img = getActiveImage();
    if (!img) return;
    img.posX = 0;
    img.posY = 0;
    if (positionDot) { positionDot.style.left = '50%'; positionDot.style.top = '50%'; }
    if (positionValue) positionValue.textContent = '0, 0';
    applyImageToPreview();
  });

  if (resetAllAdjust) resetAllAdjust.addEventListener('click', () => {
    const img = getActiveImage();
    if (!img) return;
    img.fit = 'contain';
    img.zoom = 100;
    img.posX = 0;
    img.posY = 0;
    applyImageAdjustmentsToUI();
    renderPreview();
    showToast('✓ Image adjustments reset');
  });
}

function applyImageAdjustmentsToUI() {
  const img = getActiveImage();
  if (!img) return;
  const fitMode = document.getElementById('fitMode');
  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  const positionDot = document.getElementById('positionDot');
  const positionValue = document.getElementById('positionValue');
  if (fitMode) fitMode.value = img.fit;
  if (zoomRange) zoomRange.value = img.zoom;
  if (zoomValue) zoomValue.textContent = img.zoom + '%';
  if (positionDot) {
    positionDot.style.left = (50 + img.posX / 2) + '%';
    positionDot.style.top = (50 + img.posY / 2) + '%';
  }
  if (positionValue) positionValue.textContent = Math.round(img.posX) + ', ' + Math.round(img.posY);
}

// Apply image adjustments using inline style on <img>
function applyImageToPreview() {
  const wrapper = document.getElementById('mockupWrapper');
  if (!wrapper) return;
  const imgEl = wrapper.querySelector('.mockup .screen-area img.screen-img');
  if (!imgEl) return;
  const active = getActiveImage();
  if (!active) return;

  // Reset styles
  imgEl.style.transform = '';
  imgEl.style.objectFit = active.fit;
  imgEl.style.objectPosition = 'center center';

  if (active.fit === 'none') {
    // Show actual size
    imgEl.style.width = 'auto';
    imgEl.style.height = 'auto';
    imgEl.style.maxWidth = 'none';
    imgEl.style.maxHeight = 'none';
  } else if (active.fit === 'fill') {
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.maxWidth = 'none';
    imgEl.style.maxHeight = 'none';
  } else {
    // contain or cover
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
  }

  // Apply zoom + position via transform
  if (active.zoom !== 100 || active.posX !== 0 || active.posY !== 0) {
    const tx = active.posX;
    const ty = active.posY;
    const scale = active.zoom / 100;
    imgEl.style.transform = 'translate(' + tx + '%, ' + ty + '%) scale(' + scale + ')';
    imgEl.style.transformOrigin = 'center center';
  }
}

// ============================================
// EXPORT
// ============================================
function setupExport() {
  const qualityRange = document.getElementById('qualityRange');
  const qualityValue = document.getElementById('qualityValue');
  if (qualityRange) {
    qualityRange.value = settings.defaultQuality;
    if (qualityValue) qualityValue.textContent = settings.defaultQuality + '%';
    qualityRange.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      settings.defaultQuality = v;
      if (qualityValue) qualityValue.textContent = v + '%';
      saveSettings();
    });
  }

  document.querySelectorAll('.format-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.format-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      settings.defaultFormat = pill.dataset.format;
      saveSettings();
      const qg = document.getElementById('qualityGroup');
      if (qg) qg.hidden = pill.dataset.format === 'png';
      applySettings();
    });
  });

  const filenameInput = document.getElementById('filenameInput');
  if (filenameInput) {
    filenameInput.value = settings.defaultPrefix;
    filenameInput.addEventListener('input', (e) => {
      settings.defaultPrefix = e.target.value.trim() || 'mockup';
      saveSettings();
    });
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportCurrent);

  const exportAllBtn = document.getElementById('exportAllBtn');
  if (exportAllBtn) exportAllBtn.addEventListener('click', exportAll);

  const clearBtn = document.getElementById('clearBatchBtn');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (images.length === 0) return;
    if (confirm('Remove all ' + images.length + ' images?')) {
      images = [];
      activeImageId = null;
      updateUI();
    }
  });
}

async function exportCurrent() {
  if (isExporting) return;
  const img = getActiveImage();
  if (!img) return;
  isExporting = true;
  updateExportButtonState();
  showToast('Generating mockup...');
  try {
    await exportImage(img, settings.defaultFormat, settings.defaultQuality, settings.defaultPrefix);
    showToast('✓ Exported successfully');
  } catch (e) {
    console.error('Export failed:', e);
    showToast('Export failed: ' + (e.message || 'Unknown error'));
  } finally {
    isExporting = false;
    updateExportButtonState();
  }
}

async function exportAll() {
  if (isExporting || images.length === 0) return;
  if (!confirm('Export all ' + images.length + ' mockups as a ZIP?')) return;
  isExporting = true;
  updateExportButtonState();
  showToast('Generating ' + images.length + ' mockups...');
  try {
    const zip = new JSZip();
    const folder = zip.folder(settings.defaultPrefix + 's');
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const blob = await generateBlob(img, settings.defaultFormat, settings.defaultQuality);
      const ext = settings.defaultFormat === 'jpeg' ? 'jpg' : settings.defaultFormat;
      const safeName = (settings.defaultPrefix + '-' + (i + 1) + '-' + img.device).replace(/[^a-z0-9\-_]/gi, '_');
      folder.file(safeName + '.' + ext, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, settings.defaultPrefix + '-batch.zip');
    showToast('✓ Exported ' + images.length + ' mockups as ZIP');
  } catch (e) {
    console.error('Batch export failed:', e);
    showToast('Batch export failed: ' + (e.message || 'Unknown error'));
  } finally {
    isExporting = false;
    updateExportButtonState();
  }
}

async function exportImage(img, format, quality, prefix) {
  const blob = await generateBlob(img, format, quality);
  const ext = format === 'jpeg' ? 'jpg' : format;
  const safeName = (prefix + '-' + img.device + '-' + img.id.slice(-6)).replace(/[^a-z0-9\-_]/gi, '_');
  downloadBlob(blob, safeName + '.' + ext);
}

// CRITICAL: Use cloneNode + outerHTML approach for reliable html2canvas capture
async function generateBlob(img, format, quality) {
  // Create a temporary visible container for html2canvas
  const wrapper = document.createElement('div');

  const isTransparent = settings.background === 'transparent' && (format === 'png' || format === 'webp');

  if (isTransparent) {
    wrapper.style.cssText = 'position:fixed;left:0;top:0;padding:40px;z-index:99999;background:transparent;pointer-events:none;';
  } else {
    wrapper.style.cssText = 'position:fixed;left:0;top:0;padding:40px;z-index:99999;pointer-events:none;';
    if (settings.background === 'custom') {
      wrapper.style.background = settings.customBgColor;
    } else {
      wrapper.className = 'bg-' + settings.background;
    }
  }

  wrapper.innerHTML = createMockupHTML(img, true);
  document.body.appendChild(wrapper);

  try {
    // Wait for ALL images to fully decode
    const allImages = wrapper.querySelectorAll('img.screen-img');
    const imagePromises = Array.from(allImages).map(im => {
      if (im.complete && im.naturalHeight !== 0) return Promise.resolve();
      return new Promise((resolve) => {
        im.onload = resolve;
        im.onerror = () => {
          // Force data URL reload
          const orig = im.src;
          im.onload = resolve;
          im.src = orig;
        };
        // Timeout safety
        setTimeout(resolve, 5000);
      });
    });
    await Promise.all(imagePromises);

    // Wait for layout to settle
    await new Promise(r => setTimeout(r, 200));
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));

    const captureWidth = Math.ceil(wrapper.scrollWidth);
    const captureHeight = Math.ceil(wrapper.scrollHeight);

    // html2canvas options
    const canvas = await html2canvas(wrapper, {
      backgroundColor: isTransparent ? null : undefined,
      scale: settings.hqExport ? 2 : 1,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: captureWidth,
      height: captureHeight,
      windowWidth: captureWidth,
      windowHeight: captureHeight,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
      imageTimeout: 20000,
      onclone: function(clonedDoc) {
        // Ensure cloned styles are correct
        const clonedWrapper = clonedDoc.querySelector('.mockup-wrapper');
        if (clonedWrapper) {
          clonedWrapper.style.transform = 'none';
        }
      }
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has zero dimensions');
    }

    const mime = 'image/' + format;
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob && blob.size > 200) {
          resolve(blob);
        } else if (blob) {
          reject(new Error('Blob too small (' + blob.size + ' bytes) - capture may be blank'));
        } else {
          reject(new Error('toBlob returned null'));
        }
      }, mime, format === 'png' ? undefined : quality / 100);
    });
  } finally {
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}

function updateExportButtonState() {
  const exportBtn = document.getElementById('exportBtn');
  const exportAllBtn = document.getElementById('exportAllBtn');
  if (exportBtn) exportBtn.disabled = isExporting || !getActiveImage();
  if (exportAllBtn) exportAllBtn.disabled = isExporting || images.length === 0;
}

// ============================================
// ★★★ MOCKUP HTML — CLEAN IMG-BASED APPROACH ★★★
// Uses standard <img> + object-fit, no background-image
// ============================================
function createMockupHTML(img, forExport) {
  const color = img.frameColor || 'dark';
  const orient = img.orientation || 'portrait';
  const orientClass = (orient === 'landscape' && ORIENTABLE_DEVICES.includes(img.device)) ? ' landscape' : '';

  // Build img element with inline styles
  let imgStyle = 'object-fit:' + img.fit + ';object-position:center center;width:100%;height:100%;display:block;';

  // For 'none' fit, show actual size
  if (img.fit === 'none') {
    imgStyle = 'object-fit:none;width:auto;height:auto;max-width:none;max-height:none;display:block;';
  }

  // Apply zoom + position via transform
  if (img.zoom !== 100 || img.posX !== 0 || img.posY !== 0) {
    const tx = img.posX;
    const ty = img.posY;
    const scale = img.zoom / 100;
    imgStyle += 'transform:translate(' + tx + '%, ' + ty + '%) scale(' + scale + ');transform-origin:center center;';
  }

  const screenImg = '<img class="screen-img" src="' + img.dataUrl + '" alt="' + escapeHtml(img.name) + '" crossorigin="anonymous" style="' + imgStyle + '">';

  let mockup = '';

  switch (img.device) {
    case 'iphone':
      mockup = '<div class="mockup iphone ' + color + orientClass + '">' +
        '<div class="screen-area">' + screenImg + '<div class="dynamic-island"></div></div>' +
        '<div class="side-button mute"></div>' +
        '<div class="side-button volume-up"></div>' +
        '<div class="side-button volume-down"></div>' +
        '<div class="side-button power"></div>' +
        '</div>';
      break;

    case 'ipad':
      mockup = '<div class="mockup ipad ' + color + orientClass + '">' +
        '<div class="screen-area">' + screenImg + '<div class="camera-dot"></div></div>' +
        '</div>';
      break;

    case 'android':
      mockup = '<div class="mockup android ' + color + orientClass + '">' +
        '<div class="screen-area">' + screenImg + '<div class="punch-hole"></div></div>' +
        '</div>';
      break;

    case 'watch':
      mockup = '<div class="mockup watch ' + color + '">' +
        '<div class="band-top"></div>' +
        '<div class="watch-body">' +
          '<div class="screen-area">' + screenImg + '</div>' +
          '<div class="crown"></div>' +
          '<div class="side-button"></div>' +
          '<div class="speaker"></div>' +
        '</div>' +
        '<div class="band-bottom"></div>' +
        '</div>';
      break;

    case 'macbook':
      mockup = '<div class="mockup macbook ' + color + '">' +
        '<div class="lid">' +
          '<div class="screen-area">' +
            '<div class="screen-inner">' + screenImg + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="base"></div>' +
        '</div>';
      break;

    case 'laptop':
      mockup = '<div class="mockup laptop ' + color + '">' +
        '<div class="lid">' +
          '<div class="screen-area">' + screenImg + '</div>' +
        '</div>' +
        '<div class="base"></div>' +
        '</div>';
      break;

    case 'imac':
      mockup = '<div class="mockup imac ' + color + '">' +
        '<div class="display">' +
          '<div class="screen-area">' + screenImg + '</div>' +
        '</div>' +
        '<div class="stand"></div>' +
        '<div class="foot"></div>' +
        '</div>';
      break;

    case 'tv':
      mockup = '<div class="mockup tv ' + color + '">' +
        '<div class="bezel">' +
          '<div class="screen-area">' + screenImg + '</div>' +
        '</div>' +
        '<div class="legs">' +
          '<div class="leg"></div>' +
          '<div class="leg"></div>' +
        '</div>' +
        '</div>';
      break;
  }

  return '<div class="mockup-wrapper" style="display:inline-block;padding:30px">' + mockup + '</div>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ============================================
// UI UPDATES
// ============================================
function updateUI() {
  const hasImages = images.length > 0;
  toggleSection('deviceSection', hasImages);
  toggleSection('previewSection', hasImages);
  toggleSection('batchSection', hasImages);
  toggleSection('exportSection', hasImages);

  const adjustPanel = document.getElementById('adjustPanel');
  if (adjustPanel) adjustPanel.hidden = !hasImages;

  const batchCount = document.getElementById('batchCount');
  if (batchCount) batchCount.textContent = images.length;

  const activeImg = getActiveImage();
  if (activeImg) {
    updateOrientationVisibility(activeImg.device);
    document.querySelectorAll('.device-card').forEach(c => {
      const isSelected = c.dataset.device === activeImg.device;
      c.classList.toggle('selected', isSelected);
      c.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
    document.querySelectorAll('#frameColors .color-pill').forEach(p => {
      p.classList.toggle('selected', p.dataset.color === activeImg.frameColor);
    });
    document.querySelectorAll('.seg-btn[data-orient]').forEach(b => {
      b.classList.toggle('selected', b.dataset.orient === activeImg.orientation);
    });
    applyImageAdjustmentsToUI();
  }

  renderPreview();
  renderBatchList();
  updateExportButtonState();
}

function toggleSection(id, show) {
  const el = document.getElementById(id);
  if (el) el.hidden = !show;
}

function renderPreview() {
  const wrapper = document.getElementById('mockupWrapper');
  if (!wrapper) return;
  const img = getActiveImage();
  if (!img) {
    wrapper.innerHTML = '<p style="color:var(--text-secondary);padding:40px;text-align:center">Upload an image to see preview</p>';
    wrapper.style.removeProperty('--mockup-scale');
    return;
  }
  wrapper.innerHTML = createMockupHTML(img, false);
  wrapper.style.setProperty('--mockup-scale', settings.scale / 100);
  applyImageToPreview();
}

function renderBatchList() {
  const list = document.getElementById('batchList');
  if (!list) return;
  if (images.length === 0) { list.innerHTML = ''; return; }

  list.innerHTML = images.map(img => {
    const isActive = String(img.id) === String(activeImageId);
    return '<div class="batch-item ' + (isActive ? 'active' : '') + '" data-id="' + img.id + '">' +
      '<button class="remove-batch" data-remove="' + img.id + '" aria-label="Remove">×</button>' +
      '<img src="' + img.dataUrl + '" alt="' + escapeHtml(img.name) + '">' +
      '<div class="batch-name">' + escapeHtml(img.name) + '</div>' +
      '<div class="batch-device">' + img.device + ' • ' + img.fit + '</div>' +
      '</div>';
  }).join('');

  list.querySelectorAll('.batch-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.remove-batch')) return;
      activeImageId = item.dataset.id;
      renderPreview();
      renderBatchList();
      updateExportButtonState();
    });
  });

  list.querySelectorAll('.remove-batch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.remove;
      images = images.filter(i => String(i.id) !== String(id));
      if (String(activeImageId) === String(id)) {
        activeImageId = images.length > 0 ? images[0].id : null;
      }
      updateUI();
    });
  });
}

function getActiveImage() {
  return images.find(i => String(i.id) === String(activeImageId));
}

// ============================================
// SETTINGS PAGE
// ============================================
function setupSettingsPage() {
  const themeGrid = document.getElementById('themeGrid');
  if (themeGrid) {
    themeGrid.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        settings.theme = card.dataset.theme;
        saveSettings();
        applySettings();
      });
    });
  }

  const accentPicker = document.getElementById('accentPicker');
  if (accentPicker) accentPicker.addEventListener('input', (e) => {
    settings.accent = e.target.value;
    saveSettings();
    applySettings();
  });

  const defaultDevice = document.getElementById('defaultDevice');
  if (defaultDevice) defaultDevice.addEventListener('change', () => {
    settings.defaultDevice = defaultDevice.value;
    saveSettings();
  });

  const defaultFormat = document.getElementById('defaultFormat');
  if (defaultFormat) defaultFormat.addEventListener('change', () => {
    settings.defaultFormat = defaultFormat.value;
    saveSettings();
  });

  const defaultQuality = document.getElementById('defaultQuality');
  const defaultQualityValue = document.getElementById('defaultQualityValue');
  if (defaultQuality) {
    defaultQuality.addEventListener('input', () => {
      const v = parseInt(defaultQuality.value, 10);
      if (!isNaN(v)) {
        settings.defaultQuality = v;
        if (defaultQualityValue) defaultQualityValue.textContent = v + '%';
        saveSettings();
      }
    });
  }

  const defaultPrefix = document.getElementById('defaultPrefix');
  if (defaultPrefix) defaultPrefix.addEventListener('input', () => {
    settings.defaultPrefix = defaultPrefix.value.trim() || 'mockup';
    saveSettings();
  });

  const autoFit = document.getElementById('autoFit');
  if (autoFit) autoFit.addEventListener('change', () => {
    settings.autoFit = autoFit.checked;
    saveSettings();
  });

  const hqExport = document.getElementById('hqExport');
  if (hqExport) hqExport.addEventListener('change', () => {
    settings.hqExport = hqExport.checked;
    saveSettings();
  });

  const reduceMotion = document.getElementById('reduceMotion');
  if (reduceMotion) reduceMotion.addEventListener('change', () => {
    settings.reduceMotion = reduceMotion.checked;
    saveSettings();
    applySettings();
  });

  const resetBtn = document.getElementById('resetSettings');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults? This will reload the page.')) return;
    try {
      localStorage.removeItem('mockup-settings');
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
    } catch (e) {}
    location.reload();
  });
}

// ============================================
// PWA
// ============================================
function setupPWA() {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    const banner = document.getElementById('installBanner');
    if (banner) banner.hidden = true;
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('installBanner');
    if (banner) {
      const dismissed = localStorage.getItem('install-dismissed');
      if (!dismissed) banner.hidden = false;
    }
  });

  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice(); } catch (e) {}
    deferredPrompt = null;
    const banner = document.getElementById('installBanner');
    if (banner) banner.hidden = true;
  });

  const dismiss = document.getElementById('dismissInstall');
  if (dismiss) dismiss.addEventListener('click', () => {
    const banner = document.getElementById('installBanner');
    if (banner) banner.hidden = true;
    localStorage.setItem('install-dismissed', '1');
  });

  window.addEventListener('appinstalled', () => {
    showToast('✓ Mockup Studio installed!');
    deferredPrompt = null;
  });
}

function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ============================================
// UTILITIES
// ============================================
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}
