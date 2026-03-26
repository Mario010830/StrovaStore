"use client";
import Image from "next/image";
import { toImageProxyUrl } from "@/lib/image";

interface PushDialogProps {
  open: boolean;
  onClose: () => void;
  onActivate: () => void;
  storeName: string;
  storePhotoUrl?: string | null;
}

export function PushDialog({
  open,
  onClose,
  onActivate,
  storeName,
  storePhotoUrl,
}: PushDialogProps) {
  if (!open) return null;

  const proxiedImageUrl = toImageProxyUrl(storePhotoUrl);

  return (
    <div className="push-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="push-dialog-title">
      <div className="push-dialog">
        {proxiedImageUrl && (
          <div className="push-dialog__logo">
            <Image src={proxiedImageUrl} alt="" width={56} height={56} />
          </div>
        )}
        <h2 id="push-dialog-title" className="push-dialog__title">
          ¿Quieres recibir ofertas?
        </h2>
        <p className="push-dialog__body">
          Te avisamos cuando <strong>{storeName}</strong> publique novedades o descuentos.
        </p>
        <div className="push-dialog__actions">
          <button
            type="button"
            className="push-dialog__btn push-dialog__btn--primary"
            onClick={() => {
              onActivate();
              onClose();
            }}
          >
            Activar notificaciones
          </button>
          <button type="button" className="push-dialog__btn push-dialog__btn--secondary" onClick={onClose}>
            No gracias
          </button>
        </div>
      </div>
    </div>
  );
}
