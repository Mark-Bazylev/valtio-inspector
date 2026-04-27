# Valtio Inspector

A real-time, Redux-style DevTools inspector for [Valtio](https://github.com/pmndrs/valtio).

Track state mutations, time-travel through history, view precise object diffs, and inspect your stores in a dedicated Chrome DevTools panel or a standalone floating window.

## Features

* **Live State Tree:** Expandable/collapsible JSON tree view of all your connected Valtio stores.
* **Smart Filtering:** Hide/show class methods and functions to keep your data view clean.
* **History & Time Travel:** Automatically logs your last 50 state changes. Click on any historical state to instantly restore your app to that point in time.
* **Action Diffs:** See exactly what changed in every update with color-coded (Added/Removed) diffs.
* **Standalone Window:** Right-click anywhere on your page to pop out the inspector into a dedicated floating window (just like Redux DevTools).
* **Read-Only Detection:** Automatically flags derived or read-only stores and disables time-travel for them to prevent app crashes.

## Installation (Coming Soon)

The official Chrome Extension is currently undergoing Google's review process and will be published shortly!

> **[Link to Chrome Web Store (Coming Soon) ⏳](#)**

##  How to Connect Your App

*(Add a quick snippet here showing how developers import your bridge function into their React/Vanilla code to send data to the extension, e.g., wrapping their store or calling an initialization function).*

```typescript
// Example:
import { proxy } from 'valtio';
import { inspectStore } from 'valtio-inspector';

const myStore = proxy({ count: 0 });

// THIS LINE HERE:
inspectStore('myStore', myStore);