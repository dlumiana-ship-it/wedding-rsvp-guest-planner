'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode, Camera, CheckCircle2, XCircle, User, MapPin,
  Utensils, RefreshCw, X, Zap, Clock, List
} from 'lucide-react';

interface ScanResult {
  id: string;
  name: string;
  tableId?: number | null;
  side?: string;
  diet?: string;
  checkIn?: boolean;
  message: string;
  success: boolean;
  timestamp: Date;
}

export default function QRScannerPanel() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);

  const html5QrCodeRef = useRef<any>(null);
  const lastScannedRef = useRef<string | null>(null); // debounce duplicate scans

  const processQrData = useCallback(async (qrData: string) => {
    // Debounce — ignore if same code within 3s
    if (lastScannedRef.current === qrData) return;
    lastScannedRef.current = qrData;
    setTimeout(() => { lastScannedRef.current = null; }, 3000);

    setLoading(true);
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData }),
      });
      const data = await res.json();

      const result: ScanResult = {
        id: qrData,
        name: data.guest?.name || 'Desconhecido',
        tableId: data.guest?.tableId,
        side: data.guest?.side,
        diet: data.guest?.diet,
        checkIn: data.guest?.checkIn,
        message: data.message || (data.success ? 'Check-in realizado!' : 'Convite não localizado.'),
        success: data.success,
        timestamp: new Date(),
      };

      setLastResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 19)]); // Keep last 20
    } catch (err) {
      const result: ScanResult = {
        id: qrData,
        name: 'Erro de ligação',
        message: 'Não foi possível verificar o convite. Verifique a ligação.',
        success: false,
        timestamp: new Date(),
      };
      setLastResult(result);
    } finally {
      setLoading(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setLastResult(null);
    setScanning(true);
  }, []);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
    setScanning(false);
  }, []);

  // Start camera when scanning = true
  useEffect(() => {
    if (!scanning) return;

    let mounted = true;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!mounted) return;

      const qrCode = new Html5Qrcode('qr-scanner-container');
      html5QrCodeRef.current = qrCode;

      qrCode.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        (decodedText) => {
          processQrData(decodedText);
        },
        () => { /* scan frame errors are normal */ }
      ).catch((err: any) => {
        if (!mounted) return;
        const msg = String(err).toLowerCase();
        if (msg.includes('permission') || msg.includes('notallowed')) {
          setCameraError('Permissão de câmera negada. Autorize nas definições do browser.');
        } else if (msg.includes('notfound') || msg.includes('no camera')) {
          setCameraError('Nenhuma câmera detetada neste dispositivo.');
        } else {
          setCameraError('Não foi possível iniciar a câmera. Tente novamente.');
        }
        setScanning(false);
      });
    });

    return () => {
      mounted = false;
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [scanning, processQrData]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      processQrData(manualId.trim());
      setManualId('');
      setShowManual(false);
    }
  };

  const checkedInToday = scanHistory.filter(s => s.success).length;

  return (
    <div className="bg-white rounded-3xl border border-[#001B3D]/10 shadow-xs overflow-hidden" id="qr-scanner-panel">

      {/* Header bar */}
      <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-wedding-navy rounded-xl flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-wedding-navy">Leitura de QR Code</h3>
            <p className="text-[10px] text-stone-500">Check-in de convidados por QR Code</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {scanHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(h => !h)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showHistory ? 'bg-wedding-navy text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Histórico ({scanHistory.length})
            </button>
          )}
          <button
            onClick={() => setShowManual(m => !m)}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-semibold transition-colors"
          >
            ID Manual
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Stats strip */}
        {scanHistory.length > 0 && (
          <div className="flex items-center gap-4 mb-6 p-3 bg-stone-50 rounded-xl border border-stone-100">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-stone-700">{checkedInToday} check-ins</span>
            </div>
            <div className="w-px h-4 bg-stone-200" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-xs text-stone-500">
                Último: {scanHistory[0]?.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Manual input */}
        <AnimatePresence>
          {showManual && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleManualSubmit}
              className="mb-6 overflow-hidden"
            >
              <div className="flex gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <input
                  autoFocus
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  placeholder="Cole ou escreva o ID do convidado..."
                  className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-wedding-navy font-mono"
                />
                <button type="submit" disabled={!manualId.trim()}
                  className="px-4 py-2 bg-wedding-navy text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                  Verificar
                </button>
                <button type="button" onClick={() => setShowManual(false)}
                  className="p-2 text-stone-400 hover:text-stone-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Main scanner area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Camera */}
          <div className="flex flex-col gap-4">
            <div className={`relative rounded-2xl overflow-hidden bg-stone-900 aspect-square flex items-center justify-center ${
              scanning ? 'ring-2 ring-wedding-gold ring-offset-2' : ''
            }`}>
              {/* Camera container (always mounted but hidden when not scanning) */}
              <div
                id="qr-scanner-container"
                className={`absolute inset-0 ${scanning ? 'block' : 'hidden'}`}
              />

              {/* Overlay when not scanning */}
              {!scanning && (
                <div className="flex flex-col items-center justify-center gap-4 text-white p-8 text-center">
                  <div className="w-20 h-20 rounded-2xl border-2 border-white/20 flex items-center justify-center bg-white/5">
                    <Camera className="w-10 h-10 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Câmera desligada</p>
                    <p className="text-[10px] text-white/40 mt-1">Clique em "Iniciar Scanner" para activar</p>
                  </div>
                </div>
              )}

              {/* Scanning overlay — crosshair */}
              {scanning && !loading && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="relative w-52 h-52">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-wedding-gold rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-wedding-gold rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-wedding-gold rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-wedding-gold rounded-br-lg" />
                    {/* Scanning line animation */}
                    <motion.div
                      animate={{ top: ['10%', '85%', '10%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-2 right-2 h-0.5 bg-wedding-gold/70 shadow-[0_0_8px_rgba(197,168,128,0.8)]"
                    />
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white text-xs">A verificar convite...</p>
                  </div>
                </div>
              )}

              {/* Camera error */}
              {cameraError && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 p-6">
                  <div className="text-center">
                    <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                    <p className="text-white text-xs leading-relaxed">{cameraError}</p>
                    <button onClick={() => { setCameraError(null); startScanner(); }}
                      className="mt-4 px-4 py-2 bg-white text-stone-900 rounded-lg text-xs font-semibold">
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}

              {/* Live badge */}
              {scanning && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-white text-[9px] font-bold tracking-wider uppercase">LIVE</span>
                </div>
              )}
            </div>

            {/* Start/Stop button */}
            <button
              onClick={scanning ? stopScanner : startScanner}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                scanning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-wedding-navy hover:bg-slate-800 text-white'
              }`}
            >
              {scanning ? (
                <><X className="w-4 h-4" /> Parar Scanner</>
              ) : (
                <><Camera className="w-4 h-4" /> Iniciar Scanner</>
              )}
            </button>
          </div>

          {/* Right — Result + History */}
          <div className="flex flex-col gap-4">
            {/* Last result card */}
            <AnimatePresence mode="wait">
              {lastResult ? (
                <motion.div
                  key={lastResult.timestamp.toISOString()}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`rounded-2xl border-2 p-5 ${
                    lastResult.success
                      ? 'bg-green-50 border-green-300'
                      : 'bg-rose-50 border-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {lastResult.success ? (
                      <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-semibold text-base ${lastResult.success ? 'text-green-800' : 'text-rose-800'}`}>
                        {lastResult.success ? 'Check-in Confirmado ✓' : 'Convite Não Localizado'}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {lastResult.timestamp.toLocaleTimeString('pt-PT')}
                      </p>
                    </div>
                  </div>

                  {lastResult.success && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span className="font-semibold text-stone-800 text-sm">{lastResult.name}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          lastResult.side === 'Bride'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {lastResult.side === 'Bride' ? '♥ Noiva' : '♦ Noivo'}
                        </span>
                      </div>
                      {lastResult.tableId && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-stone-500" />
                          <span className="text-sm text-stone-700">Mesa <strong>{lastResult.tableId}</strong></span>
                        </div>
                      )}
                      {lastResult.diet && lastResult.diet !== 'Nenhuma' && (
                        <div className="flex items-center gap-2">
                          <Utensils className="w-3.5 h-3.5 text-stone-500" />
                          <span className="text-sm text-stone-700">{lastResult.diet}</span>
                        </div>
                      )}
                      <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
                        lastResult.checkIn
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {lastResult.message}
                      </div>
                    </div>
                  )}

                  {!lastResult.success && (
                    <p className="text-sm text-rose-700 mt-2">{lastResult.message}</p>
                  )}

                  <button
                    onClick={() => setLastResult(null)}
                    className="mt-4 w-full py-2 text-xs text-stone-500 hover:text-stone-800 border border-stone-200 rounded-lg flex items-center justify-center gap-1.5 hover:bg-stone-50 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Pronto para próximo
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border-2 border-dashed border-stone-200 p-8 flex flex-col items-center justify-center text-center flex-1 min-h-48"
                >
                  <QrCode className="w-12 h-12 text-stone-200 mb-3" />
                  <p className="text-stone-400 text-sm font-medium">Aguardando leitura</p>
                  <p className="text-stone-300 text-xs mt-1">
                    {scanning ? 'Aponte a câmera ao QR Code do convidado' : 'Inicie o scanner para fazer check-in'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan history */}
            <AnimatePresence>
              {showHistory && scanHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border border-stone-100 overflow-hidden">
                    <div className="px-3 py-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Últimos Check-ins
                      </span>
                      <button onClick={() => setScanHistory([])}
                        className="text-[9px] text-rose-500 hover:text-rose-700 font-semibold">
                        Limpar
                      </button>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-stone-50">
                      {scanHistory.map((s, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                          {s.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate">{s.name}</p>
                            {s.tableId && (
                              <p className="text-[9px] text-stone-400">Mesa {s.tableId}</p>
                            )}
                          </div>
                          <span className="text-[9px] text-stone-400 shrink-0">
                            {s.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
