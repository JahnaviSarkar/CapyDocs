Write-Host "Checking if Ollama is running..."
$ollama_running = Get-Process "ollama*" -ErrorAction SilentlyContinue
if (-not $ollama_running) {
    Write-Host "WARNING: Ollama does not seem to be running! Please start Ollama so CapyDocs can generate answers." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

Write-Host "Starting CapyDocs Backend in a new window..."
Start-Process powershell -WorkingDirectory $PSScriptRoot -ArgumentList "-NoExit", "-Command", "cd backend; ..\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 2>&1"

Write-Host "Starting CapyDocs Frontend in a new window..."
Start-Process powershell -WorkingDirectory $PSScriptRoot -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Done! Close the popup windows to stop the servers."
Write-Host "Backend URL: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Frontend URL: http://127.0.0.1:5173" -ForegroundColor Green
