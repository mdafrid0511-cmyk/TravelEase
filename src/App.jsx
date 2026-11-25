import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import "./App.css";
import { supabase } from "./supabaseClient";

const destinations = [
  { id: 1, name: "Goa", state: "Goa", category: "Beach", price: 7999, days: 3, rating: 4.8, seats: 20, image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85", description: "Relax on golden beaches, explore colourful markets, and enjoy unforgettable sunsets." },
  { id: 2, name: "Manali", state: "Himachal Pradesh", category: "Mountain", price: 10999, days: 4, rating: 4.9, seats: 20, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85", description: "Discover mountain views, pine forests, cosy cafés, and beautiful valleys." },
  { id: 3, name: "Kerala", state: "Kerala", category: "Nature", price: 12999, days: 5, rating: 4.9, seats: 20, image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85", description: "Cruise through peaceful backwaters and enjoy lush greenery and local cuisine." },
  { id: 4, name: "Jaipur", state: "Rajasthan", category: "Culture", price: 6999, days: 3, rating: 4.7, seats: 20, image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=85", description: "Explore royal palaces, historic forts, colourful bazaars, and Rajasthani food." },
  { id: 5, name: "Ooty", state: "Tamil Nadu", category: "Mountain", price: 8999, days: 3, rating: 4.6, seats: 20, image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=85", description: "Enjoy tea gardens, misty hills, scenic train rides, and a cool mountain climate." },
  { id: 6, name: "Andaman Islands", state: "Andaman and Nicobar Islands", category: "Beach", price: 18999, days: 6, rating: 4.9, seats: 20, image: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85", description: "Experience clear blue water, island beaches, snorkelling, and marine life." },
];

const defaultSeatsMap = destinations.reduce((acc, item) => {
  acc[item.id] = item.seats;
  return acc;
}, {});

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [maxBudget, setMaxBudget] = useState("30000");
  const [sort, setSort] = useState("recommended");
  const [seatsByDest, setSeatsByDest] = useState(() => readStorage("travelease-seats", defaultSeatsMap));
  const [bookings, setBookings] = useState(() => readStorage("travelease-bookings", []));
  const [favourites, setFavourites] = useState(() => readStorage("travelease-favourites", []));
  const [reviews, setReviews] = useState(() => readStorage("travelease-reviews", [
    { id: 1, name: "Ananya", rating: 5, text: "The trip was well organised and the booking process was simple." },
    { id: 2, name: "Rahul", rating: 5, text: "Beautiful destinations and a very smooth travel experience." },
    { id: 3, name: "Priya", rating: 4, text: "Helpful itinerary and great value for the price." },
  ]));
  const [users, setUsers] = useState(() => readStorage("travelease-users", []));
  const [currentUser, setCurrentUser] = useState(() => readStorage("travelease-session", null));
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [authMessage, setAuthMessage] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [pendingDestination, setPendingDestination] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [bookingDestination, setBookingDestination] = useState(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [showBookings, setShowBookings] = useState(false);
  const [ticketBooking, setTicketBooking] = useState(null);
  const [showFavourites, setShowFavourites] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", people: "1" });
  const [reviewForm, setReviewForm] = useState({ name: "", rating: "5", text: "" });
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => localStorage.setItem("travelease-seats", JSON.stringify(seatsByDest)), [seatsByDest]);
  useEffect(() => localStorage.setItem("travelease-bookings", JSON.stringify(bookings)), [bookings]);
  useEffect(() => localStorage.setItem("travelease-favourites", JSON.stringify(favourites)), [favourites]);
  useEffect(() => localStorage.setItem("travelease-reviews", JSON.stringify(reviews)), [reviews]);
  useEffect(() => localStorage.setItem("travelease-users", JSON.stringify(users)), [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem("travelease-session", JSON.stringify(currentUser));
    else localStorage.removeItem("travelease-session");
  }, [currentUser]);

  useEffect(() => {
    async function loadDatabaseData() {
      const { data: seatRows, error: seatErr } = await supabase
        .from("destination_seats")
        .select("destination_id, seats_left");

      if (!seatErr && Array.isArray(seatRows) && seatRows.length > 0) {
        const merged = { ...defaultSeatsMap };
        for (const row of seatRows) {
          merged[row.destination_id] = Number(row.seats_left);
        }
        setSeatsByDest(merged);
      }

      const { data: bookingRows, error: bookingErr } = await supabase
        .from("bookings")
        .select("*")
        .order("id", { ascending: false });

      if (!bookingErr && Array.isArray(bookingRows)) {
        setBookings(
          bookingRows.map((row) => ({
            id: row.id,
            destinationId: row.destination_id,
            destination: row.destination,
            image: row.image || destinations.find((d) => d.id === row.destination_id)?.image || destinations[0].image,
            date: row.travel_date,
            people: Number(row.people),
            total: Number(row.total),
            name: row.passenger_name,
            email: row.passenger_email,
            phone: row.passenger_phone,
            status: row.status || "Confirmed",
          }))
        );
      }

      const { data: reviewRows, error: reviewErr } = await supabase
        .from("reviews")
        .select("*")
        .order("id", { ascending: false });

      if (!reviewErr && Array.isArray(reviewRows) && reviewRows.length > 0) {
        setReviews(reviewRows);
      }
    }

    loadDatabaseData();
  }, []);

  const enrichedDestinations = useMemo(() => {
    return destinations.map((item) => ({
      ...item,
      seatsLeft: seatsByDest[item.id] ?? item.seats,
    }));
  }, [seatsByDest]);

  const filteredDestinations = useMemo(() => {
    let list = enrichedDestinations.filter((item) => {
      const matchesSearch = `${item.name} ${item.state} ${item.category}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || item.category === category;
      const matchesBudget = item.price <= Number(maxBudget || 0);
      const matchesFavourite = !showFavourites || favourites.includes(item.id);
      return matchesSearch && matchesCategory && matchesBudget && matchesFavourite;
    });
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [enrichedDestinations, search, category, maxBudget, sort, showFavourites, favourites]);

  const userBookings = useMemo(() => {
    if (!currentUser) return bookings;
    const activeEmail = currentUser.email.trim().toLowerCase();
    return bookings.filter(
      (booking) => (booking.email || "").trim().toLowerCase() === activeEmail
    );
  }, [bookings, currentUser]);

  function openBooking(destination) {
    setSelectedDestination(null);
    setBookingMessage("");
    if (!currentUser) {
      setPendingDestination(destination);
      setAuthMode("signin");
      setAuthMessage("Please sign in or create an account before booking your trip.");
      setShowAuth(true);
      return;
    }
    const latestDest = enrichedDestinations.find((d) => d.id === destination.id) || destination;
    setBookingDestination(latestDest);
    setForm({ name: currentUser.name || "", email: currentUser.email || "", phone: currentUser.phone || "", date: "", people: "1" });
  }

  function handleAuthChange(event) {
    setAuthForm({ ...authForm, [event.target.name]: event.target.value });
  }

  async function hashPassword(password, saltHex) {
    if (!window.crypto?.subtle) return `demo-${saltHex}-${password}`;
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await window.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: Uint8Array.from(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))), iterations: 120000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;
    if (!email || !password) {
      setAuthMessage("Please enter your email and password.");
      return;
    }
    if (authMode === "signup") {
      if (!authForm.name.trim() || !authForm.phone.trim()) {
        setAuthMessage("Please enter your name and phone number.");
        return;
      }
      if (!/^\d{10}$/.test(authForm.phone.trim())) {
        setAuthMessage("Enter a valid 10-digit phone number.");
        return;
      }
      if (password.length < 8) {
        setAuthMessage("Password must contain at least 8 characters.");
        return;
      }
      if (users.some((user) => user.email === email)) {
        setAuthMessage("An account with this email already exists. Please sign in.");
        return;
      }
      const salt = Array.from(window.crypto?.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(16)) : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256)), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const passwordHash = await hashPassword(password, salt);
      const newUser = { id: Date.now(), name: authForm.name.trim(), phone: authForm.phone.trim(), email, salt, passwordHash };
      setUsers((previous) => [...previous, newUser]);
      setAuthMode("signin");
      setAuthMessage("Account created successfully. Please sign in with your email and password.");
      setAuthForm({ name: "", phone: "", email, password: "" });
      return;
    }

    const user = users.find((entry) => entry.email === email);
    if (!user) {
      setAuthMessage("No account found with this email. Please sign up first.");
      return;
    }
    const passwordHash = await hashPassword(password, user.salt);
    if (passwordHash !== user.passwordHash) {
      setAuthMessage("Incorrect password. Please try again.");
      return;
    }
    const session = { id: user.id, name: user.name, email: user.email, phone: user.phone };
    setCurrentUser(session);
    setForm({ name: session.name, email: session.email, phone: session.phone, date: "", people: "1" });
    setShowAuth(false);
    setAuthMessage("");
    if (pendingDestination) {
      const latestPending = enrichedDestinations.find((d) => d.id === pendingDestination.id) || pendingDestination;
      setBookingDestination(latestPending);
      setPendingDestination(null);
    }
  }

  function handleSignOut() {
    setCurrentUser(null);
    setPendingDestination(null);
    setBookingDestination(null);
    setShowBookings(false);
    setTicketBooking(null);
    setShowFavourites(false);
    setAuthMessage("You have signed out.");
  }

  function toggleFavourite(id) {
    setFavourites((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  }

  function handleFormChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleBooking(event) {
    event.preventDefault();
    if (!currentUser) {
      setBookingDestination(null);
      setShowAuth(true);
      setAuthMode("signin");
      setAuthMessage("Please sign in before booking.");
      return;
    }
    if (!form.date) {
      setBookingMessage("Please choose your travel date.");
      return;
    }
    const people = Number(form.people);
    const availableSeats = seatsByDest[bookingDestination.id] ?? bookingDestination.seats;
    if (!Number.isInteger(people) || people < 1 || people > availableSeats) {
      setBookingMessage(`Only ${availableSeats} ${availableSeats === 1 ? "seat" : "seats"} left for ${bookingDestination.name}.`);
      return;
    }

    const updatedSeats = availableSeats - people;
    const booking = {
      id: Date.now(),
      destinationId: bookingDestination.id,
      destination: bookingDestination.name,
      image: bookingDestination.image,
      date: form.date,
      people,
      total: bookingDestination.price * people,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      status: "Confirmed",
    };

    const { error: insertErr } = await supabase.from("bookings").insert([
      {
        id: booking.id,
        destination_id: booking.destinationId,
        destination: booking.destination,
        image: booking.image,
        travel_date: booking.date,
        people: booking.people,
        total: booking.total,
        passenger_name: booking.name,
        passenger_email: booking.email,
        passenger_phone: booking.phone,
        status: booking.status,
      },
    ]);

    await supabase.from("destination_seats").upsert([
      { destination_id: bookingDestination.id, seats_left: updatedSeats },
    ]);

    setSeatsByDest((previous) => ({ ...previous, [bookingDestination.id]: updatedSeats }));
    setBookings((previous) => [booking, ...previous]);
    setBookingDestination(null);
    setTicketBooking(booking);
    setBookingMessage(
      insertErr
        ? `Saved locally (${insertErr.message}). Check Supabase bookings table.`
        : `Your trip to ${booking.destination} has been booked successfully! (${updatedSeats} seats left)`
    );
  }

  async function cancelBooking(id) {
    const target = bookings.find((b) => b.id === id);
    await supabase.from("bookings").delete().eq("id", id);
    setBookings((previous) => previous.filter((booking) => booking.id !== id));
    if (ticketBooking?.id === id) setTicketBooking(null);

    if (target && target.destinationId) {
      const currentSeats = seatsByDest[target.destinationId] ?? defaultSeatsMap[target.destinationId] ?? 20;
      const restoredSeats = currentSeats + Number(target.people || 1);
      await supabase.from("destination_seats").upsert([
        { destination_id: target.destinationId, seats_left: restoredSeats },
      ]);
      setSeatsByDest((previous) => ({ ...previous, [target.destinationId]: restoredSeats }));
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.text.trim()) return;
    const newReview = {
      id: Date.now(),
      name: reviewForm.name.trim(),
      rating: Number(reviewForm.rating),
      text: reviewForm.text.trim(),
    };
    await supabase.from("reviews").insert([newReview]);
    setReviews((previous) => [newReview, ...previous]);
    setReviewForm({ name: "", rating: "5", text: "" });
    setShowReviews(false);
  }

  function downloadTicketPDF(ticket) {
    if (!ticket) return;
    const doc = new jsPDF();

    doc.setFillColor(24, 78, 72);
    doc.rect(0, 0, 210, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("TravelEase", 18, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("CONFIRMED E-TICKET / TRAVEL PASS", 18, 27);
    doc.text(`Booking ID: #${ticket.id}`, 192, 22, { align: "right" });

    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`${ticket.destination} Trip`, 18, 54);

    doc.setFontSize(11);
    doc.setTextColor(24, 120, 80);
    doc.text(`Status: ${ticket.status || "Confirmed"}`, 18, 62);

    doc.setDrawColor(210, 210, 210);
    doc.line(18, 68, 192, 68);

    const rows = [
      ["Passenger Name", ticket.name],
      ["Email Address", ticket.email],
      ["Phone Number", ticket.phone || "N/A"],
      ["Travel Date", ticket.date],
      ["Travellers", `${ticket.people} ${ticket.people === 1 ? "person" : "people"}`],
      ["Total Paid", `Rs. ${Number(ticket.total).toLocaleString("en-IN")}`],
    ];

    let y = 80;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(110, 110, 110);
      doc.text(label, 18, y);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(25, 25, 25);
      doc.text(String(value), 80, y);
      y += 12;
    });

    doc.line(18, y + 4, 192, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Please carry a valid photo ID along with this e-ticket during travel.", 18, y + 14);
    doc.text("Generated by TravelEase", 18, y + 21);

    doc.save(`TravelEase-Ticket-${ticket.id}.pdf`);
  }

  function goToDestinations() {
    setShowFavourites(false);
    document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" });
  }

  const maxSelectablePeople = bookingDestination
    ? Math.max(1, Math.min(20, seatsByDest[bookingDestination.id] ?? bookingDestination.seats))
    : 20;

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="#home" aria-label="TravelEase home"><span className="logo-mark">✦</span> TravelEase</a>
        <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu ? "✕" : "☰"}</button>
        <nav className={`nav-links ${mobileMenu ? "nav-open" : ""}`}>
          <a href="#home" onClick={() => setMobileMenu(false)}>Home</a>
          <a href="#destinations" onClick={() => { setMobileMenu(false); setShowFavourites(false); }}>Destinations</a>
          <button className="nav-link-button" onClick={() => { setShowBookings(true); setMobileMenu(false); }}>My Bookings</button>
          <button className="nav-link-button" onClick={() => { setShowFavourites(!showFavourites); setMobileMenu(false); goToDestinations(); }}>{showFavourites ? "All Trips" : "Favourites"}</button>
          {currentUser ? (
            <>
              <span className="user-greeting">Hi, {currentUser.name.split(" ")[0]}</span>
              <button className="btn btn-small btn-outline" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="nav-link-button" onClick={() => { setAuthMode("signin"); setAuthMessage(""); setShowAuth(true); setMobileMenu(false); }}>Sign In</button>
              <button className="btn btn-small" onClick={() => { setAuthMode("signup"); setAuthMessage(""); setShowAuth(true); setMobileMenu(false); }}>Sign Up</button>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="eyebrow light">YOUR NEXT ADVENTURE STARTS HERE</span>
            <h1>Find your next<br /><em>happy place.</em></h1>
            <p>Discover beautiful destinations, plan your getaway, and make memories that last a lifetime.</p>
            <div className="hero-actions">
              <button className="btn" onClick={goToDestinations}>Explore Destinations <span>↗</span></button>
              <a className="hero-text-link" href="#why-us">Why TravelEase? <span>↓</span></a>
            </div>
            <div className="hero-stats">
              <div><strong>6+</strong><span>Destinations</span></div>
              <div><strong>4.8/5</strong><span>Guest rating</span></div>
              <div><strong>Easy</strong><span>Booking process</span></div>
            </div>
          </div>
          <div className="hero-note"><span>✦</span> Collect moments, not things.</div>
        </section>

        <section className="section destinations-section" id="destinations">
          <div className="section-heading">
            <div><span className="eyebrow">{showFavourites ? "YOUR SAVED PLACES" : "CURATED FOR YOU"}</span><h2>{showFavourites ? "Your favourites" : "Explore destinations"}</h2></div>
            <p>{showFavourites ? "The places you have saved for later." : "From peaceful hills to sunlit shores, your next story is waiting."}</p>
          </div>

          <div className="filter-panel">
            <label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search places or states..." /></label>
            <label><span className="field-label">Travel style</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option><option>Beach</option><option>Mountain</option><option>Nature</option><option>Culture</option></select></label>
            <label><span className="field-label">Max budget</span><select value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)}><option value="7000">₹7,000</option><option value="10000">₹10,000</option><option value="15000">₹15,000</option><option value="20000">₹20,000</option><option value="30000">Any budget</option></select></label>
            <label><span className="field-label">Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select></label>
          </div>

          <div className="results-line"><span>{filteredDestinations.length} {filteredDestinations.length === 1 ? "destination" : "destinations"} found</span>{showFavourites && <button className="text-button" onClick={() => setShowFavourites(false)}>Show all destinations</button>}</div>
          <div className="destination-grid">
            {filteredDestinations.map((destination) => (
              <article className="destination-card" key={destination.id}>
                <div className="card-image-wrap">
                  <img src={destination.image} alt={destination.name} className="card-image" />
                  <span className="category-pill">{destination.category}</span>
                  <button className={`heart-button ${favourites.includes(destination.id) ? "is-favourite" : ""}`} onClick={() => toggleFavourite(destination.id)} aria-label={favourites.includes(destination.id) ? "Remove favourite" : "Add favourite"}>{favourites.includes(destination.id) ? "♥" : "♡"}</button>
                </div>
                <div className="card-body">
                  <div className="card-location">⌖ {destination.state}</div>
                  <div className="card-title-row"><h3>{destination.name}</h3><span className="rating">★ {destination.rating}</span></div>
                  <p>{destination.description}</p>
                  <div className="card-footer"><div><strong>₹{destination.price.toLocaleString("en-IN")}</strong><span> / person</span><small>{destination.days} days trip · {destination.seatsLeft} {destination.seatsLeft === 1 ? "seat" : "seats"} left</small></div><button className="btn btn-card" onClick={() => setSelectedDestination(destination)} disabled={destination.seatsLeft <= 0}>{destination.seatsLeft <= 0 ? "Sold out" : "View trip"} <span>↗</span></button></div>
                </div>
              </article>
            ))}
          </div>
          {filteredDestinations.length === 0 && <div className="empty-state"><span>⌕</span><h3>No destinations found</h3><p>Try changing your search or filters.</p><button className="btn" onClick={() => { setSearch(""); setCategory("All"); setMaxBudget("30000"); setShowFavourites(false); }}>Reset filters</button></div>}
        </section>

        <section className="why-section" id="why-us">
          <div className="section why-inner">
            <div className="why-copy"><span className="eyebrow">TRAVEL WITHOUT THE STRESS</span><h2>Less planning.<br /><em>More living.</em></h2><p>Your time away should feel effortless. We keep your trip choices simple, transparent, and easy to manage.</p><button className="btn" onClick={goToDestinations}>Find your trip <span>↗</span></button></div>
            <div className="benefit-list">
              <div className="benefit"><span className="benefit-icon">◎</span><div><h3>Handpicked places</h3><p>Explore a thoughtful collection of memorable destinations.</p></div><span className="benefit-number">01</span></div>
              <div className="benefit"><span className="benefit-icon">↗</span><div><h3>Simple booking</h3><p>Choose your destination and save your trip details in minutes.</p></div><span className="benefit-number">02</span></div>
              <div className="benefit"><span className="benefit-icon">♡</span><div><h3>Your trips, your way</h3><p>Save favourites and manage your bookings from one place.</p></div><span className="benefit-number">03</span></div>
            </div>
          </div>
        </section>

        <section className="section reviews-section" id="reviews">
          <div className="section-heading"><div><span className="eyebrow">KIND WORDS FROM TRAVELLERS</span><h2>Stories from the road</h2></div><button className="btn btn-outline" onClick={() => setShowReviews(true)}>Write a review <span>↗</span></button></div>
          <div className="reviews-grid">
            {reviews.slice(0, 3).map((review) => <article className="review-card" key={review.id}><div className="review-stars">{"★".repeat(review.rating)}<span>{"★".repeat(5 - review.rating)}</span></div><p>“{review.text}”</p><div className="review-person"><span className="avatar">{review.name.charAt(0).toUpperCase()}</span><strong>{review.name}</strong><span>Verified traveller</span></div></article>)}
          </div>
        </section>
      </main>

      <footer className="footer"><a className="logo footer-logo" href="#home"><span className="logo-mark">✦</span> TravelEase</a><p>Make room for the moments that matter.</p><div className="footer-bottom"><span>© {new Date().getFullYear()} TravelEase. Learning project.</span><a href="#home">Back to top ↑</a></div></footer>

      {showAuth && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAuth(false); }}><section className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" onClick={() => setShowAuth(false)} aria-label="Close">×</button><div className="modal-content"><div className="auth-brand"><span className="logo-mark">✦</span> TravelEase</div><span className="eyebrow">{authMode === "signup" ? "START YOUR JOURNEY" : "WELCOME BACK"}</span><h2 id="auth-title">{authMode === "signup" ? "Create your account" : "Sign in to TravelEase"}</h2><p className="modal-intro">{authMode === "signup" ? "Create an account to save your trips and manage bookings." : "Sign in to continue planning your next getaway."}</p><form className="form-stack" onSubmit={handleAuthSubmit}>{authMode === "signup" && <><label>Full name<input name="name" value={authForm.name} onChange={handleAuthChange} placeholder="Enter your name" required autoComplete="name" /></label><label>Phone number<input name="phone" value={authForm.phone} onChange={handleAuthChange} placeholder="10-digit phone number" inputMode="numeric" maxLength={10} required autoComplete="tel" /></label></>}<label>Email address<input name="email" type="email" value={authForm.email} onChange={handleAuthChange} placeholder="you@example.com" required autoComplete="email" /></label><label>Password<input name="password" type="password" value={authForm.password} onChange={handleAuthChange} placeholder={authMode === "signup" ? "At least 8 characters" : "Enter your password"} minLength={8} required autoComplete={authMode === "signup" ? "new-password" : "current-password"} /></label>{authMessage && <p className="auth-message" role="status">{authMessage}</p>}<button className="btn btn-full" type="submit">{authMode === "signup" ? "Create account" : "Sign in"} <span>↗</span></button></form><p className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New to TravelEase?"}<button className="text-button" onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setAuthMessage(""); }}> {authMode === "signup" ? "Sign in" : "Create an account"}</button></p><p className="fine-print">Demo project: account data is saved in this browser only.</p></div></section></div>}

      {selectedDestination && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDestination(null); }}><section className="modal detail-modal" role="dialog" aria-modal="true"><button className="modal-close over-image" onClick={() => setSelectedDestination(null)} aria-label="Close">×</button><img className="detail-image" src={selectedDestination.image} alt={selectedDestination.name} /><div className="modal-content"><span className="eyebrow">{selectedDestination.category} ESCAPE · {selectedDestination.days} DAYS</span><h2>{selectedDestination.name}, {selectedDestination.state}</h2><p>{selectedDestination.description}</p><div className="detail-facts"><span>★ {selectedDestination.rating} traveller rating</span><span>⌖ {selectedDestination.days} days</span><span>🪑 {selectedDestination.seatsLeft} {selectedDestination.seatsLeft === 1 ? "seat" : "seats"} left</span></div><div className="detail-price"><div><span>Starting from</span><strong>₹{selectedDestination.price.toLocaleString("en-IN")} <small>/ person</small></strong></div><button className="btn" onClick={() => openBooking(selectedDestination)} disabled={selectedDestination.seatsLeft <= 0}>{selectedDestination.seatsLeft <= 0 ? "Sold out" : "Book this trip"} <span>↗</span></button></div></div></section></div>}

      {bookingDestination && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingDestination(null); }}><section className="modal booking-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setBookingDestination(null)} aria-label="Close">×</button><div className="modal-content"><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Book your trip</h2><p className="modal-intro">A few details and you're one step closer to {bookingDestination.name} ({seatsByDest[bookingDestination.id] ?? bookingDestination.seats} seats left).</p><div className="booking-summary"><img src={bookingDestination.image} alt="" /><div><strong>{bookingDestination.name}</strong><span>{bookingDestination.days} days · {bookingDestination.category}</span><strong>₹{(bookingDestination.price * Number(form.people || 1)).toLocaleString("en-IN")} total</strong></div></div><form className="form-stack" onSubmit={handleBooking}><label>Full name<input name="name" value={form.name} onChange={handleFormChange} required /></label><label>Email address<input name="email" type="email" value={form.email} onChange={handleFormChange} required /></label><label>Phone number<input name="phone" value={form.phone} onChange={handleFormChange} inputMode="numeric" maxLength={10} required /></label><div className="form-row"><label>Travel date<input name="date" type="date" value={form.date} onChange={handleFormChange} min={new Date().toISOString().split("T")[0]} required /></label><label>Travellers<select name="people" value={form.people} onChange={handleFormChange}>{Array.from({ length: maxSelectablePeople }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? "person" : "people"}</option>)}</select></label></div>{bookingMessage && <p className="auth-message" role="status">{bookingMessage}</p>}<button className="btn btn-full" type="submit">Confirm booking <span>↗</span></button></form><p className="fine-print">This demo saves your booking and seat availability to Supabase.</p></div></section></div>}

      {bookingMessage && !bookingDestination && <div className="toast-message"><span>✓</span><div><strong>TravelEase</strong><p>{bookingMessage}</p></div><button onClick={() => setBookingMessage("")} aria-label="Dismiss">×</button></div>}

      {showBookings && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowBookings(false); }}><section className="modal bookings-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setShowBookings(false)} aria-label="Close">×</button><div className="modal-content"><span className="eyebrow">YOUR TRAVEL PLANS</span><h2>My bookings</h2><p className="modal-intro">{currentUser ? `Bookings saved for ${currentUser.name}.` : "Your saved bookings."}</p>{userBookings.length === 0 ? <div className="empty-state compact"><span>✦</span><h3>No bookings yet</h3><p>Your next adventure could be just around the corner.</p><button className="btn" onClick={() => { setShowBookings(false); goToDestinations(); }}>Explore trips</button></div> : <div className="booking-list">{userBookings.map((booking) => <article className="booking-item" key={booking.id}><img src={booking.image} alt={booking.destination} /><div className="booking-info"><div className="booking-title-row"><h3>{booking.destination}</h3><span className="status-pill">{booking.status}</span></div><p>{booking.date} · {booking.people} {booking.people === 1 ? "traveller" : "travellers"}</p><strong>₹{Number(booking.total).toLocaleString("en-IN")}</strong><small>Booked by {booking.name}</small><div style={{ display: "flex", gap: "14px", marginTop: "6px" }}><button className="text-button" type="button" onClick={() => setTicketBooking(booking)}>View Ticket 🎫</button><button className="text-button danger-text" type="button" onClick={() => cancelBooking(booking.id)}>Cancel booking</button></div></div></article>)}</div>}</div></section></div>}

      {ticketBooking && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTicketBooking(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              onClick={() => setTicketBooking(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="modal-content">
              <span className="eyebrow">TRAVEL PASS · CONFIRMED</span>
              <h2>{ticketBooking.destination} Ticket</h2>
              <p className="modal-intro">
                Booking ID: <strong>#{ticketBooking.id}</strong> · Status:{" "}
                <strong>{ticketBooking.status}</strong>
              </p>
              <div className="booking-summary">
                <img src={ticketBooking.image} alt={ticketBooking.destination} />
                <div>
                  <strong>Passenger: {ticketBooking.name}</strong>
                  <span>Travel Date: {ticketBooking.date}</span>
                  <span>
                    Travellers: {ticketBooking.people}{" "}
                    {ticketBooking.people === 1 ? "person" : "people"}
                  </span>
                  {ticketBooking.phone && <span>Phone: {ticketBooking.phone}</span>}
                  <span>Email: {ticketBooking.email}</span>
                  <strong>
                    Total Paid: ₹{Number(ticketBooking.total).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  className="btn btn-outline btn-full"
                  type="button"
                  onClick={() => downloadTicketPDF(ticketBooking)}
                >
                  Download PDF ↓
                </button>
                <button
                  className="btn btn-full"
                  type="button"
                  onClick={() => setTicketBooking(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {showReviews && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowReviews(false); }}><section className="modal review-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setShowReviews(false)} aria-label="Close">×</button><div className="modal-content"><span className="eyebrow">SHARE YOUR EXPERIENCE</span><h2>Write a review</h2><p className="modal-intro">Tell other travellers what you enjoyed.</p><form className="form-stack" onSubmit={submitReview}><label>Your name<input value={reviewForm.name} onChange={(event) => setReviewForm({ ...reviewForm, name: event.target.value })} required placeholder="Enter your name" /></label><label>Rating<select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: event.target.value })}><option value="5">★★★★★ - Excellent</option><option value="4">★★★★ - Very good</option><option value="3">★★★ - Good</option><option value="2">★★ - Fair</option><option value="1">★ - Poor</option></select></label><label>Your review<textarea rows="4" value={reviewForm.text} onChange={(event) => setReviewForm({ ...reviewForm, text: event.target.value })} required placeholder="Write a few words about your trip..." /></label><button className="btn btn-full" type="submit">Publish review <span>↗</span></button></form></div></section></div>}
    </div>
  );
}

export default App;