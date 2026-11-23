const EVENTS = [
  {
    id: 1,
    title: "Tech & Cloud Meetup",
    category: "Tech",
    date: "Dec 12, 2026",
    location: "Nairobi",
    price: "KES 1,500",
    image: "images/tech-meetup.jpg"
  },
  {
    id: 2,
    title: "Live Acoustic Night",
    category: "Music",
    date: "Dec 18, 2026",
    location: "Westlands",
    price: "KES 1,000",
    image: "images/concert.jpg"
  },
  {
    id: 3,
    title: "Web Development Workshop",
    category: "Workshop",
    date: "Jan 09, 2027",
    location: "Online",
    price: "Free",
    image: "images/workshop.jpg"
  },
  {
    id: 4,
    title: "East Africa Startup Forum",
    category: "Business",
    date: "Jan 22, 2027",
    location: "Nairobi",
    price: "KES 3,000",
    image: "images/tech-meetup.jpg"
  },
  {
    id: 5,
    title: "Linux & Systems Engineering Lab",
    category: "Tech",
    date: "Feb 05, 2027",
    location: "Chuka",
    price: "Free",
    image: "images/workshop.jpg"
  },
  {
    id: 6,
    title: "Jazz Under the Stars",
    category: "Music",
    date: "Feb 14, 2027",
    location: "Karen",
    price: "KES 2,200",
    image: "images/concert.jpg"
  }
];

// Storage Helpers
const getUsers = () => JSON.parse(localStorage.getItem("eb_users") || "[]");
const saveUsers = (users) => localStorage.setItem("eb_users", JSON.stringify(users));
const getCurrentUser = () => JSON.parse(localStorage.getItem("eb_session") || "null");
const setCurrentUser = (user) => localStorage.setItem("eb_session", JSON.stringify(user));

function logoutUser() {
  localStorage.removeItem("eb_session");
  window.location.href = "index.html";
}

// Update Navbar Based on Auth Session
function syncNavigation() {
  const nav = document.getElementById("mainNav");
  const user = getCurrentUser();
  if (!nav || !user) return;

  const currentPage = window.location.pathname.split("/").pop();
  nav.innerHTML = `
    <a href="index.html" class="${currentPage === "index.html" ? "active" : ""}">Home</a>
    <a href="events.html" class="${currentPage === "events.html" ? "active" : ""}">Events</a>
    <a href="dashboard.html" class="${currentPage === "dashboard.html" ? "active" : ""}">My Tickets</a>
    <button type="button" class="btn btn-outline" id="logoutBtn">Log Out (${user.name.split(" ")[0]})</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", logoutUser);
}

// Render Reusable Event Card with Image Frame
function createEventCard(ev, actionLabel = "Book Now", isCancel = false) {
  return `
    <article class="event-card">
      <div class="event-card-image">
        <img src="${ev.image}" alt="${ev.title}" onerror="this.src='images/workshop.jpg'" />
        <span class="event-badge">${ev.category}</span>
      </div>
      <div class="event-card-body">
        <p class="event-date">${ev.date}</p>
        <h3 class="event-title">${ev.title}</h3>
        <p class="event-location">${ev.location}</p>
        <div class="event-card-footer">
          <span class="event-price">${ev.price}</span>
          <button
            type="button"
            class="btn ${isCancel ? "btn-outline" : "btn-primary"}"
            onclick="${isCancel ? `cancelBooking(${ev.id})` : `bookEvent(${ev.id})`}">
            ${actionLabel}
          </button>
        </div>
      </div>
    </article>
  `;
}

// Step 1: Book Button -> Save event ID and always send to login.html
function bookEvent(eventId) {
  localStorage.setItem("eb_pending_event", eventId);
  window.location.href = "login.html";
}

// Cancel Ticket Handler (Dashboard)
function cancelBooking(eventId) {
  const user = getCurrentUser();
  if (!user) return;

  const users = getUsers();
  const idx = users.findIndex((u) => u.email === user.email);
  if (idx !== -1) {
    users[idx].bookings = (users[idx].bookings || []).filter((id) => id !== eventId);
    saveUsers(users);
    setCurrentUser(users[idx]);
    renderDashboard();
  }
}

// Home Page Featured Events
function initHomePage() {
  const grid = document.getElementById("featuredEventsGrid");
  if (!grid) return;
  grid.innerHTML = EVENTS.slice(0, 3).map((ev) => createEventCard(ev)).join("");
}

// Events Page Search & Category Filter
function initEventsPage() {
  const grid = document.getElementById("allEventsGrid");
  if (!grid) return;

  const searchInput = document.getElementById("eventSearch");
  const categorySelect = document.getElementById("categoryFilter");

  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) {
    searchInput.value = params.get("q");
  }

  function filterAndRender() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;

    const filtered = EVENTS.filter((ev) => {
      const matchesCategory = category === "all" || ev.category === category;
      const matchesQuery =
        ev.title.toLowerCase().includes(query) ||
        ev.location.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });

    grid.innerHTML = filtered.length
      ? filtered.map((ev) => createEventCard(ev)).join("")
      : `<p class="meta">No events match your search criteria.</p>`;
  }

  searchInput.addEventListener("input", filterAndRender);
  categorySelect.addEventListener("change", filterAndRender);
  filterAndRender();
}

// Step 2A: Register Page -> Create account and proceed to payment.html
function initRegisterPage() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const alertBox = document.getElementById("registerAlert");
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const role = document.getElementById("regRole").value;
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;

    if (!name || !email || password.length < 8) {
      alertBox.className = "alert error";
      alertBox.textContent = "Please complete all fields (password must be at least 8 characters).";
      return;
    }

    if (password !== confirm) {
      alertBox.className = "alert error";
      alertBox.textContent = "Passwords do not match.";
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      alertBox.className = "alert error";
      alertBox.textContent = "An account with this email already exists.";
      return;
    }

    const newUser = { name, email, role, password, bookings: [] };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    window.location.href = "payment.html";
  });
}

// Step 2B: Login Page -> Authenticate and proceed to payment.html
function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const alertBox = document.getElementById("loginAlert");
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = getUsers().find((u) => u.email === email && u.password === password);
    if (!user) {
      alertBox.className = "alert error";
      alertBox.textContent = "Invalid email or password.";
      return;
    }

    setCurrentUser(user);
    window.location.href = "payment.html";
  });
}

// Step 3: Payment Page -> Confirm payment, save booking, and redirect to dashboard.html
function initPaymentPage() {
  const form = document.getElementById("paymentForm");
  if (!form) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const pendingId = Number(localStorage.getItem("eb_pending_event")) || EVENTS[0].id;
  const selectedEvent = EVENTS.find((ev) => ev.id === pendingId) || EVENTS[0];

  const summaryBox = document.getElementById("paymentSummary");
  if (summaryBox) {
    summaryBox.innerHTML = `
      <h3>${selectedEvent.title}</h3>
      <p>${selectedEvent.date} &bull; ${selectedEvent.location}</p>
      <p class="summary-price">Ticket Price: ${selectedEvent.price}</p>
    `;
  }

  const methodSelect = document.getElementById("paymentMethod");
  const mpesaGroup = document.getElementById("mpesaGroup");
  const cardGroup = document.getElementById("cardGroup");

  methodSelect.addEventListener("change", () => {
    if (methodSelect.value === "M-Pesa") {
      mpesaGroup.style.display = "block";
      cardGroup.style.display = "none";
    } else {
      mpesaGroup.style.display = "none";
      cardGroup.style.display = "block";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const alertBox = document.getElementById("paymentAlert");
    const method = methodSelect.value;
    const phone = document.getElementById("mpesaPhone").value.trim();
    const card = document.getElementById("cardNumber").value.trim();

    if (method === "M-Pesa" && phone.length < 10) {
      alertBox.className = "alert error";
      alertBox.textContent = "Please enter a valid M-Pesa phone number.";
      return;
    }

    if (method === "Card" && card.replace(/\s+/g, "").length < 12) {
      alertBox.className = "alert error";
      alertBox.textContent = "Please enter a valid card number.";
      return;
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.email === user.email);
    if (idx !== -1) {
      users[idx].bookings = users[idx].bookings || [];
      if (!users[idx].bookings.includes(selectedEvent.id)) {
        users[idx].bookings.push(selectedEvent.id);
      }
      saveUsers(users);
      setCurrentUser(users[idx]);
    }

    localStorage.removeItem("eb_pending_event");

    alertBox.className = "alert success";
    alertBox.textContent = `Payment confirmed via ${method}! Redirecting to your dashboard...`;

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  });
}

// Step 4: Dashboard Page -> Render user's booked tickets
function renderDashboard() {
  const grid = document.getElementById("bookedTicketsGrid");
  if (!grid) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("welcomeHeading").textContent = `Welcome, ${user.name}`;
  document.getElementById("userRoleBadge").textContent = `Account Role: ${user.role} • ${user.email}`;

  const bookedEvents = EVENTS.filter((ev) => (user.bookings || []).includes(ev.id));
  grid.innerHTML = bookedEvents.length
    ? bookedEvents.map((ev) => createEventCard(ev, "Cancel Ticket", true)).join("")
    : `<p class="meta">You haven't booked any tickets yet. <a href="events.html">Browse events</a>.</p>`;
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  syncNavigation();
  initHomePage();
  initEventsPage();
  initRegisterPage();
  initLoginPage();
  initPaymentPage();
  renderDashboard();
});