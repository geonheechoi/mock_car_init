import { useState } from "react";
import "./App.css";

const cars = [
  { id: 1, name: "Tesla Model 3", price: 52000 },
  { id: 2, name: "BMW i4", price: 61000 },
  { id: 3, name: "Hyundai IONIQ 5", price: 48000 },
  { id: 4, name: "Kia EV6", price: 47000 },
];

function App() {
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // 🔥 나중에 Grafana 트래픽 이벤트로 보낼 함수
  const trackEvent = (type, data = {}) => {
    console.log("EVENT:", type, data);

    // 나중에 backend로 보낼 자리
    // fetch("/api/events", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ type, data }),
    // });
  };

  const filteredCars = cars.filter((car) =>
    car.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <h1>🚗 CarSite</h1>
        <div>Cart 🛒 ({cartCount})</div>
      </nav>

      {/* SEARCH */}
      <input
        className="search"
        placeholder="Search cars..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          trackEvent("search", { keyword: e.target.value });
        }}
      />

      {/* CAR LIST */}
      <div className="car-grid">
        {filteredCars.map((car) => (
          <div key={car.id} className="card">
            <h2>{car.name}</h2>
            <p>${car.price.toLocaleString()}</p>

            <button
              onClick={() => {
                setCartCount(cartCount + 1);
                trackEvent("add_to_cart", { car: car.name });
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;