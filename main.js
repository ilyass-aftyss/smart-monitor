const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pyProc = null;
let mainWindow;

// Fonction pour lancer votre backend Python
function startBackend() {
  // Chemin vers votre exe (généré par PyInstaller)
  const pyExecutable = path.join(__dirname, 'mock_backend.exe'); 
  
  pyProc = spawn(pyExecutable, [], {
    detached: true,
    stdio: 'ignore'
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Charge votre frontend React (buildé)
  mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
}

app.on('ready', () => {
  startBackend();
  // Petit délai pour laisser le temps au backend de démarrer avant la fenêtre
  setTimeout(createWindow, 2000);
});

app.on('will-quit', () => {
  if (pyProc) pyProc.kill(); // Tue le processus Python à la fermeture
});