import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { ImageViewer } from './image-viewer';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  showViewer?: boolean;
  fallback?: string;
  loading?: 'lazy' | 'eager';
}

export function ImagePreview({
  src,
  alt = "Imagem",
  className = "",
  width,
  height,
  showViewer = true,
  fallback = "/placeholder.svg",
  loading = "lazy"
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (loading === 'lazy' && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      setIsInView(true);
    }
  }, [loading]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleClick = () => {
    if (showViewer && !hasError) {
      setIsViewerOpen(true);
    }
  };

  const imageSrc = hasError ? fallback : (isInView ? src : '');
  const shouldShowViewer = showViewer && !hasError && !isLoading;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Container da imagem */}
      <div
        ref={imgRef}
        className={`relative overflow-hidden rounded-lg border border-gray-200 ${
          shouldShowViewer ? 'cursor-pointer hover:border-gray-300' : ''
        } transition-all duration-200`}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          minHeight: height ? `${height}px` : '200px'
        }}
        onClick={handleClick}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">Erro ao carregar imagem</p>
            </div>
          </div>
        )}

        {/* Image */}
        {imageSrc && (
          <img
            src={imageSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
          />
        )}

        {/* Overlay para visualização */}
        {shouldShowViewer && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {shouldShowViewer && (
        <ImageViewer
          images={[src]}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          title={alt}
        />
      )}
    </div>
  );
}

// Componente para múltiplas imagens com preview
interface MultiImagePreviewProps {
  images: string[];
  maxVisible?: number;
  className?: string;
  showViewer?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MultiImagePreview({
  images,
  maxVisible = 4,
  className = "",
  showViewer = true,
  size = 'md'
}: MultiImagePreviewProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setIsViewerOpen(true);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {visibleImages.map((image, index) => (
        <div
          key={index}
          className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden border border-gray-200 ${
            showViewer ? 'cursor-pointer hover:border-gray-300' : ''
          } transition-all duration-200`}
          onClick={() => showViewer && handleImageClick(index)}
        >
          <img
            src={image}
            alt={`Imagem ${index + 1}`}
            className="w-full h-full object-cover"
          />
          
          {showViewer && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
            </div>
          )}

          {/* Indicador de mais imagens */}
          {index === maxVisible - 1 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Image Viewer */}
      {showViewer && (
        <ImageViewer
          images={images}
          initialIndex={selectedIndex}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          title="Galeria de Imagens"
        />
      )}
    </div>
  );
}
