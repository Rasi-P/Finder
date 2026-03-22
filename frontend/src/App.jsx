import { startTransition, useDeferredValue, useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

const text = {
  brand: "Finder",
  badge: "Hyper-local help in minutes",
  title: "Find trusted workers nearby and let new workers submit their own details.",
  subtitle:
    "Direct call and WhatsApp links for users, plus a public listing form for workers that stays pending until admin approval.",
  searchLabel: "Search by worker or service",
  pincodeLabel: "Pincode or area",
  verifiedOnly: "Verified only",
  availableOnly: "Available now",
  clearFilters: "Clear filters",
  searchHint: "No login required. Reach a worker in one tap.",
  statsCategories: "Services",
  statsLocations: "Areas",
  statsWorkers: "Contacts",
  statsVerified: "Verified",
  categoriesTitle: "Popular services",
  categoriesHint: "Tap a category to narrow the list instantly.",
  locationsTitle: "Nearby areas",
  locationsHint: "Use a familiar neighbourhood or pincode to search.",
  submissionTitle: "Add your service",
  submissionHint:
    "Workers can add their own details here. Submissions stay pending until you approve them in Django admin.",
  submissionName: "Full name",
  submissionPhone: "Phone or WhatsApp number",
  submissionCategory: "Service category",
  submissionCity: "City",
  submissionArea: "Area",
  submissionPincode: "Pincode",
  submissionDescription: "Short service description",
  submissionAvailability: "Available for calls right now",
  submissionConsent: "I agree to be contacted and shown in the directory after approval.",
  submit: "Submit details",
  submitting: "Submitting...",
  submitSuccess: "Thanks. Your details were submitted for review.",
  submitDefaultError: "We could not save the submission right now.",
  resultsTitle: "Available workers",
  resultsHint: "Fast results, direct contact, no booking friction.",
  loading: "Loading local contacts...",
  error: "We could not reach the backend. Start Django on port 8000 and try again.",
  noResults: "No workers matched this filter yet.",
  allServices: "All services",
  selectCategory: "Select a category",
  verified: "Verified",
  available: "Available",
  unavailable: "Busy",
  call: "Call",
  whatsapp: "WhatsApp",
  newBadge: "New",
};

const emptySubmission = {
  name: "",
  phone_number: "",
  category: "",
  city: "",
  area_name: "",
  pincode: "",
  service_description: "",
  availability_status: true,
  consent_to_contact: true,
};

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function findError(payload) {
  if (!payload) {
    return "";
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (Array.isArray(payload)) {
    return payload.map(findError).find(Boolean) ?? "";
  }
  if (typeof payload === "object") {
    return Object.values(payload).map(findError).find(Boolean) ?? "";
  }
  return "";
}

async function requestJson(path, { method = "GET", params, body, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(findError(payload) || `Request failed with status ${response.status}`);
  }

  return payload;
}

function App() {
  const [homeData, setHomeData] = useState({
    stats: { categories: 0, locations: 0, workers: 0, verified_workers: 0 },
    categories: [],
    locations: [],
  });
  const [workers, setWorkers] = useState([]);
  const [filters, setFilters] = useState({ category: "", pincode: "", search: "", verified: false, available: true });
  const [submission, setSubmission] = useState(emptySubmission);
  const [homeState, setHomeState] = useState({ loading: true, error: "" });
  const [workerState, setWorkerState] = useState({ loading: true, error: "" });
  const [submissionState, setSubmissionState] = useState({ loading: false, error: "", success: "" });
  const deferredSearch = useDeferredValue(filters.search);
  const deferredPincode = useDeferredValue(filters.pincode);

  useEffect(() => {
    const controller = new AbortController();
    requestJson("/home/", { signal: controller.signal })
      .then((data) => {
        setHomeData(data);
        setHomeState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setHomeState({ loading: false, error: text.error });
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setWorkerState({ loading: true, error: "" });
    requestJson("/workers/", {
      params: {
        category: filters.category,
        pincode: deferredPincode,
        search: deferredSearch,
        verified: filters.verified || "",
        available: filters.available,
      },
      signal: controller.signal,
    })
      .then((data) => {
        setWorkers(data);
        setWorkerState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setWorkerState({ loading: false, error: text.error });
        }
      });
    return () => controller.abort();
  }, [deferredPincode, deferredSearch, filters.available, filters.category, filters.verified]);

  function updateFilter(key, value) {
    startTransition(() => {
      setFilters((current) => ({ ...current, [key]: value }));
    });
  }

  function updateSubmission(key, value) {
    setSubmission((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSubmissionState({ loading: true, error: "", success: "" });
      const response = await requestJson("/worker-submissions/", {
        method: "POST",
        body: { ...submission, category: Number(submission.category) },
      });
      setSubmission(emptySubmission);
      setSubmissionState({ loading: false, error: "", success: response.message || text.submitSuccess });
    } catch (error) {
      setSubmissionState({ loading: false, error: error.message || text.submitDefaultError, success: "" });
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{text.badge}</span>
          <div className="brand-lockup"><span className="brand-mark">F</span><span className="brand-name">{text.brand}</span></div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="search-card">
          <label><span>{text.searchLabel}</span><input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Plumber, cleaner, Niyas..." /></label>
          <label><span>{text.pincodeLabel}</span><input value={filters.pincode} onChange={(event) => updateFilter("pincode", event.target.value)} placeholder="673633" /></label>
          <div className="toggle-row">
            <button className={filters.verified ? "toggle active" : "toggle"} onClick={() => updateFilter("verified", !filters.verified)} type="button">{text.verifiedOnly}</button>
            <button className={filters.available ? "toggle active" : "toggle"} onClick={() => updateFilter("available", !filters.available)} type="button">{text.availableOnly}</button>
          </div>
          <button className="ghost-button" onClick={() => setFilters({ category: "", pincode: "", search: "", verified: false, available: true })} type="button">{text.clearFilters}</button>
          <p className="search-note">{text.searchHint}</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label={text.statsCategories} value={homeData.stats.categories} accent="sun" />
        <StatCard label={text.statsLocations} value={homeData.stats.locations} accent="mint" />
        <StatCard label={text.statsWorkers} value={homeData.stats.workers} accent="peach" />
        <StatCard label={text.statsVerified} value={homeData.stats.verified_workers} accent="ink" />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading"><div><h2>{text.categoriesTitle}</h2><p>{text.categoriesHint}</p></div></div>
          <div className="category-grid">
            <button className={filters.category === "" ? "category-pill active" : "category-pill"} onClick={() => updateFilter("category", "")} type="button"><span>{text.allServices}</span></button>
            {homeData.categories.map((category) => (
              <button key={category.id} className={filters.category === category.name ? "category-pill active" : "category-pill"} onClick={() => updateFilter("category", category.name)} type="button">
                {category.icon_url ? <img src={category.icon_url} alt="" /> : <span className="icon-fallback">+</span>}
                <span>{category.name}</span>
                <strong>{category.worker_count}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="section-heading"><div><h2>{text.locationsTitle}</h2><p>{text.locationsHint}</p></div></div>
          <div className="location-list">
            {homeData.locations.map((location) => (
              <button key={location.id} className="location-card" onClick={() => updateFilter("pincode", location.pincode)} type="button">
                <span>{location.display_name}</span>
                <strong>{location.pincode}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="submission-grid">
        <div className="panel submission-copy">
          <div className="section-heading"><div><h2>{text.submissionTitle}</h2><p>{text.submissionHint}</p></div></div>
          <div className="submission-steps"><p>1. Add contact and service details.</p><p>2. The request stays pending for review.</p><p>3. Approve it in admin to publish the listing.</p></div>
        </div>
        <div className="panel">
          <form className="submission-form" onSubmit={handleSubmit}>
            <div className="form-grid two-up">
              <label><span>{text.submissionName}</span><input required value={submission.name} onChange={(event) => updateSubmission("name", event.target.value)} /></label>
              <label><span>{text.submissionPhone}</span><input required value={submission.phone_number} onChange={(event) => updateSubmission("phone_number", event.target.value)} /></label>
            </div>
            <label><span>{text.submissionCategory}</span><select required value={submission.category} onChange={(event) => updateSubmission("category", event.target.value)}><option value="">{text.selectCategory}</option>{homeData.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <div className="form-grid three-up">
              <label><span>{text.submissionCity}</span><input required value={submission.city} onChange={(event) => updateSubmission("city", event.target.value)} /></label>
              <label><span>{text.submissionArea}</span><input required value={submission.area_name} onChange={(event) => updateSubmission("area_name", event.target.value)} /></label>
              <label><span>{text.submissionPincode}</span><input required value={submission.pincode} onChange={(event) => updateSubmission("pincode", event.target.value)} /></label>
            </div>
            <label><span>{text.submissionDescription}</span><textarea rows="4" value={submission.service_description} onChange={(event) => updateSubmission("service_description", event.target.value)} placeholder="Emergency plumbing, wiring, painting, home cleaning..." /></label>
            <label className="checkbox-row"><input type="checkbox" checked={submission.availability_status} onChange={(event) => updateSubmission("availability_status", event.target.checked)} /><span>{text.submissionAvailability}</span></label>
            <label className="checkbox-row"><input type="checkbox" checked={submission.consent_to_contact} onChange={(event) => updateSubmission("consent_to_contact", event.target.checked)} /><span>{text.submissionConsent}</span></label>
            {submissionState.error ? <p className="form-message error">{submissionState.error}</p> : null}
            {submissionState.success ? <p className="form-message success">{submissionState.success}</p> : null}
            <button className="submit-button" disabled={submissionState.loading} type="submit">{submissionState.loading ? text.submitting : text.submit}</button>
          </form>
        </div>
      </section>

      <section className="results-panel">
        <div className="section-heading"><div><h2>{text.resultsTitle}</h2><p>{text.resultsHint}</p></div></div>
        {homeState.loading || workerState.loading ? <p className="state-copy">{text.loading}</p> : null}
        {homeState.error || workerState.error ? <p className="state-copy error">{homeState.error || workerState.error}</p> : null}
        {!homeState.loading && !workerState.loading && workers.length === 0 ? <p className="state-copy">{text.noResults}</p> : (
          <div className="worker-grid">
            {workers.map((worker) => (
              <article key={worker.id} className="worker-card">
                <div className="worker-topline">
                  <div><h3>{worker.name}</h3><p>{worker.category.name} - {worker.location.display_name}</p></div>
                  {worker.is_verified ? <span className="verified-chip">{text.verified}</span> : null}
                </div>
                <div className="meta-row"><span>{worker.average_rating ? `${worker.average_rating}/5` : text.newBadge}</span><span className={worker.availability_status ? "status available" : "status unavailable"}>{worker.availability_status ? text.available : text.unavailable}</span></div>
                <div className="action-row"><a href={worker.call_url} className="action-button call-button">{text.call}</a><a href={worker.whatsapp_url} className="action-button whatsapp-button" target="_blank" rel="noreferrer">{text.whatsapp}</a></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, accent }) {
  return <article className={`stat-card ${accent}`}><span>{label}</span><strong>{value}</strong></article>;
}

export default App;
