const { app, BrowserWindow, Notification } = require('electron')

try {
  require('electron-reload')(__dirname)
} catch {}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 370,
    height: 580,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
  
  // Add this line INSIDE the createWindow function
  win.webContents.openDevTools()
  
  // Request notification permission on macOS
  if (process.platform === 'darwin') {
    app.setAppUserModelId('com.yourapp.potatodo')
  }
}

app.whenReady().then(() => {
  createWindow()
  
  // Check if notifications are supported
  if (Notification.isSupported()) {
    console.log('Notifications are supported')
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
