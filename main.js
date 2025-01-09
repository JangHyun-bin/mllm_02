const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      devTools: true
    }
  })

  // React 앱 로드
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, 'build/index.html'),
    protocol: 'file:',
    slashes: true
  })

  win.loadURL(startUrl)

  // 개발자 도구
  win.webContents.openDevTools()

  // 로드 상태 모니터링
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
    // 로드 실패 시 재시도
    if (errorCode === -6) { // ERR_FILE_NOT_FOUND
      console.log('Retrying with localhost:3000...')
      win.loadURL('http://localhost:3000')
    }
  })
}

// 앱 초기화
app.whenReady().then(() => {
  // 환경변수 설정
  process.env.ELECTRON_START_URL = 'http://localhost:3000'
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 