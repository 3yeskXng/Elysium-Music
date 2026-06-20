@echo off
:: Check if node_modules exists. If not, trigger dependency installation environment.
if not exist node_modules (
    echo [Elysium Launcher] First time setup detected. Installing node dependencies...
    npm install
)
echo [Elysium Launcher] Booting core engine...
cd elysium_ui
npm run dev
pause