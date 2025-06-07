# Link Hints for Obsidian



Navigate much of Obsidian with only your keyboard!  Explore your Obsidian vault with unparalleled speed and precision using keyboard-based hints for all clickable elements! Inspired by browser extensions like Vimium, this plugin allows you to quickly jump to links, buttons, tabs, and other UI elements without touching your mouse.



## Features

*   **Universal Hinting:** Display short, unique character sequences (hints) next to just about every clickable element on your screen.
*   **Keyboard-First Navigation:** Type the characters of a hint to instantly click the corresponding element.
*   **Intelligent Hinting:**
    *   Supports single and multi-character hints.
    *   Use `Backspace` to correct typos in your input.
    *   Press `Escape` to cancel the hinting mode.
    *   Automatic click on unique match or after a short delay if multiple longer hints are possible.
*   **Comprehensive Element Support:** Works with:
    *   Internal and external links (Live Preview, Reading Mode)
    *   Editor links and URLs
    *   Buttons, tabs, and icons across the Obsidian interface
    *   Checkboxes/task items
    *   Outline items
    *   And many more UI elements!
*   **Highly Customizable:**
    *   **Hotkey:** Set your preferred hotkey to activate link hints (via Obsidian's Hotkey settings).
    *   **Hint Characters:** Define the set and order of characters used to generate hints (e.g., `asdfghjkl`).
    *   **Appearance:**
        *   **Opacity:** Adjust the transparency of hint labels.
        *   **Font Size:** Set the font size for hint labels.
        *   **Background Color:** Choose the background color of the hints.
        *   **Text Color:** Select the text color for the hints.
        *   **Reset Appearance:** A dedicated button to quickly reset appearance settings to their optimal defaults:
            *   Background Color: `#FFD700` (Gold)
            *   Text Color: `#000000` (Black)
            *   Font Size: `12px`
            *   Opacity: `0.75`

## How to Use

1.  **Activate Hints:**
    *   Press the configured hotkey (default is `Ctrl+Shift+L`, but it's recommended to check/set this in `Obsidian Settings` → `Hotkeys`).
    *   Hint labels will appear next to all clickable elements.



2.  **Select an Element:**
    *   Type the character(s) displayed in the hint label for the element you want to click.
    *   The typed characters will be highlighted in the hints.
    *   If your input uniquely identifies an element, it will be clicked immediately.
    *   If your input is a prefix for multiple hints (e.g., you type "a" and there are hints "a", "ab", "ac"), the plugin will wait for a short moment. If you don't type another character, the element corresponding to "a" will be clicked. If you type "b", the "ab" element will be targeted.


3.  **Interacting:**
    *   **`Escape` key:** Press `Escape` at any time to dismiss the hints and cancel the operation.
    *   **`Backspace` key:** Press `Backspace` to delete the last character you typed if you make a mistake.

## Settings

You can customize the Link Hints plugin by going to `Obsidian Settings` → `Community Plugins` → `Link Hints`.

*   **Hotkey:**
    *   A button is provided to directly take you to Obsidian's Hotkey settings. Search for "Link Hints: Show link hints" to configure your preferred hotkey.
*   **Hint characters:**
    *   A string of lowercase letters to use for generating hints. The order matters for shorter hints.
    *   Example: `asdfghjklqwertyuiopzxcvbnm`
    *   Only unique, lowercase letters are accepted. Invalid characters will be stripped.
*   **Appearance:**
    *   **Reset Appearance Settings:** Click this button to reset all appearance settings below to their specific defaults:
        *   Background Color: `#FFD700`
        *   Text Color: `#000000`
        *   Font Size: `12px`
        *   Opacity: `0.75`
    *   **Opacity:** A slider to control the transparency of the hint labels (0.3 for more transparent, 1.0 for fully opaque). Includes a reset button for this specific setting.
    *   **Font size:** Input field for the font size of hint labels (e.g., `12px`, `1em`). Numbers alone will have `px` appended.
    *   **Background color:** Input field for the background color of hints (e.g., `#FFD700`, `gold`).
    *   **Text color:** Input field for the text color of hints (e.g., `#000000`, `black`).



## Installation

### From within Obsidian

1.  Open **Settings** in Obsidian.
2.  Go to **Community plugins**.
3.  Make sure **Restricted mode** is **off**.
4.  Click **Browse** community plugins.
5.  Search for "Link Hints" (or the name you publish it under).
6.  Click **Install**.
7.  Once installed, click **Enable**.

### Manual Installation (Not Recommended for most users)

1.  Download the latest release files (`main.js`, `manifest.json`, `styles.css` if present) from the Releases page of this GitHub repository.
2.  Go to your Obsidian vault's configuration folder: `<VaultFolder>/.obsidian/plugins/`.
3.  Create a new folder named `your-plugin-id` (e.g., `link-hints`).
4.  Copy the downloaded files into this new folder.
5.  Reload Obsidian (or disable and re-enable the plugin if it was already partially installed).

## Compatibility

*   **Minimum Obsidian Version:** `0.12.0'
*   Works on Desktop and Mobile.

## Reporting Issues & Contributing

If you find any bugs, have feature requests, or would like to contribute, please feel free to:

*   Open an issue on the [GitHub repository](https://github.com/your-github-username/your-plugin-repository-name/issues).
*   Submit a pull request with your improvements.

## License

This plugin is licensed under the [MIT License](LICENSE).

## Acknowledgements

*   Inspired by Vimium and other similar browser extensions for keyboard-based navigation.

---

Happy Hinting!
