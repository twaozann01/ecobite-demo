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
  /** id món người bán đã xóa, để không bổ sung lại món mẫu đó */
  removed?: string[];
  /** đã đăng nhập (giả lập, không có máy chủ) */
  authed?: boolean;
  /** tài khoản đã đăng ký trên máy này */
  accounts?: Account[];
}

export interface Account {
  phone: string; // chỉ chữ số
  name: string;
  address: string;
  role: Role;
}

export const DEMO_PHONE = '0901234567';
export const DEMO_OTP = '123456';
export const digits = (p: string) => p.replace(/\D/g, '');
export const prettyPhone = (p: string) => digits(p).replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');

const M = 60_000;
const H = 60 * M;

function fresh(now = Date.now()): State {
  return {
    role: null,
    items: seedItems(now),
    shops: SEED_SHOPS,
    orders: [
      {
        id: 'o1', code: 'EB4821', itemId: 'i1', qty: 2, total: 50000, fee: 0, fulfil: 'pickup', method: 'Chuyển khoản MB', status: 'paid', holdMins: 30, createdAt: now - 8 * M,
        msgs: [
          { from: 'seller', text: 'Chào bạn, Cơm Tấm Bà Năm đã nhận đơn 2 phần Cơm gà xối mỡ. Mã nhận món: EB4821.', at: now - 8 * M },
          { from: 'buyer', text: 'Dạ shop ơi, khoảng 15 phút nữa em qua lấy nhé!', at: now - 6 * M },
          { from: 'seller', text: 'Ok em, cô để sẵn ở quầy, tới đọc mã là lấy được luôn nha.', at: now - 5 * M },
          { from: 'buyer', text: 'Cho em xin thêm ít nước mắm được không ạ?', at: now - 4 * M },
          { from: 'seller', text: 'Được chứ, cô bỏ thêm cho 2 túi nhé 😊', at: now - 3 * M },
        ],
      },
      {
        id: 'o2', code: 'EB3307', itemId: 'i8', qty: 1, total: 32000, fee: 0, fulfil: 'self', method: 'Tiền mặt', status: 'paid', holdMins: 45, createdAt: now - 25 * M,
        msgs: [
          { from: 'seller', text: 'Bún Chả Phố Cổ đã nhận đơn. Người lấy hộ chỉ cần đọc mã EB3307 nhé.', at: now - 25 * M },
          { from: 'buyer', text: 'Em nhờ bạn tên Hùng qua lấy giúp ạ, áo xanh.', at: now - 22 * M },
          { from: 'seller', text: 'Dạ ok, shop sẽ đưa đúng người có mã.', at: now - 21 * M },
        ],
      },
      {
        id: 'o3', code: 'EB2190', itemId: 'i4', qty: 3, total: 54000, fee: 12000, fulfil: 'shop', method: 'Thẻ ngân hàng', status: 'received', holdMins: 30, createdAt: now - 26 * H,
        msgs: [
          { from: 'seller', text: 'Tiệm Bánh Lúa Mạch sẽ tự giao tới 199 Chùa Láng nhé!', at: now - 26 * H },
          { from: 'buyer', text: 'Shop giao trước 7h tối giúp em nha.', at: now - 26 * H + 2 * M },
          { from: 'seller', text: 'Shop đang tới, 5 phút nữa nha bạn.', at: now - 25 * H },
          { from: 'buyer', text: 'Em nhận được rồi, bánh còn giòn lắm, cảm ơn shop!', at: now - 25 * H + 10 * M },
        ],
        address: '199 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội',
      },
      {
        id: 'o4', code: 'EB1055', itemId: 'i3', qty: 1, total: 30000, fee: 0, fulfil: 'pickup', method: 'Chuyển khoản MB', status: 'reviewed', holdMins: 30, createdAt: now - 50 * H,
        stars: 5, review: 'Phở còn nóng, nước dùng ngon, giá quá hời!',
        msgs: [
          { from: 'seller', text: 'Phở Thìn 13 đã nhận đơn, mã EB1055.', at: now - 50 * H },
          { from: 'buyer', text: 'Shop cho em xin thêm hành nhé.', at: now - 50 * H + 3 * M },
          { from: 'seller', text: 'Có ngay em ơi!', at: now - 50 * H + 4 * M },
        ],
      },
      {
        id: 'o5', code: 'EB0932', itemId: 'i5', qty: 2, total: 40000, fee: 0, fulfil: 'pickup', method: 'Tiền mặt', status: 'cancelled', holdMins: 15, createdAt: now - 74 * H,
        msgs: [
          { from: 'buyer', text: 'Shop ơi em kẹt việc không qua kịp, em hủy nhé.', at: now - 74 * H + 5 * M },
          { from: 'seller', text: 'Không sao bạn, hẹn lần sau nha!', at: now - 74 * H + 6 * M },
        ],
      },
    ],
    sellerOrders: [
      {
        id: 's1', buyer: 'Minh Anh', itemName: 'Cơm chiên dương châu', qty: 2, fulfil: 'pickup', done: false,
        msgs: [
          { from: 'buyer', text: 'Chào chị, 20:15 em qua lấy được không ạ?', at: now - 10 * M },
          { from: 'seller', text: 'Được em nhé, chị để sẵn 2 hộp.', at: now - 9 * M },
          { from: 'buyer', text: 'Dạ em cảm ơn chị!', at: now - 8 * M },
        ],
      },
      {
        id: 's2', buyer: 'Quốc Bảo', itemName: 'Canh chua cá lóc', qty: 1, fulfil: 'shop', done: false,
        msgs: [
          { from: 'buyer', text: 'Chị giao tới ngõ 46 Láng Thượng giúp em với ạ.', at: now - 20 * M },
          { from: 'seller', text: 'Ok em, khoảng 19h chị mang qua nhé.', at: now - 18 * M },
        ],
      },
      {
        id: 's3', buyer: 'Thu Trang', itemName: 'Thịt kho trứng', qty: 3, fulfil: 'self', done: false,
        msgs: [
          { from: 'buyer', text: 'Em nhờ chồng qua lấy hộ, mã là gì chị nhỉ?', at: now - 35 * M },
          { from: 'seller', text: 'Mã EB7712 nha em, anh tới đọc mã là chị đưa.', at: now - 33 * M },
        ],
      },
      {
        id: 's4', buyer: 'Hoàng Long', itemName: 'Cơm chiên dương châu', qty: 1, fulfil: 'pickup', done: true,
        msgs: [
          { from: 'buyer', text: 'Em lấy rồi nha chị, ngon lắm!', at: now - 22 * H },
          { from: 'seller', text: 'Cảm ơn em, mai ghé tiếp nhé 💚', at: now - 22 * H + M },
        ],
      },
      {
        id: 's5', buyer: 'Lan Phương', itemName: 'Canh chua cá lóc', qty: 2, fulfil: 'shop', done: true,
        msgs: [{ from: 'seller', text: 'Chị giao tới rồi nhé em.', at: now - 46 * H }],
      },
    ],
    favorites: ['i4'],
    notifs: [
      { id: 'n1', icon: '⚡', text: 'Flash sale 50%: Phở bò tái nạm chỉ còn 30.000đ!', read: false, itemId: 'i3' },
      { id: 'n2', icon: '📍', text: 'Tiệm Bánh Lúa Mạch vừa đăng món mới gần bạn (1,5 km).', read: false, itemId: 'i4' },
      { id: 'n4', icon: '💬', text: 'Cơm Tấm Bà Năm: “Được chứ, cô bỏ thêm cho 2 túi nhé 😊”', read: false },
      { id: 'n5', icon: '🧺', text: 'Đơn Bún chả Hà Nội đang được giữ. Mã nhận món: EB3307', read: true },
      { id: 'n6', icon: '⭐', text: 'Cảm ơn bạn đã đánh giá Phở Thìn 13. +10 EcoPoint', read: true },
      { id: 'n3', icon: '🌱', text: 'Bạn sắp đạt huy hiệu Green Consumer cấp 2!', read: true },
    ],
    reports: [],
    profile: { name: 'Nguyễn An', phone: '0901 234 567', address: '199 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội' },
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
  | { type: 'login'; phone: string }
  | { type: 'register'; account: Account; shop?: Pick<Shop, 'name' | 'address' | 'hours' | 'phone'> }
  | { type: 'logout' }
  | { type: 'reset' };

/** Luôn có sẵn tài khoản demo (Nguyễn An) để thuyết trình. */
export const accountsOf = (s: State): Account[] => {
  const list = s.accounts ?? [];
  return list.some((x) => x.phone === DEMO_PHONE)
    ? list
    : [{ phone: DEMO_PHONE, name: 'Nguyễn An', address: '199 Chùa Láng, Láng Thượng, Đống Đa, Hà Nội', role: 'buyer' }, ...list];
};

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
      return { ...s, items: s.items.filter((i) => i.id !== a.id), removed: [...(s.removed ?? []), a.id] };
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
    case 'login': {
      const acc = accountsOf(s).find((x) => x.phone === digits(a.phone));
      if (!acc) return s;
      // tài khoản demo: để người thuyết trình tự chọn vai trò
      return { ...s, authed: true, role: acc.phone === DEMO_PHONE ? null : acc.role, profile: { name: acc.name, phone: prettyPhone(acc.phone), address: acc.address } };
    }
    case 'register': {
      const acc = a.account;
      return {
        ...s,
        authed: true,
        role: acc.role,
        accounts: [...accountsOf(s).filter((x) => x.phone !== acc.phone), acc],
        profile: { name: acc.name, phone: prettyPhone(acc.phone), address: acc.address },
        shops: a.shop ? s.shops.map((x) => (x.id === MY_SHOP_ID ? { ...x, ...a.shop } : x)) : s.shops,
      };
    }
    case 'logout':
      return { ...s, authed: false, role: null };
    case 'reset':
      return { ...fresh(), authed: s.authed, accounts: s.accounts, role: s.role };
  }
}

const KEY = 'ecobite-demo-v4';

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
      // món mẫu thêm ở bản sau: bổ sung vào máy đã có dữ liệu cũ
      const have = new Set(st.items.map((i) => i.id));
      st.items.push(...[...seeds.values()].filter((i) => !have.has(i.id) && !(st.removed ?? []).includes(i.id)));
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
