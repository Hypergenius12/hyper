# SlopCraft 3D — Standalone Desktop Launcher & FPS Optimization Guide

## 🚀 Running as a Standalone Desktop App (.EXE)

You can launch SlopCraft 3D directly from this folder:

1. Double-click **`Slopcraft3D.exe`** (or `Launch-Slopcraft.bat`).
2. It automatically:
   - Ensures the local game server is running in the background.
   - Opens SlopCraft 3D in a dedicated, borderless standalone app window without browser tabs, address bars, or toolbars.
   - Enables high-performance GPU flags (`--enable-gpu-rasterization --ignore-gpu-blocklist --force-high-performance-gpu`).

---

## ⚡ In-Game Settings for Maximum FPS

We have added new performance optimizations directly to the Options menu:

1. **Render Scale (Resolution):**
   - **100% (Balanced):** The new default. Automatically renders at crisp 1:1 resolution instead of lagging on high-DPI/Retina screens.
   - **75% (Performance):** Cuts pixel shader load nearly in half. Perfect for laptops and integrated Intel/AMD graphics.
   - **50% (Fastest):** Maximum possible framerate for low-end hardware.

2. **Minimap Toggle (`M` key or Options Menu):**
   - The minimap performs a second 3D camera pass.
   - We optimized it to draw 70% fewer chunks, but you can also toggle it **OFF** in Options or by pressing **`M`** to instantly gain 20–40% higher FPS!

3. **Render Distance:**
   - Setting Render Distance to **6** or **8** chunks provides great view distance while keeping chunk generation smooth.

4. **Hardware Acceleration Check (If using browser):**
   - In Microsoft Edge or Google Chrome, open `edge://settings/system` or `chrome://settings/system`.
   - Make sure **"Use graphics acceleration when available"** is turned **ON**. If this setting is disabled, WebGL is forced to render on your CPU in software emulation, causing severe lag (2–10 FPS).
