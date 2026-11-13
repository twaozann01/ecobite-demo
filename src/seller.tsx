import { useEffect, useRef, useState } from 'react';
import {
  Bike, Camera, CircleCheck, Clock, Eye, EyeOff, Image as ImageIcon, MapPin, MessageCircle, Package, PackagePlus, Pencil, Phone, Plus,
  RefreshCcw, ShoppingBag, Store, Trash2, X,
} from 'lucide-react';
import type { Nav } from './App';
import { CATEGORIES, MY_SHOP_ID, PRESET_PHOTOS, atToday, fmt, hiddenReason, hm, left, photo, readPhoto, type Category, type Shop } from './data';
import { LogoutRow, ResetSheet } from './buyer';
import { StatsTeaser } from './extra';
import { ChatBox, FulfilLabel } from './shared';
import { FULFIL, shopOf, useNow, useStore } from './store';
import {
  Avatar, Banner, Button, Chip, Empty, Field, Footer, IconButton, Label, ListRow, Muted, Page, Photo, Pill, Price, SectionTitle, Segmented, Sheet,
  Stack, StatTile, Stepper, TopBar, WithIcon,
} from './ui';

/* ───────── Món đang bán ───────── */

const SEGS = [
  ['live', 'Đang hiện'],
  ['hidden', 'Đã ẩn'],
] as const;

export function Listings({ nav }: { nav: Nav }) {
  const { s, d, showToast } = useStore();
  const now = useNow();
  const [seg, setSeg] = useState<(typeof SEGS)[number][0]>('live');
  const [removing, setRemoving] = useState<string | null>(null);
  const shop = shopOf(s, MY_SHOP_ID);
  const mine = s.items.filter((i) => i.shopId === MY_SHOP_ID);
  const live = mine.filter((i) => !hiddenReason(i, now));
  const hidden = mine.filter((i) => hiddenReason(i, now));
  const waiting = s.sellerOrders.filter((o) => !o.done).length;
  const shown = seg === 'live' ? live : hidden;

  return (
    <>
      <TopBar title={shop.name} sub="Kênh người bán" right={<Avatar text={shop.emoji} />} />
      <Page>
        <Stack gap="lg">
          <div className="facts">
            <StatTile icon={<Eye size={18} />} value={live.length} label="đang hiện" />
            <StatTile icon={<EyeOff size={18} />} value={hidden.length} label="đã ẩn" />
            <StatTile icon={<ShoppingBag size={18} />} value={waiting} label="đơn chờ" />
          </div>
          <Button size="lg" block icon={<Plus size={20} />} onClick={() => nav.open({ name: 'post' })}>
            Đăng món mới
          </Button>
          <StatsTeaser nav={nav} />
          <div>
            <Segmented options={SEGS} value={seg} onChange={setSeg} />
          </div>
          {shown.length === 0 && (
            <Empty icon={<PackagePlus size={30} />}>{seg === 'live' ? 'Chưa có món đang hiện. Đăng món dư để người mua gần bạn thấy ngay.' : 'Chưa có món bị ẩn.'}</Empty>
          )}
          <Stack gap="sm">
            {shown.map((i) => {
              const why = hiddenReason(i, now);
              return (
                <div key={i.id} className="listing">
                  <button className="listing-main clickable" onClick={() => nav.open({ name: 'detail', id: i.id })}>
                    <Photo item={i} className="sq-72" />
                    <span className="grow">
                      <b>{i.name}</b>
                      <Price item={i} />
                      <span className="meta">
                        <WithIcon icon={<Package size={13} />}>{i.qty} phần</WithIcon>
                        <WithIcon icon={<Clock size={13} />}>
                          {hm(i.pickupFrom)}–{hm(i.pickupTo)}
                        </WithIcon>
                      </span>
                    </span>
                  </button>
                  <div className="listing-foot">
                    {why ? (
                      <Chip tone="muted" icon={<EyeOff size={12} />}>
                        Tự ẩn · {why}
                      </Chip>
                    ) : (
                      <Chip icon={<Eye size={12} />}>Còn {left(Math.min(i.expiresAt, i.pickupTo), now)}</Chip>
                    )}
                    <div className="row">
                      <Button variant="soft" size="sm" icon={<PackagePlus size={15} />} onClick={() => d({ type: 'restock', id: i.id })}>
                        +5 phần
                      </Button>
                      <IconButton onClick={() => setRemoving(i.id)} aria-label="Xóa món">
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </Stack>
        </Stack>
      </Page>
      {removing && (
        <Sheet title="Gỡ món này?" onClose={() => setRemoving(null)}>
          <Muted>Món sẽ biến mất khỏi danh sách của người mua.</Muted>
          <div className="row">
            <Button variant="ghost" grow onClick={() => setRemoving(null)}>
              Không
            </Button>
            <Button
              grow
              onClick={() => {
                d({ type: 'removeItem', id: removing });
                setRemoving(null);
                showToast('Đã gỡ món');
              }}
            >
              Gỡ món
            </Button>
          </div>
        </Sheet>
      )}
    </>
  );
}

/* ───────── Đăng món: 3 bước ───────── */

interface Form {
  photo: string; // ảnh chụp/chọn từ máy (data URL) hoặc ảnh có sẵn
  preset: string;
  name: string;
  cat: Category;
  price: string;
  orig: string;
  qty: number;
  cooked: string;
  expires: string;
  from: string;
  to: string;
}
type Errs = Partial<Record<keyof Form, string>>;

const STEPS = ['Món ăn', 'Giá & số lượng', 'Thời gian'];

function validateStep(step: number, f: Form, now: number): Errs {
  const e: Errs = {};
  if (step === 0) {
    if (!f.photo && !f.preset) e.photo = 'Vui lòng chụp, chọn ảnh hoặc chọn ảnh có sẵn';
    if (!f.name.trim()) e.name = 'Vui lòng nhập tên món';
  }
  if (step === 1) {
    if (!(Number(f.price) > 0)) e.price = 'Vui lòng nhập giá bán';
    if (f.orig && Number(f.orig) < Number(f.price)) e.orig = 'Giá gốc phải lớn hơn giá bán';
    if (!(f.qty > 0)) e.qty = 'Vui lòng nhập số lượng';
  }
  if (step === 2) {
    if (!f.cooked) e.cooked = 'Vui lòng nhập giờ nấu';
    if (!f.expires) e.expires = 'Vui lòng nhập hạn dùng';
    else if (atToday(f.expires, now) <= now) e.expires = 'Hạn dùng phải sau thời điểm hiện tại';
    if (!f.from) e.from = 'Bắt buộc';
    if (!f.to) e.to = 'Bắt buộc';
    else if (f.from && atToday(f.to, now) <= atToday(f.from, now)) e.to = 'Phải sau giờ bắt đầu';
  }
  return e;
}

export function PostWizard({ nav }: { nav: Nav }) {
  const { d, showToast } = useStore();
  const now = useNow();
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);
  const [f, setF] = useState<Form>(() => ({ photo: '', preset: '', name: '', cat: 'Cơm', price: '', orig: '', qty: 5, cooked: hm(Date.now()), expires: '', from: hm(Date.now()), to: '' }));
  const errs = validateStep(step, f, now);
  const err = (k: keyof Form) => (tried ? errs[k] : undefined);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const img = f.photo || (f.preset ? photo(f.preset) : '');
  const pctOff = Number(f.orig) > Number(f.price) && Number(f.price) > 0 ? Math.round((1 - Number(f.price) / Number(f.orig)) * 100) : 0;

  const next = () => {
    setTried(true);
    if (Object.keys(errs).length) return;
    setTried(false);
    if (step < 2) return setStep(step + 1);
    const preset = PRESET_PHOTOS.find((p) => p.key === f.preset);
    d({
      type: 'addItem',
      item: {
        id: 'm' + Date.now(),
        name: f.name.trim(),
        emoji: preset?.emoji ?? '🍱',
        bg: '#dcfce7',
        photo: img,
        shopId: MY_SHOP_ID,
        cat: f.cat,
        price: Number(f.price),
        orig: Number(f.orig) || Number(f.price),
        qty: f.qty,
        cookedAt: f.cooked,
        expiresAt: atToday(f.expires, now),
        pickupFrom: atToday(f.from, now),
        pickupTo: atToday(f.to, now),
        createdAt: Date.now(),
      },
    });
    showToast('Đã đăng món · đã báo cho người mua gần bạn');
    nav.back();
  };

  const quickExpire = (h: number) => {
    const t = hm(now + h * 3600_000);
    setF({ ...f, expires: t, to: t });
  };

  return (
    <>
      <TopBar title="Đăng món mới" sub={`Bước ${step + 1}/3 · ${STEPS[step]}`} onBack={step ? () => setStep(step - 1) : nav.back} right={<IconButton onClick={nav.back} aria-label="Đóng"><X size={20} /></IconButton>} />
      <div className="progress">
        {STEPS.map((_, i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      <Page
        footer={
          <Footer>
            {step > 0 && (
              <Button variant="ghost" size="lg" onClick={() => setStep(step - 1)}>
                Quay lại
              </Button>
            )}
            <Button grow size="lg" onClick={next}>
              {step < 2 ? 'Tiếp tục' : 'Đăng món'}
            </Button>
          </Footer>
        }
      >
        {step === 0 && (
          <Stack gap="lg">
            <div>
              <Label required>Ảnh món</Label>
              <label className={'photo-drop' + (img ? ' has' : '') + (err('photo') ? ' invalid' : '')}>
                {img ? (
                  <>
                    <img src={img} alt="Ảnh món" />
                    <span className="photo-change">
                      <Pencil size={14} /> Đổi ảnh
                    </span>
                  </>
                ) : (
                  <>
                    <Camera size={30} />
                    <b>Chụp hoặc chọn ảnh món</b>
                    <span>Ảnh thật giúp bán nhanh hơn</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setF({ ...f, photo: await readPhoto(file), preset: '' });
                    } catch {
                      showToast('Không đọc được ảnh, vui lòng chọn ảnh khác');
                    }
                  }}
                />
              </label>
              {err('photo') && <span className="err">{err('photo')}</span>}
              <p className="muted small mt">
                <WithIcon icon={<ImageIcon size={13} />}>Hoặc dùng ảnh có sẵn</WithIcon>
              </p>
              <div className="preset-grid">
                {PRESET_PHOTOS.map((p) => (
                  <button key={p.key} className={'preset' + (f.preset === p.key && !f.photo ? ' on' : '')} onClick={() => setF({ ...f, preset: p.key, photo: '', name: f.name || p.label })}>
                    <img src={photo(p.key)} alt="" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Tên món" required placeholder="VD: Cơm gà xối mỡ" value={f.name} onChange={set('name')} error={err('name')} />
            <div>
              <Label>Loại món</Label>
              <div className="row wrap">
                {CATEGORIES.map((c) => (
                  <Pill key={c} on={f.cat === c} onClick={() => setF({ ...f, cat: c })}>
                    {c}
                  </Pill>
                ))}
              </div>
            </div>
          </Stack>
        )}

        {step === 1 && (
          <Stack gap="lg">
            <Field label="Giá bán" required inputMode="numeric" placeholder="20.000" suffix="đ" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, '') })} error={err('price')} />
            <Field
              label="Giá gốc"
              inputMode="numeric"
              placeholder="40.000"
              suffix="đ"
              value={f.orig}
              onChange={(e) => setF({ ...f, orig: e.target.value.replace(/\D/g, '') })}
              error={err('orig')}
              hint={pctOff ? `Người mua thấy giảm ${pctOff}%` : 'Không bắt buộc, để hiện % giảm giá'}
            />
            <div>
              <Label required>Số lượng</Label>
              <div className="row between qty-field">
                <span className="muted">Số phần còn dư</span>
                <Stepper value={f.qty} min={1} max={50} onChange={(n) => setF({ ...f, qty: n })} />
              </div>
            </div>
          </Stack>
        )}

        {step === 2 && (
          <Stack gap="lg">
            <div className="grid2">
              <Field label="Giờ nấu" required type="time" value={f.cooked} onChange={set('cooked')} error={err('cooked')} />
              <Field label="Hạn dùng" required type="time" value={f.expires} onChange={set('expires')} error={err('expires')} />
            </div>
            <div>
              <Muted className="small">Chọn nhanh hạn dùng:</Muted>
              <div className="row wrap mt">
                {[1, 2, 3, 5].map((h) => (
                  <Pill key={h} onClick={() => quickExpire(h)}>
                    +{h} giờ
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <Label required>Khung giờ nhận</Label>
              <div className="grid2">
                <Field type="time" value={f.from} onChange={set('from')} error={err('from')} />
                <Field type="time" value={f.to} onChange={set('to')} error={err('to')} />
              </div>
            </div>
            <Banner tone="info" icon={<EyeOff size={16} />}>
              Món tự ẩn khi hết số lượng hoặc quá hạn dùng / giờ nhận.
            </Banner>
            <div>
              <Label>Xem trước</Label>
              <div className="preview">
                {img && <img src={img} alt="" />}
                <span className="grow">
                  <b>{f.name || 'Tên món'}</b>
                  <span className="price">{f.price ? fmt(Number(f.price)) : '—'}</span>
                  <span className="sub">
                    {f.qty} phần · nhận {f.from || '--:--'}–{f.to || '--:--'}
                  </span>
                </span>
              </div>
            </div>
          </Stack>
        )}
      </Page>
    </>
  );
}

/* ───────── Đơn khách ───────── */

export function SellerOrders({ nav }: { nav: Nav }) {
  const { s, d, showToast } = useStore();
  const [seg, setSeg] = useState<'wait' | 'done'>('wait');
  const list = s.sellerOrders.filter((o) => (seg === 'wait' ? !o.done : o.done));
  return (
    <>
      <TopBar title="Đơn khách" />
      <div className="seg-wrap">
        <Segmented
          options={[
            ['wait', `Chờ nhận (${s.sellerOrders.filter((o) => !o.done).length})`],
            ['done', 'Đã xong'],
          ]}
          value={seg}
          onChange={setSeg}
        />
      </div>
      <Page>
        {list.length === 0 && <Empty icon={<ShoppingBag size={30} />}>{seg === 'wait' ? 'Chưa có khách giữ món.' : 'Chưa có đơn đã xong.'}</Empty>}
        <Stack gap="sm">
          {list.map((o) => {
            const linked = o.orderId ? s.orders.find((x) => x.id === o.orderId) : undefined;
            return (
              <div key={o.id} className="order-card">
                <div className="order-card-head">
                  <span className="row">
                    <span className="avatar sm">{o.buyer.split(' ').pop()![0]}</span>
                    <b>{o.buyer}</b>
                  </span>
                  <Chip tone={o.done ? 'brand' : 'warn'}>{o.done ? 'Đã nhận' : 'Chờ nhận'}</Chip>
                </div>
                <div className="order-lines">
                  <span>
                    <b>{o.qty} ×</b> {o.itemName}
                  </span>
                  <FulfilLabel f={o.fulfil} />
                  {linked && (
                    <span className="sub">
                      Mã nhận: <b>{linked.code}</b>
                      {linked.address ? ` · giao tới ${linked.address}` : ''}
                    </span>
                  )}
                </div>
                <div className="row">
                  <Button variant="ghost" grow icon={<MessageCircle size={17} />} onClick={() => nav.open({ name: 'sellerChat', id: o.id })}>
                    Nhắn tin
                  </Button>
                  {!o.done && (
                    <Button
                      grow
                      icon={<CircleCheck size={17} />}
                      onClick={() => {
                        d({ type: 'sellerDone', id: o.id });
                        showToast('Đã xác nhận khách nhận món');
                      }}
                    >
                      Khách đã nhận
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </Stack>
      </Page>
    </>
  );
}

/* ───────── Chat phía người bán ───────── */

const BUYER_REPLIES = ['Dạ em cảm ơn ạ!', 'Ok shop, mình tới đúng giờ nhé.', 'Mình đến rồi, đang đứng trước quán ạ.'];

export function SellerChat({ id, nav }: { id: string; nav: Nav }) {
  const { s, d } = useStore();
  const so = s.sellerOrders.find((x) => x.id === id);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!so) return null;
  // Đơn do chính máy này đặt (vai người mua) thì dùng chung luồng tin với phía người mua.
  const linked = so.orderId ? s.orders.find((o) => o.id === so.orderId) : undefined;
  const msgs = linked ? linked.msgs : so.msgs;

  return (
    <ChatBox
      title={so.buyer}
      avatar={<span className="avatar xs">{so.buyer.split(' ').pop()![0]}</span>}
      sub={`${so.qty} × ${so.itemName} · ${FULFIL[so.fulfil].label}`}
      msgs={msgs}
      me="seller"
      nav={nav}
      quick={['Món đã sẵn sàng, bạn qua lấy nhé!', 'Shop đang giao, khoảng 15 phút nữa tới', 'Bạn đến quầy đọc mã nhận món nhé']}
      onSend={(t) => {
        const msg = { from: 'seller' as const, text: t, at: Date.now() };
        if (linked) return d({ type: 'chat', orderId: linked.id, msg });
        d({ type: 'sellerChat', id, msg });
        const reply = BUYER_REPLIES[so.msgs.filter((m) => m.from === 'buyer').length % BUYER_REPLIES.length];
        timers.current.push(window.setTimeout(() => d({ type: 'sellerChat', id, msg: { from: 'buyer', text: reply, at: Date.now() } }), 1200));
      }}
    />
  );
}

/* ───────── Cửa hàng (tab của người bán) ───────── */

export function SellerShop({ nav }: { nav: Nav }) {
  const { s, d } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const shop = shopOf(s, MY_SHOP_ID);
  return (
    <>
      <TopBar title="Cửa hàng" />
      <Page>
        <Stack gap="lg">
          <div className="shop-head">
            <span className="shop-logo">{shop.emoji}</span>
            <div className="grow">
              <h2>{shop.name}</h2>
              <span className="sub">{shop.intro}</span>
            </div>
          </div>
          <div className="list-group">
            <ListRow icon={<MapPin size={18} />} title="Địa chỉ" sub={shop.address} />
            <ListRow icon={<Clock size={18} />} title="Giờ mở cửa" sub={shop.hours} />
            <ListRow icon={<Phone size={18} />} title="Liên hệ" sub={shop.phone} />
            <ListRow icon={<Bike size={18} />} title="Giao hàng" sub={shop.deliveryFee ? `Tự giao · ${fmt(shop.deliveryFee)}` : 'Chỉ nhận tại cửa hàng'} />
          </div>
          <div className="list-group">
            <ListRow icon={<Pencil size={18} />} title="Sửa thông tin cửa hàng" onClick={() => nav.open({ name: 'shopEdit' })} />
            <ListRow icon={<Eye size={18} />} title="Xem trang như người mua" onClick={() => nav.open({ name: 'shop', id: MY_SHOP_ID })} />
            <ListRow icon={<ShoppingBag size={18} />} title="Chuyển sang Người mua" sub="Tìm và giữ món gần bạn" onClick={() => d({ type: 'role', role: 'buyer' })} />
          </div>
          <div className="list-group">
            <ListRow icon={<RefreshCcw size={18} />} title="Đặt lại dữ liệu demo" sub="Dữ liệu đang lưu trên máy này" onClick={() => setConfirmReset(true)} danger />
            <LogoutRow />
          </div>
        </Stack>
      </Page>
      {confirmReset && <ResetSheet onClose={() => setConfirmReset(false)} />}
    </>
  );
}

export function ShopEdit({ nav }: { nav: Nav }) {
  const { s, d, showToast } = useStore();
  const [shop, setShop] = useState<Shop>(shopOf(s, MY_SHOP_ID));
  const [tried, setTried] = useState(false);
  const errs = {
    name: !shop.name.trim() ? 'Vui lòng nhập tên cửa hàng' : undefined,
    address: !shop.address.trim() ? 'Vui lòng nhập địa chỉ' : undefined,
    hours: !shop.hours.trim() ? 'Vui lòng nhập giờ mở cửa' : undefined,
    phone: !shop.phone.trim() ? 'Vui lòng nhập số liên hệ' : undefined,
  };
  const bad = Object.values(errs).some(Boolean);
  const e = (k: keyof typeof errs) => (tried ? errs[k] : undefined);
  return (
    <>
      <TopBar title="Sửa cửa hàng" onBack={nav.back} />
      <Page
        footer={
          <Footer>
            <Button
              grow
              size="lg"
              onClick={() => {
                setTried(true);
                if (bad) return;
                d({ type: 'shop', shop: { ...shop, name: shop.name.trim() } });
                showToast('Đã lưu thông tin cửa hàng');
                nav.back();
              }}
            >
              Lưu
            </Button>
          </Footer>
        }
      >
        <Stack>
          <Field label="Tên cửa hàng" required value={shop.name} error={e('name')} onChange={(x) => setShop({ ...shop, name: x.target.value })} />
          <Field label="Địa chỉ" required value={shop.address} error={e('address')} onChange={(x) => setShop({ ...shop, address: x.target.value })} />
          <Field label="Giờ mở cửa" required placeholder="16:00 – 21:00" value={shop.hours} error={e('hours')} onChange={(x) => setShop({ ...shop, hours: x.target.value })} />
          <Field label="Số liên hệ" required inputMode="tel" value={shop.phone} error={e('phone')} onChange={(x) => setShop({ ...shop, phone: x.target.value })} />
          <Field label="Giới thiệu" value={shop.intro} onChange={(x) => setShop({ ...shop, intro: x.target.value })} />
          <Field
            label="Phí tự giao"
            suffix="đ"
            inputMode="numeric"
            hint="Để 0 nếu chỉ cho khách tự đến lấy"
            value={String(shop.deliveryFee)}
            onChange={(x) => setShop({ ...shop, deliveryFee: Number(x.target.value.replace(/\D/g, '')) || 0 })}
          />
          <Banner tone="info" icon={<Store size={16} />}>
            Cửa hàng tự giao hoặc khách tự đến lấy, không qua ứng dụng giao hàng trung gian.
          </Banner>
        </Stack>
      </Page>
    </>
  );
}
