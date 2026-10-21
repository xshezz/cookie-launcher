$url = 'https://raw.githubusercontent.com/cookie-launcher/cookie-launcher/main/src/styles.css'
$originalCss = Invoke-WebRequest -Uri $url -UseBasicParsing | Select-Object -ExpandProperty Content

$themeVars = @'
/* ==============================================================================
   COOKIELAUNCHER - OBSIDIAN GLASSMORPHISM THEME (FREESM / PRISM SPEC)
   Zero-Lag, Dark Aesthetic, Native Desktop UI
   ============================================================================== */

/* Fontlar yerel olarak gomuludur (bkz. dosya sonundaki @font-face bloklari ve
   fonts/OFL-*.txt). Google Fonts'a her acilista istek atilmaz: boylece
   cevrimdisi da dogru calisir ve kullanici IP'si ucuncu tarafa gitmez. */

/* ================== TEMA DEGISKENLERI ================== */
:root {
  /* Varsayılan (Obsidian/Amber) */
  --bg-deep: #0a0a0f;
  --bg-base: #111118;
  --bg-surface: #181824;
  --bg-surface-hover: #222232;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(255, 155, 43, 0.35);

  --accent-primary: #ff9b2b;
  --accent-primary-hover: #ffad4a;
  --accent-glow: rgba(255, 155, 43, 0.25);
  --accent-gold: #ffd700;
  --accent-gold-glow: rgba(255, 215, 0, 0.3);

  --accent-green: #a6e3a1;
  --accent-blue: #89b4fa;
  --accent-purple: #cba6f7;
  --accent-yellow: #f9e2af;
  --accent-red: #f38ba8;

  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --text-dim: #6b7280;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
}

/* Türk Bayrağı Teması */
[data-theme="turkish-flag"] {
  --bg-deep: #0d0d0d;
  --bg-base: #1a1a1a;
  --bg-surface: #1f1f1f;
  --bg-surface-hover: #2a2a2a;
  --border-subtle: rgba(255, 255, 255, 0.1);
  --border-accent: rgba(227, 10, 23, 0.5);

  --accent-primary: #e30a17;
  --accent-primary-hover: #ff1a26;
  --accent-glow: rgba(227, 10, 23, 0.3);
  --accent-gold: #ffffff;
  --accent-gold-glow: rgba(255, 255, 255, 0.3);

  --accent-green: #00a651;
  --accent-blue: #0052a3;
  --accent-purple: #cba6f7;
  --accent-yellow: #ffd700;
  --accent-red: #e30a17;

  --text-main: #ffffff;
  --text-muted: #cccccc;
  --text-dim: #888888;
}

/* Osmanlı/Türk Motifleri Teması */
[data-theme="ottoman"] {
  --bg-deep: #0c0f14;
  --bg-base: #121820;
  --bg-surface: #161d2a;
  --bg-surface-hover: #1c2536;
  --border-subtle: rgba(212, 175, 55, 0.15);
  --border-accent: rgba(212, 175, 55, 0.4);

  --accent-primary: #d4af37;
  --accent-primary-hover: #e8c54d;
  --accent-glow: rgba(212, 175, 55, 0.3);
  --accent-gold: #ffdf80;
  --accent-gold-glow: rgba(255, 223, 128, 0.3);

  --accent-green: #009688;
  --accent-blue: #1e88e5;
  --accent-purple: #ba68c8;
  --accent-yellow: #ffd54f;
  --accent-red: #e57373;

  --text-main: #f5f0e8;
  --text-muted: #b8a890;
  --text-dim: #8a7a6a;
}

/* Yılbaşı/Noel Teması */
[data-theme="newyear"] {
  --bg-deep: #0a160f;
  --bg-base: #112216;
  --bg-surface: #162a1d;
  --bg-surface-hover: #1d3526;
  --border-subtle: rgba(255, 215, 0, 0.12);
  --border-accent: rgba(220, 20, 60, 0.4);

  --accent-primary: #dc143c;
  --accent-primary-hover: #ff2e4f;
  --accent-glow: rgba(220, 20, 60, 0.35);
  --accent-gold: #ffd700;
  --accent-gold-glow: rgba(255, 215, 0, 0.4);

  --accent-green: #32cd32;
  --accent-blue: #4169e1;
  --accent-purple: #da70d6;
  --accent-yellow: #ffd700;
  --accent-red: #dc143c;

  --text-main: #fffafa;
  --text-muted: #d4c4b0;
  --text-dim: #a09080;
}

/* Kış/Kar Teması */
[data-theme="winter"] {
  --bg-deep: #080c14;
  --bg-base: #0d1420;
  --bg-surface: #131d2e;
  --bg-surface-hover: #1a263a;
  --border-subtle: rgba(173, 216, 230, 0.12);
  --border-accent: rgba(100, 180, 255, 0.4);

  --accent-primary: #64b4ff;
  --accent-primary-hover: #8cc4ff;
  --accent-glow: rgba(100, 180, 255, 0.3);
  --accent-gold: #e8f4ff;
  --accent-gold-glow: rgba(232, 244, 255, 0.3);

  --accent-green: #7fffd4;
  --accent-blue: #64b4ff;
  --accent-purple: #b19cd9;
  --accent-yellow: #fff8dc;
  --accent-red: #ff6b9d;

  --text-main: #f0f8ff;
  --text-muted: #b0c4de;
  --text-dim: #778899;
}

/* Tema geçiş animasyonu */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}
'@

$themeDropdownStyles = @'
/* Tema Seçici Dropdown */
.theme-dropdown {
  position: relative;
}

.theme-dropdown-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.theme-dropdown-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.theme-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px;
  display: none;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.theme-dropdown-menu.show {
  display: flex;
}

.theme-option {
  background: none;
  border: none;
  color: var(--text-main);
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease;
  width: 100%;
}

.theme-option:hover {
  background: rgba(255, 155, 43, 0.15);
}

.theme-option.active {
  background: rgba(255, 155, 43, 0.2);
  color: var(--accent-primary);
}

.theme-option-icon {
  font-size: 16px;
}
'@

# Remove original :root block
$rootEnd = $originalCss.IndexOf('--radius-xl: 24px;')
if ($rootEnd -ge 0) {
    $rootEnd += '--radius-xl: 24px;'.Length
    $afterRoot = $originalCss.IndexOf('}', $rootEnd)
    if ($afterRoot -ge 0) {
        $cssWithoutRoot = $originalCss.Substring($afterRoot + 1)
    } else {
        $cssWithoutRoot = $originalCss
    }
} else {
    $cssWithoutRoot = $originalCss
}

# Insert theme dropdown after .control-btn.btn-close:hover
$closeHoverIdx = $cssWithoutRoot.IndexOf('.control-btn.btn-close:hover {')
if ($closeHoverIdx -ge 0) {
    $closeHoverEnd = $cssWithoutRoot.IndexOf('}', $closeHoverIdx)
    if ($closeHoverEnd -ge 0) {
        $cssWithDropdown = $cssWithoutRoot.Substring(0, $closeHoverEnd + 1) + $themeDropdownStyles + $cssWithoutRoot.Substring($closeHoverEnd + 1)
    } else {
        $cssWithDropdown = $cssWithoutRoot
    }
} else {
    $cssWithDropdown = $cssWithoutRoot
}

$finalCss = $themeVars + "`n" + $cssWithDropdown

[IO.File]::WriteAllText('C:\Users\ders\Documents\cookie-launcher-custom\src\styles.css', $finalCss, [System.Text.Encoding]::UTF8)
Write-Host "Done. Lines:" $finalCss.Split("`n").Count