import { useMemo, useState } from "react";

const cars = [
  { id: 1, name: "Tesla Model 3", price: 52000 },
  { id: 2, name: "BMW i4", price: 61000 },
  { id: 3, name: "Hyundai IONIQ 5", price: 48000 },
  { id: 4, name: "Kia EV6", price: 47000 },
  { id: 5, name: "Audi Q4 e-tron", price: 59000 },
  { id: 6, name: "Mercedes EQB", price: 63000 },
];

export default function App() {
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const trackEvent = (type, data = {}) => {
    console.log("EVENT:", type, data);
  };

  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  const styles = {
    // ✅ 전체 풀폭
    page: {
      minHeight: "100vh",
      width: "100%",
      background: "#f4f6f8",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },

    // ✅ 위 헤더 가로 꽉
    navbar: {
      width: "100%",
      background: "#111",
      color: "white",
      padding: "18px 28px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxSizing: "border-box",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    },
    navLeft: { display: "flex", alignItems: "center", gap: 10 },
    brand: { margin: 0, fontSize: 26, letterSpacing: 0.3 },
    navRight: { fontSize: 15, opacity: 0.95 },

    // ✅ 콘텐츠 영역도 풀폭
    container: {
      width: "100%",
      padding: 20,
      boxSizing: "border-box",
    },

    // ✅ 항상 2컬럼(왼쪽 리스트 + 오른쪽 패널) = “꽉 차는 데스크탑 레이아웃”
    layout: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 420px",
      gap: 20,
      alignItems: "start",
    },

    left: { minWidth: 0 },

    searchWrap: {
      background: "white",
      borderRadius: 12,
      padding: 12,
      boxShadow: "0px 2px 10px rgba(0,0,0,0.06)",
      marginBottom: 14,
    },
    search: {
      width: "100%",
      padding: "12px 14px",
      fontSize: 16,
      border: "1px solid #d6dbe1",
      borderRadius: 10,
      outline: "none",
      boxSizing: "border-box",
    },

    // ✅ 카드 그리드는 화면 넓을수록 자동으로 더 많이 채움(꽉 찬 느낌)
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 16,
    },

    card: {
      background: "white",
      borderRadius: 14,
      padding: 16,
      boxShadow: "0px 2px 12px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      color: "#0f172a", // ✅ 추가

    },

    carTitle: { margin: 0, fontSize: 20 },
    carPrice: { margin: 0, color: "#334155", fontSize: 14 },

    button: {
      marginTop: 6,
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "10px 12px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 600,
    },

    // ✅ 오른쪽 패널 고정(스크롤 따라오게)
    sidePanel: {
      background: "blue",
      borderRadius: 14,
      padding: 16,
      boxShadow: "0px 2px 12px rgba(0,0,0,0.08)",
      position: "sticky",
      top: 86,
    },

    sideTitle: { margin: "0 0 12px 0", fontSize: 18 },
    sideItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid #0f172a",
      fontSize: 14,
    },
    smallNote: { marginTop: 12, fontSize: 13, color: "#0f172a", lineHeight: 1.45 },
  };

  return (
    <div style={styles.page}>
      {/* ✅ 여기서 Vite 기본 #root 제한을 강제로 풀어버림 */}
      <style>{`
        html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
        #root {
          width: 100%;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: left !important;
        }
      `}</style>

      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <h1 style={styles.brand}>CarSite</h1>
        </div>
        <div style={styles.navRight}>Cart 🛒 ({cartCount})</div>
      </nav>

      <div style={styles.container}>
        <div style={styles.layout}>
          <div style={styles.left}>
            <div style={styles.searchWrap}>
              <input
                style={styles.search}
                placeholder="Search cars..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  trackEvent("search", { keyword: e.target.value });
                }}
              />
            </div>

            <div style={styles.grid}>
              {filteredCars.map((car) => (
                <div key={car.id} style={styles.card}>
                  <h2 style={styles.carTitle}>{car.name}</h2>
                  <p style={styles.carPrice}>${car.price.toLocaleString()}</p>

                  <button
                    style={styles.button}
                    onClick={() => {
                      setCartCount((c) => c + 1);
                      trackEvent("add_to_cart", { carId: car.id, carName: car.name });
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>

          <aside style={styles.sidePanel}>
            <h3 style={styles.sideTitle}>Dashboard</h3>

            <div style={styles.sideItem}>
              <span>Cart Items</span>
              <b>{cartCount}</b>
            </div>

            <div style={styles.sideItem}>
              <span>Cars Showing</span>
              <b>{filteredCars.length}</b>
            </div>

            <div style={styles.smallNote}>
              * 여기는 나중에 “실시간 이벤트 수 / 최근 활동 로그” 넣는 자리.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}