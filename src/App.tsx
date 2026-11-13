import { useEffect, useState } from 'react';
import { Compass, MessageCircle, Package, ShoppingBag, Store, UserRound, ClipboardList, type LucideIcon } from 'lucide-react';
import { useStore, type Role } from './store';
import { BuyerAccount, ChatView, Detail, Home, Orders, Pay, ProfileEdit, ShopPage } from './buyer';
import { Listings, PostWizard, SellerChat, SellerOrders, SellerShop, ShopEdit } from './seller';
import { Inbox, Notifs, RoleSelect } from './shared';
import { Toast } from './ui';
import { MapView, SellerStats } from './extra';

export type Tab = 'home' | 'orders' | 'inbox' | 'account' | 'listings' | 'sorders' | 'shopTab';
export type View =
  | { name: 'detail'; id: string }
  | { name: 'shop'; id: string }
  | { name: 'pay'; id: string; qty: number; hold: number }
  | { name: 'chat'; orderId: string }
  | { name: 'sellerChat'; id: string }
  | { name: 'notifs' }
  | { name: 'profile' }
  | { name: 'shopEdit' }
  | { name: 'post' }
  | { name: 'map' }
  | { name: 'stats' };

export interface Nav {
  open: (v: View) => void;
  back: () => void;
  tab: (t: Tab) => void;
}

const TABS: Record<Role, { id: Tab; label: string; icon: LucideIcon }[]> = {
  buyer: [
    { id: 'home', label: 'Khám phá', icon: Compass },
    { id: 'orders', label: 'Đơn của tôi', icon: ShoppingBag },
    { id: 'inbox', label: 'Tin nhắn', icon: MessageCircle },
    { id: 'account', label: 'Tài khoản', icon: UserRound },
  ],
  seller: [
    { id: 'listings', label: 'Món đang bán', icon: Package },
    { id: 'sorders', label: 'Đơn khách', icon: ClipboardList },
    { id: 'inbox', label: 'Tin nhắn', icon: MessageCircle },
    { id: 'shopTab', label: 'Cửa hàng', icon: Store },
  ],
};

export function App() {
  const { s, toast } = useStore();
  const role = s.role;
  const [tab, setTab] = useState<Tab>(role === 'seller' ? 'listings' : 'home');
  const [stack, setStack] = useState<View[]>([]);
  // hướng chuyển màn quyết định hiệu ứng: mở màn mới trượt từ phải, quay lại trượt từ trái, đổi tab mờ dần
  const [dir, setDir] = useState<'push' | 'pop' | 'fade'>('fade');

  // đổi vai trò → về tab đầu của vai đó
  useEffect(() => {
    setStack([]);
    setDir('fade');
    setTab(role === 'seller' ? 'listings' : 'home');
  }, [role]);

  if (!role)
    return (
      <Frame toast={toast}>
        <div className="screen fade">
          <RoleSelect />
        </div>
      </Frame>
    );

  const view = stack[stack.length - 1];
  const nav: Nav = {
    open: (v) => {
      setDir('push');
      setStack((st) => [...st, v]);
    },
    back: () => {
      setDir('pop');
      setStack((st) => st.slice(0, -1));
    },
    tab: (t) => {
      setDir('fade');
      setStack([]);
      setTab(t);
    },
  };

  const badges: Partial<Record<Tab, number>> = {
    orders: s.orders.filter((o) => o.status === 'paid').length,
    sorders: s.sellerOrders.filter((o) => !o.done).length,
  };

  const screen = () => {
    if (view) {
      switch (view.name) {
        case 'detail':
          return <Detail id={view.id} nav={nav} />;
        case 'shop':
          return <ShopPage id={view.id} nav={nav} />;
        case 'pay':
          return <Pay id={view.id} qty={view.qty} hold={view.hold} nav={nav} />;
        case 'chat':
          return <ChatView orderId={view.orderId} nav={nav} />;
        case 'sellerChat':
          return <SellerChat id={view.id} nav={nav} />;
        case 'notifs':
          return <Notifs nav={nav} />;
        case 'profile':
          return <ProfileEdit nav={nav} />;
        case 'shopEdit':
          return <ShopEdit nav={nav} />;
        case 'post':
          return <PostWizard nav={nav} />;
        case 'map':
          return <MapView nav={nav} />;
        case 'stats':
          return <SellerStats nav={nav} />;
      }
    }
    switch (tab) {
      case 'home':
        return <Home nav={nav} />;
      case 'orders':
        return <Orders nav={nav} />;
      case 'inbox':
        return <Inbox nav={nav} />;
      case 'account':
        return <BuyerAccount nav={nav} />;
      case 'listings':
        return <Listings nav={nav} />;
      case 'sorders':
        return <SellerOrders nav={nav} />;
      case 'shopTab':
        return <SellerShop nav={nav} />;
    }
  };

  const tabs = TABS[role];
  const current = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;

  return (
    <Frame toast={toast}>
      <div className={'screen ' + dir} key={view ? `${stack.length}-${view.name}` : `tab-${current}`}>
        {screen()}
      </div>
      {!view && (
        <nav className="tabbar" aria-label="Điều hướng chính">
          {tabs.map((t) => (
            <button key={t.id} className={current === t.id ? 'on' : ''} onClick={() => nav.tab(t.id)}>
              <span className="ico">
                <t.icon size={22} strokeWidth={current === t.id ? 2.3 : 1.8} />
                {!!badges[t.id] && <i className="dot">{badges[t.id]}</i>}
              </span>
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </Frame>
  );
}

function Frame({ children, toast }: { children: React.ReactNode; toast: string | null }) {
  return (
    <div className="stage">
      <div className="phone">
        {children}
        <Toast text={toast} />
      </div>
    </div>
  );
}
