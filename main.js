// main.js
const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');
const DEFAULT_SETTINGS = {
triggerKey: 'f',
modifiers: ['Ctrl', 'Alt'],
hintCharacters: 'asdfghjklqwertyuiopzxcvbnm',
hintStyle: {
backgroundColor: '#FFD700',
textColor: '#000000',
fontSize: '12px',
opacity: '0.75'
}
};
class LinkHintsPlugin extends Plugin {
styleElement = null;
keyHandler = null;
hintElements = [];
elementMap = new Map();
clickTimeout = null;
currentInput = '';
async onload() {
    console.log('Link Hints plugin: Starting load...');
    await this.loadSettings();
    this.addCommand({
        id: 'show-link-hints',
        name: 'Show link hints',
        hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'l' }],
        callback: () => this.showLinkHints()
    });
    this.addSettingTab(new LinkHintsSettingTab(this.app, this));
    this.addStyles();
    console.log('Link Hints plugin loaded successfully');
}

onunload() {
    console.log('Link Hints plugin: Starting unload process...');
    try {
        this.cleanup();
        if (this.styleElement) {
            if (this.styleElement.parentElement) {
                this.styleElement.remove();
                console.log('Link Hints plugin: Custom styles removed.');
            }
            this.styleElement = null;
        }
    } catch (error) {
        console.error('Link Hints plugin: Error during unload:', error);
    }
    console.log('Link Hints plugin unloaded.');
}

async loadSettings() {
    const loadedData = await this.loadData();
    this.settings = this.deepMerge(DEFAULT_SETTINGS, loadedData || {});
    if (!this.settings.hintStyle || typeof this.settings.hintStyle !== 'object') {
        this.settings.hintStyle = { ...DEFAULT_SETTINGS.hintStyle };
    } else {
        for (const key in DEFAULT_SETTINGS.hintStyle) {
            if (this.settings.hintStyle[key] === undefined || this.settings.hintStyle[key] === null) {
                this.settings.hintStyle[key] = DEFAULT_SETTINGS.hintStyle[key];
            }
        }
    }
}

deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target) || !isObject(target[key])) {
                    output[key] = source[key];
                } else {
                    output[key] = this.deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
    function isObject(item) { return item && typeof item === 'object' && !Array.isArray(item); }
}

async saveSettings(settingsToSave) {
    const effectiveSettings = settingsToSave || this.settings;

    if (settingsToSave) {
        this.settings = effectiveSettings;
    }
    
    await this.saveData(effectiveSettings);
    this.updateStyles();
}

showLinkHints() {
    try {
        this.cleanup();
        const clickableElements = this.getClickableElements();
        if (clickableElements.length === 0) { new Notice('No clickable elements found'); return; }
        const hints = this.generateHints(clickableElements.length);
        this.hintElements = [];
        this.elementMap.clear();
        clickableElements.forEach((element, index) => {
            const hint = hints[index];
            if (!hint) return;
            const hintElement = this.createHintElement(element, hint);
            this.hintElements.push(hintElement);
            this.elementMap.set(hint, element);
        });
        this.currentInput = '';
        this.keyHandler = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.keyHandler, true);
        document.body.classList.add('link-hints-active');
    } catch (error) { console.error('Error showing link hints:', error); this.cleanup(); }
}

getClickableElements() {
    const selector = [
        'a', 'button', '.clickable-icon', '.nav-action-button', '.tree-item-inner',
        '.tab-header', '.view-action', 'input[type="button"]', 'input[type="submit"]',
        '[role="button"]', '.cm-link', '.cm-url', '.internal-link', '.external-link',
        '.tag', '.checkbox-container', '.task-list-item-checkbox', '.suggestion-item',
        '.menu-item', '.cm-hmd-internal-link', '.cm-underline', 'span.cm-hmd-internal-link',
        '.markdown-preview-view .internal-link', '.markdown-preview-view a',
        '.outline-item', '.tree-item-self', '.workspace-leaf-content[data-type="quiet-outline"] p',
        '.workspace-tab-header-inner-title', 'input[type="text"]', 'input[type="search"]',
        '.search-input', '.prompt-input', '.n-input__input-el',
        '.workspace-leaf-content[data-type="quiet-outline"] input',
        '.workspace-leaf-content[data-type="quiet-outline"] .n-input',
        '.nav-header', '.nav-buttons-container button', '.view-header-nav-buttons button',
        '.workspace-leaf-content[data-type="backlink"] .nav-header',
        '.workspace-leaf-content[data-type="outgoing-link"] .nav-header',
        '.workspace-leaf-content[data-type="all-properties"] .nav-header',
        '.workspace-leaf-content[data-type="outline"] .nav-header',
        '.workspace-leaf-content button[aria-label*="Backlinks"]',
        '.workspace-leaf-content button[aria-label*="Outgoing links"]',
        '.workspace-leaf-content button[aria-label*="All properties"]',
        '.workspace-leaf-content button[aria-label*="Outline"]',
        '.workspace-tab-header-container button', '.view-header button',
        '.mod-sidedock .workspace-tab-header', '.mod-sidedock .workspace-tab-header-inner',
        '.mod-sidedock .workspace-tab-header-inner-icon', '.workspace-tabs button',
        '.workspace-tab-container button', '.workspace-sidedock-vault-profile .workspace-tab-header',
        '.mod-left-split .workspace-tab-header', '.mod-right-split .workspace-tab-header',
        '.workspace-sidedock .workspace-tab-header-container .workspace-tab-header',
        '.side-dock-ribbon-tab', '.side-dock-ribbon-action', '.sidebar-toggle-button',
        '.workspace-ribbon-collapse-btn', '.nav-file-title', '.nav-folder-title'
    ].join(', ');
    
    let elements = Array.from(document.querySelectorAll(selector));

    elements = elements.filter(el => {
        const text = el.textContent.trim();
        if (el.tagName === 'P' && text.length === 0) return false;
        if (el.closest('.workspace-leaf-content[data-type="quiet-outline"]')) {
            if (el.tagName === 'INPUT' || el.classList.contains('n-input__input-el')) return true;
            if (el.closest('.view-header-title')) return false;
            if (el.tagName === 'P' && text.length > 0 && text.length < 200) return true;
            if (el.tagName !== 'INPUT' && !el.classList.contains('n-input__input-el') && el.tagName !== 'P') return false;
        }
        if (el.matches('.cm-formatting')) return false;
        return true;
    });
    
    elements = elements.filter((el, index, self) => !self.some((other, otherIndex) => otherIndex !== index && el.contains(other) && el !== other));

    const urlToLinkTextElement = new Map();
    elements.forEach(el => {
        if (el.matches('.cm-editor span.cm-link[data-tooltip-url]')) {
            const url = el.getAttribute('data-tooltip-url');
            urlToLinkTextElement.set(url, el);
        }
    });

    elements = elements.filter(el => {
        if (el.matches('.cm-editor span.cm-url')) {
            const currentUrlTextContent = el.textContent;
            if (urlToLinkTextElement.has(currentUrlTextContent)) {
                const linkTextElement = urlToLinkTextElement.get(currentUrlTextContent);
                if (linkTextElement.parentElement === el.parentElement ||
                    linkTextElement.nextElementSibling === el ||
                    el.previousElementSibling === linkTextElement
                   ) {
                    return false; 
                }
            }
        }
        return true;
    });
    
    const uniqueElementsByPosition = [];
    const positions = new Set();
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const posKey = `${Math.round(rect.left)},${Math.round(rect.top)}`;
        if (!positions.has(posKey)) { 
            positions.add(posKey); 
            uniqueElementsByPosition.push(el); 
        }
    });
    elements = uniqueElementsByPosition;
    
    return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (rect.width <= 0 || rect.height <= 0 || style.visibility === 'hidden' || style.display === 'none' || rect.bottom < 0 || rect.right < 0 || rect.top > window.innerHeight || rect.left > window.innerWidth) return false;
        let parent = el;
        while (parent) {
            if (parent === document.body) break;
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') return false;
            parent = parent.parentElement;
        }
        return true;
    });
}

generateHints(count) {
    const letters = this.settings.hintCharacters; const hints = [];
    for (let i = 0; i < letters.length && hints.length < count; i++) hints.push(letters[i]);
    if (hints.length < count) {
        for (let i = 0; i < letters.length && hints.length < count; i++) {
            for (let j = 0; j < letters.length && hints.length < count; j++) hints.push(letters[i] + letters[j]);
        }
    }
    return hints;
}

createHintElement(targetElement, hint) {
    const rect = targetElement.getBoundingClientRect(); const hintEl = document.createElement('div');
    hintEl.className = 'link-hint'; hintEl.textContent = hint;
    hintEl.style.left = `${rect.left + window.scrollX}px`; hintEl.style.top = `${rect.top + window.scrollY}px`;
    document.body.appendChild(hintEl); return hintEl;
}

handleKeyPress(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.cleanup(); return; }
    if (e.key === 'Backspace') {
        e.preventDefault(); e.stopPropagation();
        if (this.currentInput.length > 0) {
            this.currentInput = this.currentInput.slice(0, -1); this.updateVisibleHints();
            if (this.clickTimeout) { clearTimeout(this.clickTimeout); this.clickTimeout = null; }
        }
        if (this.currentInput === "" && !this.hasPartialMatch()) this.updateVisibleHints();
        else if (!this.hasPartialMatch()) this.cleanup();
        return;
    }
    const keyLower = e.key.toLowerCase(); if (!this.settings.hintCharacters.includes(keyLower)) return;
    e.preventDefault(); e.stopPropagation(); this.currentInput += keyLower; this.updateVisibleHints();
    if (this.clickTimeout) { clearTimeout(this.clickTimeout); this.clickTimeout = null; }
    const element = this.elementMap.get(this.currentInput);
    if (element) {
        const possibleLongerMatches = Array.from(this.elementMap.keys()).some(h => h.startsWith(this.currentInput) && h.length > this.currentInput.length);
        if (possibleLongerMatches) {
            this.clickTimeout = setTimeout(() => {
                const currentElement = this.elementMap.get(this.currentInput);
                if (currentElement) this.clickElement(currentElement); this.cleanup();
            }, 300);
        } else { this.clickElement(element); this.cleanup(); }
    } else if (!this.hasPartialMatch()) { new Notice('No match for hint: ' + this.currentInput, 1000); this.cleanup(); }
}

updateVisibleHints() {
    this.hintElements.forEach((hintEl) => {
        if (!hintEl) return; const hint = hintEl.textContent.replace(/<[^>]*>/g, "");
        if (hint.startsWith(this.currentInput)) {
            hintEl.style.display = 'block'; const fullHintText = hint;
            if (this.currentInput.length > 0) hintEl.innerHTML = `<span class="matched">${fullHintText.substring(0, this.currentInput.length)}</span>${fullHintText.substring(this.currentInput.length)}`;
            else hintEl.innerHTML = fullHintText;
        } else { hintEl.style.display = 'none'; }
    });
}

hasPartialMatch() {
    if (this.currentInput === "") return true;
    return Array.from(this.elementMap.keys()).some(hint => hint.startsWith(this.currentInput));
}

clickElement(element) {
    try {
        // ========== MODIFICATION START ==========
        // Prioritize handling internal links with the Obsidian API for maximum reliability.
        // This ensures they always open in the current tab as requested.

        const readingViewLink = element.closest('.markdown-preview-view a.internal-link');
        if (readingViewLink) {
            const linkText = readingViewLink.getAttribute('data-href');
            if (linkText) {
                console.log(`LinkHintsPlugin: Reading view internal link found. Navigating via API to: "${linkText}"`);
                // The 'false' argument ensures the link opens in the current tab/leaf.
                this.app.workspace.openLinkText(linkText, this.app.workspace.getActiveFile()?.path || '', false);
                return; // Navigation handled.
            }
        }

        const editorLink = element.closest('.cm-editor .cm-hmd-internal-link');
        if (editorLink) {
            const linkText = editorLink.textContent;
            if (linkText) {
                console.log(`LinkHintsPlugin: Editor view internal link found. Navigating via API to: "${linkText}"`);
                // The 'false' argument ensures the link opens in the current tab/leaf.
                this.app.workspace.openLinkText(linkText, this.app.workspace.getActiveFile()?.path || '', false);
                return; // Navigation handled.
            }
        }

        // If it's not an internal link, proceed with event simulation or simple .click().
        // This handles external links and all other UI elements.

        const isEditorElement = element.closest('.cm-editor');
        if (isEditorElement) {
            // This case now primarily handles EXTERNAL links in the editor.
            const targetElement = element.closest('.cm-link, .cm-url');
            if (targetElement) {
                console.log('LinkHintsPlugin: Found an external link inside the editor. Simulating Ctrl/Cmd+Click.');

                const rect = targetElement.getBoundingClientRect();
                const clientX = rect.left + rect.width / 2;
                const clientY = rect.top + rect.height / 2;
                const isMac = /mac/i.test(navigator.platform);
                
                const eventProps = {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: clientX,
                    clientY: clientY,
                    ctrlKey: !isMac, // Use Ctrl on Win/Linux to open in new browser tab
                    metaKey: isMac   // Use Cmd on macOS
                };

                targetElement.dispatchEvent(new MouseEvent('mousedown', eventProps));
                targetElement.dispatchEvent(new MouseEvent('mouseup', eventProps));
                targetElement.dispatchEvent(new MouseEvent('click', eventProps));
                return;
            }
        }

        // --- Fallback for all other elements ---
        // This includes:
        // - External links in Reading View (which are simple <a> tags)
        // - All UI buttons, icons, and other clickable elements.
        // A standard .click() is the most reliable method for these.
        console.log("LinkHintsPlugin: Applying default .click() to UI element or non-internal link:", element);
        element.click();

    } catch (error) {
        console.error('Error clicking element:', error, element);
        // Last resort fallback if any of the above logic fails.
        if (element && typeof element.click === 'function') {
            element.click();
        }
    }
}

cleanup() {
    if (this.clickTimeout) { clearTimeout(this.clickTimeout); this.clickTimeout = null; }
    if (this.hintElements && this.hintElements.length > 0) {
        this.hintElements.forEach(el => { if (el && typeof el.remove === 'function') el.remove(); });
        this.hintElements = [];
    }
    if (this.elementMap) this.elementMap.clear();
    if (this.keyHandler) { document.removeEventListener('keydown', this.keyHandler, true); this.keyHandler = null; }
    if (document.body.classList.contains('link-hints-active')) document.body.classList.remove('link-hints-active');
    this.currentInput = '';
}

addStyles() { this.updateStyles(); }

updateStyles() {
    if (this.styleElement && this.styleElement.parentElement) {
        this.styleElement.remove();
    }
    this.styleElement = null; 
    const style = document.createElement('style');
    const bgColor = this.settings.hintStyle?.backgroundColor || DEFAULT_SETTINGS.hintStyle.backgroundColor;
    const textColor = this.settings.hintStyle?.textColor || DEFAULT_SETTINGS.hintStyle.textColor;
    const fontSize = this.settings.hintStyle?.fontSize || DEFAULT_SETTINGS.hintStyle.fontSize;
    const opacity = this.settings.hintStyle?.opacity || DEFAULT_SETTINGS.hintStyle.opacity;
    style.textContent = `
        .link-hint { position: absolute; background: ${bgColor}; color: ${textColor}; padding: 2px 6px; font-size: ${fontSize}; font-weight: bold; font-family: monospace; border-radius: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 99999; pointer-events: none; text-transform: uppercase; opacity: ${opacity}; }
        .link-hint .matched { color: #FF0000; font-weight: bold; }
        .link-hints-active .link-hint { z-index: 999999 !important; }`;
    document.head.appendChild(style);
    this.styleElement = style;
}
}
class LinkHintsSettingTab extends PluginSettingTab {
bgColorInputComponent = null;
textColorInputComponent = null;
fontSizeInputComponent = null;
opacitySliderComponent = null;
constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

display() {
    const {containerEl} = this; containerEl.empty();
    containerEl.createEl('h2', {text: 'Link Hints Settings'});
    new Setting(containerEl).setName('Hotkey').setDesc('Set the hotkey to trigger link hints. Default: Ctrl+Shift+L. Configure in Obsidian Settings → Hotkeys.')
        .addButton(button => button.setButtonText('Go to Hotkeys').onClick(() => {
            this.app.setting.open(); this.app.setting.openTabById('hotkeys');
            const hotkeySearchInput = document.querySelector('#hotkey-search');
            if (hotkeySearchInput instanceof HTMLInputElement) { hotkeySearchInput.value = this.plugin.manifest.name; hotkeySearchInput.dispatchEvent(new Event('input')); }
        }));
    new Setting(containerEl).setName('Hint characters').setDesc('Characters to use for hints (order matters, lowercase letters only)')
        .addText(text => text.setPlaceholder(DEFAULT_SETTINGS.hintCharacters).setValue(this.plugin.settings.hintCharacters)
            .onChange(async (value) => {
                const cleaned = [...new Set(value.toLowerCase().replace(/[^a-z]/g, ''))].join('');
                if (cleaned.length > 0) { this.plugin.settings.hintCharacters = cleaned; await this.plugin.saveSettings(); text.setValue(cleaned); }
                else { this.plugin.settings.hintCharacters = DEFAULT_SETTINGS.hintCharacters; await this.plugin.saveSettings(); text.setValue(this.plugin.settings.hintCharacters); new Notice('Hint characters cannot be empty. Reverted to default.'); }
            }));
    
    containerEl.createEl('h3', {text: 'Appearance'});

    new Setting(containerEl).setName('Reset Appearance Settings').setDesc('Resets background color, text color, font size, and opacity to their specified default values.')
        .addButton(button => button.setButtonText('Reset Appearance to Defaults').setWarning(true)
            .onClick(async () => {
                const specificDefaultHintStyle = {
                    backgroundColor: '#FFD700',
                    textColor: '#000000',
                    fontSize: '12px',
                    opacity: '0.75'
                };
                
                const newHintStyle = {
                    ...DEFAULT_SETTINGS.hintStyle, 
                    ...specificDefaultHintStyle
                };
                
                const newSettings = {
                    ...this.plugin.settings,
                    hintStyle: newHintStyle
                };

                await this.plugin.saveSettings(newSettings); 
                
                if (this.bgColorInputComponent) this.bgColorInputComponent.setValue(this.plugin.settings.hintStyle.backgroundColor);
                if (this.textColorInputComponent) this.textColorInputComponent.setValue(this.plugin.settings.hintStyle.textColor);
                if (this.fontSizeInputComponent) this.fontSizeInputComponent.setValue(this.plugin.settings.hintStyle.fontSize);
                if (this.opacitySliderComponent) this.opacitySliderComponent.setValue(parseFloat(this.plugin.settings.hintStyle.opacity));
                
                new Notice('Appearance settings have been reset to the specified defaults.');
            }));

    new Setting(containerEl).setName('Opacity').setDesc('Transparency of hint labels (0.3 = more transparent, 1.0 = fully opaque)')
        .addSlider(slider => { this.opacitySliderComponent = slider; slider.setLimits(0.3, 1.0, 0.05).setValue(parseFloat(this.plugin.settings.hintStyle.opacity || DEFAULT_SETTINGS.hintStyle.opacity)).setDynamicTooltip()
            .onChange(async (value) => { this.plugin.settings.hintStyle.opacity = value.toString(); await this.plugin.saveSettings(); });
        }).addButton(button => button.setButtonText('Reset').setTooltip(`Reset to default opacity (${DEFAULT_SETTINGS.hintStyle.opacity})`)
            .onClick(async () => {
                this.plugin.settings.hintStyle.opacity = DEFAULT_SETTINGS.hintStyle.opacity; 
                await this.plugin.saveSettings();
                if (this.opacitySliderComponent) this.opacitySliderComponent.setValue(parseFloat(DEFAULT_SETTINGS.hintStyle.opacity));
            }));
    new Setting(containerEl).setName('Font size').setDesc('Font size of hint labels (e.g., 12px, 1em, 0.8rem. Numbers alone will have "px" appended)')
        .addText(text => { this.fontSizeInputComponent = text; text.setPlaceholder(DEFAULT_SETTINGS.hintStyle.fontSize).setValue(this.plugin.settings.hintStyle.fontSize || DEFAULT_SETTINGS.hintStyle.fontSize)
            .onChange(async (value) => {
                let finalValue = value.trim();
                if (!finalValue) finalValue = DEFAULT_SETTINGS.hintStyle.fontSize;
                else if (/^\d+(\.\d+)?$/.test(finalValue)) finalValue += 'px';
                this.plugin.settings.hintStyle.fontSize = finalValue; await this.plugin.saveSettings();
                if (finalValue !== value.trim()) text.setValue(finalValue);
            }); text.inputEl.addEventListener('focus', () => { text.inputEl.disabled = false; text.inputEl.readOnly = false; });
        });
    new Setting(containerEl).setName('Background color').setDesc('Background color of hint labels (e.g., #FFD700, gold, rgba(255,215,0,0.8))')
        .addText(text => { this.bgColorInputComponent = text; text.setPlaceholder(DEFAULT_SETTINGS.hintStyle.backgroundColor).setValue(this.plugin.settings.hintStyle.backgroundColor)
            .onChange(async (value) => {
                const trimmedValue = value.trim(); this.plugin.settings.hintStyle.backgroundColor = trimmedValue || DEFAULT_SETTINGS.hintStyle.backgroundColor;
                await this.plugin.saveSettings(); if (trimmedValue !== value || !trimmedValue) text.setValue(this.plugin.settings.hintStyle.backgroundColor);
            });
        });
    new Setting(containerEl).setName('Text color').setDesc('Text color of hint labels (e.g., #000000, black)')
        .addText(text => { this.textColorInputComponent = text; text.setPlaceholder(DEFAULT_SETTINGS.hintStyle.textColor).setValue(this.plugin.settings.hintStyle.textColor)
            .onChange(async (value) => {
                const trimmedValue = value.trim(); this.plugin.settings.hintStyle.textColor = trimmedValue || DEFAULT_SETTINGS.hintStyle.textColor;
                await this.plugin.saveSettings(); if (trimmedValue !== value || !trimmedValue) text.setValue(this.plugin.settings.hintStyle.textColor);
            });
        });
}
}
module.exports = LinkHintsPlugin;
