/* Comprehensive Nigeria state/city data for checkout.
 * Source: Countries-States-Cities-JSON (Nigeria country dataset).
 * The dataset is loaded on demand and cached in the browser.
 */
(function () {
  const DATA_URL = 'https://cdn.jsdelivr.net/gh/Yerikmiller/Countries-States-Cities-JSON@latest/countries/NGA.json';
  const stateSelect = document.getElementById('state');
  const citySelect = document.getElementById('city');
  const otherCityWrap = document.getElementById('otherCityWrap');
  const otherCity = document.getElementById('otherCity');

  if (!stateSelect || !citySelect) return;

  let nigeriaDataPromise;

  function loadNigeriaData() {
    if (!nigeriaDataPromise) {
      nigeriaDataPromise = fetch(DATA_URL, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error(`Location data request failed: ${response.status}`);
          return response.json();
        });
    }
    return nigeriaDataPromise;
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function getStates(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.states)) return data.states;
    if (Array.isArray(data.state)) return data.state;
    return [];
  }

  function getCities(state) {
    const cities = state && (state.cities || state.city || state.towns || state.town);
    if (!Array.isArray(cities)) return [];
    return cities
      .map((city) => typeof city === 'string' ? city : city && (city.name || city.city || city.town))
      .filter(Boolean)
      .map(String)
      .sort((a, b) => a.localeCompare(b));
  }

  function renderCities(stateName, cities) {
    citySelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = cities.length ? 'Select your city / town' : 'Enter your city / town below';
    citySelect.appendChild(placeholder);
    citySelect.disabled = false;

    [...new Set(cities)].forEach((city) => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });

    const other = document.createElement('option');
    other.value = '__other__';
    other.textContent = 'My city / town is not listed';
    citySelect.appendChild(other);

    if (otherCityWrap) otherCityWrap.classList.add('is-hidden');
    if (otherCity) {
      otherCity.required = false;
      otherCity.value = '';
    }
  }

  function showFallback(stateName) {
    citySelect.innerHTML = '<option value="">Location list unavailable — enter below</option>';
    citySelect.disabled = false;
    const other = document.createElement('option');
    other.value = '__other__';
    other.textContent = 'Enter my city / town manually';
    citySelect.appendChild(other);
    citySelect.value = '__other__';
    if (otherCityWrap) otherCityWrap.classList.remove('is-hidden');
    if (otherCity) otherCity.required = true;
    console.warn(`Could not load comprehensive city data for ${stateName}. Manual entry remains available.`);
  }

  stateSelect.addEventListener('change', async function () {
    const stateName = stateSelect.value;
    if (!stateName) return;

    citySelect.disabled = true;
    citySelect.innerHTML = '<option value="">Loading cities / towns…</option>';

    try {
      const data = await loadNigeriaData();
      const state = getStates(data).find((item) => normalize(item.name || item.state || item.title) === normalize(stateName));
      if (!state) throw new Error('Selected state was not found in the location dataset.');
      renderCities(stateName, getCities(state));
    } catch (error) {
      showFallback(stateName);
    }
  });

  citySelect.addEventListener('change', function () {
    const isOther = citySelect.value === '__other__';
    if (otherCityWrap) otherCityWrap.classList.toggle('is-hidden', !isOther);
    if (otherCity) {
      otherCity.required = isOther;
      if (!isOther) otherCity.value = '';
    }
  });
})();
