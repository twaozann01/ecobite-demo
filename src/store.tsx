import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { Bike, Footprints, UserCheck, type LucideIcon } from 'lucide-react';
import { MY_SHOP_ID, SEED_SHOPS, newNearbyItem, seedItems, type Item, type Shop } from './data';

export type OrderStatus = 'paid' | 'received' | 'reviewed' | 'cancelled';
/** Cách nhận món: chỉ người mua và người bán, không qua app giao hàng trung gian. */
export type Fulfil = 'pickup' | 'shop' | 'self';

export const FULFIL: Record<Fulfil, { icon: LucideIcon; label: string; desc: string }> = {
  pickup: { icon: Footprints, label: 'Tự đến lấy', desc: 'Đến cửa hàng trong khung giờ nhận, đọc mã nhận món.' },
  shop: { icon: Bike, label: 'Cửa hàng tự giao', desc: 'Người bán tự mang đến, phí do cửa hàng đặt.' },
  self: { icon: UserCheck, label: 'Tự đặt người lấy hộ', desc: 'Bạn tự nhờ người thân hoặc tự đặt xe; gửi mã nhận món cho người lấy.' },
};

export interface Msg {
  from: 'buyer' | 'seller';
  text: string;
  at: number;
}

export interface Order {
  id: string;
  code: string; // mã nhận món
  itemId: string;
  qty: number;
  total: number;
  fee: number;
  fulfil: Fulfil;
  address?: string;
  method: string;
  status: OrderStatus;
  holdMins: number;
  createdAt: number;
  stars?: number;
  review?: string;
  msgs: Msg[];
}

/** Đơn khách giữ ở cửa hàng của người dùng. orderId có nghĩa là đơn do chính máy này đặt (chat dùng chung). */
export interface SellerOrder {
  id: string;
  orderId?: string;
  buyer: string;
  itemName: string;
  qty: number;
  fulfil: Fulfil;
  done: boolean;
  msgs: Msg[];
}

export interface Notif {
  id: string;
  icon: string;
  text: string;
  read: boolean;
  itemId?: string;
}

export interface Report {
  itemId: string;
  reason: string;
}

export type Role = 'buyer' | 'seller';

export interface State {
  role: Role | null;
  items: Item[];
  shops: Shop[];
  orders: Order[];
  sellerOrders: SellerOrder[];
  favorites: string[];
  notifs: Notif[];
  reports: Report[];
  profile: { name: string; phone: string; address: string };
  push: boolean;
  points: number;
  kg: number;
  nearbySent: boolean;
  savedAt: number;
}

function fresh(now = Date.now()): State {
  return {
    role: null,
    items: seedItems(now),
    shops: SEED_SHOPS,
    orders: [],
    sellerOrders: [
      { id: 's1', buyer: 'Minh Anh', itemName: 'Cơm chiên dương châu', qty: 2, fulfil: 'pickup', done: false, msgs: [{ from: 'buyer', text: 'Chào chị, 20:15 em qua lấy được không ạ?', at: now - 600_000 }] },
      { id: 's2', buyer: 'Quốc Bảo', itemName: 'Canh chua cá lóc', qty: 1, fulfil: 'shop', done: false, msgs: [] },
    ],
    favorites: ['i4'],
    notifs: [
      { id: 'n1', icon: '⚡', text: 'Flash sale 50%: Phở bò tái nạm chỉ còn 30.000đ!', read: false, itemId: 'i3' },
      { id: 'n2', icon: '📍', text: 'Tiệm Bánh Lúa Mạch vừa đăng món mới gần bạn (1,5 km).', read: false, itemId: 'i4' },
      { id: 'n3', icon: '🌱', text: 'Bạn sắp đạt huy hiệu Green Consumer cấp 2!', read: true },
    ],
    reports: [],
    profile: { name: 'Nguyễn An', phone: '0901 234 567', address: '27 Nguyễn Thị Minh Khai, Q.1' },
    push: true,
    points: 120,
    kg: 3.4,
    nearbySent: false,
    savedAt: now,
  };
}

export type Action =
  | { type: 'addItem'; item: Item; nearby?: boolean }
  | { type: 'removeItem'; id: string }
  | { type: 'restock'; id: string }
  | { type: 'order'; order: Order }
  | { type: 'cancel'; orderId: string }
  | { type: 'chat'; orderId: string; msg: Msg }
  | { type: 'sellerChat'; id: string; msg: Msg }
  | { type: 'receive'; orderId: string }
  | { type: 'review'; orderId: string; stars: number; text: string }
  | { type: 'sellerDone'; id: string }
  | { type: 'fav'; id: string }
  | { type: 'readAll' }
  | { type: 'report'; report: Report }
  | { type: 'profile'; profile: State['profile'] }
  | { type: 'shop'; shop: Shop }
  | { type: 'push'; on: boolean }
  | { type: 'role'; role: Role | null }
  | { type: 'reset' };

const notif = (icon: string, text: string, itemId?: string): Notif => ({ id: 'n' + Date.now() + Math.random(), icon, text, read: false, itemId });

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'addItem': {
      const shop = s.shops.find((x) => x.id === a.item.shopId);
      const n = a.nearby
        ? notif('📍', `Món mới gần bạn: ${a.item.name} – ${shop?.name} (${shop?.dist} km)`, a.item.id)
        : notif('✅', `Đã đăng “${a.item.name}”. Người mua gần bạn sẽ nhận được thông báo.`, a.item.id);
      return { ...s, items: [a.item, ...s.items], notifs: [n, ...s.notifs], nearbySent: s.nearbySent || !!a.nearby };
    }
    case 'removeItem':
      return { ...s, items: s.items.filter((i) => i.id !== a.id) };
    case 'restock':
      return { ...s, items: s.items.map((i) => (i.id === a.id ? { ...i, qty: i.qty + 5 } : i)) };
    case 'order': {
      const item = s.items.find((i) => i.id === a.order.itemId);
      const mine = item?.shopId === MY_SHOP_ID;
      return {
        ...s,
        orders: [a.order, ...s.orders],
        items: s.items.map((i) => (i.id === a.order.itemId ? { ...i, qty: Math.max(0, i.qty - a.order.qty) } : i)),
        sellerOrders: mine
          ? [{ id: 'so' + a.order.id, orderId: a.order.id, buyer: s.profile.name, itemName: item!.name, qty: a.order.qty, fulfil: a.order.fulfil, done: false, msgs: [] }, ...s.sellerOrders]
          : s.sellerOrders,
        notifs: [notif('🧺', `Đã giữ ${a.order.qty} phần “${item?.name}”. Mã nhận món: ${a.order.code}`), ...s.notifs],
      };
    }
    case 'cancel': {
      const o = s.orders.find((x) => x.id === a.orderId);
      if (!o || o.status !== 'paid') return s;
      return {
        ...s,
        orders: s.orders.map((x) => (x.id === a.orderId ? { ...x, status: 'cancelled' } : x)),
        items: s.items.map((i) => (i.id === o.itemId ? { ...i, qty: i.qty + o.qty } : i)),
        sellerOrders: s.sellerOrders.filter((x) => x.orderId !== o.id),
        notifs: [notif('↩️', `Đã hủy giữ món và hoàn ${(o.total + o.fee).toLocaleString('vi-VN')}đ.`), ...s.notifs],
      };
    }
    case 'chat':
      return { ...s, orders: s.orders.map((o) => (o.id === a.orderId ? { ...o, msgs: [...o.msgs, a.msg] } : o)) };
    case 'sellerChat':
      return { ...s, sellerOrders: s.sellerOrders.map((o) => (o.id === a.id ? { ...o, msgs: [...o.msgs, a.msg] } : o)) };
    case 'receive':
      return {
        ...s,
        points: s.points + 20,
        kg: +(s.kg + 0.5).toFixed(1),
        orders: s.orders.map((o) => (o.id === a.orderId ? { ...o, status: 'received' } : o)),
        sellerOrders: s.sellerOrders.map((x) => (x.orderId === a.orderId ? { ...x, done: true } : x)),
      };
    case 'review':
      return { ...s, points: s.points + 10, orders: s.orders.map((o) => (o.id === a.orderId ? { ...o, status: 'reviewed', stars: a.stars, review: a.text } : o)) };
    case 'sellerDone': {
      const so = s.sellerOrders.find((x) => x.id === a.id);
      const next = { ...s, sellerOrders: s.sellerOrders.map((o) => (o.id === a.id ? { ...o, done: true } : o)) };
      return so?.orderId ? reducer(next, { type: 'receive', orderId: so.orderId }) : next;
    }
    case 'fav':
      return { ...s, favorites: s.favorites.includes(a.id) ? s.favorites.filter((x) => x !== a.id) : [...s.favorites, a.id] };
    case 'readAll':
      return { ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) };
    case 'report':
      return { ...s, reports: [...s.reports.filter((r) => r.itemId !== a.report.itemId), a.report] };
    case 'profile':
      return { ...s, profile: a.profile };
    case 'shop':
      return { ...s, shops: s.shops.map((x) => (x.id === a.shop.id ? a.shop : x)) };
    case 'push':
      return { ...s, push: a.on };
    case 'role':
      return { ...s, role: a.role };
    case 'reset':
      return fresh();
  }
}

const KEY = 'ecobite-demo-v3';

/** Đọc dữ liệu đã lưu trên máy. Không bao giờ xóa dữ liệu người dùng; chỉ làm mới giờ của món MẪU đã quá hạn
 *  (để mở lại hôm sau vẫn có món để demo). Món người dùng đăng giữ nguyên, quá hạn thì tự ẩn. */
function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const st = JSON.parse(raw) as State;
      const now = Date.now();
      const seeds = new Map(seedItems(now).map((i) => [i.id, i]));
      st.items = st.items.map((i) => {
        const seed = seeds.get(i.id);
        if (!seed) return i;
        if (now >= i.pickupTo) return { ...seed, qty: i.qty > 0 ? i.qty : seed.qty };
        return i.photo ? i : { ...i, photo: seed.photo };
      });
      return { ...st, role: st.role ?? null };
    }
  } catch {
    /* không có localStorage thì dùng dữ liệu mặc định */
  }
  return fresh();
}

interface Ctx {
  s: State;
  d: Dispatch<Action>;
  toast: string | null;
  showToast: (t: string) => void;
}
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, load);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const showToast = useCallback((t: string) => {
    setToast(t);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() }));
    } catch {
      /* bỏ qua */
    }
  }, [s]);

  // Giả lập "món mới gần bạn": 20 giây sau khi mở app, một cửa hàng gần đó đăng món.
  const sent = useRef(s.nearbySent);
  useEffect(() => {
    if (sent.current) return;
    const t = window.setTimeout(() => {
      sent.current = true;
      const item = newNearbyItem(Date.now());
      d({ type: 'addItem', item, nearby: true });
      showToast(`📍 Món mới gần bạn: ${item.name} – Lò Bánh Sáng`);
    }, 20_000);
    return () => clearTimeout(t);
  }, [showToast]);

  return <StoreCtx.Provider value={{ s, d, toast, showToast }}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('StoreProvider thiếu');
  return v;
}

/** Thời gian hiện tại, cập nhật định kỳ để món tự ẩn khi hết hạn/quá giờ nhận. */
export function useNow(every = 5000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

export const shopOf = (s: State, id: string) => s.shops.find((x) => x.id === id)!;
