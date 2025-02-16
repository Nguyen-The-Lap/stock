const API_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true';

let coinsData = [];
let autoRefreshInterval = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

async function fetchCryptoData() {
  document.getElementById('loader').style.display = 'block';
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const coins = await response.json();
    coinsData = coins;
    filterAndSortCoins();
    document.getElementById('last-updated').textContent =
      'Last updated: ' + new Date().toLocaleTimeString();
  } catch (error) {
    console.error('Error fetching cryptocurrency data:', error);
  } finally {
    document.getElementById('loader').style.display = 'none';
  }
}

function filterAndSortCoins() {
  const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
  let filteredCoins = coinsData.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchTerm) ||
      coin.symbol.toLowerCase().includes(searchTerm)
  );

  const favoritesOnly = document.getElementById('favorite-filter-checkbox').checked;
  if (favoritesOnly) {
    filteredCoins = filteredCoins.filter((coin) => favorites.includes(coin.id));
  }

  const sortOption = document.getElementById('sort-select').value;
  filteredCoins.sort((a, b) => {
    if (sortOption === 'market_cap') {
      return b.market_cap - a.market_cap;
    } else if (sortOption === 'price') {
      return b.current_price - a.current_price;
    } else if (sortOption === 'change') {
      return b.price_change_percentage_24h - a.price_change_percentage_24h;
    } else if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    }
  });

  updateCoins(filteredCoins);
}

function updateCoins(coins) {
  const container = document.getElementById('crypto-container');
  container.innerHTML = ''; 

  coins.forEach((coin) => {
    const coinBox = createCoinBox(coin);
    container.appendChild(coinBox);
  });
}

function createCoinBox(coin) {
  const box = document.createElement('div');
  box.className = 'coin-box';
  if (coin.id === 'bitcoin') {
    box.classList.add('highlight');
  }


  const favBtn = document.createElement('button');
  favBtn.className = 'favorite-btn';
  favBtn.innerHTML = getStarIconHTML(favorites.includes(coin.id));
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(coin.id, favBtn);
  });
  box.appendChild(favBtn);

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'coin-icon-wrapper';

  if (coin.image) {
    const img = document.createElement('img');
    img.className = 'coin-icon-img';
    img.src = coin.image;
    img.alt = `${coin.name} logo`;
    iconWrapper.appendChild(img);
  } else {
    const svgHTML = `
      <svg class="coin-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="#f2b134" stroke="#e09b3d" stroke-width="5"></circle>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="#fff">
          ${coin.symbol.toUpperCase()}
        </text>
      </svg>
    `;
    iconWrapper.innerHTML = svgHTML;
  }
  box.appendChild(iconWrapper);

  const infoDiv = document.createElement('div');
  infoDiv.className = 'coin-info';

  const nameEl = document.createElement('h2');
  nameEl.textContent = coin.name;
  infoDiv.appendChild(nameEl);

  const priceEl = document.createElement('p');
  priceEl.innerHTML = `Price: <span class="coin-price">${formatCurrency(
    coin.current_price
  )}</span>`;
  infoDiv.appendChild(priceEl);

  const change = coin.price_change_percentage_24h;
  const changeEl = document.createElement('p');
  changeEl.innerHTML = `24h Change: <span class="coin-change" style="color: ${
    change >= 0 ? '#4caf50' : '#f44336'
  };">${(change >= 0 ? '+' : '') + change.toFixed(2)}%</span>`;
  infoDiv.appendChild(changeEl);

  const marketCapEl = document.createElement('p');
  marketCapEl.innerHTML = `Market Cap: <span class="coin-marketcap">${formatCurrency(
    coin.market_cap
  )}</span>`;
  infoDiv.appendChild(marketCapEl);

  box.appendChild(infoDiv);

  box.addEventListener('click', (e) => {
    if (e.target.id !== 'refresh-btn') {
      showCoinDetails(coin);
    }
  });

  return box;
}

function getStarIconHTML(isFavorited) {
  if (isFavorited) {
    return `<svg viewBox="0 0 24 24">
      <path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l5.46 4.73L6.82 21z"></path>
    </svg>`;
  } else {
    return `<svg viewBox="0 0 24 24">
      <path d="M22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03z" fill="none" stroke="#bbb" stroke-width="2"></path>
    </svg>`;
  }
}

function toggleFavorite(coinId, btn) {
  const index = favorites.indexOf(coinId);
  if (index === -1) {
    favorites.push(coinId);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  btn.innerHTML = getStarIconHTML(favorites.includes(coinId));
  filterAndSortCoins();
}

function formatCurrency(number) {
  return '$' + number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toggleTheme() {
  const currentTheme = document.body.dataset.theme || 'dark';
  const themes = ['dark', 'light', 'high-contrast', 'solarized', 'ocean'];
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  document.body.dataset.theme = themes[nextIndex];
  document.getElementById('theme-select').value = themes[nextIndex];
  localStorage.setItem('theme', document.body.dataset.theme);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

function drawSparkline(container, data) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 100 40`);
  svg.setAttribute('class', 'sparkline');
  
  if (!data || data.length < 2) {
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'currentColor');
    text.textContent = 'No data';
    svg.appendChild(text);
    container.appendChild(svg);
    return;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 40 - ((val - min) / (max - min)) * 40;
    return `${x},${y}`;
  }).join(' ');

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', `M ${points}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);
  container.appendChild(svg);
}

function showCoinDetails(coin) {
  const modal = document.getElementById('coin-modal');
  const detailsDiv = document.getElementById('modal-details');
  
  let html = `
    <div class="modal-header">
      <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>
      <button class="modal-favorite" onclick="toggleFavorite('${coin.id}', this)">
        ${getStarIconHTML(favorites.includes(coin.id))}
      </button>
    </div>
    <div class="sparkline-container"></div>
    <div class="modal-grid">
      <div class="modal-column">
        <p><span class="label">Price:</span> <span class="coin-price">${formatCurrency(coin.current_price)}</span></p>
        <p><span class="label">Market Cap:</span> ${formatCurrency(coin.market_cap)}</p>
        <p><span class="label">Volume (24h):</span> ${formatCurrency(coin.total_volume)}</p>
      </div>
      <div class="modal-column">
        <p><span class="label">24h Change:</span> <span class="coin-change" style="color: ${coin.price_change_percentage_24h >= 0 ? '#4caf50' : '#f44336'};">${coin.price_change_percentage_24h.toFixed(2)}%</span></p>
        <p><span class="label">High/Low (24h):</span> ${formatCurrency(coin.high_24h)} / ${formatCurrency(coin.low_24h)}</p>
        <p><span class="label">Circulating Supply:</span> ${coin.circulating_supply?.toLocaleString() || 'N/A'}</p>
      </div>
    </div>
  `;
  
  detailsDiv.innerHTML = html;
  if (coin.sparkline_in_7d?.price) {
    drawSparkline(detailsDiv.querySelector('.sparkline-container'), coin.sparkline_in_7d.price);
  }
  modal.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  fetchCryptoData();

  document.getElementById('search-input').addEventListener('input', filterAndSortCoins);
  document.getElementById('sort-select').addEventListener('change', filterAndSortCoins);
  document.getElementById('refresh-btn').addEventListener('click', fetchCryptoData);
  document.getElementById('auto-refresh-checkbox').addEventListener('change', function () {
    if (this.checked) {
      autoRefreshInterval = setInterval(fetchCryptoData, 30000);
    } else {
      clearInterval(autoRefreshInterval);
    }
  });
  document.getElementById('favorite-filter-checkbox').addEventListener('change', filterAndSortCoins);

  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.dataset.theme = savedTheme;
  document.getElementById('theme-select').value = savedTheme;
  document.getElementById('theme-select').addEventListener('change', function() {
    document.body.dataset.theme = this.value;
    localStorage.setItem('theme', this.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.getElementById('coin-modal').style.display = 'none';
    if (e.ctrlKey && e.key === 'f') document.getElementById('search-input').focus();
  });

  autoRefreshInterval = setInterval(fetchCryptoData, 30000);

  const modal = document.getElementById('coin-modal');
  const closeBtn = document.querySelector('.close-modal');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});

document.onkeydown = function(e) {
  if (
    e.keyCode === 123 || // F12
    (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
    (e.ctrlKey && e.keyCode === 85) 
  ) {
    e.preventDefault();
    return false;
  }
};