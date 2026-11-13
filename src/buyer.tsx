import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Banknote, Bell, Bike, CircleCheck, Clock, CookingPot, Croissant, CupSoda, Carrot, Flag, Gift, Heart, Landmark, LayoutGrid, Leaf,
  CreditCard, MapPin, MessageCircle, Navigation, Package, Phone, RefreshCcw, RotateCcw, Search, ShoppingBag, SlidersHorizontal, Soup, Star,
  Store, User, Zap, Map as MapIcon, type LucideIcon,
} from 'lucide-react';
import type { Nav } from './App';
import { MY_SHOP_ID, OFFERS, SAMPLE_REVIEWS, fmt, hiddenReason, hm, left, type Category, type Item } from './data';
import { FULFIL, shopOf, useNow, useStore, type Fulfil, type Order } from './store';
import { ChatBox, Countdown, DealCard, FavButton, FulfilLabel, ItemRow } from './shared';
import {
  Avatar, Banner, Button, Card, Chip, DiscountBadge, Empty, Field, Footer, IconButton, IconTile, Label, ListRow, Muted, Page, Photo, Pill, Price,
  SectionTitle, Segmented, Sheet, Stack, StatTile, Stars, Stepper, Switch, TextArea, TopBar, WithIcon,
} from './ui';

const CAT_ICON: Record<Category, LucideIcon> = { Cơm: CookingPot, Bánh: Croissant, 'Món nước': Soup, 'Đồ uống': CupSoda, 'Rau củ': Carrot };
const CATS: (Category | null)[] = [null, 'Cơm', 'Bánh', 'Món nước', 'Đồ uống', 'Rau củ'];

/* ───────── Khám phá ───────── */

type Sort = 'dist' | 'time' | 'price' | 'new';
const SORTS = [
  ['dist', 'Gần nhất'],
  ['time', 'Sắp hết hạn'],
  ['price', 'Rẻ nhất'],
  ['new', 'Mới đăng'],
] as const;

export function Home({ nav }: { nav: Nav }) {
  const { s } = useStore();
  const now = useNow();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [sort, setSort] = useState<Sort>('dist');
  const [maxDist, setMaxDist] = useState(5);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sheet, setSheet] = useState(false);

  const dist = (i: Item) => shopOf(s, i.shopId).dist;
  // Tự ẩn: món hết số lượng hoặc quá hạn dùng / giờ nhận không hiện cho người mua.
  const visible = s.items.filter((i) => !hiddenReason(i, now));
  const list = visible
    .filter((i) => (!cat || i.cat === cat) && dist(i) <= maxDist && i.price <= maxPrice)
    .filter((i) => !q || (i.name + shopOf(s, i.shopId).name).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'dist' ? dist(a) - dist(b) : sort === 'time' ? a.expiresAt - b.expiresAt : sort === 'price' ? a.price - b.price : b.createdAt - a.createdAt));
  const soon = [...visible].sort((a, b) => Math.min(a.expiresAt, a.pickupTo) - Math.min(b.expiresAt, b.pickupTo)).slice(0, 6);
  const unread = s.notifs.filter((n) => !n.read).length;
  const filtered = maxDist !== 5 || maxPrice !== 100000;
  const browsing = !!q || !!cat || filtered;

  return (
    <>
      <div className="scroll">
        <div className="home-head">
          <div className="row between">
            <div className="loc">
              <span className="muted small">Món dư gần</span>
              <b>
                <MapPin size={16} /> Chùa Láng, Đống Đa, Hà Nội
              </b>
            </div>
            <div className="row" style={{ gap: 4 }}>
            <IconButton onClick={() => nav.open({ name: 'map' })} aria-label="Bản đồ">
              <MapIcon size={22} />
            </IconButton>
            <IconButton onClick={() => nav.open({ name: 'notifs' })} aria-label="Thông báo">
              <span className="ico">
                <Bell size={22} />
                {unread > 0 && <i className="dot">{unread}</i>}
              </span>
            </IconButton>
            </div>
          </div>
          <div className="search">
            <Search size={18} />
            <input placeholder="Tìm món, cửa hàng…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className={filtered ? 'on' : ''} onClick={() => setSheet(true)} aria-label="Bộ lọc">
              <SlidersHorizontal size={18} />
            </button>
          </div>
          <div className="impact">
            <Leaf size={16} />
            <span>
              Bạn đã cứu <b>{s.kg} kg</b> thực phẩm · {visible.length} món đang chờ quanh đây
            </span>
          </div>
        </div>

        <div className="cat-strip">
          {CATS.map((c) => {
            const I = c ? CAT_ICON[c] : LayoutGrid;
            return (
              <button key={c ?? 'all'} className={'cat' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
                <span>
                  <I size={22} />
                </span>
                {c ?? 'Tất cả'}
              </button>
            );
          })}
        </div>

        {!browsing && (
          <>
            <div className="pad-x">
              <SectionTitle>
                <WithIcon icon={<Zap size={18} className="zap" />}>Sắp hết hạn · giảm sâu</WithIcon>
              </SectionTitle>
            </div>
            <div className="hscroll">
              {soon.map((i) => (
                <DealCard key={i.id} item={i} nav={nav} now={now} />
              ))}
            </div>
            <div className="pad-x">
              <SectionTitle>
                <WithIcon icon={<Gift size={18} className="gift" />}>Ưu đãi từ cửa hàng</WithIcon>
              </SectionTitle>
            </div>
            <div className="hscroll">
              {OFFERS.map((o) => {
                const shop = shopOf(s, o.shopId);
                return (
                  <button key={o.id} className="coupon clickable" onClick={() => nav.open({ name: 'shop', id: shop.id })}>
                    <b>{o.title}</b>
                    <span>{shop.name}</span>
                    <span className="code">{o.code}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="pad-x">
          <SectionTitle
            action={
              <select className="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sắp xếp">
                {SORTS.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            }
          >
            {browsing ? `${list.length} món phù hợp` : 'Món gần bạn'}
          </SectionTitle>
          <Stack gap="sm">
            {list.map((i) => (
              <ItemRow key={i.id} item={i} nav={nav} now={now} />
            ))}
          </Stack>
          {list.length === 0 && (
            <Empty
              icon={<Search size={30} />}
              action={
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    setQ('');
                    setCat(null);
                    setMaxDist(5);
                    setMaxPrice(100000);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              }
            >
              Không có món phù hợp.
            </Empty>
          )}
          <div className="bottom-space" />
        </div>
      </div>

      {sheet && (
        <Sheet title="Bộ lọc" onClose={() => setSheet(false)}>
          <Label>Khoảng cách</Label>
          <div className="row wrap">
            {[1, 2, 5].map((n) => (
              <Pill key={n} on={maxDist === n} onClick={() => setMaxDist(n)}>
                Dưới {n} km
              </Pill>
            ))}
          </div>
          <Label>Giá tối đa</Label>
          <div className="row wrap">
            {[20000, 30000, 100000].map((n) => (
              <Pill key={n} on={maxPrice === n} onClick={() => setMaxPrice(n)}>
                {n === 100000 ? 'Mọi mức giá' : 'Dưới ' + fmt(n)}
              </Pill>
            ))}
          </div>
          <div className="row">
            <Button
              variant="ghost"
              grow
              onClick={() => {
                setMaxDist(5);
                setMaxPrice(100000);
              }}
            >
              Đặt lại
            </Button>
            <Button grow onClick={() => setSheet(false)}>
              Xem {list.length} món
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}

/* ───────── Chi tiết món (bài đăng) ───────── */

const HOLDS = [30, 60, 90, 120];
const REPORT_REASONS = ['Món không đúng mô tả / ảnh', 'Hết hạn hoặc không an toàn', 'Giá không đúng', 'Cửa hàng không giao món', 'Spam / lừa đảo'];

export function Detail({ id, nav }: { id: string; nav: Nav }) {
  const { s, d, showToast } = useStore();
  const now = useNow();
  const item = s.items.find((i) => i.id === id);
  const [n, setN] = useState(1);
  const [hold, setHold] = useState(60);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  if (!item) return null;
  const shop = shopOf(s, item.shopId);
  const hidden = hiddenReason(item, now);
  const reported = s.reports.find((r) => r.itemId === item.id);
  const reviews = [
    ...s.orders.filter((o) => o.itemId === item.id && o.stars).map((o) => ({ id: o.id, name: s.profile.name, stars: o.stars ?? 5, text: o.review || 'Món ngon, người bán thân thiện.' })),
    ...(SAMPLE_REVIEWS[item.shopId] ?? []).map((r, i) => ({ id: 'r' + i, ...r })),
  ];
  const seller = s.role === 'seller';
  const end = Math.min(item.expiresAt, item.pickupTo);

  return (
    <>
      <div className="scroll">
        <div className="detail-media">
          <Photo item={item} alt={item.name} />
          <div className="detail-actions">
            <IconButton variant="float" onClick={nav.back} aria-label="Quay lại">
              <ArrowLeft size={20} />
            </IconButton>
            <FavButton id={item.id} float />
          </div>
        </div>
        <div className="detail-body">
          {hidden && <Banner>Món đã tự ẩn ({hidden}). Người mua không còn thấy món này.</Banner>}
          <div className="row between top">
            <h1 className="detail-title">{item.name}</h1>
            <DiscountBadge item={item} />
          </div>
          <Price item={item} size="lg" />
          {!hidden && (
            <div className="urgency">
              <Clock size={16} />
              <span>
                Còn <b>{left(end, now)}</b> để nhận · còn <b>{item.qty} phần</b>
              </span>
            </div>
          )}

          <button className="shop-line clickable" onClick={() => nav.open({ name: 'shop', id: shop.id })}>
            <Avatar text={shop.emoji} />
            <span className="grow">
              <b>{shop.name}</b>
              <span className="sub">
                <Star size={12} className="star on" /> {shop.rating} · {shop.dist} km · {shop.address}
              </span>
            </span>
            <Store size={18} className="chev" />
          </button>

          <div className="facts">
            <StatTile icon={<CookingPot size={18} />} value={item.cookedAt} label="Giờ nấu" />
            <StatTile icon={<Clock size={18} />} value={hm(item.expiresAt)} label="Hạn dùng" />
            <StatTile icon={<MapPin size={18} />} value={`${hm(item.pickupFrom)}–${hm(item.pickupTo)}`} label="Giờ nhận" />
          </div>

          {!seller && !hidden && (
            <div>
              <Label>Giữ món trong</Label>
              <div className="hold-grid">
                {HOLDS.map((m) => (
                  <Pill key={m} on={hold === m} onClick={() => setHold(m)}>
                    {m} phút
                  </Pill>
                ))}
              </div>
            </div>
          )}

          <SectionTitle>Đánh giá ({reviews.length})</SectionTitle>
          {reviews.length === 0 ? (
            <Muted>Chưa có đánh giá. Nhận món xong bạn có thể đánh giá bài đăng này.</Muted>
          ) : (
            <Stack gap="sm">
              {reviews.map((o) => (
                <Card key={o.id}>
                  <div className="row between">
                    <b>{o.name}</b>
                    <Stars value={o.stars} />
                  </div>
                  <Muted>{o.text}</Muted>
                </Card>
              ))}
            </Stack>
          )}
          {item.shopId !== MY_SHOP_ID && (
            <Button variant="text" size="sm" icon={<Flag size={15} />} disabled={!!reported} onClick={() => setReportOpen(true)}>
              {reported ? `Đã báo cáo: ${reported.reason}` : 'Báo cáo bài đăng'}
            </Button>
          )}
        </div>
      </div>
      {!seller && (
        <Footer>
          <Stepper value={n} max={Math.max(1, Math.min(item.qty, 5))} onChange={setN} />
          <Button grow size="lg" disabled={!!hidden} onClick={() => nav.open({ name: 'pay', id: item.id, qty: n, hold })}>
            {hidden ? 'Không còn nhận giữ' : `Giữ món · ${fmt(item.price * n)}`}
          </Button>
        </Footer>
      )}
      {reportOpen && (
        <Sheet title="Báo cáo bài đăng" onClose={() => setReportOpen(false)}>
          <Muted>EcoBite sẽ kiểm tra và gỡ bài nếu vi phạm.</Muted>
          <Stack gap="sm">
            {REPORT_REASONS.map((r) => (
              <Card key={r} tone={reason === r ? 'selected' : undefined} onClick={() => setReason(r)}>
                <div className="row between">
                  {r}
                  <span className={'radio' + (reason === r ? ' on' : '')} />
                </div>
              </Card>
            ))}
          </Stack>
          <Button
            block
            size="lg"
            disabled={!reason}
            onClick={() => {
              d({ type: 'report', report: { itemId: item.id, reason } });
              setReportOpen(false);
              showToast('Đã gửi báo cáo. Cảm ơn bạn!');
            }}
          >
            Gửi báo cáo
          </Button>
        </Sheet>
      )}
    </>
  );
}

/* ───────── Trang cửa hàng ───────── */

export function ShopPage({ id, nav }: { id: string; nav: Nav }) {
  const { s } = useStore();
  const now = useNow();
  const shop = shopOf(s, id);
  const items = s.items.filter((i) => i.shopId === id && !hiddenReason(i, now));
  const offers = OFFERS.filter((o) => o.shopId === id);
  return (
    <>
      <TopBar title="Cửa hàng" onBack={nav.back} />
      <Page>
        <div className="shop-head">
          <span className="shop-logo">{shop.emoji}</span>
          <div>
            <h2>{shop.name}</h2>
            <span className="sub">
              <Star size={13} className="star on" /> {shop.rating} · {shop.dist} km
            </span>
          </div>
        </div>
        <Muted>{shop.intro}</Muted>
        <div className="list-group">
          <ListRow icon={<MapPin size={18} />} title="Địa chỉ" sub={shop.address} />
          <ListRow icon={<Clock size={18} />} title="Giờ mở cửa" sub={shop.hours} />
          <ListRow icon={<Phone size={18} />} title="Liên hệ" sub={shop.phone} />
          <ListRow icon={<Bike size={18} />} title="Giao hàng" sub={shop.deliveryFee ? `Cửa hàng tự giao · ${fmt(shop.deliveryFee)}` : 'Chỉ nhận tại cửa hàng'} />
        </div>
        <div className="row">
          <a className="btn ghost md grow" href={`tel:${shop.phone.replace(/\s/g, '')}`}>
            <Phone size={17} />
            <span>Gọi</span>
          </a>
          <a className="btn ghost md grow" href={`https://maps.google.com/?q=${encodeURIComponent(shop.address)}`} target="_blank" rel="noreferrer">
            <Navigation size={17} />
            <span>Chỉ đường</span>
          </a>
        </div>
        {offers.map((o) => (
          <Banner key={o.id} tone="info" icon={<Gift size={16} />}>
            <b>{o.title}</b> · {o.desc} · mã <b>{o.code}</b>
          </Banner>
        ))}
        <SectionTitle>Món đang bán ({items.length})</SectionTitle>
        <Stack gap="sm">
          {items.map((i) => (
            <ItemRow key={i.id} item={i} nav={nav} now={now} />
          ))}
        </Stack>
        {items.length === 0 && <Empty icon={<Package size={30} />}>Cửa hàng chưa có món nào đang bán.</Empty>}
      </Page>
    </>
  );
}

/* ───────── Chốt món ───────── */

const METHODS: { id: string; label: string; sub: string; icon: LucideIcon }[] = [
  { id: 'mb', label: 'Chuyển khoản MB Bank', sub: 'Tiền giữ tạm đến khi nhận món', icon: Landmark },
  { id: 'card', label: 'Thẻ ngân hàng', sub: 'Thẻ •••• 2925', icon: CreditCard },
  { id: 'cash', label: 'Tiền mặt khi nhận', sub: 'Trả trực tiếp cho người bán', icon: Banknote },
];

function Choice({ on, disabled, icon, title, sub, onClick }: { on: boolean; disabled?: boolean; icon: React.ReactNode; title: React.ReactNode; sub: string; onClick: () => void }) {
  return (
    <button className={'choice' + (on ? ' on' : '') + (disabled ? ' disabled' : '')} onClick={disabled ? undefined : onClick} disabled={disabled}>
      <IconTile>{icon}</IconTile>
      <span className="grow">
        <b>{title}</b>
        <span>{sub}</span>
      </span>
      <span className={'radio' + (on ? ' on' : '')} />
    </button>
  );
}

export function Pay({ id, qty, hold, nav }: { id: string; qty: number; hold: number; nav: Nav }) {
  const { s, d } = useStore();
  const item = s.items.find((i) => i.id === id);
  const [fulfil, setFulfil] = useState<Fulfil>('pickup');
  const [address, setAddress] = useState(s.profile.address);
  const [m, setM] = useState('mb');
  const [done, setDone] = useState<Order | null>(null);
  if (!item) return null;
  const shop = shopOf(s, item.shopId);
  const fee = fulfil === 'shop' ? shop.deliveryFee : 0;
  const total = item.price * qty;
  const addrErr = fulfil === 'shop' && !address.trim() ? 'Vui lòng nhập địa chỉ nhận' : undefined;

  const confirm = () => {
    if (addrErr) return;
    const now = Date.now();
    const order: Order = {
      id: 'o' + now,
      code: String(1000 + Math.floor(Math.random() * 9000)),
      itemId: item.id,
      qty,
      total,
      fee,
      fulfil,
      address: fulfil === 'shop' ? address.trim() : undefined,
      method: METHODS.find((x) => x.id === m)!.label,
      status: 'paid',
      holdMins: hold,
      createdAt: now,
      msgs:
        item.shopId === MY_SHOP_ID
          ? []
          : [
              {
                from: 'seller',
                text:
                  fulfil === 'shop'
                    ? `Chào bạn, ${shop.name} đã nhận đơn ${qty} phần ${item.name}. Shop sẽ tự giao tới ${address.trim()} nhé!`
                    : `Chào bạn, ${shop.name} đã giữ ${qty} phần ${item.name}. Bạn đến lấy khung ${hm(item.pickupFrom)}–${hm(item.pickupTo)} nhé!`,
                at: now,
              },
            ],
    };
    d({ type: 'order', order });
    setDone(order);
  };

  if (done)
    return (
      <div className="success">
        <div className="success-icon">
          <CircleCheck size={56} />
        </div>
        <h2>Đã chốt món!</h2>
        <p className="muted center">Đưa mã này cho người bán khi nhận món</p>
        <div className="code-box">{done.code}</div>
        <div className="summary-card">
          <FulfilLabel f={done.fulfil} />
          <span>Giữ {hold} phút · {done.method}</span>
        </div>
        <Button
          block
          size="lg"
          icon={<MessageCircle size={18} />}
          onClick={() => {
            nav.back();
            nav.back();
            nav.open({ name: 'chat', orderId: done.id });
          }}
        >
          Nhắn tin cho cửa hàng
        </Button>
        <Button variant="ghost" block size="lg" onClick={() => nav.tab('orders')}>
          Xem đơn của tôi
        </Button>
      </div>
    );

  return (
    <>
      <TopBar title="Chốt món" onBack={nav.back} />
      <Page
        footer={
          <Footer>
            <div className="total">
              <span>Tổng cộng</span>
              <b>{fmt(total + fee)}</b>
            </div>
            <Button grow size="lg" disabled={!!addrErr} onClick={confirm}>
              Xác nhận
            </Button>
          </Footer>
        }
      >
        <div className="order-item">
          <Photo item={item} className="sq-56" />
          <span className="grow">
            <b>{item.name}</b>
            <span className="sub">
              {qty} phần · {shop.name}
            </span>
          </span>
          <b>{fmt(total)}</b>
        </div>

        <SectionTitle>Cách nhận món</SectionTitle>
        <Stack gap="sm">
          {(Object.keys(FULFIL) as Fulfil[]).map((k) => {
            const I = FULFIL[k].icon;
            const off = k === 'shop' && !shop.deliveryFee;
            return (
              <Choice
                key={k}
                on={fulfil === k}
                disabled={off}
                icon={<I size={20} />}
                title={k === 'shop' && shop.deliveryFee ? `${FULFIL[k].label} · ${fmt(shop.deliveryFee)}` : FULFIL[k].label}
                sub={off ? 'Cửa hàng này không tự giao' : FULFIL[k].desc}
                onClick={() => setFulfil(k)}
              />
            );
          })}
        </Stack>
        {fulfil === 'shop' ? (
          <Field label="Địa chỉ nhận" required value={address} onChange={(e) => setAddress(e.target.value)} error={addrErr} />
        ) : (
          <div className="where">
            <MapPin size={16} />
            <span>
              <b>{shop.address}</b>
              <span className="sub">
                Nhận trong khung {hm(item.pickupFrom)}–{hm(item.pickupTo)}
              </span>
            </span>
          </div>
        )}
        <Muted className="small">EcoBite chỉ kết nối người bán và người mua, không qua ứng dụng giao hàng trung gian.</Muted>

        <SectionTitle>Thanh toán</SectionTitle>
        <Stack gap="sm">
          {METHODS.map((x) => (
            <Choice key={x.id} on={m === x.id} icon={<x.icon size={20} />} title={x.label} sub={x.sub} onClick={() => setM(x.id)} />
          ))}
        </Stack>
        <div className="bill">
          <div className="row between">
            <span>Tiền món</span>
            <span>{fmt(total)}</span>
          </div>
          <div className="row between">
            <span>Phí cửa hàng giao</span>
            <span>{fee ? fmt(fee) : 'Miễn phí'}</span>
          </div>
        </div>
      </Page>
    </>
  );
}

/* ───────── Đơn của tôi ───────── */

const STATUS = {
  paid: { text: 'Chờ nhận món', tone: 'warn' },
  received: { text: 'Đã nhận', tone: 'brand' },
  reviewed: { text: 'Hoàn tất', tone: 'brand' },
  cancelled: { text: 'Đã hủy', tone: 'muted' },
} as const;
const SEGS = [
  ['active', 'Đang xử lý'],
  ['history', 'Lịch sử'],
  ['fav', 'Yêu thích'],
] as const;

export function Orders({ nav }: { nav: Nav }) {
  const { s, d, showToast } = useStore();
  const now = useNow();
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [seg, setSeg] = useState<(typeof SEGS)[number][0]>('active');
  const favs = s.items.filter((i) => s.favorites.includes(i.id));
  const shown = s.orders.filter((o) => (seg === 'active' ? o.status === 'paid' || o.status === 'received' : o.status === 'reviewed' || o.status === 'cancelled'));

  return (
    <>
      <TopBar title="Đơn của tôi" />
      <div className="seg-wrap">
        <Segmented options={SEGS} value={seg} onChange={setSeg} />
      </div>
      <Page>
        {seg === 'fav' && favs.length === 0 && <Empty icon={<Heart size={30} />}>Bấm vào trái tim ở món bất kỳ để lưu lại đây.</Empty>}
        {seg !== 'fav' && shown.length === 0 && (
          <Empty
            icon={<ShoppingBag size={30} />}
            action={
              seg === 'active' ? (
                <Button size="sm" onClick={() => nav.tab('home')}>
                  Tìm món gần bạn
                </Button>
              ) : undefined
            }
          >
            {seg === 'active' ? 'Bạn chưa giữ món nào.' : 'Chưa có đơn đã xong.'}
          </Empty>
        )}
        <Stack gap="sm">
          {seg === 'fav' && favs.map((i) => <ItemRow key={i.id} item={i} nav={nav} now={now} />)}
          {seg !== 'fav' &&
            shown.map((o) => {
              const item = s.items.find((i) => i.id === o.itemId);
              if (!item) return null;
              const shop = shopOf(s, item.shopId);
              const st = STATUS[o.status];
              return (
                <div key={o.id} className="order-card">
                  <div className="order-card-head">
                    <WithIcon icon={<Store size={15} />}>
                      <b>{shop.name}</b>
                    </WithIcon>
                    <Chip tone={st.tone}>{st.text}</Chip>
                  </div>
                  <button className="order-item clickable" onClick={() => nav.open({ name: 'detail', id: item.id })}>
                    <Photo item={item} className="sq-56" />
                    <span className="grow">
                      <b>{item.name}</b>
                      <span className="sub">
                        {o.qty} phần · {fmt(o.total + o.fee)}
                      </span>
                    </span>
                  </button>
                  {o.status === 'paid' && (
                    <>
                      <div className="pickup-box">
                        <div>
                          <span className="sub">Mã nhận món</span>
                          <b className="code-sm">{o.code}</b>
                        </div>
                        <div className="right">
                          <FulfilLabel f={o.fulfil} />
                          <Countdown createdAt={o.createdAt} mins={o.holdMins} />
                        </div>
                      </div>
                      <Muted className="small">{o.fulfil === 'shop' ? `Giao tới: ${o.address}` : `${shop.address} · nhận ${hm(item.pickupFrom)}–${hm(item.pickupTo)}`}</Muted>
                      <div className="row">
                        <Button variant="ghost" grow icon={<MessageCircle size={17} />} onClick={() => nav.open({ name: 'chat', orderId: o.id })}>
                          Nhắn tin
                        </Button>
                        <Button
                          grow
                          icon={<CircleCheck size={17} />}
                          onClick={() => {
                            d({ type: 'receive', orderId: o.id });
                            showToast('+20 EcoPoint · bạn vừa cứu 0,5 kg thực phẩm!');
                          }}
                        >
                          Đã nhận món
                        </Button>
                      </div>
                      <Button variant="text" size="sm" onClick={() => setCancelling(o.id)}>
                        Hủy giữ món
                      </Button>
                    </>
                  )}
                  {o.status === 'received' && (
                    <Button block icon={<Star size={17} />} onClick={() => setReviewing(o.id)}>
                      Đánh giá món và người bán
                    </Button>
                  )}
                  {o.status === 'reviewed' && (
                    <div className="row between">
                      <span className="review-line">
                        <Stars value={o.stars ?? 5} /> {o.review && <span className="sub">“{o.review}”</span>}
                      </span>
                      <Button variant="soft" size="sm" icon={<RotateCcw size={15} />} onClick={() => nav.open({ name: 'detail', id: item.id })}>
                        Mua lại
                      </Button>
                    </div>
                  )}
                  {o.status === 'cancelled' && (
                    <Button variant="soft" size="sm" icon={<RotateCcw size={15} />} onClick={() => nav.open({ name: 'detail', id: item.id })}>
                      Mua lại
                    </Button>
                  )}
                </div>
              );
            })}
        </Stack>
      </Page>

      {reviewing && (
        <Sheet title="Đánh giá món và người bán" onClose={() => setReviewing(null)}>
          <Stars value={stars} onChange={setStars} />
          <TextArea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Món còn tươi ngon, người bán thân thiện…" />
          <Button
            block
            size="lg"
            onClick={() => {
              d({ type: 'review', orderId: reviewing, stars, text: text.trim() });
              setText('');
              setReviewing(null);
              showToast('Cảm ơn bạn đã đánh giá! +10 EcoPoint');
            }}
          >
            Gửi đánh giá
          </Button>
        </Sheet>
      )}
      {cancelling && (
        <Sheet title="Hủy giữ món?" onClose={() => setCancelling(null)}>
          <Muted>Món được trả lại cho cửa hàng, tiền đã trả (nếu có) được hoàn ngay.</Muted>
          <div className="row">
            <Button variant="ghost" grow onClick={() => setCancelling(null)}>
              Giữ lại
            </Button>
            <Button
              grow
              onClick={() => {
                d({ type: 'cancel', orderId: cancelling });
                setCancelling(null);
                showToast('Đã hủy và hoàn tiền');
              }}
            >
              Hủy giữ món
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}

/* ───────── Chat phía người mua ───────── */

const SHOP_REPLIES = ['Dạ vâng ạ, em để phần cho mình rồi nhé 😊', 'Mình đến quầy đọc mã nhận món là được ạ.', 'Cảm ơn bạn đã chung tay giảm lãng phí thực phẩm 🌱'];

export function ChatView({ orderId, nav }: { orderId: string; nav: Nav }) {
  const { s, d } = useStore();
  const order = s.orders.find((o) => o.id === orderId);
  const item = s.items.find((i) => i.id === order?.itemId);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!order || !item) return null;
  const shop = shopOf(s, item.shopId);
  // Món của chính cửa hàng mình: phía người bán (cũng máy này) tự trả lời ở vai Người bán. Còn lại giả lập trả lời.
  const auto = item.shopId !== MY_SHOP_ID;

  return (
    <ChatBox
      title={shop.name}
      avatar={<span className="avatar xs">{shop.emoji}</span>}
      sub={`${item.name} · ${order.qty} phần · mã ${order.code}`}
      msgs={order.msgs}
      me="buyer"
      nav={nav}
      quick={['Mấy giờ mình đến lấy được ạ?', 'Cho mình xin vị trí cụ thể', 'Mình sắp tới rồi nhé!']}
      onSend={(t) => {
        d({ type: 'chat', orderId, msg: { from: 'buyer', text: t, at: Date.now() } });
        if (auto) {
          const reply = SHOP_REPLIES[order.msgs.filter((m) => m.from === 'seller').length % SHOP_REPLIES.length];
          timers.current.push(window.setTimeout(() => d({ type: 'chat', orderId, msg: { from: 'seller', text: reply, at: Date.now() } }), 1200));
        }
      }}
    />
  );
}

/* ───────── Tài khoản người mua ───────── */

const initials = (n: string) =>
  n
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export function ProfileEdit({ nav }: { nav: Nav }) {
  const { s, d, showToast } = useStore();
  const [p, setP] = useState(s.profile);
  const err = !p.name.trim() ? 'Vui lòng nhập họ tên' : undefined;
  return (
    <>
      <TopBar title="Thông tin cá nhân" onBack={nav.back} />
      <Page
        footer={
          <Footer>
            <Button
              grow
              size="lg"
              disabled={!!err}
              onClick={() => {
                d({ type: 'profile', profile: { ...p, name: p.name.trim() } });
                showToast('Đã lưu thông tin');
                nav.back();
              }}
            >
              Lưu
            </Button>
          </Footer>
        }
      >
        <Stack>
          <Field label="Họ tên" required value={p.name} error={err} onChange={(e) => setP({ ...p, name: e.target.value })} />
          <Field label="Số điện thoại" inputMode="tel" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          <Field label="Địa chỉ nhận mặc định" hint="Dùng khi cửa hàng tự giao" value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} />
        </Stack>
      </Page>
    </>
  );
}

export function BuyerAccount({ nav }: { nav: Nav }) {
  const { s, d, showToast } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const level = s.kg >= 10 ? 3 : s.kg >= 5 ? 2 : 1;
  return (
    <>
      <TopBar title="Tài khoản" />
      <Page>
        <Stack gap="lg">
          <button className="profile-card clickable" onClick={() => nav.open({ name: 'profile' })}>
            <span className="avatar lg">{initials(s.profile.name)}</span>
            <span className="grow">
              <b>{s.profile.name}</b>
              <span className="sub">{s.profile.phone}</span>
              <Chip icon={<Leaf size={12} />}>Green Consumer cấp {level}</Chip>
            </span>
            <User size={18} className="chev" />
          </button>
          <div className="facts">
            <StatTile icon={<Leaf size={18} />} value={`${s.kg} kg`} label="đã cứu" />
            <StatTile icon={<Star size={18} />} value={s.points} label="EcoPoint" />
            <StatTile icon={<ShoppingBag size={18} />} value={s.orders.length} label="đơn" />
          </div>
          <div className="list-group">
            <ListRow icon={<Bell size={18} />} title="Thông báo món mới gần bạn" sub="Flash sale, món mới trong 2 km" right={<Switch on={s.push} onChange={(on) => d({ type: 'push', on })} label="Bật tắt thông báo" />} />
            <ListRow icon={<Gift size={18} />} title="Mời bạn – nhận thưởng" sub="Mã ECO-AN2025 · +50 EcoPoint mỗi bạn" onClick={() => showToast('Đã chép mã mời ECO-AN2025')} />
            <ListRow icon={<Store size={18} />} title="Chuyển sang Người bán" sub="Đăng món dư của cửa hàng bạn" onClick={() => d({ type: 'role', role: 'seller' })} />
          </div>
          <div className="list-group">
            <ListRow icon={<RefreshCcw size={18} />} title="Đặt lại dữ liệu demo" sub="Dữ liệu đang lưu trên máy này" onClick={() => setConfirmReset(true)} danger />
          </div>
        </Stack>
      </Page>
      {confirmReset && <ResetSheet onClose={() => setConfirmReset(false)} />}
    </>
  );
}

export function ResetSheet({ onClose }: { onClose: () => void }) {
  const { d, showToast } = useStore();
  return (
    <Sheet title="Đặt lại dữ liệu demo?" onClose={onClose}>
      <Muted>Mọi đơn, món đã đăng, tin nhắn trên máy này sẽ bị xóa và quay về dữ liệu mẫu.</Muted>
      <div className="row">
        <Button variant="ghost" grow onClick={onClose}>
          Không
        </Button>
        <Button
          grow
          onClick={() => {
            d({ type: 'reset' });
            onClose();
            showToast('Đã đặt lại dữ liệu demo');
          }}
        >
          Đặt lại
        </Button>
      </div>
    </Sheet>
  );
}
