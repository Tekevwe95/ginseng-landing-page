/*
 * Comprehensive Nigerian location selector for checkout.
 *
 * Sources:
 * 1. CountriesNow state/city API.
 * 2. Countries-States-Cities-JSON Nigeria dataset.
 * 3. Broader Nigerian city/town dataset used as a supplemental source.
 *
 * The selector keeps the existing form fields intact: state, city, and
 * other_city. If a customer cannot find a location, the manual-entry path
 * remains available and the order payload still uses the existing `city`
 * field expected by the Render backend.
 */
(function () {
  const CITIES_API_URL = 'https://countriesnow.space/api/v0.1/countries/state/cities';
  const DATA_URL = 'https://cdn.jsdelivr.net/gh/Yerikmiller/Countries-States-Cities-JSON@latest/countries/NGA.json';
  const BROADER_DATA_URL = 'https://gist.githubusercontent.com/chrisidakwo/28f8dd7dabcfdb969032283d79f6b0d3/raw/';
  const CACHE_KEY = 'ginsengPlusNigeriaLocations:v3';
  const STYLE_ID = 'ginseng-location-selector-styles';

  const stateSelect = document.getElementById('state');
  const citySelect = document.getElementById('city');
  const otherCityWrap = document.getElementById('otherCityWrap');
  const otherCity = document.getElementById('otherCity');

  if (!stateSelect || !citySelect) return;

  // The existing stylesheet did not define .is-hidden, so the manual city
  // field could remain visible even when a location was selected.
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '.is-hidden{display:none!important;}';
    document.head.appendChild(style);
  }

  let fallbackDataPromise;
  let broaderDataPromise;
  const memoryCache = new Map();

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\s+/g, ' ');
  }

  function stateKey(value) {
    return normalize(value).replace(/[^a-z0-9]/g, '');
  }

  function stateNamesMatch(datasetName, selectedName) {
    const a = stateKey(datasetName);
    const b = stateKey(selectedName);
    if (a === b) return true;

    const aliases = new Set([
      'federalcapitalterritoryfct',
      'federalcapitalterritory',
      'abujafederalcapitalterritory',
      'abujafct',
      'fct',
      'fctfederalcapitalterritory'
    ]);
    return aliases.has(a) && aliases.has(b);
  }

  function cleanCities(cities) {
    if (!Array.isArray(cities)) return [];

    return [...new Set(
      cities
        .map((city) => {
          if (typeof city === 'string') return city;
          if (!city || typeof city !== 'object') return '';
          return city.name || city.city || city.town || '';
        })
        .map((city) => String(city).trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  function getStates(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.states)) return data.states;
    if (Array.isArray(data?.state)) return data.state;
    return [];
  }

  function getCitiesFromState(state) {
    return cleanCities(state?.cities || state?.city || state?.towns || state?.town);
  }

  function readCachedDataset() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return cached && typeof cached === 'object' ? cached : null;
    } catch (_) {
      return null;
    }
  }

  function writeCachedDataset(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (_) {
      // Storage can be unavailable in private/restricted browser contexts.
    }
  }

  async function loadFallbackDataset() {
    if (!fallbackDataPromise) {
      const cached = readCachedDataset();
      if (cached) {
        fallbackDataPromise = Promise.resolve(cached);
      } else {
        fallbackDataPromise = fetch(DATA_URL, { headers: { Accept: 'application/json' } })
          .then((response) => {
            if (!response.ok) throw new Error(`Fallback location request failed: ${response.status}`);
            return response.json();
          })
          .then((data) => {
            writeCachedDataset(data);
            return data;
          });
      }
    }
    return fallbackDataPromise;
  }

  async function loadBroaderDataset() {
    if (!broaderDataPromise) {
      broaderDataPromise = fetch(BROADER_DATA_URL, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error(`Broader location request failed: ${response.status}`);
          return response.json();
        });
    }
    return broaderDataPromise;
  }

  async function loadCitiesFromApi(stateName) {
    const response = await fetch(CITIES_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ country: 'Nigeria', state: stateName })
    });

    if (!response.ok) {
      throw new Error(`Cities API request failed: ${response.status}`);
    }

    const payload = await response.json();
    if (payload.error || !Array.isArray(payload.data)) {
      throw new Error(payload.msg || 'Cities API returned no city list.');
    }

    return cleanCities(payload.data);
  }

  async function loadCitiesFromFallback(stateName) {
    const data = await loadFallbackDataset();
    const state = getStates(data).find((item) =>
      stateNamesMatch(item?.name || item?.state || item?.title, stateName)
    );

    if (!state) return [];
    return getCitiesFromState(state);
  }

  async function loadCitiesFromBroaderDataset(stateName) {
    const data = await loadBroaderDataset();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [];

    const key = Object.keys(data).find((name) => stateNamesMatch(name, stateName));
    return key ? cleanCities(data[key]) : [];
  }

  function setOtherCityVisible(visible) {
    if (otherCityWrap) otherCityWrap.classList.toggle('is-hidden', !visible);
    if (otherCity) {
      otherCity.required = visible;
      if (!visible) otherCity.value = '';
    }
  }

  function renderCities(cities) {
    const previousValue = citySelect.value;
    citySelect.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = cities.length
      ? 'Select your city / town'
      : 'Select or enter your city / town';
    citySelect.appendChild(placeholder);

    cities.forEach((city) => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });

    const other = document.createElement('option');
    other.value = '__other__';
    other.textContent = 'My city / town is not listed';
    citySelect.appendChild(other);

    citySelect.disabled = false;
    setOtherCityVisible(false);

    if (cities.includes(previousValue)) citySelect.value = previousValue;
  }

  function showManualFallback() {
    citySelect.innerHTML = '';
    const option = document.createElement('option');
    option.value = '__other__';
    option.textContent = 'Enter my city / town manually';
    citySelect.appendChild(option);
    citySelect.value = '__other__';
    citySelect.disabled = false;
    setOtherCityVisible(true);
  }

  async function populateCities(stateName) {
    citySelect.disabled = true;
    citySelect.innerHTML = '<option value="">Loading cities / towns…</option>';
    setOtherCityVisible(false);

    if (!stateName) {
      citySelect.innerHTML = '<option value="">Select your state first</option>';
      citySelect.disabled = true;
      return;
    }

    const cacheKey = stateKey(stateName);
    if (memoryCache.has(cacheKey)) {
      renderCities(memoryCache.get(cacheKey));
      return;
    }

    try {
      // Load independent sources together and merge their results. This avoids
      // relying on a single provider whose city list may be too small.
      const results = await Promise.allSettled([
        loadCitiesFromApi(stateName),
        loadCitiesFromFallback(stateName),
        loadCitiesFromBroaderDataset(stateName)
      ]);

      const cities = cleanCities(
        results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      );

      if (!cities.length) throw new Error('No Nigerian locations were returned by the available sources.');

      memoryCache.set(cacheKey, cities);
      renderCities(cities);
    } catch (error) {
      console.error(`Could not load Nigerian locations for ${stateName}:`, error);
      showManualFallback();
    }
  }

  stateSelect.addEventListener('change', () => populateCities(stateSelect.value));

  citySelect.addEventListener('change', () => {
    setOtherCityVisible(citySelect.value === '__other__');
  });
})();
