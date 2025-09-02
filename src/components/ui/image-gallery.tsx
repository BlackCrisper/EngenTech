import React from 'react';
import { Image as ImageIcon, Play } from 'lucide-react';
import { ImageViewer } from './image-viewer';

interface ImageGalleryProps {
  images: string[];
  title?: string;
  maxColumns?: number;
  showCount?: boolean;
  className?: string;
}

export function ImageGallery({ 
  images, 
  title, 
  maxColumns = 4, 
  showCount = true,
  className = "" 
}: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerOpen(true);
  };

  const getGridCols = () => {
    if (images.length === 1) return 'grid-cols-1';
    if (images.length === 2) return 'grid-cols-2';
    if (images.length === 3) return 'grid-cols-3';
    return `grid-cols-2 md:grid-cols-${Math.min(maxColumns, 4)} lg:grid-cols-${Math.min(maxColumns, 6)}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      {(title || showCount) && (
        <div className="flex items-center justify-between">
          {title && (
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">{title}</span>
            </div>
          )}
          {showCount && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
            </span>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      <div className={`grid ${getGridCols()} gap-2`}>
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group aspect-square overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
            onClick={() => handleImageClick(index)}
          >
            {/* Image */}
            <img
              src={image}
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Image Counter (for multiple images) */}
            {images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                {index + 1}
              </div>
            )}

            {/* Play Icon for Videos (if needed in the future) */}
            {image.includes('.mp4') && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-3">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Viewer */}
      <ImageViewer
        images={images}
        initialIndex={selectedImageIndex}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={title || 'Galeria de Imagens'}
      />
    </div>
  );
}

// Componente para exibir uma única imagem com preview
export function SingleImage({ 
  image, 
  alt = "Imagem", 
  className = "",
  showViewer = true 
}: { 
  image: string; 
  alt?: string; 
  className?: string;
  showViewer?: boolean;
}) {
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);

  if (!image) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`relative group overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 ${
          showViewer ? 'cursor-pointer' : ''
        }`}
        onClick={() => showViewer && setIsViewerOpen(true)}
      >
        <img
          src={image}
          alt={alt}
          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-200"
        />
        
        {showViewer && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        )}
      </div>

      {showViewer && (
        <ImageViewer
          images={[image]}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          title={alt}
        />
      )}
    </div>
  );
}
