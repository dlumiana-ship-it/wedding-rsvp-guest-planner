@echo off
title Portal de Casamento: Lumiana & Vicente - Inicializador
color 0F
cls
echo ==========================================================
echo    PORTAL DE CASAMENTO - LUMIANA & VICENTE
echo ==========================================================
echo    [1] Iniciar em Modo de Desenvolvimento (Porta 3000)
echo    [2] Iniciar em Modo de Producao (Porta 3000)
echo    [3] Executar Compilacao de Producao (Build)
echo    [4] Abrir Visualizador de Base de Dados (Prisma Studio)
echo    [5] Limpar Processos Travados (Libertar Porta 3000)
echo    [6] Sair
echo ==========================================================
echo.
set /p op="Selecione uma opcao [1-6]: "

if "%op%"=="1" goto DEV
if "%op%"=="2" goto PROD
if "%op%"=="3" goto BUILD
if "%op%"=="4" goto STUDIO
if "%op%"=="5" goto KILL
if "%op%"=="6" goto EXIT

:DEV
echo.
echo [INFO] Limpando processos Node antigos para evitar conflitos...
taskkill /F /IM node.exe >nul 2>&1
echo [INFO] A iniciar servidor de desenvolvimento...
set NODE_OPTIONS=--max-old-space-size=2048
npm run dev
goto EXIT

:PROD
echo.
echo [INFO] Limpando processos Node antigos...
taskkill /F /IM node.exe >nul 2>&1
echo [INFO] A iniciar servidor de producao...
set NODE_OPTIONS=--max-old-space-size=2048
npm run start
goto EXIT

:BUILD
echo.
echo [INFO] A iniciar compilacao de producao otimizada...
set NODE_OPTIONS=--max-old-space-size=2048
npx next build
echo.
echo [OK] Compilacao concluida!
pause
goto EXIT

:STUDIO
echo.
echo [INFO] A iniciar Prisma Studio na porta 5555...
npx prisma studio
goto EXIT

:KILL
echo.
echo [INFO] A encerrar todos os processos Node.exe ativos...
taskkill /F /IM node.exe
echo.
echo [OK] Porta 3000 libertada com sucesso!
pause
goto EXIT

:EXIT
exit
