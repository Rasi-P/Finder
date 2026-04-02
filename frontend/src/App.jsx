import { startTransition, useCallback, useDeferredValue, useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const WORKER_PHONE_STORAGE_KEY = "finder_worker_phone";

const translations = {
  en: {
    helpTitle: "How it works",
    helpUserTitle: "👤 Finding a worker",
    helpUserSteps: [
      "Search by service (Plumber, Electrician...) or worker name.",
      "Enter your pincode or tap 'Use my location'.",
      "Tap a nearby area to filter workers in that zone — the selected area will highlight.",
      "Filter by Verified or Available now.",
      "Tap Call or WhatsApp to contact directly — no login needed.",
    ],
    helpWorkerTitle: "🔧 Getting listed as a worker",
    helpWorkerSteps: [
      "Tap 'Register as a Worker'.",
      "Fill in your name, phone, service category and location.",
      "Submit — your listing goes live immediately.",
      "After admin review you get a Verified badge.",
    ],
    helpClose: "Got it!",
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
    useMyLocation: "Use my location",
    locating: "Locating...",
    currentLocation: "Current location",
    nearbyAreas: "Nearby areas",
    locationError: "Could not detect location.",
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
    statusTitle: "Your listing status",
    statusPending: "Pending approval — we are reviewing your details.",
    statusApproved: "Approved — your listing is verified in the directory.",
    statusRejected: "Not approved — if this looks wrong, try submitting again or contact support.",
    statusRefresh: "Refresh status",
    statusHint: "We remember the number you used last so you can check back after refresh.",
    statusLookupError: "Could not load status for this number.",
    viewOrEditListing: "View or update your listing →",
    editListing: "Update my listing",
    editListingHint: "Enter the phone number you registered with. We use it instead of a password.",
    editPhoneConfirm: "Registered phone (verification)",
    saveListing: "Save changes",
    listingUpdated: "Your listing was updated.",
    listingUpdateError: "Could not update. Check that your phone matches this listing.",
    removeListing: "Remove my listing",
    removeListingHint: "This removes your contact from the public directory.",
    deleteConfirmPhone: "Your phone number to confirm",
    deleteListing: "Delete my listing",
    listingDeleteError: "Could not delete. Check your phone number.",
    cancelEdit: "Close",
  },
  ml: {
    helpTitle: "എങ്ങനെ ഉപയോഗിക്കാം",
    helpUserTitle: "👤 സേവനം തേടുന്നവർക്ക്",
    helpUserSteps: [
      "സേവനം അല്ലെങ്കിൽ തൊഴിലാളിയുടെ പേര് തിരയൂ.",
      "പിൻകോഡ് നൽകൂ അല്ലെങ്കിൽ 'എന്റെ സ്ഥാനം ഉപയോഗിക്കൂ' ടാപ്പ് ചെയ്യൂ.",
      "അടുത്തുള്ള പ്രദേശം ടാപ്പ് ചെയ്ത് ആ പ്രദേശത്തെ തൊഴിലാളികൾ ഫിൽടർ ചെയ്യൂ — തിരഞ്ഞെടുത്ത പ്രദേശം ഹൈലൈറ് ആകും.",
      "സ്ഥിരീകരിച്ചത് / ലഭ്യം ഫിൽട്ടർ ഉപയോഗിക്കൂ.",
      "Call അല്ലെങ്കിൽ WhatsApp ടാപ്പ് ചെയ്ത് നേരിട്ട് ബന്ധപ്പെടൂ.",
    ],
    helpWorkerTitle: "🔧 തൊഴിലാളികൾക്ക്",
    helpWorkerSteps: [
      "'തൊഴിലാളിയായി രജിസ്റ്റർ ചെയ്യൂ' ടാപ്പ് ചെയ്യൂ.",
      "പേര്, ഫോൺ, സേവനം, സ്ഥലം നൽകൂ.",
      "സമർപ്പിക്കൂ — ലിസ്റ്റിംഗ് ഉടൻ ലൈവ് ആകും.",
      "അഡ്മിൻ അവലോകനത്തിന് ശേഷം 'സ്ഥിരീകരിച്ചത്' ബാഡ്ജ് ലഭിക്കും.",
    ],
    helpClose: "മനസ്സിലായി!",
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
    useMyLocation: "എന്റെ സ്ഥാനം ഉപയോഗിക്കൂ",
    locating: "കണ്ടെത്തുന്നു...",
    currentLocation: "നിലവിലെ സ്ഥാനം",
    nearbyAreas: "അടുത്തുള്ള പ്രദേശങ്ങൾ",
    locationError: "സ്ഥാനം കണ്ടെത്താൻ കഴിഞ്ഞില്ല.",
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
    statusTitle: "നിങ്ങളുടെ ലിസ്റ്റിംഗ് നില",
    statusPending: "അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു — ഞങ്ങൾ നിങ്ങളുടെ വിവരങ്ങൾ പരിശോധിക്കുന്നു.",
    statusApproved: "അംഗീകരിച്ചു — നിങ്ങളുടെ ലിസ്റ്റിംഗ് ഡയറക്ടറിയിൽ സ്ഥിരീകരിച്ചു.",
    statusRejected: "അംഗീകരിച്ചില്ല — തെറ്റാണെന്ന് തോന്നുന്നുവെങ്കിൽ വീണ്ടும் സമർപ്പിക്കുക അല്ലെങ്കിൽ പിന്തുണയുമായി ബന്ധപ്പെടുക.",
    statusRefresh: "നില പുതുക്കുക",
    statusHint: "നിങ്ങൾ അവസാനം ഉപയോഗിച്ച നമ്പർ ഞങ്ങൾ ഓർക്കുന്നു; പുതുക്കിയതിന് ശേഷവും പരിശോധിക്കാം.",
    statusLookupError: "ഈ നമ്പറിനായുള്ള നില ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.",
    viewOrEditListing: "ലിസ്റ്റിംഗ് കാണുക അല്ലെങ്കിൽ നവീകരിക്കുക →",
    editListing: "എന്റെ ലിസ്റ്റിംഗ് നവീകരിക്കുക",
    editListingHint: "രജിസ്റ്റർ ചെയ്ത ഫോൺ നമ്പർ നൽകുക. പാസ്‌വേഡിന് പകരം ഇത് ഉപയോഗിക്കുന്നു.",
    editPhoneConfirm: "രജിസ്റ്റർ ചെയ്ത ഫോൺ (സ്ഥിരീകരണം)",
    saveListing: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
    listingUpdated: "ലിസ്റ്റിംഗ് പുതുക്കി.",
    listingUpdateError: "പുതുക്കാൻ കഴിഞ്ഞില്ല. ഫോൺ ഈ ലിസ്റ്റിംഗുമായി പൊരുത്തപ്പെടുന്നുവെന്ന് പരിശോധിക്കുക.",
    removeListing: "എന്റെ ലിസ്റ്റിംഗ് നീക്കം ചെയ്യുക",
    removeListingHint: "പൊതു ഡയറക്ടറിയിൽ നിന്ന് നിങ്ങളുടെ കോൺടാക്റ്റ് നീക്കം ചെയ്യും.",
    deleteConfirmPhone: "സ്ഥിരീകരിക്കാൻ നിങ്ങളുടെ ഫോൺ",
    deleteListing: "ലിസ്റ്റിംഗ് ഡിലീറ്റ് ചെയ്യുക",
    listingDeleteError: "ഡിലീറ്റ് ചെയ്യാൻ കഴിഞ്ഞില്ല. ഫോൺ പരിശോധിക്കുക.",
    cancelEdit: "അടയ്ക്കുക",
  },
};

const emptySubmission = {
  name: "",
  name_ml: "",
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
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });

  if (response.status === 204) {
    return null;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(findError(payload) || `Request failed with status ${response.status}`);
  }

  return payload;
}

function trackEngagement(path) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json" },
  }).catch(() => {});
}

function trackCallThenNavigate(workerId, telUrl) {
  void trackEngagement(`/workers/${workerId}/track-call/`).finally(() => {
    window.location.href = telUrl;
  });
}

function trackWhatsAppThenOpen(workerId, waUrl) {
  void trackEngagement(`/workers/${workerId}/track-whatsapp/`).finally(() => {
    window.open(waUrl, "_blank", "noopener,noreferrer");
  });
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
    if (key === "category") {
      setTimeout(() => {
        document.getElementById("available-workers")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage lang={lang} text={text} toggleLang={toggleLang} homeData={homeData} workers={workers} pagination={pagination} filters={filters} updateFilter={updateFilter} homeState={homeState} workerState={workerState} setFilters={setFilters} locationSuggestions={locationSuggestions} setLocationSuggestions={setLocationSuggestions} />} />
      <Route path="/join" element={<JoinPage lang={lang} text={text} toggleLang={toggleLang} />} />
      <Route path="/workers/:id" element={<WorkerDetailPage lang={lang} text={text} toggleLang={toggleLang} />} />
    </Routes>
  );
}

function MobileNav({ text, toggleLang }) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <nav className="mobile-bottom-nav">
      <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={isHome ? "active" : ""}>
        <span className="nav-icon">🏠</span>
        <span>Home</span>
      </Link>
      <button type="button" onClick={toggleLang}>
        <span className="nav-icon">🌐</span>
        <span>{text.langToggle}</span>
      </button>
      <a href="#popular-services">
        <span className="nav-icon">🔧</span>
        <span>Services</span>
      </a>
      <a href="#available-workers">
        <span className="nav-icon">👷</span>
        <span>Workers</span>
      </a>
    </nav>
  );
}

function HomePage({
  lang, text, toggleLang, homeData, workers, pagination, filters, updateFilter, homeState, workerState,
  setFilters, locationSuggestions, setLocationSuggestions,
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpVisible, setHelpVisible] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY > 400;
      setHelpVisible(!scrolled);
      setShowScrollTop(scrolled);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="app-shell">
      {helpOpen && <HelpDesk text={text} onClose={() => setHelpOpen(false)} />}
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
          <label><span>{text.searchLabel}</span><div className="field-wrap"><span className="field-icon"><Search size={16} /></span><input value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} placeholder={lang === "ml" ? "പ്ലംബർ, ക്ലീനർ, പേര്..." : "Plumber, cleaner, Name..."} /></div></label>
          <div className="location-autocomplete">
            <label>
              <span>{text.pincodeLabel}</span>
              <div className="field-wrap"><span className="field-icon"><MapPin size={16} /></span><input value={filters.pincode} onChange={(e) => updateFilter("pincode", e.target.value)} placeholder="673633" autoComplete="off" /></div>
            </label>
            {locationSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {locationSuggestions.map((loc) => (
                  <li key={loc.id}>
                    <button type="button" onClick={() => { updateFilter("pincode", loc.pincode); setLocationSuggestions([]); }}>
                      <span>{lang === "ml" ? (loc.display_name_ml || loc.display_name) : loc.display_name}</span><strong>{loc.pincode}</strong>
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
          <a href="#available-workers" className="find-workers-btn">{lang === "ml" ? "തൊഴിലാളികളെ കണ്ടെത്തൂ →" : "Find Workers →"}</a>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label={text.statsCategories} value={homeData.stats.categories} accent="sun" />
        <StatCard label={text.statsLocations} value={homeData.stats.locations} accent="mint" />
        <StatCard label={text.statsWorkers} value={homeData.stats.workers} accent="peach" />
        <StatCard label={text.statsVerified} value={homeData.stats.verified_workers} accent="ink" />
      </section>

      <section className="content-grid" id="popular-services">
        <div className="panel">
          <div className="section-heading"><div><h2>{text.categoriesTitle}</h2><p>{text.categoriesHint}</p></div></div>
          <div className="category-grid">
            <button className={filters.category === "" ? "category-pill active" : "category-pill"} onClick={() => updateFilter("category", "")} type="button"><span>{text.allServices}</span></button>
            {homeData.categories.map((category) => (
              <button key={category.id} className={filters.category === category.name ? "category-pill active" : "category-pill"} onClick={() => updateFilter("category", category.name)} type="button">
                {category.icon_url ? <img src={category.icon_url} alt="" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='inline-grid'; }} /> : null}<span className="icon-fallback" style={category.icon_url ? {display:'none'} : {}}>+</span>
                <span>{lang === "ml" && category.name_ml ? category.name_ml : category.name}</span>
                <strong>{category.worker_count}</strong>
              </button>
            ))}
          </div>
        </div>
        <NearbyLocationsPanel lang={lang} text={text} updateFilter={updateFilter} defaultLocations={homeData.locations} filters={filters} />
      </section>

      <section className="join-banner">
        <div>
          <h2>{text.joinBanner}</h2>
          <p>{text.joinBannerSub}</p>
        </div>
        <Link to="/join" className="join-button">{text.joinButton}</Link>
      </section>

      <Link to="/join" className="mobile-fab">➕ Register as a Worker</Link>
      {helpVisible && <button type="button" className="help-fab" onClick={() => setHelpOpen(true)}>?</button>}
      {showScrollTop && (
        <button type="button" className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>
      )}
      <MobileNav text={text} toggleLang={toggleLang} />

      <section className="results-panel" id="available-workers">
        <div className="section-heading"><div><h2>{text.resultsTitle}</h2><p>{text.resultsHint}</p></div></div>
        {homeState.loading || workerState.loading ? <p className="state-copy">{text.loading}</p> : null}
        {homeState.error || workerState.error ? <p className="state-copy error">{homeState.error || workerState.error}</p> : null}
        {!homeState.loading && !workerState.loading && workers.length === 0 ? <p className="state-copy">{text.noResults}</p> : (
          <div className="worker-grid">
            {workers.map((worker) => (
              <article key={worker.id} className="worker-card">
                <div className="worker-topline">
                  <div><h3>{lang === "ml" && worker.name_ml ? worker.name_ml : worker.name}</h3><p>{lang === "ml" && worker.category.name_ml ? worker.category.name_ml : worker.category.name} - {lang === "ml" ? (worker.location.display_name_ml || worker.location.display_name) : worker.location.display_name}</p></div>
                  {worker.is_verified
                    ? <span className="verified-chip">{text.verified}</span>
                    : <span className="pending-chip">Pending</span>}
                </div>
                <div className="meta-row"><span>{worker.average_rating >= 4.5 ? "🔥 Top Rated" : worker.average_rating ? `${worker.average_rating}/5` : text.newBadge}</span><span className={worker.availability_status ? "status available" : "status unavailable"}>{worker.availability_status ? text.available : text.unavailable}</span></div>
                <div className="action-row">
                  <button type="button" className="action-button call-button" onClick={() => trackCallThenNavigate(worker.id, worker.call_url)}>{text.call}</button>
                  <button type="button" className="action-button whatsapp-button" onClick={() => trackWhatsAppThenOpen(worker.id, worker.whatsapp_url)}>{text.whatsapp}</button>
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

async function fetchPincodeData(pincode) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data[0]?.Status === "Success") {
      const offices = data[0].PostOffice;
      const city = offices[0]?.District || offices[0]?.Division || "";
      const areas = [...new Set(offices.map((o) => o.Name))];
      return { city, areas };
    }
  } catch {}
  return null;
}

async function transliterate(text) {
  try {
    const res = await fetch(
      `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=ml-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`
    );
    const data = await res.json();
    return data?.[1]?.[0]?.[1]?.[0] || "";
  } catch {
    return "";
  }
}

function JoinPage({ lang, text, toggleLang }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [submission, setSubmission] = useState(emptySubmission);
  const [submissionState, setSubmissionState] = useState({ loading: false, error: "", success: "" });
  const [pincodeAreas, setPincodeAreas] = useState([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [trackedPhone, setTrackedPhone] = useState(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem(WORKER_PHONE_STORAGE_KEY) || "" : ""
  );
  const [submissionStatus, setSubmissionStatus] = useState({
    loading: false,
    error: "",
    data: null,
  });

  const loadSubmissionStatus = useCallback(
    async (phone) => {
      const trimmed = (phone || "").trim();
      if (!trimmed) {
        setSubmissionStatus({ loading: false, error: "", data: null });
        return;
      }
      setSubmissionStatus((s) => ({ ...s, loading: true, error: "" }));
      try {
        const data = await requestJson("/submission-status/", { params: { phone: trimmed } });
        setSubmissionStatus({ loading: false, error: "", data });
      } catch (error) {
        setSubmissionStatus({
          loading: false,
          error: error.message || text.statusLookupError,
          data: null,
        });
      }
    },
    [text.statusLookupError]
  );

  useEffect(() => {
    requestJson("/categories/").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadSubmissionStatus(trackedPhone);
  }, [trackedPhone, loadSubmissionStatus]);

  function updateSubmission(key, value) {
    setSubmission((current) => ({ ...current, [key]: value }));
  }

  async function handlePincodeChange(pincode) {
    updateSubmission("pincode", pincode);
    updateSubmission("city", "");
    updateSubmission("area_name", "");
    setPincodeAreas([]);
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setPincodeLoading(true);
      const result = await fetchPincodeData(pincode);
      setPincodeLoading(false);
      if (result) {
        updateSubmission("city", result.city);
        updateSubmission("area_name", result.areas[0] || "");
        setPincodeAreas(result.areas);
      } else {
        updateSubmission("city", "");
        updateSubmission("area_name", "");
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const phoneUsed = submission.phone_number;
    try {
      setSubmissionState({ loading: true, error: "", success: "" });
      const response = await requestJson("/worker-submissions/", {
        method: "POST",
        body: { ...submission, category: Number(submission.category) },
      });
      setSubmission(emptySubmission);
      const phoneForTracking = (response.phone_number || phoneUsed).trim();
      if (phoneForTracking) {
        localStorage.setItem(WORKER_PHONE_STORAGE_KEY, phoneForTracking);
        setTrackedPhone(phoneForTracking);
      }
      setSubmissionState({ loading: false, error: "", success: response.message || text.submitSuccess });
    } catch (error) {
      setSubmissionState({ loading: false, error: error.message || text.submitDefaultError, success: "" });
    }
  }

  const statusMessage =
    submissionStatus.data?.status === "pending"
      ? text.statusPending
      : submissionStatus.data?.status === "approved"
        ? text.statusApproved
        : submissionStatus.data?.status === "rejected"
          ? text.statusRejected
          : "";

  return (
    <main className="app-shell">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",padding:"12px 12px 0"}}>
        <button className="ghost-button back-button" onClick={() => navigate("/")} type="button">{text.backToHome}</button>
        <button className="lang-toggle" onClick={toggleLang} type="button">{text.langToggle}</button>
      </div>
      <MobileNav text={text} toggleLang={toggleLang} />
      <div className="join-grid">
        <div className="panel join-copy">
          <div className="brand-lockup"><span className="brand-mark">F</span><span className="brand-name">{text.brand}</span></div>
          <h2>{text.joinTitle}</h2>
          <p>{text.joinHint}</p>
          {trackedPhone ? (
            <div className="submission-status-panel">
              <h3 className="status-heading">{text.statusTitle}</h3>
              <p className="status-phone-note">{text.statusHint}</p>
              {submissionStatus.loading ? <p className="state-copy">{text.loading}</p> : null}
              {submissionStatus.error ? <p className="form-message error">{submissionStatus.error}</p> : null}
              {!submissionStatus.loading && submissionStatus.data ? (
                <p className={`form-message ${submissionStatus.data.status === "approved" ? "success" : submissionStatus.data.status === "rejected" ? "error" : ""}`}>
                  {statusMessage}
                </p>
              ) : null}
              <button
                className="ghost-button"
                type="button"
                disabled={submissionStatus.loading || !trackedPhone}
                onClick={() => loadSubmissionStatus(trackedPhone)}
              >
                {text.statusRefresh}
              </button>
              {submissionStatus.data?.worker_id ? (
                <p style={{ marginTop: 12 }}>
                  <Link to={`/workers/${submissionStatus.data.worker_id}`} className="profile-link">
                    {text.viewOrEditListing}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="submission-steps">
            <p>{lang === "ml" ? "1. നിങ്ങളുടെ വിവരങ്ങൾ പൂരിപ്പിക്കൂ." : "1. Fill in your contact and service details."}</p>
            <p>{lang === "ml" ? "2. അവലോകനത്തിനായി കാത്തിരിക്കൂ." : "2. Your request stays pending for review."}</p>
            <p>{lang === "ml" ? "3. അംഗീകരിച്ചാൽ ലിസ്റ്റിംഗ് ലൈവ് ആകും." : "3. Once approved, your listing goes live."}</p>
          </div>
        </div>
        <div className="panel">
          <form className="submission-form" onSubmit={handleSubmit}>
            <div className="form-grid two-up">
              <label><span>{lang === "ml" ? "പേര്‍ (ഇംഗ്ലീഷ്)" : "Name (English)"}</span><input value={submission.name} onChange={(e) => updateSubmission("name", e.target.value)} onBlur={async (e) => { if (e.target.value && !submission.name_ml) { const ml = await transliterate(e.target.value); if (ml) updateSubmission("name_ml", ml); } }} placeholder="Your name" /></label>
              <label><span>{lang === "ml" ? "പേര്‍ (മലയാളം)" : "പേര്‍ (മലയാളം)"}</span><input value={submission.name_ml} onChange={(e) => updateSubmission("name_ml", e.target.value)} onBlur={async (e) => { if (e.target.value && !submission.name) { updateSubmission("name", e.target.value); } }} placeholder="നിങ്ങളുടെ പേര്" /></label>
            </div>
            <label><span>{text.submissionPhone}</span><input required value={submission.phone_number} onChange={(e) => updateSubmission("phone_number", e.target.value)} /></label>
            <label><span>{text.submissionCategory}</span><select required value={submission.category} onChange={(e) => updateSubmission("category", e.target.value)}><option value="">{text.selectCategory}</option>{categories.map((c) => <option key={c.id} value={c.id}>{lang === "ml" && c.name_ml ? c.name_ml : c.name}</option>)}</select></label>
            <div className="form-grid three-up">
              <label>
                <span>{text.submissionPincode}</span>
                <input required value={submission.pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder={lang === "ml" ? "6 അക്ക പിൻകോഡ്" : "6-digit pincode"} maxLength={6} />
                {pincodeLoading ? <span style={{fontSize:"0.8rem",color:"var(--muted)"}}>{lang === "ml" ? "പിൻകോഡ് തിരയുന്നു..." : "Looking up pincode..."}</span> : null}
              </label>
              <label>
                <span>{text.submissionCity}</span>
                <input required value={submission.city} onChange={(e) => updateSubmission("city", e.target.value)} placeholder={lang === "ml" ? "നഗരം" : "City"} />
              </label>
              <label>
                <span>{text.submissionArea}</span>
                {pincodeAreas.length > 1
                  ? <select required value={submission.area_name} onChange={(e) => updateSubmission("area_name", e.target.value)}>
                      {pincodeAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  : <input required value={submission.area_name} onChange={(e) => updateSubmission("area_name", e.target.value)} placeholder={lang === "ml" ? "പ്രദേശം" : "Area"} />}
              </label>
            </div>
            <label><span>{text.submissionDescription}</span><textarea rows="4" value={submission.service_description} onChange={(e) => updateSubmission("service_description", e.target.value)} placeholder={lang === "ml" ? "അടിയന്തര പ്ലംബിംഗ്, വൈയരിംഗ്, പെയിന്റിംഗ്..." : "Emergency plumbing, wiring, painting, home cleaning..."} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={submission.availability_status} onChange={(e) => updateSubmission("availability_status", e.target.checked)} /><span>{text.submissionAvailability}</span></label>
            <label className="checkbox-row"><input type="checkbox" checked={submission.consent_to_contact} onChange={(e) => updateSubmission("consent_to_contact", e.target.checked)} /><span>{text.submissionConsent}</span></label>
            {submissionState.error ? <p className="form-message error">{submissionState.error}</p> : null}
            {submissionState.success ? <p className="form-message success">{submissionState.success}</p> : null}
            <button className="submit-button" disabled={submissionState.loading} type="submit">{submissionState.loading ? text.submitting : text.submit}</button>
          </form>
        </div>
      </div>
    </main>
  );
}

function WorkerDetailPage({ lang, text, toggleLang }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });
  const [rating, setRating] = useState(0);
  const [ratingState, setRatingState] = useState({ loading: false, error: "", success: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [ownerForm, setOwnerForm] = useState(null);
  const [ownerState, setOwnerState] = useState({ loading: false, error: "", success: "" });
  const [deletePhone, setDeletePhone] = useState("");
  const [deleteState, setDeleteState] = useState({ loading: false, error: "" });
  const [editPincodeAreas, setEditPincodeAreas] = useState([]);
  const [editPincodeLoading, setEditPincodeLoading] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const storedPhone = typeof localStorage !== "undefined" ? localStorage.getItem(WORKER_PHONE_STORAGE_KEY) || "" : "";

  const fetchPendingUpdate = useCallback(() => {
    if (!storedPhone) return Promise.resolve(null);
    return requestJson(`/workers/${id}/pending-update/`, { params: { phone: storedPhone } })
      .then((r) => r.pending)
      .catch(() => null);
  }, [id, storedPhone]);

  const fetchWorker = useCallback(() => {
    const params = storedPhone ? { phone: storedPhone, _: Date.now() } : { _: Date.now() };
    return requestJson(`/workers/${id}/`, { params })
      .then((data) => {
        setWorker(data);
        setState({ loading: false, error: "" });
        setOwnerForm((prev) => prev ? {
          ...prev,
          name: data.name,
          category: String(data.category.id),
          availability_status: data.availability_status,
          city: data.location.city,
          area_name: data.location.area_name,
          pincode: data.location.pincode,
          service_description: data.service_description || "",
        } : prev);
      })
      .catch((error) => { setState({ loading: false, error: error.message || text.error }); });
  }, [id, storedPhone, text.error]);

  useEffect(() => {
    const controller = new AbortController();
    const params = storedPhone ? { phone: storedPhone } : {};
    requestJson(`/workers/${id}/`, { params, signal: controller.signal })
      .then((data) => {
        setWorker(data);
        setState({ loading: false, error: "" });
        // Fetch pending update if this is the owner
        if (storedPhone) {
          requestJson(`/workers/${id}/pending-update/`, { params: { phone: storedPhone } })
            .then((r) => setPendingUpdate(r.pending))
            .catch(() => setPendingUpdate(null));
        } else {
          setPendingUpdate(null);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") setState({ loading: false, error: error.message || text.error });
      });
    return () => controller.abort();
  }, [id]);

  // Poll every 5s always; when pending transitions to null, re-fetch worker
  useEffect(() => {
    if (!storedPhone) return;
    let lastPending = pendingUpdate;
    const interval = setInterval(async () => {
      const pending = await fetchPendingUpdate();
      setPendingUpdate(pending);
      if (lastPending && !pending) {
        fetchWorker();
      }
      lastPending = pending;
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPendingUpdate, fetchWorker, storedPhone]);

  useEffect(() => {
    if (!editOpen) return;
    requestJson("/categories/").then(setCategories).catch(() => {});
  }, [editOpen]);

  function openOwnerEdit() {
    if (!worker) return;
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(WORKER_PHONE_STORAGE_KEY) || "" : "";
    setOwnerForm({
      phoneConfirm: stored,
      name: worker.name,
      category: String(worker.category.id),
      availability_status: worker.availability_status,
      city: worker.location.city,
      area_name: worker.location.area_name,
      pincode: worker.location.pincode,
      service_description: worker.service_description || "",
    });
    setDeletePhone(stored);
    setOwnerState({ loading: false, error: "", success: "" });
    setDeleteState({ loading: false, error: "" });
    setEditOpen(true);
  }

  function updateOwnerForm(key, value) {
    setOwnerForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleEditPincodeChange(pincode) {
    updateOwnerForm("pincode", pincode);
    updateOwnerForm("city", "");
    updateOwnerForm("area_name", "");
    setEditPincodeAreas([]);
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      setEditPincodeLoading(true);
      const result = await fetchPincodeData(pincode);
      setEditPincodeLoading(false);
      if (result) {
        updateOwnerForm("city", result.city);
        updateOwnerForm("area_name", result.areas[0] || "");
        setEditPincodeAreas(result.areas);
      }
    }
  }

  async function handleOwnerSave(event) {
    event.preventDefault();
    if (!ownerForm) return;
    try {
      setOwnerState({ loading: true, error: "", success: "" });
      await requestJson(`/workers/${id}/self/`, {
        method: "PATCH",
        body: {
          phone_number: ownerForm.phoneConfirm.trim(),
          name: ownerForm.name,
          category: Number(ownerForm.category),
          availability_status: ownerForm.availability_status,
          city: ownerForm.city,
          area_name: ownerForm.area_name,
          pincode: ownerForm.pincode,
          service_description: ownerForm.service_description,
        },
      });
      setOwnerState({ loading: false, error: "", success: "Your changes have been submitted and are waiting for admin approval." });
      // Refresh pending update banner
      const pending = await fetchPendingUpdate();
      setPendingUpdate(pending);
    } catch (error) {
      setOwnerState({ loading: false, error: error.message || text.listingUpdateError, success: "" });
    }
  }

  async function handleOwnerDelete(event) {
    event.preventDefault();
    try {
      setDeleteState({ loading: true, error: "" });
      await requestJson(`/workers/${id}/self/`, {
        method: "DELETE",
        body: { phone_number: deletePhone.trim() },
      });
      localStorage.removeItem(WORKER_PHONE_STORAGE_KEY);
      navigate("/");
    } catch (error) {
      setDeleteState({ loading: false, error: error.message || text.listingDeleteError });
    }
  }

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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",padding:"12px 12px 0"}}>
        <button className="ghost-button back-button" onClick={() => navigate(-1)} type="button">{text.backToHome}</button>
        <button className="lang-toggle" onClick={toggleLang} type="button">{text.langToggle}</button>
      </div>
      <MobileNav text={text} toggleLang={toggleLang} />
      <div className="detail-grid" style={{padding:"0 12px"}}>
        <div className="panel detail-main">
          <div className="worker-topline">
            <div>
              <h2>{lang === "ml" && worker.name_ml ? worker.name_ml : worker.name}</h2>
              <p>{lang === "ml" && worker.category.name_ml ? worker.category.name_ml : worker.category.name} · {lang === "ml" ? (worker.location.display_name_ml || worker.location.display_name) : worker.location.display_name} · {worker.location.pincode}</p>
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
            <button type="button" className="action-button call-button" onClick={() => trackCallThenNavigate(worker.id, worker.call_url)}>{text.call}</button>
            <button type="button" className="action-button whatsapp-button" onClick={() => trackWhatsAppThenOpen(worker.id, worker.whatsapp_url)}>{text.whatsapp}</button>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="ghost-button" type="button" onClick={() => (editOpen ? setEditOpen(false) : openOwnerEdit())}>
              {editOpen ? text.cancelEdit : text.editListing}
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>{text.serviceDescription}</h3>
          <p className="detail-description">
            {worker.service_description || text.noDescription}
          </p>
        </div>

        {pendingUpdate ? (
          <div className="panel" style={{borderColor:"rgba(255,182,73,0.5)",background:"rgba(255,182,73,0.07)"}}>
            <p style={{fontWeight:600,marginBottom:10}}>⏳ Changes pending admin approval</p>
            <p style={{fontSize:"0.85rem",color:"var(--muted)",marginBottom:12}}>Your current listing stays unchanged until an admin approves the update below.</p>
            <div style={{display:"grid",gap:6,fontSize:"0.9rem"}}>
              {pendingUpdate.name && <span><strong>Name:</strong> {pendingUpdate.name}</span>}
              {pendingUpdate.category && <span><strong>Category:</strong> {pendingUpdate.category}</span>}
              {pendingUpdate.availability_status !== null && pendingUpdate.availability_status !== undefined && <span><strong>Availability:</strong> {pendingUpdate.availability_status ? "Available" : "Busy"}</span>}
              {pendingUpdate.pincode && <span><strong>Location:</strong> {pendingUpdate.area_name}, {pendingUpdate.city} - {pendingUpdate.pincode}</span>}
              {pendingUpdate.service_description && <span><strong>Description:</strong> {pendingUpdate.service_description}</span>}
            </div>
          </div>
        ) : null}

        {editOpen && ownerForm ? (
          <div className="panel submission-form">
            <h3>{text.editListing}</h3>
            <p className="detail-description" style={{ marginBottom: 16 }}>{text.editListingHint}</p>
            <form className="form-grid" onSubmit={handleOwnerSave}>
              <label><span>{text.editPhoneConfirm}</span><input required value={ownerForm.phoneConfirm} onChange={(e) => updateOwnerForm("phoneConfirm", e.target.value)} autoComplete="tel" /></label>
              <div className="form-grid two-up">
                <label><span>{text.submissionName}</span><input required value={ownerForm.name} onChange={(e) => updateOwnerForm("name", e.target.value)} /></label>
                <label><span>{text.submissionCategory}</span><select required value={ownerForm.category} onChange={(e) => updateOwnerForm("category", e.target.value)}><option value="">{text.selectCategory}</option>{categories.map((c) => <option key={c.id} value={c.id}>{lang === "ml" && c.name_ml ? c.name_ml : c.name}</option>)}</select></label>
              </div>
              <label className="checkbox-row"><input type="checkbox" checked={ownerForm.availability_status} onChange={(e) => updateOwnerForm("availability_status", e.target.checked)} /><span>{text.submissionAvailability}</span></label>
              <p style={{fontSize:"0.85rem",color:"var(--muted)",margin:"8px 0 4px",padding:"10px 12px",background:"rgba(255,182,73,0.1)",borderRadius:"10px",border:"1px solid rgba(255,182,73,0.3)"}}>
                ⚠️ Location changes need admin re-approval. Your current location stays active until approved.
              </p>
              <div className="form-grid three-up">
                <label>
                  <span>{text.submissionPincode}</span>
                  <input required value={ownerForm.pincode} onChange={(e) => handleEditPincodeChange(e.target.value)} maxLength={6} />
                  {editPincodeLoading ? <span style={{fontSize:"0.8rem",color:"var(--muted)"}}>Looking up pincode...</span> : null}
                </label>
                <label>
                  <span>{text.submissionCity}</span>
                  <input required value={ownerForm.city} readOnly style={{background:"var(--bg-deep)",cursor:"not-allowed"}} />
                </label>
                <label>
                  <span>{text.submissionArea}</span>
                  {editPincodeAreas.length > 1
                    ? <select required value={ownerForm.area_name} onChange={(e) => updateOwnerForm("area_name", e.target.value)}>
                        {editPincodeAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    : <input required value={ownerForm.area_name} readOnly style={{background:"var(--bg-deep)",cursor:"not-allowed"}} />}
                </label>
              </div>
              <label><span>{text.submissionDescription}</span><textarea rows={3} value={ownerForm.service_description} onChange={(e) => updateOwnerForm("service_description", e.target.value)} /></label>
              {ownerState.error ? <p className="form-message error">{ownerState.error}</p> : null}
              {ownerState.success ? <p className="form-message success">{ownerState.success}</p> : null}
              <button className="submit-button" disabled={ownerState.loading} type="submit">{ownerState.loading ? text.submitting : text.saveListing}</button>
            </form>
            <hr style={{ margin: "24px 0", border: 0, borderTop: "1px solid var(--line)" }} />
            <h3>{text.removeListing}</h3>
            <p className="detail-description">{text.removeListingHint}</p>
            <form onSubmit={handleOwnerDelete}>
              <label><span>{text.deleteConfirmPhone}</span><input required value={deletePhone} onChange={(e) => setDeletePhone(e.target.value)} autoComplete="tel" /></label>
              {deleteState.error ? <p className="form-message error">{deleteState.error}</p> : null}
              <button className="submit-button" style={{ background: "var(--warn)", marginTop: 12 }} disabled={deleteState.loading} type="submit">
                {deleteState.loading ? text.submitting : text.deleteListing}
              </button>
            </form>
          </div>
        ) : null}

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

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || "";
    const city = addr.city || addr.town || addr.county || "";
    // Try to get accurate pincode from India Post using the area name
    let pincode = addr.postcode || "";
    if (area) {
      try {
        const ipRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(area)}`);
        const ipData = await ipRes.json();
        if (ipData[0]?.Status === "Success") {
          const match = ipData[0].PostOffice.find((o) =>
            o.District?.toLowerCase() === city.toLowerCase() ||
            o.Division?.toLowerCase() === city.toLowerCase()
          ) || ipData[0].PostOffice[0];
          if (match?.Pincode) pincode = match.Pincode;
        }
      } catch {}
    }
    return { area, city, pincode };
  } catch {
    return null;
  }
}

function NearbyLocationsPanel({ lang, text, updateFilter, defaultLocations, filters }) {
  const [current, setCurrent] = useState(null); // { area, city, pincode }
  const [nearby, setNearby] = useState([]);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  async function loadNearby(pincode) {
    if (!pincode || pincode.length < 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0]?.Status === "Success") {
        const offices = data[0].PostOffice;
        const city = offices[0]?.District || offices[0]?.Division || "";
        let allOffices = [...offices];
        // Fetch more areas from the same city/district
        if (city) {
          try {
            const cityRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`);
            const cityData = await cityRes.json();
            if (cityData[0]?.Status === "Success") {
              allOffices = [...allOffices, ...cityData[0].PostOffice];
            }
          } catch {}
        }
        const unique = [...new Map(allOffices.map((o) => [o.Pincode, o])).values()];
        setNearby(unique.slice(0, 8).map((o) => ({
          id: o.Pincode,
          pincode: o.Pincode,
          display_name: `${o.Name}, ${city || o.District}`,
          display_name_ml: "",
        })));
      }
    } catch {}
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) { setError(text.locationError); return; }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        if (!result || !result.pincode) { setError(text.locationError); return; }
        setCurrent(result);
        updateFilter("pincode", result.pincode);
        await loadNearby(result.pincode);
      },
      () => { setLocating(false); setError(text.locationError); }
    );
  }

  const locationsToShow = nearby.length > 0 ? nearby : defaultLocations;

  return (
    <div className="panel">
      <div className="section-heading">
        <div><h2>{text.locationsTitle}</h2><p>{text.locationsHint}</p></div>
      </div>
      <button
        className={`location-btn${locating ? " locating" : ""}`}
        type="button"
        onClick={handleUseLocation}
        disabled={locating}
      >
        <span>📍</span>
        <span>{locating ? text.locating : text.useMyLocation}</span>
      </button>
      {error ? <p className="state-copy error" style={{ marginTop: 8 }}>{error}</p> : null}
      {current ? (
        <div className="current-location-card">
          <span className="current-location-label">{text.currentLocation}</span>
          <strong>{current.area}{current.city ? `, ${current.city}` : ""}</strong>
          <span className="current-pincode">{current.pincode}</span>
        </div>
      ) : null}
      {(current || nearby.length > 0) ? (
        <p className="nearby-label">{text.nearbyAreas}</p>
      ) : null}
      <div className="location-list">
        {locationsToShow.map((location) => (
          <button
            key={location.id ?? location.pincode}
            className={`location-card${filters.pincode === location.pincode ? " active" : ""}`}
            onClick={() => updateFilter("pincode", location.pincode)}
            type="button"
          >
            <span>{lang === "ml" ? (location.display_name_ml || location.display_name) : location.display_name}</span>
            <strong>{location.pincode}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function HelpDesk({ text, onClose }) {
  return (
    <div className="helpdesk-overlay" onClick={onClose}>
      <div className="helpdesk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="helpdesk-header">
          <h2>{text.helpTitle}</h2>
          <button type="button" onClick={onClose} className="helpdesk-close">✕</button>
        </div>
        <div className="helpdesk-section">
          <h3>{text.helpUserTitle}</h3>
          <ol>
            {text.helpUserSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
        <div className="helpdesk-section">
          <h3>{text.helpWorkerTitle}</h3>
          <ol>
            {text.helpWorkerSteps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
        <button type="button" className="submit-button" onClick={onClose}>{text.helpClose}</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <article className={`stat-card ${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${Math.min(100, (value / 200) * 100)}%` }} /></div>
    </article>
  );
}

export default App;
