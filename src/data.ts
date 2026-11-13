export type Category = 'Cơm' | 'Bánh' | 'Món nước' | 'Đồ uống' | 'Rau củ';

export const CATEGORIES: Category[] = ['Cơm', 'Bánh', 'Món nước', 'Đồ uống', 'Rau củ'];
export const CAT_EMOJI: Record<Category, string> = {
  Cơm: '🍚',
  Bánh: '🥐',
  'Món nước': '🍜',
  'Đồ uống': '🧋',
  'Rau củ': '🥬',
};

export interface Shop {
  id: string;
  name: string;
  emoji: string;
  address: string;
  hours: string;
  phone: string;
  dist: number; // km
  rating: number;
  intro: string;
  /** Cửa hàng tự giao (không qua app giao hàng trung gian); 0 = không giao. */
  deliveryFee: number;
  mine?: boolean;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  /** Ảnh thật người bán chụp/chọn (data URL đã thu nhỏ), ưu tiên hơn emoji. */
  photo?: string;
  shopId: string;
  cat: Category;
  price: number;
  orig: number;
  qty: number;
  cookedAt: string; // giờ nấu HH:MM
  expiresAt: number; // hạn dùng (ms)
  pickupFrom: number; // khung giờ nhận (ms)
  pickupTo: number;
  createdAt: number;
  flash?: boolean;
}

const H = 3600_000;
const M = 60_000;

export const MY_SHOP_ID = 'me';

export const SEED_SHOPS: Shop[] = [
  { id: 's1', name: 'Cơm Tấm Bà Năm', emoji: '🍚', address: '12 Lê Thánh Tôn, Bến Nghé, Q.1', hours: '06:00 – 21:30', phone: '0901 111 222', dist: 0.4, rating: 4.8, intro: 'Cơm tấm gia truyền 20 năm, cuối ngày bán lại phần dư giá tốt.', deliveryFee: 10000 },
  { id: 's2', name: 'Lò Bánh Sáng', emoji: '🥖', address: '45 Nguyễn Huệ, Bến Nghé, Q.1', hours: '05:30 – 21:00', phone: '0902 333 444', dist: 0.9, rating: 4.6, intro: 'Bánh mì nướng củi mỗi ngày.', deliveryFee: 0 },
  { id: 's3', name: 'Phở Thìn 13', emoji: '🍜', address: '13 Pasteur, Bến Nghé, Q.1', hours: '06:00 – 22:00', phone: '0903 555 666', dist: 1.2, rating: 4.9, intro: 'Phở bò Hà Nội nước dùng ninh 12 tiếng.', deliveryFee: 15000 },
  { id: 's4', name: 'Tiệm Bánh Lúa Mạch', emoji: '🥐', address: '88 Hai Bà Trưng, Đa Kao, Q.1', hours: '07:00 – 21:00', phone: '0904 777 888', dist: 1.5, rating: 4.7, intro: 'Bánh ngọt Pháp, nướng trong ngày.', deliveryFee: 12000 },
  { id: 's5', name: 'TeaHouse', emoji: '🧋', address: '21 Lý Tự Trọng, Bến Nghé, Q.1', hours: '08:00 – 22:30', phone: '0905 121 212', dist: 0.7, rating: 4.5, intro: 'Trà sữa nấu từ lá trà tươi.', deliveryFee: 0 },
  { id: 's6', name: 'Siêu Thị Mini Green', emoji: '🥬', address: '5 Tôn Đức Thắng, Bến Nghé, Q.1', hours: '07:00 – 22:00', phone: '0906 343 434', dist: 2.1, rating: 4.8, intro: 'Rau củ hữu cơ từ Đà Lạt.', deliveryFee: 15000 },
  { id: 's7', name: 'Bún Chả Phố Cổ', emoji: '🍲', address: '102 Calmette, Nguyễn Thái Bình, Q.1', hours: '10:00 – 22:00', phone: '0907 565 656', dist: 1.8, rating: 4.6, intro: 'Bún chả than hoa chuẩn vị Hà Nội.', deliveryFee: 0 },
  { id: MY_SHOP_ID, name: 'Bếp Nhà An', emoji: '🏠', address: '27 Nguyễn Thị Minh Khai, Q.1', hours: '16:00 – 21:00', phone: '0901 234 567', dist: 0.2, rating: 5, intro: 'Cơm nhà nấu, dư bao nhiêu bán bấy nhiêu.', deliveryFee: 8000, mine: true },
];

type SeedRow = [id: string, name: string, emoji: string, bg: string, shopId: string, cat: Category, price: number, orig: number, qty: number, cooked: string, hoursLeft: number, flash?: boolean];

const ROWS: SeedRow[] = [
  ['i1', 'Cơm gà xối mỡ', '🍗', '#fde68a', 's1', 'Cơm', 25000, 50000, 6, '10:30', 2, true],
  ['i2', 'Bánh mì que pate (5 ổ)', '🥖', '#fed7aa', 's2', 'Bánh', 15000, 35000, 10, '05:30', 3, true],
  ['i3', 'Phở bò tái nạm', '🍜', '#fecaca', 's3', 'Món nước', 30000, 65000, 4, '06:00', 1.2, true],
  ['i4', 'Bánh croissant bơ', '🥐', '#fde68a', 's4', 'Bánh', 18000, 40000, 8, '07:00', 4],
  ['i5', 'Trà sữa trân châu', '🧋', '#fbcfe8', 's5', 'Đồ uống', 20000, 45000, 12, '14:00', 5],
  ['i6', 'Combo rau củ hữu cơ', '🥬', '#bbf7d0', 's6', 'Rau củ', 22000, 55000, 5, '08:00', 6],
  ['i7', 'Sườn nướng mật ong', '🍖', '#fed7aa', 's1', 'Cơm', 28000, 55000, 3, '10:30', 2.5],
  ['i8', 'Bún chả Hà Nội', '🍲', '#fecaca', 's7', 'Món nước', 32000, 60000, 7, '11:00', 3],
];

/** Ảnh món thật (Unsplash) trong public/food. Thiếu ảnh thì Thumb tự lùi về hình minh họa. */
export const photo = (key: string) => `./food/${key}.jpg`;
const SEED_PHOTO: Record<string, string> = {
  i1: 'com-ga', i2: 'banh-mi', i3: 'pho-bo', i4: 'croissant', i5: 'tra-sua', i6: 'rau-cu', i7: 'com-suon', i8: 'bun-cha',
};

/** Ảnh có sẵn để người bán chọn nhanh khi đăng món (ngoài chụp/chọn ảnh từ máy). */
export const PRESET_PHOTOS: { key: string; label: string; emoji: string }[] = [
  { key: 'com-chien', label: 'Cơm chiên', emoji: '🍚' },
  { key: 'com-ga', label: 'Cơm gà', emoji: '🍗' },
  { key: 'banh-mi', label: 'Bánh mì', emoji: '🥖' },
  { key: 'banh-ngot', label: 'Bánh ngọt', emoji: '🍰' },
  { key: 'banh-bao', label: 'Bánh bao', emoji: '🥟' },
  { key: 'rau-cu', label: 'Rau củ', emoji: '🥬' },
];

/** Dữ liệu mẫu tính thời gian theo lúc mở app để buổi thuyết trình lúc nào cũng có món còn hạn. */
export function seedItems(now: number): Item[] {
  return ROWS.map(([id, name, emoji, bg, shopId, cat, price, orig, qty, cooked, h, flash]) => ({
    id, name, emoji, bg, shopId, cat, price, orig, qty,
    photo: photo(SEED_PHOTO[id]),
    cookedAt: cooked,
    expiresAt: now + h * H,
    pickupFrom: now - 30 * M,
    pickupTo: now + h * H,
    createdAt: now - 2 * H,
    flash,
  }));
}

/** Món "mới gần bạn" giả lập: một cửa hàng gần đó đăng thêm khi đang dùng app. */
export function newNearbyItem(now: number): Item {
  return { id: 'nearby-' + now, name: 'Bánh bao nhân thịt trứng', emoji: '🥟', bg: '#fef3c7', photo: photo('banh-bao'), shopId: 's2', cat: 'Bánh', price: 12000, orig: 25000, qty: 9, cookedAt: hm(now - H), expiresAt: now + 3 * H, pickupFrom: now, pickupTo: now + 3 * H, createdAt: now, flash: true };
}

export interface Offer {
  id: string;
  shopId: string;
  title: string;
  desc: string;
  code: string;
}

export const OFFERS: Offer[] = [
  { id: 'o1', shopId: 's1', title: 'Giảm thêm 10.000đ', desc: 'Cho đơn đầu tiên từ 40.000đ', code: 'ECO10' },
  { id: 'o2', shopId: 's4', title: 'Mua 2 tặng 1', desc: 'Áp dụng bánh ngọt sau 19:00', code: 'LUAMACH' },
  { id: 'o3', shopId: 's5', title: 'Giảm 15% khi tự đến lấy', desc: 'Mang ly cá nhân giảm thêm 5%', code: 'GREEN' },
  { id: 'o4', shopId: 's6', title: 'Hoàn 5% EcoPoint', desc: 'Khi mua rau củ gần hết hạn', code: 'ECOPOINT' },
];

/* ── tiện ích ── */

export const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';
export const pct = (i: Item) => (i.orig > i.price ? Math.round((1 - i.price / i.orig) * 100) : 0);
export const hm = (ms: number) => new Date(ms).toTimeString().slice(0, 5);

/** "HH:MM" của hôm nay → ms. */
export function atToday(t: string, now: number) {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function left(ms: number, now: number) {
  const mins = Math.max(0, Math.round((ms - now) / M));
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const r = mins % 60;
  return r ? `${h} giờ ${r} phút` : `${h} giờ`;
}

/** Dạng ngắn cho chip nhỏ: "1g 20p", "45p". */
export function leftShort(ms: number, now: number) {
  const mins = Math.max(0, Math.round((ms - now) / M));
  if (mins < 60) return `${mins}p`;
  const r = mins % 60;
  return r ? `${Math.floor(mins / 60)}g ${r}p` : `${mins / 60}g`;
}

/** Đọc ảnh từ máy, thu nhỏ về cạnh dài 480px dạng JPEG để lưu được trong bộ nhớ trình duyệt. */
export function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Lý do món bị ẩn khỏi danh sách người mua, hoặc null nếu đang hiển thị. */
export function hiddenReason(i: Item, now: number): string | null {
  if (i.qty <= 0) return 'Hết số lượng';
  if (now >= i.expiresAt) return 'Quá hạn dùng';
  if (now >= i.pickupTo) return 'Quá giờ nhận';
  return null;
}
