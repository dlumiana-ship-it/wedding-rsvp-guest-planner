'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Check, Image as ImageIcon, Sparkles, X, Heart } from 'lucide-react';

interface GalleryPhoto {
  id: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
  approved: boolean;
}

interface CollaborativeGalleryProps {
  currentUser?: { id: string; name: string };
}

export default function CollaborativeGallery({ currentUser }: CollaborativeGalleryProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(fetchPhotos, 10000); // Poll every 10 seconds for new photos
    return () => clearInterval(interval);
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (res.ok && data.success) {
        // Guests only see approved photos
        setPhotos(data.photos.filter((p: any) => p.approved));
      }
    } catch (e) {
      console.error('Failed to fetch gallery photos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um ficheiro de imagem válido (PNG, JPG, WebP).');
      return;
    }

    // Limit to 2.5MB for Base64 storage
    if (file.size > 2.5 * 1024 * 1024) {
      setError('A imagem é muito grande. Escolha uma foto com menos de 2.5MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
        setUploadedBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedBase64 || !currentUser) return;

    setUploading(true);
    setError('');

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadedBase64,
          uploadedBy: currentUser.name,
          uploadedById: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccess(true);
        setUploadedBase64(null);
        setPreviewUrl(null);
        setTimeout(() => {
          setUploadSuccess(false);
          setShowUploadModal(false);
        }, 2500);
      } else {
        setError(data.error || 'Erro ao carregar a foto.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de rede ao carregar a foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-[#001B3D]/10 rounded-3xl p-6 shadow-xs text-stone-900" id="collaborative-gallery">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-wedding-burgundy" />
            <h3 className="font-serif text-lg text-wedding-navy">Galeria Colaborativa</h3>
          </div>
          <p className="text-[10px] text-stone-400">Capture e partilhe os seus melhores momentos do evento</p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              alert('Por favor, faça login para carregar fotografias.');
              return;
            }
            setShowUploadModal(true);
          }}
          className="px-4 py-2 bg-wedding-navy hover:bg-slate-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" /> Carregar Foto
        </button>
      </div>

      {/* Grid of approved photos */}
      {loading ? (
        <div className="text-center py-16 text-stone-400">
          <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30 animate-spin" />
          <p className="text-xs">A carregar fotos da galeria...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-xs font-medium text-stone-500">Nenhuma fotografia aprovada na galeria ainda.</p>
          <p className="text-[10px] text-stone-400 mt-1">Carregue as suas fotos para que os noivos as possam aprovar e exibir!</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-2xl border border-stone-100 group shadow-xs break-inside-avoid"
            >
              <img
                src={photo.url}
                alt={`Carregada por ${photo.uploadedBy}`}
                className="w-full h-auto object-cover hover:scale-[1.03] transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] font-semibold">{photo.uploadedBy}</p>
                <p className="text-[8px] text-stone-300">{new Date(photo.createdAt).toLocaleDateString('pt-PT')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!uploading) {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                  setUploadedBase64(null);
                  setError('');
                }
              }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative border border-stone-100 z-10 text-stone-900"
            >
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewUrl(null);
                  setUploadedBase64(null);
                  setError('');
                }}
                disabled={uploading}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-lg text-[#001B3D] mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-wedding-burgundy" /> Carregar Foto do Casamento
              </h3>

              {uploadSuccess ? (
                <div className="text-center py-8 flex flex-col items-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-sm text-stone-800 mb-1">Carregado com Sucesso!</h4>
                  <p className="text-xs text-stone-500 max-w-[280px]">
                    Obrigado por partilhar! A sua foto está na fila de aprovação e aparecerá na galeria assim que os noivos a aprovarem.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {previewUrl ? (
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-stone-200">
                      <img src={previewUrl} alt="Visualização do upload" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl(null);
                          setUploadedBase64(null);
                        }}
                        className="absolute top-2 right-2 bg-stone-950/60 hover:bg-stone-950 text-white p-1.5 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('gallery-photo-input')?.click()}
                      className="border-2 border-dashed border-stone-200 hover:border-wedding-burgundy hover:bg-rose-50/5 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300"
                    >
                      <Upload className="w-6 h-6 mx-auto text-stone-400 mb-2" />
                      <p className="text-xs font-semibold text-stone-700">Clique para selecionar uma foto</p>
                      <p className="text-[10px] text-stone-400 mt-1">PNG, JPG, WebP (Máx. 2.5MB)</p>
                      <input
                        type="file"
                        id="gallery-photo-input"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-center font-medium">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        setPreviewUrl(null);
                        setUploadedBase64(null);
                        setError('');
                      }}
                      disabled={uploading}
                      className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!uploadedBase64 || uploading}
                      className="px-5 py-2 bg-wedding-navy hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold tracking-wider uppercase shadow-md flex items-center gap-1.5"
                    >
                      {uploading ? 'Carregando...' : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-wedding-gold" /> Enviar para Aprovação
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
