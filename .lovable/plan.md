

## NexusSystems — Inventory & Sales Management Frontend

A modern, professional admin panel built in React/TypeScript with a dark sidebar + light content theme, connecting to your backend at `http://localhost:5000/api`.

---

### 🎨 Design & Layout
- **Dark sidebar** (navy/slate) with icons and navigation links, collapsible
- **Light content area** with clean white cards and subtle shadows
- **Top header** with user info, notifications bell, and logout
- **Fully responsive** — sidebar collapses to icons on mobile
- **Professional ERP aesthetic** with consistent spacing and typography

---

### 🔐 Authentication (Login Screen)
- Clean centered login form with email & password
- JWT token stored in localStorage
- Axios interceptor automatically attaches Bearer token to all requests
- Token expiry detection → auto-redirect to login
- Protected route wrapper for all pages

---

### 📊 Dashboard
A rich overview page split into sections:

**Summary Cards** — Total products, total stock quantity, total sales, low-stock alerts

**Sales Analytics Section:**
- Sales by period (line/bar chart)
- Sales by product (bar chart)
- Sales by user (bar chart)
- Profit by period (area chart)

**Stock Section:**
- Low stock alerts table (items below threshold)
- Recent stock movements

All charts powered by Recharts, pulling from the `/reports/*` endpoints.

---

### 👥 Users (CRUD)
- Table listing all users with search
- Create/Edit via modal dialog
- Delete with confirmation dialog
- Fields: name, email, password, role

### 👤 Customers (CRUD)
- Table with search and actions
- Create/Edit modal
- Delete confirmation
- Fields: name, email, phone, address

### 🏢 Suppliers (CRUD)
- Table with search and actions
- Create/Edit modal
- Delete confirmation
- Fields: name, contact info

### 📁 Categories (CRUD)
- Table with search and actions
- Create/Edit modal
- Delete confirmation
- Fields: name, description

---

### 📦 Products / Stock
- Table showing all products with current stock quantity highlighted
- Color-coded stock levels (green = ok, yellow = low, red = critical)
- Create/Edit product modal with category and supplier selection
- Delete confirmation
- Quick view of stock movements per product

---

### 🛒 Sales (Create & List)
- **Sales list** — table of past sales with date, customer, total, user
- **New sale flow:**
  - Select customer from dropdown
  - Add products with quantity (auto-complete search)
  - Auto-calculate line totals and grand total
  - Review before submitting
  - On submit → POST to API → stock automatically reduced
  - Success/error feedback via toast notifications

---

### 📦 Stock Movements
- History table showing all entries/exits
- Filter by type (entry/exit), date range, product
- Create new movement (manual entry/exit)
- Each row shows product, quantity, type, date, user

---

### ⚙️ Technical Architecture
- **API Service Layer** — Centralized Axios instance with base URL `http://localhost:5000/api`, configurable via environment variable
- **Auth Context** — React Context for login state, token management, user info
- **Reusable Components** — Data tables, modal forms, confirmation dialogs, loading skeletons
- **Form Validation** — Using react-hook-form + zod for all forms
- **Mock Data Fallback** — Service layer structured so you can easily swap mock data while backend is unavailable from the preview
- **Folder Structure:** pages/, components/, services/, contexts/, hooks/, types/

---

### 🚀 Screens Summary (9 pages)

| Page | Route |
|------|-------|
| Login | `/login` |
| Dashboard | `/` |
| Users | `/users` |
| Customers | `/customers` |
| Suppliers | `/suppliers` |
| Categories | `/categories` |
| Products | `/products` |
| Sales | `/sales` |
| Stock Movements | `/stock/movements` |

