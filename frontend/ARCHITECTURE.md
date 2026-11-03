# FreshTrack Frontend — Architecture & Migration Guide

> Read this once before you start coding. It explains **why** the frontend is
> split the way it is, **where** every new file should go, and **how** to move
> from the old "one big `App.jsx` + `store.css`" style to the new style.

---

## 1. Why we changed

In the original Vite scaffold, everyone edited the same two files:

- `src/App.jsx` — the whole app (store logic, layout, state, everything)
- `src/store.css` — one global stylesheet

That is a conflict magnet: if two people both touch `App.jsx`, every
`git pull` means a merge fight, and two `.card` rules in one global CSS file
silently override each other.

The fix is the standard React answer: **one component per file, each feature in
its own folder, and scoped (CSS Module) styles.** Now Tse owns
`components/buyer/`, Chan owns `components/admin/`, and they almost never touch
the same file.

---

## 2. The new structure

```
frontend/src/
  main.jsx              ← Vite entry point. Do NOT edit.
  App.jsx               ← SHARED ROUTER ONLY (nav bar + which view shows).
                          This is the ONE file both of you may touch.
  index.css             ← Global resets + the top nav styles only.
  auth/                 ← SHARED: login screen + role guard (both use it).
    AuthContext.jsx     ← <AuthProvider> (wraps the app in main.jsx)
    authContext.js      ← the raw React context (internal)
    useAuth.js          ← the useAuth() hook (import this in components)
    Login.jsx           ← the login screen
    RequireRole.jsx     ← wraps a page so only the right role can open it
    Auth.module.css
  components/
    buyer/              ← TSE CHUN HONG's zone (storefront)
      BuyerApp.jsx          ← storefront entry (logo, hero, search, grid)
      HeroCarousel.jsx      ← rotating "Hot Selling" banner
      ProductCatalog.jsx    ← the product grid + cards
      CartSidebar.jsx       ← cart / checkout sidebar
      Buyer.module.css      ← ALL buyer styles live here (or a new *.module.css)
    admin/              ← CHAN LONG HIM's zone (ERP dashboard)
      AdminApp.jsx          ← dashboard entry (build inside here)
      Admin.module.css      ← ALL admin styles live here
```

---

## 3. Old style → new style (worked example)

### OLD (what we had at the root — do not write code like this anymore)

```jsx
// ❌ src/App.jsx (OLD) — one file held the whole store + all the UI
function App() {
  const [cart, setCart] = useState([]);
  // ...hundreds of lines of product logic, JSX, styling...
  return <div className="product-grid"> ... </div>;
}
```

```css
/* ❌ src/store.css (OLD) — global, classes can clash with Chan's */
.product-grid { display: grid; }
.card { border: 1px solid #ddd; }
```

### NEW (how ALL new code should be written)

```jsx
// ✅ src/components/buyer/ProductCatalog.jsx
import styles from "./Buyer.module.css";

export default function ProductCatalog({ products, onAdd }) {
  return (
    <div className={styles.grid}>
      {products.map((p) => (
        <div className={styles.card} key={p.id}>
          <span>{p.name}</span>
          <button onClick={() => onAdd(p)}>Add</button>
        </div>
      ))}
    </div>
  );
}
```

```css
/* ✅ src/components/buyer/Buyer.module.css — auto-scoped, never clashes */
.card { border: 1px solid #ddd; border-radius: 12px; }
.grid { display: grid; gap: 16px; }
```

**The magic:** `styles.card` is compiled to a unique hashed class name at build
time. So Tse's `.card` in `Buyer.module.css` and Chan's `.card` in
`Admin.module.css` are two completely unrelated classes. No collisions, ever.

**Rule:** never import a `*.module.css` from outside its own folder, and never
add page-specific styles to the global `index.css` — put them in your folder's
`*.module.css`.

---

## 4. Where to put new files

| You are adding…                              | Put it in…                                              |
|----------------------------------------------|---------------------------------------------------------|
| A new **buyer storefront** component (Tse)    | `src/components/buyer/` + styles in `Buyer.module.css`  |
| A new **admin dashboard** component (Chan)    | `src/components/admin/` + styles in `Admin.module.css`  |
| Anything **shared** (login, nav, guards)      | `src/auth/` (or ask first)                              |
| A **brand-new top-level page** (both)         | Build it as a component, then mount it in `App.jsx`     |

`App.jsx` is the **only** file we both edit. Keep it minimal — it just shows the
nav and picks which zone (`BuyerApp` / `AdminApp`) to render. Do **not** put
page logic in it.

---

## 5. How to add a feature (example: Chan adds an inventory table)

1. Create the component in **your** folder:

   ```jsx
   // src/components/admin/InventoryTable.jsx
   import styles from "./Admin.module.css";

   export default function InventoryTable({ rows }) {
     return (
       <table className={styles.table}>
         {rows.map((r) => (<tr key={r.id}><td>{r.name}</td><td>{r.stock}</td></tr>))}
       </table>
     );
   }
   ```

2. Import and use it inside your zone's entry file:

   ```jsx
   // src/components/admin/AdminApp.jsx
   import InventoryTable from "./InventoryTable";
   // ...
   <main>
     <InventoryTable rows={rows} />
   </main>
   ```

3. Add any new classes to `src/components/admin/Admin.module.css` — **not**
   `index.css`, and **not** `Buyer.module.css`.

That's it. Tse's `buyer/` files are untouched, so there is no merge conflict.

---

## 6. Access control (already wired)

- The **storefront (`BuyerApp`) is public** — anyone can browse without logging
  in.
- The **Admin ERP is admin-only**. The "Admin ERP" button only appears for
  `ADMIN` accounts, and `RequireRole role="ADMIN"` blocks the route even if
  someone forces the URL.
- Login UI lives in `src/auth/Login.jsx`. The real login endpoint
  (`POST /api/auth/login`) is backend work (Katarina) — until that exists,
  `authContext.js` has a dev fallback that treats any email containing "admin"
  as an admin. **Remove that fallback once the backend is live.**

---

## 7. Running it

```bash
cd frontend
npm install      # first time only
npm run dev      # opens Vite dev server, usually http://localhost:5173
npm run build    # production build (use to check it compiles)
npm run lint     # catch React anti-patterns before committing
```

---

## 8. Git / branches

- Your frontend work lives on the **`storefront`** branch.
- Make small, focused commits. Example message style:
  `feat(buyer): add category filter chips` or
  `feat(admin): inventory table component`.
- `App.jsx`, `main.jsx`, `index.css`, and `auth/` are shared — pull before you
  start and tell the group in the chat if you change them.
- Open a Pull Request `storefront → main` when a feature is done and reviewed.

---

## 9. One-minute checklist for new code

- [ ] Component lives in **your** `components/<role>/` folder.
- [ ] Styles are in a `*.module.css` in the **same** folder (never global).
- [ ] Classes referenced as `styles.xxx`, not plain `"xxx"`.
- [ ] Page logic is **not** in `App.jsx`.
- [ ] `npm run lint` and `npm run build` both pass.
