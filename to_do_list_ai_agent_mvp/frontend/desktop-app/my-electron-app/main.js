const { app, BrowserWindow } = require('electron')

try {
  require('electron-reload')(__dirname)
} catch {}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 300,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
  
  // Add this line INSIDE the createWindow function
  win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

