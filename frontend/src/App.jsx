import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

const translations = {
  en: {
    brand: "Finder",
    badge: "Hyper-local help in minutes",
    title: "Find trusted workers near you.",
    subtitle: "Direct call and WhatsApp links. No login, no booking, no friction.",
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
    joinBanner: "Are you a worker?",
    joinBannerSub: "List your service for free. Get discovered by people near you.",
    joinButton: "Register as a Worker →",
    joinTitle: "List your service",
    joinHint: "Fill in your details. Your listing goes live after a quick review.",
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
    viewProfile: "View profile",
    backToHome: "← Back to home",
    rateWorker: "Rate this worker",
    submitRating: "Submit rating",
    ratingSuccess: "Thanks for your rating!",
    ratingError: "Could not submit rating.",
    serviceDescription: "Service description",
    noDescription: "No description provided.",
    langToggle: "മലയാളം",
  },
  ml: {
    brand: "Finder",
    badge: "അടുത്തുള്ള സഹായം മിനിറ്റുകൾക്കുള്ളിൽ",
    title: "വിശ്വസ്തരായ തൊഴിലാളികളെ കണ്ടെത്തൂ.",
    subtitle: "നേരിട്ട് വിളിക്കാം, WhatsApp ചെയ്യാം. ലോഗിൻ വേണ്ട, ബുക്കിംഗ് വേണ്ട.",
    searchLabel: "തൊഴിലാളിയെ അല്ലെങ്കിൽ സേവനം തിരയൂ",
    pincodeLabel: "പിൻകോഡ് അല്ലെങ്കിൽ പ്രദേശം",
    verifiedOnly: "സ്ഥിരീകരിച്ചവർ മാത്രം",
    availableOnly: "ഇപ്പോൾ ലഭ്യം",
    clearFilters: "ഫിൽട്ടർ മായ്ക്കുക",
    searchHint: "ലോഗിൻ ആവശ്യമില്ല. ഒറ്റ ടാപ്പിൽ തൊഴിലാളിയെ ബന്ധപ്പെടാം.",
    statsCategories: "സേവനങ്ങൾ",
    statsLocations: "പ്രദേശങ്ങൾ",
    statsWorkers: "കോൺടാക്ടുകൾ",
    statsVerified: "സ്ഥിരീകരിച്ചത്",
    categoriesTitle: "ജനപ്രിയ സേവനങ്ങൾ",
    categoriesHint: "ഒരു വിഭാഗം തിരഞ്ഞെടുത്ത് ലിസ്റ്റ് ഉടൻ ചുരുക്കൂ.",
    locationsTitle: "അടുത്തുള്ള പ്രദേശങ്ങൾ",
    locationsHint: "പരിചിതമായ നാടോ പിൻകോഡോ ഉപയോഗിച്ച് തിരയൂ.",
    joinBanner: "നിങ്ങൾ ഒരു തൊഴിലാളിയാണോ?",
    joinBannerSub: "സൗജന്യമായി ലിസ്റ്റ് ചെയ്യൂ. അടുത്തുള്ളവർ നിങ്ങളെ കണ്ടെത്തട്ടെ.",
    joinButton: "തൊഴിലാളിയായി രജിസ്റ്റർ ചെയ്യൂ →",
    joinTitle: "നിങ്ങളുടെ സേവനം ലിസ്റ്റ് ചെയ്യൂ",
    joinHint: "വിവരങ്ങൾ പൂരിപ്പിക്കൂ. അവലോകനത്തിന് ശേഷം ലിസ്റ്റിംഗ് ലൈവ് ആകും.",
    submissionName: "പൂർണ്ണ നാമം",
    submissionPhone: "ഫോൺ അല്ലെങ്കിൽ WhatsApp നമ്പർ",
    submissionCategory: "സേവന വിഭാഗം",
    submissionCity: "നഗരം",
    submissionArea: "പ്രദേശം",
    submissionPincode: "പിൻകോഡ്",
    submissionDescription: "ചെറിയ സേവന വിവരണം",
    submissionAvailability: "ഇപ്പോൾ കോളുകൾക്ക് ലഭ്യമാണ്",
    submissionConsent: "അംഗീകാരത്തിന് ശേഷം ഡയറക്ടറിയിൽ കാണിക്കാൻ ഞാൻ സമ്മതിക്കുന്നു.",
    submit: "വിവരങ്ങൾ സമർപ്പിക്കൂ",
    submitting: "സമർപ്പിക്കുന്നു...",
    submitSuccess: "നന്ദി. നിങ്ങളുടെ വിവരങ്ങൾ അവലോകനത്തിനായി സമർപ്പിച്ചു.",
    submitDefaultError: "ഇപ്പോൾ സമർപ്പണം സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല.",
    resultsTitle: "ലഭ്യമായ തൊഴിലാളികൾ",
    resultsHint: "വേഗത്തിലുള്ള ഫലങ്ങൾ, നേരിട്ടുള്ള ബന്ധം.",
    loading: "ലോക്കൽ കോൺടാക്ടുകൾ ലോഡ് ചെയ്യുന്നു...",
    error: "ബാക്കെൻഡിൽ എത്താൻ കഴിഞ്ഞില്ല. Django പോർട്ട് 8000-ൽ ആരംഭിക്കൂ.",
    noResults: "ഈ ഫിൽട്ടറിന് യോജിക്കുന്ന തൊഴിലാളികൾ ഇല്ല.",
    allServices: "എല്ലാ സേവനങ്ങളും",
    selectCategory: "ഒരു വിഭാഗം തിരഞ്ഞെടുക്കൂ",
    verified: "സ്ഥിരീകരിച്ചത്",
    available: "ലഭ്യം",
    unavailable: "തിരക്കിൽ",
    call: "വിളിക്കൂ",
    whatsapp: "WhatsApp",
    newBadge: "പുതിയത്",
    viewProfile: "പ്രൊഫൈൽ കാണൂ",
    backToHome: "← തിരിച്ച് പോകൂ",
    rateWorker: "തൊഴിലാളിയെ റേറ്റ് ചെയ്യൂ",
    submitRating: "റേറ്റിംഗ് സമർപ്പിക്കൂ",
    ratingSuccess: "റേറ്റിംഗിന് നന്ദി!",
    ratingError: "റേറ്റിംഗ് സമർപ്പിക്കാൻ കഴിഞ്ഞില്ല.",
    serviceDescription: "സേവന വിവരണം",
    noDescription: "വിവരണം നൽകിയിട്ടില്ല.",
    langToggle: "English",
  },
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
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) return payload.map(findError).find(Boolean) ?? "";
  if (typeof payload === "object") return Object.values(payload).map(findError).find(Boolean) ?? "";
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
  const [lang, setLang] = useState("en");
  const text = translations[lang];
  const toggleLang = () => setLang((l) => (l === "en" ? "ml" : "en"));

  const [homeData, setHomeData] = useState({
    stats: { categories: 0, locations: 0, workers: 0, verified_workers: 0 },
    categories: [],
    locations: [],
  });
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null, page: 1 });
  const [filters, setFilters] = useState({ category: "", pincode: "", search: "", verified: false, available: false });
  const [homeState, setHomeState] = useState({ loading: true, error: "" });
  const [workerState, setWorkerState] = useState({ loading: true, error: "" });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
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
        if (error.name !== "AbortError") setHomeState({ loading: false, error: text.error });
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
        available: filters.available || "",
        page: filters.page ?? 1,
      },
      signal: controller.signal,
    })
      .then((data) => {
        setWorkers(data.results ?? data);
        setPagination({ count: data.count ?? 0, next: data.next, previous: data.previous, page: filters.page ?? 1 });
        setWorkerState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setWorkerState({ loading: false, error: text.error });
      });
    return () => controller.abort();
  }, [deferredPincode, deferredSearch, filters.available, filters.category, filters.verified, filters.page]);

  useEffect(() => {
    if (!deferredPincode || deferredPincode.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    const controller = new AbortController();
    requestJson("/locations/", { params: { q: deferredPincode }, signal: controller.signal })
      .then((data) => setLocationSuggestions((data.results ?? data).slice(0, 5)))
      .catch(() => {});
    return () => controller.abort();
  }, [deferredPincode]);

  function updateFilter(key, value) {
    startTransition(() => {
      setFilters((current) => ({ ...current, [key]: value, ...(key !== "page" ? { page: 1 } : {}) }));
    });
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage text={text} toggleLang={toggleLang} homeData={homeData} workers={workers} pagination={pagination} filters={filters} updateFilter={updateFilter} homeState={homeState} workerState={workerState} setFilters={setFilters} locationSuggestions={locationSuggestions} setLocationSuggestions={setLocationSuggestions} />} />
      <Route path="/join" element={<JoinPage text={text} toggleLang={toggleLang} />} />
      <Route path="/workers/:id" element={<WorkerDetailPage text={text} toggleLang={toggleLang} />} />
    </Routes>
  );
}

function HomePage({
  text, toggleLang, homeData, workers, pagination, filters, updateFilter, homeState, workerState,
  setFilters, locationSuggestions, setLocationSuggestions,
}) {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span className="eyebrow">{text.badge}</span>
            <button className="lang-toggle" onClick={toggleLang} type="button">{text.langToggle}</button>
          </div>
          <div className="brand-lockup"><span className="brand-mark">F</span><span className="brand-name">{text.brand}</span></div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="search-card">
          <label><span>{text.searchLabel}</span><input value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="Plumber, cleaner, Niyas..." /></label>
          <div className="location-autocomplete">
            <label>
              <span>{text.pincodeLabel}</span>
              <input value={filters.pincode} onChange={(e) => updateFilter("pincode", e.target.value)} placeholder="673633" autoComplete="off" />
            </label>
            {locationSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {locationSuggestions.map((loc) => (
                  <li key={loc.id}>
                    <button type="button" onClick={() => { updateFilter("pincode", loc.pincode); setLocationSuggestions([]); }}>
                      <span>{loc.display_name}</span><strong>{loc.pincode}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="toggle-row">
            <button className={filters.verified ? "toggle active" : "toggle"} onClick={() => updateFilter("verified", !filters.verified)} type="button">{text.verifiedOnly}</button>
            <button className={filters.available ? "toggle active" : "toggle"} onClick={() => updateFilter("available", !filters.available)} type="button">{text.availableOnly}</button>
          </div>
          <button className="ghost-button" onClick={() => setFilters({ category: "", pincode: "", search: "", verified: false, available: false })} type="button">{text.clearFilters}</button>
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

      <section className="join-banner">
        <div>
          <h2>{text.joinBanner}</h2>
          <p>{text.joinBannerSub}</p>
        </div>
        <Link to="/join" className="join-button">{text.joinButton}</Link>
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
                  {worker.is_verified
                    ? <span className="verified-chip">{text.verified}</span>
                    : <span className="pending-chip">Pending</span>}
                </div>
                <div className="meta-row"><span>{worker.average_rating >= 4.5 ? "🔥 Top Rated" : worker.average_rating ? `${worker.average_rating}/5` : text.newBadge}</span><span className={worker.availability_status ? "status available" : "status unavailable"}>{worker.availability_status ? text.available : text.unavailable}</span></div>
                <div className="action-row">
                  <a href={worker.call_url} className="action-button call-button">{text.call}</a>
                  <a href={worker.whatsapp_url} className="action-button whatsapp-button" target="_blank" rel="noreferrer">{text.whatsapp}</a>
                </div>
                <Link to={`/workers/${worker.id}`} className="profile-link">{text.viewProfile}</Link>
              </article>
            ))}
          </div>
        )}
        {pagination.count > 20 && (
          <div className="pagination-row">
            <button className="ghost-button" disabled={!pagination.previous} onClick={() => updateFilter("page", (pagination.page ?? 1) - 1)} type="button">← Prev</button>
            <span className="page-info">Page {pagination.page ?? 1} · {pagination.count} workers</span>
            <button className="ghost-button" disabled={!pagination.next} onClick={() => updateFilter("page", (pagination.page ?? 1) + 1)} type="button">Next →</button>
          </div>
        )}
      </section>
    </main>
  );
}

function JoinPage({ text, toggleLang }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [submission, setSubmission] = useState(emptySubmission);
  const [submissionState, setSubmissionState] = useState({ loading: false, error: "", success: "" });

  useEffect(() => {
    requestJson("/categories/").then(setCategories).catch(() => {});
  }, []);

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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
        <button className="ghost-button back-button" onClick={() => navigate("/")} type="button">{text.backToHome}</button>
        <button className="lang-toggle" onClick={toggleLang} type="button">{text.langToggle}</button>
      </div>
        <div className="panel join-copy">
          <div className="brand-lockup"><span className="brand-mark">F</span><span className="brand-name">{text.brand}</span></div>
          <h2>{text.joinTitle}</h2>
          <p>{text.joinHint}</p>
          <div className="submission-steps">
            <p>1. Fill in your contact and service details.</p>
            <p>2. Your request stays pending for review.</p>
            <p>3. Once approved, your listing goes live.</p>
          </div>
        </div>
        <div className="panel">
          <form className="submission-form" onSubmit={handleSubmit}>
            <div className="form-grid two-up">
              <label><span>{text.submissionName}</span><input required value={submission.name} onChange={(e) => updateSubmission("name", e.target.value)} /></label>
              <label><span>{text.submissionPhone}</span><input required value={submission.phone_number} onChange={(e) => updateSubmission("phone_number", e.target.value)} /></label>
            </div>
            <label><span>{text.submissionCategory}</span><select required value={submission.category} onChange={(e) => updateSubmission("category", e.target.value)}><option value="">{text.selectCategory}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <div className="form-grid three-up">
              <label><span>{text.submissionCity}</span><input required value={submission.city} onChange={(e) => updateSubmission("city", e.target.value)} /></label>
              <label><span>{text.submissionArea}</span><input required value={submission.area_name} onChange={(e) => updateSubmission("area_name", e.target.value)} /></label>
              <label><span>{text.submissionPincode}</span><input required value={submission.pincode} onChange={(e) => updateSubmission("pincode", e.target.value)} /></label>
            </div>
            <label><span>{text.submissionDescription}</span><textarea rows="4" value={submission.service_description} onChange={(e) => updateSubmission("service_description", e.target.value)} placeholder="Emergency plumbing, wiring, painting, home cleaning..." /></label>
            <label className="checkbox-row"><input type="checkbox" checked={submission.availability_status} onChange={(e) => updateSubmission("availability_status", e.target.checked)} /><span>{text.submissionAvailability}</span></label>
            <label className="checkbox-row"><input type="checkbox" checked={submission.consent_to_contact} onChange={(e) => updateSubmission("consent_to_contact", e.target.checked)} /><span>{text.submissionConsent}</span></label>
            {submissionState.error ? <p className="form-message error">{submissionState.error}</p> : null}
            {submissionState.success ? <p className="form-message success">{submissionState.success}</p> : null}
            <button className="submit-button" disabled={submissionState.loading} type="submit">{submissionState.loading ? text.submitting : text.submit}</button>
          </form>
        </div>
    </main>
  );
}

function WorkerDetailPage({ text, toggleLang }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });
  const [rating, setRating] = useState(0);
  const [ratingState, setRatingState] = useState({ loading: false, error: "", success: "" });

  useEffect(() => {
    const controller = new AbortController();
    requestJson(`/workers/${id}/`, { signal: controller.signal })
      .then((data) => {
        setWorker(data);
        setState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setState({ loading: false, error: text.error });
      });
    return () => controller.abort();
  }, [id]);

  async function handleRating(event) {
    event.preventDefault();
    if (!rating) return;
    try {
      setRatingState({ loading: true, error: "", success: "" });
      const data = await requestJson(`/workers/${id}/ratings/`, { method: "POST", body: { rating } });
      setWorker((w) => ({ ...w, average_rating: data.average_rating }));
      setRating(0);
      setRatingState({ loading: false, error: "", success: text.ratingSuccess });
    } catch (error) {
      setRatingState({ loading: false, error: error.message || text.ratingError, success: "" });
    }
  }

  if (state.loading) return <main className="app-shell"><p className="state-copy">{text.loading}</p></main>;
  if (state.error) return <main className="app-shell"><p className="state-copy error">{state.error}</p></main>;
  if (!worker) return null;

  return (
    <main className="app-shell">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
        <button className="ghost-button back-button" onClick={() => navigate(-1)} type="button">{text.backToHome}</button>
        <button className="lang-toggle" onClick={toggleLang} type="button">{text.langToggle}</button>
      </div>
      <div className="detail-grid">
        <div className="panel detail-main">
          <div className="worker-topline">
            <div>
              <h2>{worker.name}</h2>
              <p>{worker.category.name} · {worker.location.display_name} · {worker.location.pincode}</p>
            </div>
            {worker.is_verified
              ? <span className="verified-chip">{text.verified}</span>
              : <span className="pending-chip">Pending</span>}
          </div>
          <div className="meta-row">
            <span>{worker.average_rating ? `⭐ ${worker.average_rating}/5` : text.newBadge}</span>
            <span className={worker.availability_status ? "status available" : "status unavailable"}>
              {worker.availability_status ? text.available : text.unavailable}
            </span>
          </div>
          <div className="action-row">
            <a href={worker.call_url} className="action-button call-button">{text.call}</a>
            <a href={worker.whatsapp_url} className="action-button whatsapp-button" target="_blank" rel="noreferrer">{text.whatsapp}</a>
          </div>
        </div>

        <div className="panel">
          <h3>{text.serviceDescription}</h3>
          <p className="detail-description">
            {worker.service_description || text.noDescription}
          </p>
        </div>

        <div className="panel">
          <h3>{text.rateWorker}</h3>
          <form className="rating-form" onSubmit={handleRating}>
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${rating >= star ? "active" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            {ratingState.error ? <p className="form-message error">{ratingState.error}</p> : null}
            {ratingState.success ? <p className="form-message success">{ratingState.success}</p> : null}
            <button className="submit-button" disabled={!rating || ratingState.loading} type="submit">
              {ratingState.loading ? text.submitting : text.submitRating}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }) {
  return <article className={`stat-card ${accent}`}><span>{label}</span><strong>{value}</strong></article>;
}

export default App;
