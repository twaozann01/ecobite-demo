import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronRight, Leaf, LocateFixed, Package, Receipt, Star, TrendingUp, Wallet, X } from 'lucide-react';
import type { Nav } from './App';
import { ME_POS, MY_SHOP_ID, SAMPLE_REVIEWS, SHOP_POS, fmt, hiddenReason } from './data';
import { ItemRow } from './shared';
import { shopOf, useNow, useStore } from './store';
import { Button, Card, IconButton, Muted, Page, SectionTitle, Segmented, Stack, StatTile, TopBar } from './ui';

/* ───────── Bản đồ món dư quanh bạn ───────── */

export function MapView({ nav }: { nav: Nav }) {
  const { s } = useStore();
  const now = useNow();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  const live = s.items.filter((i) => !hiddenReason(i, now));
  const shops = s.shops.filter((sh) => SHOP_POS[sh.id]);
  const countOf = (id: string) => live.filter((i) => i.shopId === id).length;

  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView(ME_POS, 16);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles © Esri',
    }).addTo(m);
    m.fitBounds(L.latLngBounds([ME_POS, ...shops.map((sh) => SHOP_POS[sh.id])]), { paddingTopLeft: [30, 30], paddingBottomRight: [30, 110] });
    L.marker(ME_POS, { icon: L.divIcon({ className: '', html: '<span class="me-pin"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }) })
      .addTo(m)
      .bindTooltip('Bạn ở đây', { direction: 'top', offset: [0, -10] });
    for (const sh of shops) {
      const n = countOf(sh.id);
      const icon = L.divIcon({
        className: '',
        html: `<span class="shop-pin${n ? '' : ' off'}"><b>${sh.emoji}</b>${n ? `<i>${n}</i>` : ''}</span>`,
        iconSize: [44, 50],
        iconAnchor: [22, 48],
      });
      L.marker(SHOP_POS[sh.id], { icon }).addTo(m).on('click', () => {
        setSel(sh.id);
        m.panTo(SHOP_POS[sh.id], { animate: true });
      });
    }
    map.current = m;
    // khung điện thoại vừa hiện xong (hiệu ứng trượt) → tính lại kích thước
    const t = window.setTimeout(() => m.invalidateSize(), 400);
    return () => {
      clearTimeout(t);
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shop = sel ? shopOf(s, sel) : null;
  const items = sel ? live.filter((i) => i.shopId === sel) : [];
  const nearby = [...shops].sort((a, b) => a.dist - b.dist);

  return (
    <>
      <TopBar title="Bản đồ món dư" sub={`${live.length} món · ${shops.length} cửa hàng quanh Chùa Láng`} onBack={nav.back} />
      <div className="map-wrap">
        <div ref={box} className="map" />
        <IconButton className="map-locate" aria-label="Về vị trí của tôi" onClick={() => map.current?.flyTo(ME_POS, 16)}>
          <LocateFixed size={20} />
        </IconButton>
        <div className="map-panel">
          {shop ? (
            <Card className="map-card">
              <div className="row between">
                <button className="row clickable grow map-shop" onClick={() => nav.open({ name: 'shop', id: shop.id })}>
                  <span className="avatar sm">{shop.emoji}</span>
                  <span className="grow">
                    <b>{shop.name}</b>
                    <span className="sub">
                      <Star size={12} className="star on" /> {shop.rating} · {shop.dist} km · {shop.hours}
                    </span>
                  </span>
                </button>
                <IconButton aria-label="Đóng" onClick={() => setSel(null)}>
                  <X size={18} />
                </IconButton>
              </div>
              {items.length ? (
                <div className="map-items">
                  {items.map((i) => (
                    <ItemRow key={i.id} item={i} nav={nav} now={now} />
                  ))}
                </div>
              ) : (
                <Muted className="small">Cửa hàng hiện chưa có món dư.</Muted>
              )}
            </Card>
          ) : (
            <div className="map-chips">
              {nearby.map((sh) => (
                <button
                  key={sh.id}
                  className="map-chip clickable"
                  onClick={() => {
                    setSel(sh.id);
                    map.current?.flyTo(SHOP_POS[sh.id], 17);
                  }}
                >
                  <span>{sh.emoji}</span>
                  <b>{sh.name}</b>
                  <em>
                    {sh.dist} km · {countOf(sh.id)} món
                  </em>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ───────── Thống kê bán hàng (người bán) ───────── */

const RANGES = [
  ['week', '7 ngày'],
  ['month', '30 ngày'],
] as const;

// doanh thu mẫu 7 ngày gần nhất (nghìn đồng) và số phần bán; ngày cuối cộng thêm đơn thật trong app
const WEEK = [
  [180, 9],
  [240, 12],
  [150, 8],
  [310, 15],
  [270, 13],
  [420, 21],
  [0, 0],
];
const DAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function SellerStats({ nav }: { nav: Nav }) {
  const { s } = useStore();
  const now = useNow();
  const [range, setRange] = useState<(typeof RANGES)[number][0]>('week');

  const mine = s.items.filter((i) => i.shopId === MY_SHOP_ID);
  const priceOf = (name: string) => mine.find((i) => i.name === name)?.price ?? 20000;
  const done = s.sellerOrders.filter((o) => o.done);
  const todayRev = done.reduce((t, o) => t + o.qty * priceOf(o.itemName), 0);
  const todayQty = done.reduce((t, o) => t + o.qty, 0);
  const week = WEEK.map(([k, q], i) => (i === WEEK.length - 1 ? [k * 1000 + todayRev, q + todayQty] : [k * 1000, q]));
  const factor = range === 'week' ? 1 : 4.3;
  const rev = Math.round((week.reduce((t, [r]) => t + r, 0) * factor) / 1000) * 1000;
  const qty = Math.round(week.reduce((t, [, q]) => t + q, 0) * factor);
  const kg = +(qty * 0.4).toFixed(1);
  const co2 = +(kg * 2.5).toFixed(1);
  const max = Math.max(...week.map(([r]) => r), 1);
  const reviews = SAMPLE_REVIEWS[MY_SHOP_ID] ?? [];
  const avg = reviews.length ? (reviews.reduce((t, r) => t + r.stars, 0) / reviews.length).toFixed(1) : '–';
  const sold = Math.round(qty * 0.92);

  // món bán chạy: gộp theo tên từ đơn khách + dữ liệu mẫu
  const top = new Map<string, number>([
    ['Cơm chiên dương châu', 34],
    ['Canh chua cá lóc', 21],
    ['Thịt kho trứng', 17],
    ['Bánh bao nhân thịt (3 cái)', 12],
  ]);
  for (const o of s.sellerOrders) top.set(o.itemName, (top.get(o.itemName) ?? 0) + o.qty);
  const tops = [...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topMax = tops[0]?.[1] ?? 1;
  const today = new Date(now).getDay();

  return (
    <>
      <TopBar title="Thống kê bán hàng" sub="Bếp Nhà An" onBack={nav.back} />
      <Page>
        <Stack gap="lg">
          <Segmented options={RANGES} value={range} onChange={setRange} />

          <div className="rev-card">
            <span>Doanh thu {range === 'week' ? '7 ngày' : '30 ngày'}</span>
            <b>{fmt(rev)}</b>
            <em>
              <TrendingUp size={14} /> +18% so với kỳ trước
            </em>
          </div>

          <div className="facts">
            <StatTile icon={<Receipt size={18} />} value={qty} label="phần đã bán" />
            <StatTile icon={<Leaf size={18} />} value={`${kg} kg`} label="thực phẩm cứu" />
            <StatTile icon={<Star size={18} />} value={avg} label={`${reviews.length} đánh giá`} />
          </div>

          <div>
            <SectionTitle>Doanh thu theo ngày</SectionTitle>
            <Card>
              <div className="bars">
                {week.map(([r], i) => {
                  const d = (today - (week.length - 1 - i) + 7) % 7;
                  const last = i === week.length - 1;
                  return (
                    <div key={i} className={'bar' + (last ? ' on' : '')}>
                      <em>{r ? Math.round(r / 1000) + 'k' : ''}</em>
                      <span style={{ height: `${Math.max(4, (r / max) * 78)}%` }} />
                      <b>{last ? 'Nay' : DAY[d]}</b>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>Món bán chạy</SectionTitle>
            <Card>
              <Stack gap="sm">
                {tops.map(([name, n]) => (
                  <div key={name} className="top-row">
                    <div className="row between">
                      <span>{name}</span>
                      <b>{n} phần</b>
                    </div>
                    <div className="meter">
                      <span style={{ width: `${(n / topMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </Stack>
            </Card>
          </div>

          <div>
            <SectionTitle>Tác động môi trường</SectionTitle>
            <div className="impact-grid">
              <Card>
                <b>{Math.round((sold / Math.max(qty, 1)) * 100)}%</b>
                <Muted className="small">món dư bán được thay vì bỏ đi</Muted>
              </Card>
              <Card>
                <b>{co2} kg</b>
                <Muted className="small">CO₂ giảm được (ước tính)</Muted>
              </Card>
            </div>
          </div>

          <Button variant="ghost" block icon={<Package size={18} />} onClick={() => nav.tab('listings')}>
            Quản lý món đang bán
          </Button>
        </Stack>
      </Page>
    </>
  );
}

/** Thẻ tóm tắt doanh thu ở trang Món đang bán → mở màn Thống kê. */
export function StatsTeaser({ nav }: { nav: Nav }) {
  return (
    <button className="stats-teaser clickable" onClick={() => nav.open({ name: 'stats' })}>
      <span className="icon-tile">
        <Wallet size={20} />
      </span>
      <span className="grow">
        <b>Thống kê bán hàng</b>
        <span className="sub">Doanh thu, món bán chạy, thực phẩm đã cứu</span>
      </span>
      <ChevronRight size={18} className="chev" />
    </button>
  );
}
