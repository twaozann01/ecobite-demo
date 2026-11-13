import { useEffect, useRef, useState } from 'react';
import {
  Bell, CircleCheck, Clock, Heart, Leaf, MapPin, MessageCircle, Package, PackageCheck, Send, ShoppingBag, Store, Undo2, Zap, type LucideIcon,
} from 'lucide-react';
import type { Nav } from './App';
import { hm, left, leftShort, type Item } from './data';
import { FULFIL, shopOf, useNow, useStore, type Fulfil, type Msg } from './store';
import { Button, Card, DiscountBadge, Empty, Footer, IconButton, IconTile, Page, Photo, Pill, Price, Stack, TopBar, WithIcon, cx } from './ui';

/* ───────── thẻ món ───────── */

function FavButton({ id, float }: { id: string; float?: boolean }) {
  const { s, d } = useStore();
  const on = s.favorites.includes(id);
  return (
    <IconButton
      variant={float ? 'float' : 'plain'}
      aria-label={on ? 'Bỏ yêu thích' : 'Yêu thích'}
      onClick={(e) => {
        e.stopPropagation();
        d({ type: 'fav', id });
      }}
    >
      <Heart size={18} className={cx('heart', on && 'on')} />
    </IconButton>
  );
}
export { FavButton };

/** Thẻ ngang có ảnh lớn ở trên — dùng cho dải "Sắp hết hạn". */
export function DealCard({ item, nav, now }: { item: Item; nav: Nav; now: number }) {
  const { s } = useStore();
  const shop = shopOf(s, item.shopId);
  return (
    <div className="deal clickable" onClick={() => nav.open({ name: 'detail', id: item.id })}>
      <div className="deal-media">
        <Photo item={item} />
        <DiscountBadge item={item} />
        <span className="deal-fav">
          <FavButton id={item.id} float />
        </span>
        <span className="deal-time">
          <Clock size={12} />
          {leftShort(Math.min(item.expiresAt, item.pickupTo), now)}
        </span>
      </div>
      <div className="deal-body">
        <h3>{item.name}</h3>
        <span className="sub">
          {shop.name} · {shop.dist} km
        </span>
        <Price item={item} />
      </div>
    </div>
  );
}

/** Thẻ dọc: ảnh vuông bên trái — dùng cho danh sách "Gần bạn". */
export function ItemRow({ item, nav, now, right }: { item: Item; nav: Nav; now: number; right?: React.ReactNode }) {
  const { s } = useStore();
  const shop = shopOf(s, item.shopId);
  return (
    <div className="item-row clickable" onClick={() => nav.open({ name: 'detail', id: item.id })}>
      <div className="item-row-media">
        <Photo item={item} />
        <DiscountBadge item={item} />
      </div>
      <div className="item-row-body">
        <div className="row between top">
          <h3>{item.name}</h3>
          {right ?? <FavButton id={item.id} />}
        </div>
        <span className="sub">
          {shop.name} · {shop.dist} km
        </span>
        <span className="meta">
          <WithIcon icon={<Clock size={13} />}>Còn {left(Math.min(item.expiresAt, item.pickupTo), now)}</WithIcon>
          <WithIcon icon={<Package size={13} />}>{item.qty} phần</WithIcon>
        </span>
        <Price item={item} />
      </div>
    </div>
  );
}

/* ───────── nhỏ dùng chung ───────── */

export function FulfilLabel({ f }: { f: Fulfil }) {
  const I = FULFIL[f].icon;
  return <WithIcon icon={<I size={15} />}>{FULFIL[f].label}</WithIcon>;
}

const NOTIF_ICONS: Record<string, LucideIcon> = { '⚡': Zap, '📍': MapPin, '🌱': Leaf, '✅': CircleCheck, '🧺': ShoppingBag, '↩️': Undo2, '📦': PackageCheck };
export function NotifIcon({ icon }: { icon: string }) {
  const I = NOTIF_ICONS[icon] ?? Bell;
  return <I size={20} />;
}

export function Countdown({ createdAt, mins }: { createdAt: number; mins: number }) {
  const now = useNow(1000);
  const l = Math.max(0, createdAt + mins * 60000 - now);
  const mm = String(Math.floor(l / 60000)).padStart(2, '0');
  const ss = String(Math.floor((l % 60000) / 1000)).padStart(2, '0');
  return (
    <span className="countdown">
      <Clock size={13} /> Giữ còn {mm}:{ss}
    </span>
  );
}

/* ───────── Chat (dùng chung cho hai phía) ───────── */

export function ChatBox({
  title, sub, avatar, msgs, me, onSend, quick, nav,
}: { title: string; sub?: string; avatar: React.ReactNode; msgs: Msg[]; me: Msg['from']; onSend: (t: string) => void; quick: string[]; nav: Nav }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs.length]);
  const send = (t: string) => {
    if (!t.trim()) return;
    onSend(t.trim());
    setText('');
  };
  return (
    <>
      <TopBar title={<WithIcon icon={avatar}>{title}</WithIcon>} sub={sub} onBack={nav.back} />
      <div className="scroll chat">
        {msgs.length === 0 && <Empty icon={<MessageCircle size={30} />}>Hẹn giờ và địa điểm nhận món ngay tại đây.</Empty>}
        {msgs.map((m, i) => (
          <div key={i} className={'bubble ' + (m.from === me ? 'me' : 'them')}>
            {m.text}
            <span className="time">{hm(m.at)}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="quick">
        {quick.map((t) => (
          <Pill key={t} onClick={() => send(t)}>
            {t}
          </Pill>
        ))}
      </div>
      <Footer>
        <input className="input grow chat-input" value={text} placeholder="Nhập tin nhắn…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(text)} />
        <IconButton variant="filled" onClick={() => send(text)} disabled={!text.trim()} aria-label="Gửi">
          <Send size={18} />
        </IconButton>
      </Footer>
    </>
  );
}

/* ───────── Hộp tin nhắn ───────── */

interface Thread {
  key: string;
  name: string;
  avatar: React.ReactNode;
  about: string;
  last?: Msg;
  open: () => void;
}

export function Inbox({ nav }: { nav: Nav }) {
  const { s } = useStore();
  const seller = s.role === 'seller';
  const threads: Thread[] = seller
    ? s.sellerOrders.map((o) => {
        const linked = o.orderId ? s.orders.find((x) => x.id === o.orderId) : undefined;
        const msgs = linked ? linked.msgs : o.msgs;
        return { key: o.id, name: o.buyer, avatar: <span className="avatar sm">{o.buyer.split(' ').pop()![0]}</span>, about: `${o.qty} × ${o.itemName}`, last: msgs[msgs.length - 1], open: () => nav.open({ name: 'sellerChat', id: o.id }) };
      })
    : s.orders
        .filter((o) => o.status !== 'cancelled')
        .map((o) => {
          const item = s.items.find((i) => i.id === o.itemId);
          const shop = item ? shopOf(s, item.shopId) : undefined;
          return { key: o.id, name: shop?.name ?? 'Cửa hàng', avatar: <span className="avatar sm">{shop?.emoji ?? '🏪'}</span>, about: `${o.qty} × ${item?.name ?? ''}`, last: o.msgs[o.msgs.length - 1], open: () => nav.open({ name: 'chat', orderId: o.id }) };
        });
  threads.sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));

  return (
    <>
      <TopBar title="Tin nhắn" />
      <Page flush>
        {threads.length === 0 && (
          <Empty icon={<MessageCircle size={30} />}>{seller ? 'Khi khách giữ món, cuộc trò chuyện sẽ hiện ở đây.' : 'Giữ một món để bắt đầu trò chuyện với người bán.'}</Empty>
        )}
        <div className="threads">
          {threads.map((t) => (
            <button key={t.key} className="thread clickable" onClick={t.open}>
              {t.avatar}
              <span className="thread-body">
                <span className="row between">
                  <b>{t.name}</b>
                  {t.last && <span className="time">{hm(t.last.at)}</span>}
                </span>
                <span className="thread-about">{t.about}</span>
                <span className={cx('thread-last', t.last && t.last.from !== (seller ? 'seller' : 'buyer') && 'strong')}>
                  {t.last ? (t.last.from === (seller ? 'seller' : 'buyer') ? 'Bạn: ' : '') + t.last.text : 'Chưa có tin nhắn'}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Page>
    </>
  );
}

/* ───────── Thông báo ───────── */

export function Notifs({ nav }: { nav: Nav }) {
  const { s, d } = useStore();
  return (
    <>
      <TopBar
        title="Thông báo"
        onBack={nav.back}
        right={
          <Button variant="text" size="sm" onClick={() => d({ type: 'readAll' })}>
            Đọc hết
          </Button>
        }
      />
      <Page>
        <Stack gap="sm">
          {s.notifs.map((n) => {
            const target = n.itemId && s.items.some((i) => i.id === n.itemId) ? () => nav.open({ name: 'detail', id: n.itemId! }) : undefined;
            return (
              <Card key={n.id} tone={n.read ? undefined : 'unread'} onClick={target}>
                <div className="row">
                  <IconTile>
                    <NotifIcon icon={n.icon} />
                  </IconTile>
                  <p className="grow">{n.text}</p>
                </div>
              </Card>
            );
          })}
        </Stack>
      </Page>
    </>
  );
}

/* ───────── Màn chọn vai trò ───────── */

export function RoleSelect() {
  const { d } = useStore();
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <img src="./food/hero.jpg" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <div className="welcome-brand">
          <span className="brand-mark">
            <Leaf size={22} />
          </span>
          EcoBite
        </div>
      </div>
      <div className="welcome-body">
        <h1>Mỗi miếng ăn bạn chọn đều giúp bảo vệ môi trường</h1>
        <p className="muted">Kết nối trực tiếp người bán và người mua món ăn dư thừa, giá tốt, ngay gần bạn.</p>
        <button className="role-card clickable" onClick={() => d({ type: 'role', role: 'buyer' })}>
          <IconTile tone="solid">
            <ShoppingBag size={24} />
          </IconTile>
          <span>
            <b>Tôi muốn mua món</b>
            <span>Tìm món giảm giá gần bạn, giữ món, tự đến lấy</span>
          </span>
        </button>
        <button className="role-card clickable" onClick={() => d({ type: 'role', role: 'seller' })}>
          <IconTile tone="solid">
            <Store size={24} />
          </IconTile>
          <span>
            <b>Tôi là người bán</b>
            <span>Đăng món dư, nhận đơn giữ món, chat với khách</span>
          </span>
        </button>
        <p className="muted small center">Có thể đổi vai trò bất cứ lúc nào trong mục Tài khoản / Cửa hàng.</p>
      </div>
    </div>
  );
}
