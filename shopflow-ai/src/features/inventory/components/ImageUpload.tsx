import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_MAX_MB } from '../constants';

export interface ImageUploadProps {
  /** Current image (data URL or remote URL). Empty string = none. */
  value: string;
  onChange: (dataUrl: string) => void;
  className?: string;
}

/**
 * Drag-and-drop / click-to-browse image picker used in the product form.
 * Reads the file as a data URL so it works offline and POSTs as JSON later.
 */
export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const readFile = (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }
    if (file.size > IMAGE_UPLOAD_MAX_MB * 1024 * 1024) {
      setError(`Image must be under ${IMAGE_UPLOAD_MAX_MB}MB.`);
      return;
    }

    setIsReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result ?? ''));
      setIsReading(false);
    };
    reader.onerror = () => {
      setError('Could not read that file. Try another image.');
      setIsReading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) readFile(file);
  };

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readFile(file);
    event.target.value = '';
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        onChange={handleSelect}
        className="hidden"
        aria-label="Upload product image"
      />

      {value ? (
        <div className="group relative w-fit">
          <img
            src={value}
            alt="Product preview"
            className="h-28 w-28 rounded-xl border border-border object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              aria-label="Remove image"
              onClick={() => onChange('')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5',
          )}
        >
          {isReading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-xs font-medium text-foreground">
            {isReading ? 'Reading…' : 'Drop an image or click to browse'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            PNG, JPG, WebP · max {IMAGE_UPLOAD_MAX_MB}MB
          </span>
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default ImageUpload;
