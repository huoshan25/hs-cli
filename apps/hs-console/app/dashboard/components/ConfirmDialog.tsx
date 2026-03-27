import { useEffect } from 'react';

type Props = {
  open: boolean;
  title?: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog(props: Props) {
  const { open, title, message, cancelText = '取消', confirmText = '确定', onCancel, onConfirm } = props;
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-overlay open" onClick={onCancel}>
      <div className="confirm-card" onClick={event => event.stopPropagation()}>
        <div className="confirm-main">
          <span className="confirm-icon" aria-hidden="true">!</span>
          <div className="confirm-content">
            {title ? <div className="confirm-title show">{title}</div> : null}
            <div className="confirm-body">{message}</div>
          </div>
        </div>
        <div className="confirm-foot">
          <button className="btn" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
