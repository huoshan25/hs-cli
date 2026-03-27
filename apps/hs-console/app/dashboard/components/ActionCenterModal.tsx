type Props = {
  open: boolean;
  busy: boolean;
  canRun: boolean;
  log: string;
  onClose: () => void;
  onValidate: () => void;
  onArchive: () => void;
};

export function ActionCenterModal(props: Props) {
  const { open, busy, canRun, log, onClose, onValidate, onArchive } = props;
  if (!open) return null;

  return (
    <div className="palette-mask" onClick={onClose}>
      <div className="palette-card action-center-card" onClick={e => e.stopPropagation()}>
        <div className="palette-head">
          <div className="modal-title action-center-title">动作中心</div>
        </div>
        <div className="action-center-body">
          <div className="actions mb-2">
            <button className="btn-primary" disabled={busy || !canRun} onClick={onValidate}>严格验证</button>
            <button disabled={busy || !canRun} onClick={onArchive}>确认归档</button>
          </div>
          <pre className="action-log">{log || '执行结果将显示在这里'}</pre>
        </div>
      </div>
    </div>
  );
}
