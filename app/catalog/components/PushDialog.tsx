"use client";

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

  const imagePath = storePhotoUrl
    ? storePhotoUrl.replace(
        process.env.NEXT_PUBLIC_TUNNEL_URL ?? "https://dark-boats-feel.loca.lt",
        "",
      )
    : "";
  const proxiedImageUrl = imagePath ? `/api/image?path=${imagePath}` : null;

  return (
    <div className="push-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="push-dialog-title">
      <div className="push-dialog">
        <h2 id="push-dialog-title" className="push-dialog__title">
          ¿Querés recibir ofertas?
        </h2>
        <p className="push-dialog__body">
          Te avisamos cuando <strong>{storeName}</strong> publique novedades o descuentos.
        </p>
        {proxiedImageUrl && (
          <div className="push-dialog__logo">
            <img src={proxiedImageUrl} alt="" width={64} height={64} />
          </div>
        )}
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
