import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, KeyRound, Leaf, LogIn, ShoppingBag, Sparkles, Store, UserPlus } from 'lucide-react';
import { DEMO_OTP, DEMO_PHONE, accountsOf, digits, prettyPhone, useStore, type Role } from './store';
import { Banner, Button, Field, Footer, IconButton, IconTile, cx } from './ui';

type Mode = 'login' | 'register';
type Step = 'welcome' | 'phone' | 'otp' | 'profile' | 'shop';

const phoneErr = (p: string) => {
  const d = digits(p);
  if (!d) return 'Vui lòng nhập số điện thoại';
  if (!/^0\d{9}$/.test(d)) return 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0';
};

/** Đăng nhập / đăng ký giả lập bằng số điện thoại + mã OTP (không có máy chủ, mã demo hiện trên màn hình). */
export function Auth() {
  const { s, d, showToast } = useStore();
  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState<string>();
  const [wait, setWait] = useState(0);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<Role>('buyer');
  const [shop, setShop] = useState({ name: '', address: '', hours: '16:00 – 21:00', phone: '' });
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const go = (st: Step) => {
    setTried(false);
    setErr(undefined);
    setStep(st);
  };
  const start = (m: Mode) => {
    setMode(m);
    setPhone('');
    go('phone');
  };
  const exists = accountsOf(s).some((a) => a.phone === digits(phone));

  const sendCode = () => {
    setTried(true);
    if (phoneErr(phone)) return;
    if (mode === 'login' && !exists) return setErr('Số này chưa đăng ký. Bạn tạo tài khoản mới nhé.');
    if (mode === 'register' && exists) return setErr('Số này đã có tài khoản. Bạn đăng nhập nhé.');
    setOtp('');
    setWait(30);
    go('otp');
    showToast(`Mã xác thực EcoBite của bạn: ${DEMO_OTP}`);
    setTimeout(() => otpRef.current?.focus(), 350);
  };

  const verify = (code = otp) => {
    if (code !== DEMO_OTP) return setErr('Mã chưa đúng. Mã demo là ' + DEMO_OTP);
    if (mode === 'login') {
      d({ type: 'login', phone });
      showToast('Đăng nhập thành công. Chào mừng bạn quay lại!');
    } else go('profile');
  };

  const nameErr = !name.trim() ? 'Vui lòng nhập họ tên' : undefined;
  const finishProfile = () => {
    setTried(true);
    if (nameErr) return;
    if (role === 'seller') {
      setShop((x) => ({ ...x, phone: x.phone || prettyPhone(phone), address: x.address || address }));
      return go('shop');
    }
    register();
  };

  const shopErr = {
    name: !shop.name.trim() ? 'Vui lòng nhập tên cửa hàng' : undefined,
    address: !shop.address.trim() ? 'Vui lòng nhập địa chỉ' : undefined,
    hours: !shop.hours.trim() ? 'Vui lòng nhập giờ mở cửa' : undefined,
    phone: phoneErr(shop.phone),
  };
  const finishShop = () => {
    setTried(true);
    if (Object.values(shopErr).some(Boolean)) return;
    register({ name: shop.name.trim(), address: shop.address.trim(), hours: shop.hours.trim(), phone: prettyPhone(shop.phone) });
  };

  const register = (sh?: { name: string; address: string; hours: string; phone: string }) => {
    d({ type: 'register', account: { phone: digits(phone), name: name.trim(), address: address.trim(), role }, shop: sh });
    showToast(role === 'seller' ? 'Đã tạo cửa hàng. Đăng món dư đầu tiên nào!' : 'Tạo tài khoản thành công. Cùng săn món ngon giá tốt!');
  };

  const demo = () => {
    d({ type: 'login', phone: DEMO_PHONE });
    showToast('Đã vào bằng tài khoản demo Nguyễn An');
  };

  if (step === 'welcome')
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
          <Button size="lg" block icon={<LogIn size={20} />} onClick={() => start('login')}>
            Đăng nhập
          </Button>
          <Button size="lg" variant="ghost" block icon={<UserPlus size={20} />} onClick={() => start('register')}>
            Tạo tài khoản mới
          </Button>
          <Button variant="text" block icon={<Sparkles size={18} />} onClick={demo}>
            Dùng tài khoản demo
          </Button>
        </div>
      </div>
    );

  const steps: Step[] = mode === 'login' ? ['phone', 'otp'] : role === 'seller' ? ['phone', 'otp', 'profile', 'shop'] : ['phone', 'otp', 'profile'];
  const idx = steps.indexOf(step);
  const back = () => (idx <= 0 ? go('welcome') : go(steps[idx - 1]));

  return (
    <>
      <header className="topbar">
        <IconButton onClick={back} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </IconButton>
        <div className="topbar-title">
          <h1>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
          <span>
            Bước {idx + 1}/{steps.length}
          </span>
        </div>
      </header>
      <div className="progress" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((x, i) => (
          <span key={x} className={i <= idx ? 'on' : ''} />
        ))}
      </div>

      <div className="scroll pad auth">
        {step === 'phone' && (
          <>
            <h2>{mode === 'login' ? 'Chào mừng trở lại 👋' : 'Bắt đầu với số điện thoại'}</h2>
            <p className="muted">Chúng tôi sẽ gửi mã xác thực 6 số qua SMS.</p>
            <Field
              label="Số điện thoại"
              required
              inputMode="tel"
              placeholder="VD: 0901 234 567"
              value={phone}
              autoFocus
              onChange={(e) => {
                setPhone(e.target.value);
                setErr(undefined);
              }}
              onKeyDown={(e) => e.key === 'Enter' && sendCode()}
              error={(tried && phoneErr(phone)) || err}
            />
            {err && (
              <Button variant="text" size="sm" onClick={() => start(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Tạo tài khoản với số này' : 'Chuyển sang đăng nhập'}
              </Button>
            )}
            {mode === 'login' && (
              <Banner tone="info" icon={<Sparkles size={16} />}>
                Tài khoản demo: <b>{prettyPhone(DEMO_PHONE)}</b>
              </Banner>
            )}
          </>
        )}

        {step === 'otp' && (
          <>
            <h2>Nhập mã xác thực</h2>
            <p className="muted">
              Mã 6 số đã gửi tới <b>{prettyPhone(phone)}</b>
            </p>
            <label className="otp" onClick={() => otpRef.current?.focus()}>
              <input
                ref={otpRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                aria-label="Mã xác thực"
                onChange={(e) => {
                  const v = digits(e.target.value).slice(0, 6);
                  setOtp(v);
                  setErr(undefined);
                  if (v.length === 6) verify(v);
                }}
              />
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className={cx('otp-box', i === otp.length && 'cur', !!err && 'bad')}>
                  {otp[i] ?? ''}
                </span>
              ))}
            </label>
            {err && <p className="err">{err}</p>}
            <Banner tone="info" icon={<KeyRound size={16} />}>
              Bản demo không gửi SMS thật. Mã của bạn: <b>{DEMO_OTP}</b>
            </Banner>
            <Button variant="text" size="sm" disabled={wait > 0} onClick={() => { setWait(30); showToast(`Mã xác thực EcoBite của bạn: ${DEMO_OTP}`); }}>
              {wait > 0 ? `Gửi lại mã sau ${wait}s` : 'Gửi lại mã'}
            </Button>
          </>
        )}

        {step === 'profile' && (
          <>
            <h2>Thông tin của bạn</h2>
            <Field label="Họ tên" required placeholder="VD: Trần Minh Anh" value={name} autoFocus onChange={(e) => setName(e.target.value)} error={tried ? nameErr : undefined} />
            <Field label="Địa chỉ nhận mặc định" hint="Dùng khi cửa hàng tự giao, có thể để trống" placeholder="VD: 12 Chùa Láng, Đống Đa" value={address} onChange={(e) => setAddress(e.target.value)} />
            <div>
              <p className="label">Bạn dùng EcoBite để</p>
              <div className="auth-roles">
                {(
                  [
                    ['buyer', ShoppingBag, 'Mua món', 'Săn món dư giá tốt gần bạn'],
                    ['seller', Store, 'Bán món', 'Đăng món dư của quán / bếp nhà'],
                  ] as const
                ).map(([r, Icon, t, sub]) => (
                  <button key={r} className={cx('choice clickable', role === r && 'on')} onClick={() => setRole(r)}>
                    <IconTile tone={role === r ? 'solid' : undefined}>
                      <Icon size={20} />
                    </IconTile>
                    <span className="grow">
                      <b>{t}</b>
                      <span>{sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 'shop' && (
          <>
            <h2>Thông tin cửa hàng</h2>
            <p className="muted">Người mua sẽ thấy các thông tin này trên trang cửa hàng của bạn.</p>
            <Field label="Tên cửa hàng" required placeholder="VD: Bếp Nhà Mai" value={shop.name} autoFocus onChange={(e) => setShop({ ...shop, name: e.target.value })} error={tried ? shopErr.name : undefined} />
            <Field label="Địa chỉ" required placeholder="VD: 199 Chùa Láng, Đống Đa, Hà Nội" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} error={tried ? shopErr.address : undefined} />
            <Field label="Giờ mở cửa" required placeholder="VD: 16:00 – 21:00" value={shop.hours} onChange={(e) => setShop({ ...shop, hours: e.target.value })} error={tried ? shopErr.hours : undefined} />
            <Field label="Số liên hệ" required inputMode="tel" value={shop.phone} onChange={(e) => setShop({ ...shop, phone: e.target.value })} error={tried ? shopErr.phone : undefined} />
          </>
        )}
      </div>

      <Footer>
        {step === 'phone' && (
          <Button size="lg" block onClick={sendCode}>
            Gửi mã xác thực
          </Button>
        )}
        {step === 'otp' && (
          <Button size="lg" block disabled={otp.length < 6} onClick={() => verify()}>
            Xác nhận
          </Button>
        )}
        {step === 'profile' && (
          <Button size="lg" block onClick={finishProfile}>
            {role === 'seller' ? 'Tiếp tục' : 'Hoàn tất đăng ký'}
          </Button>
        )}
        {step === 'shop' && (
          <Button size="lg" block onClick={finishShop}>
            Tạo cửa hàng
          </Button>
        )}
      </Footer>
    </>
  );
}
