/*
 * Comprehensive Nigerian location selector for checkout.
 *
 * Sources:
 * 1. CountriesNow state/city API.
 * 2. Countries-States-Cities-JSON Nigeria dataset.
 * 3. Nigerian cities dataset (state -> cities/towns).
 * 4. Nigerian state/LGA dataset as a supplemental delivery-location source.
 *
 * The selector keeps the existing form fields intact: state, city, and
 * other_city. If a customer cannot find a location, the manual-entry path
 * remains available and the order payload still uses the existing `city`
 * field expected by the Render backend.
 */
(function () {
  const CITIES_API_URL = 'https://countriesnow.space/api/v0.1/countries/state/cities';
  const DATA_URL = 'https://cdn.jsdelivr.net/gh/Yerikmiller/Countries-States-Cities-JSON@latest/countries/NGA.json';
  const CITY_DATA_URL = 'https://gist.githubusercontent.com/mr-chidex/3a51271217871827eb86fb664d29e7e5/raw/';
  const LGA_DATA_URL = 'https://gist.githubusercontent.com/judeebene/2b3f9c0c816b68ff5dd5fa40c48a3d5c/raw/22e0b687f267d55e28e6428ce360118142b6f1fe/state%20and%20lga%20json%20in%20nigeria';
  const CACHE_KEY = 'ginsengPlusNigeriaLocations:v5';
  const STYLE_ID = 'ginseng-location-selector-styles';

  const stateSelect = document.getElementById('state');
  const citySelect = document.getElementById('city');
  const otherCityWrap = document.getElementById('otherCityWrap');
  const otherCity = document.getElementById('otherCity');

  if (!stateSelect || !citySelect) return;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = '.is-hidden{display:none!important;}';
    document.head.appendChild(style);
  }

  let fallbackDataPromise;
  let cityDataPromise;
  let lgaDataPromise;
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

  async function fetchJson(url, label) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`${label} request failed: ${response.status}`);
    return response.json();
  }

  async function loadFallbackDataset() {
    if (!fallbackDataPromise) {
      const cached = readCachedDataset();
      if (cached) {
        fallbackDataPromise = Promise.resolve(cached);
      } else {
        fallbackDataPromise = fetchJson(DATA_URL, 'Fallback location')
          .then((data) => {
            writeCachedDataset(data);
            return data;
          });
      }
    }
    return fallbackDataPromise;
  }

  async function loadCityDataset() {
    if (!cityDataPromise) {
      cityDataPromise = fetchJson(CITY_DATA_URL, 'City dataset');
    }
    return cityDataPromise;
  }

  async function loadLgaDataset() {
    if (!lgaDataPromise) {
      lgaDataPromise = fetchJson(LGA_DATA_URL, 'LGA location');
    }
    return lgaDataPromise;
  }

  async function loadCitiesFromApi(stateName) {
    const response = await fetch(CITIES_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ country: 'Nigeria', state: stateName })
    });

    if (!response.ok) throw new Error(`Cities API request failed: ${response.status}`);

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
    return state ? getCitiesFromState(state) : [];
  }

  async function loadCitiesFromCityDataset(stateName) {
    const data = await loadCityDataset();
    const states = Array.isArray(data) ? data : data?.states;
    if (!Array.isArray(states)) return [];

    const match = states.find((item) => {
      const name = item?.state?.name || item?.name || item?.state;
      return stateNamesMatch(name, stateName);
    });

    if (!match) return [];
    return cleanCities(match?.state?.cities || match?.cities || match?.city);
  }

  async function loadLocationsFromLgaDataset(stateName) {
    const data = await loadLgaDataset();
    const states = Array.isArray(data) ? data : data?.states;
    if (!Array.isArray(states)) return [];

    const state = states.find((item) => stateNamesMatch(item?.name || item?.state, stateName));
    if (!state || !Array.isArray(state.locals)) return [];

    // LGAs are useful supplemental delivery-location choices when a city/town
    // provider does not list the customer's locality. They are merged and
    // deduplicated with actual city/town results rather than replacing them.
    return cleanCities(state.locals);
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
      ? 'Select your city / town / LGA'
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
      // Merge independent sources so a small list from one provider does not
      // hide useful Nigerian delivery locations available in another source.
      const results = await Promise.allSettled([
        loadCitiesFromApi(stateName),
        loadCitiesFromFallback(stateName),
        loadCitiesFromCityDataset(stateName),
        loadLocationsFromLgaDataset(stateName)
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
