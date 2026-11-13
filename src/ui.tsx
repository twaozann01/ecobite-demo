import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { ArrowLeft, ChevronRight, Leaf, Minus, Plus, Star } from 'lucide-react';
import { fmt, pct, type Item } from './data';

/* Bộ component dùng chung: mọi màn chỉ ghép từ đây để style đồng bộ. */

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/* ── nút ── */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'soft' | 'text';
  size?: 'lg' | 'md' | 'sm';
  block?: boolean;
  grow?: boolean;
  icon?: ReactNode;
};
export function Button({ variant = 'primary', size = 'md', block, grow, icon, className, children, ...p }: BtnProps) {
  return (
    <button {...p} className={cx('btn', variant, size, block && 'block', grow && 'grow', className)}>
      {icon}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Pill({ on, icon, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean; icon?: ReactNode }) {
  return (
    <button {...p} className={cx('pill', on && 'on', className)}>
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ variant = 'plain', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'plain' | 'filled' | 'float' }) {
  return <button {...p} className={cx('icon-btn', variant, className)} />;
}

export function Chip({ tone = 'brand', icon, children }: { tone?: 'brand' | 'warn' | 'muted' | 'danger'; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={cx('chip', tone)}>
      {icon}
      {children}
    </span>
  );
}

/* ── bố cục ── */
export function Stack({ children, gap = 'md', className }: { children: ReactNode; gap?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <div className={cx('stack', 'gap-' + gap, className)}>{children}</div>;
}
export function Row({ children, between, wrap, className }: { children: ReactNode; between?: boolean; wrap?: boolean; className?: string }) {
  return <div className={cx('row', between && 'between', wrap && 'wrap', className)}>{children}</div>;
}
export function Card({ children, onClick, tone, className }: { children: ReactNode; onClick?: () => void; tone?: 'selected' | 'unread'; className?: string }) {
  const c = cx('card', tone, onClick && 'clickable', className);
  return onClick ? (
    <button className={c} onClick={onClick}>
      {children}
    </button>
  ) : (
    <div className={c}>{children}</div>
  );
}
export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('muted', className)}>{children}</p>;
}
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}
export function Empty({ children, icon, action }: { children: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon ?? <Leaf size={30} />}</span>
      <p>{children}</p>
      {action}
    </div>
  );
}
/** Vùng cuộn chính của một màn, kèm footer dính đáy (nếu có). */
export function Page({ children, footer, flush }: { children: ReactNode; footer?: ReactNode; flush?: boolean }) {
  return (
    <>
      <div className={cx('scroll', !flush && 'pad')}>{children}</div>
      {footer}
    </>
  );
}
export function Footer({ children }: { children: ReactNode }) {
  return <footer className="cta">{children}</footer>;
}

/* ── thanh trên (nền sáng) ── */
export function TopBar({ title, sub, onBack, right, lead }: { title: ReactNode; sub?: ReactNode; onBack?: () => void; right?: ReactNode; lead?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack && (
        <IconButton onClick={onBack} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </IconButton>
      )}
      {lead}
      <div className="topbar-title">
        <h1>{title}</h1>
        {sub && <span>{sub}</span>}
      </div>
      {right}
    </header>
  );
}

/* ── lớp phủ dạng sheet ── */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

/* ── form ── */
export function Field({ label, error, required, hint, suffix, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string; suffix?: string }) {
  return (
    <label className="field">
      {label && (
        <span className="label">
          {label}
          {required && <span className="req"> *</span>}
        </span>
      )}
      <span className={cx('input-wrap', error && 'invalid')}>
        <input {...p} className="input" aria-invalid={!!error} />
        {suffix && <span className="suffix">{suffix}</span>}
      </span>
      {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}
export function TextArea({ label, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      <textarea {...p} className="input area" />
    </label>
  );
}
export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <p className="label">
      {children}
      {required && <span className="req"> *</span>}
    </p>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={cx('switch', on && 'on')} onClick={() => onChange(!on)} aria-label={label} role="switch" aria-checked={on} />;
}

export function Stepper({ value, min = 1, max, onChange }: { value: number; min?: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="qty">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Giảm">
        <Minus size={16} />
      </button>
      <b>{value}</b>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Tăng">
        <Plus size={16} />
      </button>
    </div>
  );
}

export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  if (!onChange)
    return (
      <span className="stars-sm" aria-label={`${value} sao`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={13} className={n <= value ? 'star on' : 'star'} />
        ))}
      </span>
    );
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} sao`}>
          <Star size={34} className={n <= value ? 'star on' : 'star'} />
        </button>
      ))}
    </div>
  );
}

/* ── ảnh món: ảnh thật, lỗi thì lùi về hình minh họa ── */
export function Photo({ item, className, alt = '' }: { item: Pick<Item, 'emoji' | 'bg' | 'photo'>; className?: string; alt?: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className={cx('photo', className)} style={{ background: item.bg }}>
      {item.photo && !broken ? <img src={item.photo} alt={alt} loading="lazy" onError={() => setBroken(true)} /> : <span className="photo-emoji">{item.emoji}</span>}
    </div>
  );
}

export function Price({ item, size = 'md' }: { item: Item; size?: 'md' | 'lg' }) {
  return (
    <span className={cx('price-row', size)}>
      <b className="price">{fmt(item.price)}</b>
      {item.orig > item.price && <s>{fmt(item.orig)}</s>}
    </span>
  );
}

export function DiscountBadge({ item }: { item: Item }) {
  const p = pct(item);
  return p > 0 ? <span className="discount">-{p}%</span> : null;
}

export function StatTile({ value, label, icon }: { value: ReactNode; label: string; icon?: ReactNode }) {
  return (
    <div className="stat">
      {icon && <span className="stat-icon">{icon}</span>}
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function IconTile({ children, tone }: { children: ReactNode; tone?: 'warn' | 'muted' | 'solid' }) {
  return <span className={cx('icon-tile', tone)}>{children}</span>;
}

export function WithIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="with-icon">
      {icon}
      <span>{children}</span>
    </span>
  );
}

/** Một dòng trong danh sách cài đặt / thông tin. */
export function ListRow({ icon, title, sub, right, onClick, danger }: { icon: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; danger?: boolean }) {
  const body = (
    <>
      <IconTile tone={danger ? 'warn' : undefined}>{icon}</IconTile>
      <span className="list-row-text">
        <b>{title}</b>
        {sub && <span>{sub}</span>}
      </span>
      {right ?? (onClick && <ChevronRight size={20} className="chev" />)}
    </>
  );
  return onClick ? (
    <button className="list-row clickable" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="list-row">{body}</div>
  );
}

export function Avatar({ text, img }: { text: string; img?: ReactNode }) {
  return <span className="avatar">{img ?? text}</span>;
}

export function Toast({ text }: { text: string | null }) {
  return text ? (
    <div className="toast" role="status" key={text}>
      {text}
    </div>
  ) : null;
}

export function Banner({ tone = 'warn', icon, children }: { tone?: 'warn' | 'info'; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className={cx('banner', 'banner-' + tone)}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
