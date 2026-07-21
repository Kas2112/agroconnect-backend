# frontend/update_api.ps1
Write-Host "Updating all API calls..." -ForegroundColor Green

# Create services folder
New-Item -ItemType Directory -Force -Path "src/services" | Out-Null

# Create api.js
$apiContent = @'
// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'https://agroconnect-backend-ki3c.onrender.com';

const api = axios.create({
    baseURL: `${API_URL}/api/`,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
'@

$apiContent | Out-File -FilePath "src/services/api.js" -Encoding utf8

Write-Host "Created src/services/api.js" -ForegroundColor Green

# Update all JSX files
$files = Get-ChildItem -Path "src/pages" -Filter "*.jsx"

foreach ($file in $files) {
    Write-Host "Updating $($file.Name)..." -ForegroundColor Yellow
    
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace import
    $content = $content -replace "import axios from 'axios';", "import api from '../services/api';"
    
    # Replace API calls - removing http://127.0.0.1:8000/api/
    $content = $content -replace 'axios\.get\([''"`]http://127\.0\.0\.1:8000/api/', 'api.get('
    $content = $content -replace 'axios\.post\([''"`]http://127\.0\.0\.1:8000/api/', 'api.post('
    $content = $content -replace 'axios\.put\([''"`]http://127\.0\.0\.1:8000/api/', 'api.put('
    $content = $content -replace 'axios\.delete\([''"`]http://127\.0\.0\.1:8000/api/', 'api.delete('
    
    # Save file
    $content | Set-Content -Path $file.FullName -Encoding utf8
}

Write-Host "All files updated!" -ForegroundColor Green
Write-Host "Done! Now run: git add . && git commit -m 'Update API calls' && git push" -ForegroundColor Cyan