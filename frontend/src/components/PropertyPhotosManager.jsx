import { useState, useEffect, useRef } from 'react';
import { PropertyService } from '../services/propertyService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

export default function PropertyPhotosManager({ propertyId, initialPhotos = [], onPhotosChange }) {
  const toast = useToast();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const inputRef = useRef(null);
  const onPhotosChangeRef = useRef(onPhotosChange);
  onPhotosChangeRef.current = onPhotosChange;

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  useEffect(() => {
    onPhotosChangeRef.current?.(photos);
  }, [photos]);

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos = await PropertyService.uploadPhotos(propertyId, files);
      setPhotos((list) => [...list, ...newPhotos]);
      toast.success(`${newPhotos.length} foto${newPhotos.length > 1 ? 's' : ''} subida${newPhotos.length > 1 ? 's' : ''}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos subir las fotos.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove(photoId) {
    setRemovingId(photoId);
    try {
      await PropertyService.removePhoto(propertyId, photoId);
      setPhotos((list) => list.filter((p) => p.id !== photoId));
    } catch (err) {
      toast.error(getErrorMessage(err, 'No pudimos quitar la foto.'));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
            <img
              src={`${API_ORIGIN}${photo.file_url}`}
              alt="Foto de la propiedad"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              disabled={removingId === photo.id}
              aria-label="Quitar foto"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 font-sans text-xs text-cream opacity-0 transition-opacity hover:bg-terracotta-dark group-hover:opacity-100 disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line font-sans text-xs text-ink/50 transition-colors hover:border-forest hover:text-forest disabled:opacity-50"
        >
          <span className="text-xl">+</span>
          {uploading ? 'Subiendo…' : 'Agregar fotos'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {photos.length === 0 && (
        <p className="mt-2 font-sans text-xs text-ink/40">
          Las propiedades con fotos reciben muchas más consultas.
        </p>
      )}
    </div>
  );
}
