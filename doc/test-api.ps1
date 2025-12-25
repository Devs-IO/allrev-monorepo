# Script para testar o fluxo completo de login e acesso ao perfil

$baseUrl = "http://localhost:3000"

Write-Host "`n=== Testando API AllRev ===" -ForegroundColor Cyan

# 1. Testar se servidor está rodando
Write-Host "`n1. Verificando servidor..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Servidor respondendo" -ForegroundColor Green
} catch {
    Write-Host "✗ Servidor não está rodando em $baseUrl" -ForegroundColor Red
    exit 1
}

# 2. Fazer login
Write-Host "`n2. Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@allrev.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Login bem-sucedido" -ForegroundColor Green
    Write-Host "  Token: $($loginResponse.accessToken.Substring(0,20))..." -ForegroundColor Gray
    Write-Host "  Usuário: $($loginResponse.user.name)" -ForegroundColor Gray
    $token = $loginResponse.accessToken
} catch {
    Write-Host "✗ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Detalhe: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# 3. Acessar /users/profile com o token
Write-Host "`n3. Acessando /users/profile..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers
    Write-Host "✓ Perfil carregado com sucesso!" -ForegroundColor Green
    Write-Host "  Nome: $($profile.name)" -ForegroundColor Gray
    Write-Host "  Email: $($profile.email)" -ForegroundColor Gray
    Write-Host "  Role: $($profile.role)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao carregar perfil" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Mensagem: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# 4. Testar /users/me
Write-Host "`n4. Acessando /users/me..." -ForegroundColor Yellow
try {
    $me = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method GET -Headers $headers
    Write-Host "✓ Dados do usuário carregados!" -ForegroundColor Green
    Write-Host "  ID: $($me.id)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erro ao carregar /users/me" -ForegroundColor Red
    Write-Host "  Detalhe: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n=== Teste concluído ===" -ForegroundColor Cyan
