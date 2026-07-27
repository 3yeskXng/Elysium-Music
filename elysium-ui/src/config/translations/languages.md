# Elysium Translation System

## Architecture

The i18n system uses a centralized dictionary lookup with `t(key)` calls throughout the codebase.

### File Structure

```
src/config/
  translations/
    en.js          ← English (reference language, all keys defined here)
    de.js          ← German
    es.js          ← Spanish
    fr.js          ← French
    ja.js          ← Japanese
    ru.js          ← Russian
    tr.js          ← Turkish
    pt-BR.js       ← Portuguese (Brazil)
    index.js       ← Combines all dictionaries into single export
  languageRegistry.js  ← Language metadata (code, name, flag)
src/utils/
  translate.js    ← t(key) function, getCurrentLang(), interpolate()
```

### How It Works

1. **`t(key)`** — Call `t('search_btn')` anywhere. It reads `localStorage('elysium_language')`, falls back to `'en'`, looks up the key, returns the translated string (or the key itself if missing).

2. **`languageRegistry.js`** — Single source of truth for supported languages. Each entry has `{ code, name, flag }`. The settings view reads this to populate the language selector.

3. **`translations/index.js`** — Imports all `*.js` files from the translations folder and exports them as `{ de, en, es, fr, ja, ru, tr, 'pt-BR' }`. Also exposes `window.elysiumTranslate(lang)` for DOM-level `[data-i18n]` attribute translation.

4. **`localStorage('elysium_language')`** — Stores the user's chosen language code. Default: `'en'`.

### DOM Translation

Elements with `data-i18n="key"` attributes are automatically translated when the language changes:

```html
<span data-i18n="search_title"></span>
```

The `window.elysiumTranslate(lang)` function updates all `[data-i18n]` elements in the DOM.

### String Interpolation

Some translation keys use `${variable}` placeholders:

```js
// en.js
dl_success: 'Success! "${title}" downloaded to music library.'

// Usage:
import { interpolate, t } from '../utils/translate.js';
const msg = interpolate(t('dl_success'), { title: track.title });
```

## Adding a New Language

### Step 1: Create the translation file

Create `src/config/translations/<code>.js` with ALL keys from `en.js`:

```js
// elysium-ui/src/config/translations/xx.js
// XX translation dictionary

export default {
    appTitle: "Elysium",
    settingsTitle: "...",
    // ... every key from en.js, translated
};
```

**Rule:** Every key from `en.js` MUST exist in the new file. Missing keys fall back to English but should be translated for completeness.

### Step 2: Register in languageRegistry.js

Add an entry to `src/config/languageRegistry.js`:

```js
{ code: 'xx', name: 'Language Name', flag: '🏳️' },
```

### Step 3: Import in translations/index.js

Add the import and register it in the translations object:

```js
import xx from './xx.js';
export const translations = { de, en, es, fr, ja, ru, tr, 'pt-BR': xx };
```

### Step 4: Add the i18n key for the language label

In your new `xx.js`, include the `langLabel` key (shown in Settings):

```js
langLabel: "言語 / Language",
```

## File Length Rules

- Translation files (`*.js`): No hard limit, but keep concise
- `translate.js`: Max ~150 lines (currently ~22)
- `languageRegistry.js`: Max ~150 lines (currently ~26)
- `translations/index.js`: Max ~150 lines (currently ~28)

## Current Languages

| Code | Language | Flag |
|------|----------|------|
| `de` | Deutsch | 🇩🇪 |
| `en` | English | 🇬🇧 |
| `es` | Español | 🇪🇸 |
| `fr` | Français | 🇫🇷 |
| `ja` | 日本語 | 🇯🇵 |
| `ru` | Русский | 🇷🇺 |
| `tr` | Türkçe | 🇹🇷 |
| `pt-BR` | Português (BR) | 🇧🇷 |
