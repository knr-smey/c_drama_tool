const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let pythonProcess = null;
const BACKEND_PORT = process.env.KHMERDUB_PORT || 8080;
const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged;

function findPythonBinary() {
  const rootDir = path.resolve(__dirname, '..');
  const venvPython = path.join(rootDir, '.venv', 'bin', 'python');
  const venvWindows = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
  
  const fs = require('fs');
  if (process.platform === 'win32' && fs.existsSync(venvWindows)) {
    return venvWindows;
  }
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function startPythonBackend() {
  const rootDir = path.resolve(__dirname, '..');
  const pythonBin = findPythonBinary();
  const serverScript = path.join(rootDir, 'server.py');

  console.log(`[Electron] Launching Python backend with: ${pythonBin} ${serverScript}`);

  const env = {
    ...process.env,
    KHMERDUB_PORT: String(BACKEND_PORT),
    KHMERDUB_HOST: '127.0.0.1',
    PYTHONUNBUFFERED: '1',
  };

  pythonProcess = spawn(pythonBin, [serverScript], {
    cwd: rootDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Err] ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`[Electron] Python backend exited with code ${code}`);
    pythonProcess = null;
  });
}

function waitForBackend(url, timeoutMs = 25000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', () => retry());
      req.end();
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        console.warn(`[Electron] Backend health check timed out. Proceeding anyway.`);
        resolve(false);
      } else {
        setTimeout(check, 350);
      }
    };

    check();
  });
}

function stopPythonBackend() {
  if (pythonProcess) {
    console.log('[Electron] Shutting down Python backend process...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(pythonProcess.pid), '/f', '/t']);
      } else {
        pythonProcess.kill('SIGTERM');
        setTimeout(() => {
          if (pythonProcess) {
            try { pythonProcess.kill('SIGKILL'); } catch (e) {}
          }
        }, 1500);
      }
    } catch (err) {
      console.error('[Electron] Error killing python process:', err);
    }
    pythonProcess = null;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    title: 'KhmerDubStudio - AI Video Dubbing Studio',
    backgroundColor: '#09090b',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  const healthUrl = `http://127.0.0.1:${BACKEND_PORT}/api/health`;
  await waitForBackend(healthUrl);

  const startUrl = IS_DEV
    ? (process.env.NEXT_DEV_URL || 'http://localhost:3000')
    : `http://127.0.0.1:${BACKEND_PORT}`;

  console.log(`[Electron] Loading UI at: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'mov', 'webm', 'avi'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('close-app', () => {
  stopPythonBackend();
  app.quit();
});

ipcMain.handle('open-path', async (_, targetPath) => {
  if (targetPath) {
    shell.openPath(targetPath);
  }
});

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  } else {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopPythonBackend();
});
