const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'market-prices.json');

const regions = ['Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga', 'North Unguja', 'South Unguja', 'West Unguja', 'North Pemba', 'South Pemba'];
const cropCatalog = [{ crop: 'Maize', base: 86000, icon: '◈' }, { crop: 'Rice', base: 178000, icon: '▦' }, { crop: 'Beans', base: 245000, icon: '●' }, { crop: 'Wheat', base: 215000, icon: '▥' }, { crop: 'Sorghum', base: 119000, icon: '▤' }, { crop: 'Millet', base: 132000, icon: '▤' }, { crop: 'Cowpeas', base: 188000, icon: '●' }, { crop: 'Pigeon peas', base: 205000, icon: '●' }, { crop: 'Groundnuts', base: 190000, icon: '●' }, { crop: 'Cassava', base: 76000, icon: '◆' }, { crop: 'Sweet potatoes', base: 92000, icon: '◆' }, { crop: 'Potatoes', base: 126000, icon: '●' }, { crop: 'Bananas', base: 110000, icon: '◒' }, { crop: 'Sugarcane', base: 108000, icon: '▥' }, { crop: 'Cotton', base: 310000, icon: '✦' }, { crop: 'Coffee', base: 685000, icon: '●' }, { crop: 'Tea', base: 420000, icon: '✦' }, { crop: 'Tobacco', base: 355000, icon: '◇' }, { crop: 'Cashew nuts', base: 485000, icon: '✺' }, { crop: 'Sunflower', base: 142000, icon: '✺' }, { crop: 'Sesame', base: 270000, icon: '●' }, { crop: 'Coconut', base: 102000, icon: '◉' }, { crop: 'Cloves', base: 920000, icon: '✦' }, { crop: 'Horticultural produce', base: 98000, icon: '✿' }];

function generateBasePrices() {
  return regions.flatMap((region, regionIndex) => cropCatalog.map((item, cropIndex) => {
    const price = Math.round((item.base * (0.88 + (regionIndex % 8) * 0.035)) / 1000) * 1000;
    const changeValue = ((regionIndex * 3 + cropIndex * 2) % 17 - 5) / 10;
    return { id: `${region}-${item.crop}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), crop: item.crop, region, price, change: `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(1)}%`, trend: changeValue >= 0 ? 'up' : 'down', icon: item.icon, updatedAt: new Date().toISOString(), source: 'market-feed' };
  }));
}
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ submissions: [], marketPrices: generateBasePrices() }, null, 2));
}
function readData() { ensureDataFile(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/api/regions', (req, res) => res.json({ regions }));
app.get('/api/prices', (req, res) => {
  const data = readData();
  const prices = [...(data.marketPrices || []), ...(data.submissions || [])];
  res.json({ prices: req.query.region && req.query.region !== 'all' ? prices.filter(item => item.region === req.query.region) : prices });
});
app.get('/api/dashboard', (req, res) => {
  const data = readData();
  const prices = [...(data.marketPrices || []), ...(data.submissions || [])];
  const average = prices.reduce((sum, item) => sum + Number(String(item.change || '0').replace('%', '')), 0) / Math.max(prices.length, 1);
  res.json({ regionsCovered: new Set(prices.map(item => item.region)).size, cropsTracked: new Set(prices.map(item => item.crop)).size, averageWeeklyChange: `${average >= 0 ? '+' : ''}${average.toFixed(1)}%` });
});
app.post('/api/prices', (req, res) => {
  const { name, region, crop, price, market } = req.body || {};
  const numericPrice = Number(price);
  if (!name || !region || !crop || !market || !Number.isFinite(numericPrice) || numericPrice <= 0) return res.status(400).json({ success: false, message: 'All fields are required and price must be positive.' });
  const data = readData();
  const record = { id: `submission-${Date.now()}`, crop: String(crop).trim(), region: String(region).trim(), price: numericPrice, change: '+0.0%', trend: 'up', icon: '✦', updatedAt: new Date().toISOString(), source: 'market-submission', submittedBy: String(name).trim(), market: String(market).trim() };
  data.submissions = [...(data.submissions || []), record];
  writeData(data);
  res.status(201).json({ success: true, message: 'Thank you. Your price update has been received for review.', record });
});
app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'Website.html')));
app.listen(PORT, () => console.log(`Mazao Price Point is running on port ${PORT}`));
