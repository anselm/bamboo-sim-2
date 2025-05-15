const html = `

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        crossorigin="anonymous" referrerpolicy="no-referrer" />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body, html {
      margin: 0; padding: 0;
      height: 100%; overflow: hidden;
      font-family: 'Roboto', sans-serif;
    }
    .container {
      position: relative;
      width: 100%; height: 100%;
    }
    .sidebar {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 300px;
      padding: 1rem;
      background: #ffffffee;
      box-shadow: 2px 0 8px rgba(0,0,0,0.1);
      overflow-y: auto;
      z-index: 999
    }
    .sidebar h1 {
      margin: 0.5rem 0 0.2rem;
      font-size: 1.25rem; font-weight: 700;
    }
    .sidebar h1 + p {
      margin: 0; font-size: 0.85rem; color: #555;
    }
    .section {
      margin-top: 1.5rem;
    }
    .section h2 {
      font-size: 1rem; font-weight: 500;
      margin-bottom: 0.5rem;
      display: flex; align-items: center;
    }
    .section h2 i {
      margin-right: 0.5rem; color: #2d6a4f;
    }
    .section label {
      display: block; font-size: 0.85rem; margin-bottom: 0.25rem;
    }
    .section input[type="range"],
    .section input[type="number"],
    .section select {
      width: 100%; margin-bottom: 0.75rem;
    }
    .btn-group {
      display: flex; gap: 0.5rem; margin-bottom: 0.75rem;
    }
    .btn {
      flex: 1;
      padding: 0.4rem;
      border: none;
      background: #2d6a4f;
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .metrics {
      list-style: none; padding: 0; margin: 0;
    }
    .metrics li {
      display: flex; align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .metrics li i {
      width: 1.2rem;
      margin-right: 0.5rem;
      text-align: center;
      color: #40916c;
    }
    .checkbox-list, .checkbox-list label {
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.9rem;
    }
  </style>


 
    <aside class="sidebar">
      <!-- 1) Title -->
      <header>
        <h1><i class="fas fa-seedling"></i> Bamboo Growth Simulation</h1>
        <p>Carbon sequestration model from 2025 – 2035</p>
      </header>

      <!-- 2) Timeline control -->
      <section class="section">
        <h2><i class="fas fa-clock"></i> Timeline</h2>
        <label for="yearRange">Year: <span id="yearLabel">2025</span></label>
        <input id="yearRange" type="range" min="2025" max="2035" value="2025">
        <div class="btn-group">
          <button class="btn" id="btnPlay"><i class="fas fa-play"></i></button>
          <button class="btn" id="btnPause"><i class="fas fa-pause"></i></button>
          <button class="btn" id="btnReset"><i class="fas fa-rotate-right"></i></button>
        </div>
      </section>

      <!-- 3) Growth Metrics -->
      <section class="section">
        <h2><i class="fas fa-chart-line"></i> Growth Metrics</h2>
        <ul class="metrics">
          <li><i class="fas fa-ruler-vertical"></i> Avg Height: <strong id="avgHeight">0&nbsp;m</strong></li>
          <li><i class="fas fa-layer-group"></i> Clumps: <strong id="clumpCount">0</strong></li>
          <li><i class="fas fa-tree"></i> Live Poles: <strong id="livePoles">0</strong></li>
          <li><i class="fas fa-cut"></i> Harvested: <strong id="harvested">0</strong></li>
          <li><i class="fas fa-cloud"></i> CO₂ Sequestered: <strong id="co2">0&nbsp;kg</strong></li>
        </ul>
      </section>

      <!-- 4) Species selection -->
      <section class="section">
        <h2><i class="fas fa-pagelines"></i> Species &amp; Schedule</h2>
        <label for="speciesSelect">Species</label>
        <select id="speciesSelect">
          <option>Golden Bamboo</option>
          <option>Giant Bamboo</option>
        </select>

        <label for="densitySelect">Density</label>
        <select id="densitySelect">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <label for="harvestYears">Harvest in (yrs)</label>
        <input id="harvestYears" type="range" min="0" max="10" value="5">

        <label for="harvestRate">Harvest Rate (%)</label>
        <input id="harvestRate" type="range" min="0" max="100" value="50">
      </section>

      <!-- 5) Plot information -->
      <section class="section">
        <h2><i class="fas fa-map"></i> Plot Info</h2>
        <label for="hectares">Area (ha)</label>
        <input id="hectares" type="number" min="1" max="1000" value="100">

        <label for="elevation">Elevation (m)</label>
        <input id="elevation" type="range" min="0" max="4000" value="250">

        <label for="facing">Slope Facing (°)</label>
        <input id="facing" type="range" min="0" max="360" value="180">

        <label for="steepness">Steepness (%)</label>
        <input id="steepness" type="range" min="0" max="100" value="10">

        <label for="latitude">Latitude</label>
        <input id="latitude" type="number" step="0.0001" value="0">

        <label for="longitude">Longitude</label>
        <input id="longitude" type="number" step="0.0001" value="0">

        <label for="rainfall">Rainfall (mm/yr)</label>
        <input id="rainfall" type="range" min="0" max="3000" value="1200">

        <label for="drainage">Drainage (m³/yr)</label>
        <input id="drainage" type="number" min="0" value="5000">
      </section>

      <!-- 6) Soil conditions -->
      <section class="section">
        <h2><i class="fas fa-soap"></i> Soil Conditions</h2>
        <!-- you might later replace with custom bars -->
        <label>Salts</label><input type="range" min="0" max="100" value="20">
        <label>Nitrogen</label><input type="range" min="0" max="100" value="50">
        <label>Microbial Mass</label><input type="range" min="0" max="100" value="30">
        <label>Earthworms</label><input type="range" min="0" max="100" value="40">
        <label>Acidity (pH)</label><input type="range" min="0" max="14" value="6">
        <label>Fertility</label><input type="range" min="0" max="100" value="60">
      </section>

      <!-- 7) Pests -->
      <section class="section">
        <h2><i class="fas fa-bug"></i> Pests</h2>
        <div class="checkbox-list">
          <label><input type="checkbox" /> Bamboo Borer</label>
          <label><input type="checkbox" /> Aphids</label>
          <label><input type="checkbox" /> Fungal Pathogens</label>
        </div>
      </section>

      <!-- 8) Intervention plan -->
      <section class="section">
        <h2><i class="fas fa-tools"></i> Intervention</h2>
        <div class="checkbox-list">
          <label><input type="checkbox" /> Weeding</label>
          <label><input type="checkbox" /> Mulching</label>
          <label><input type="checkbox" /> Fertilization</label>
          <label><input type="checkbox" /> Pest Control</label>
        </div>
      </section>

      <!-- 9) Intercropping -->
      <section class="section">
        <h2><i class="fas fa-seedling"></i> Intercropping</h2>
        <div class="checkbox-list">
          <label><input type="checkbox" /> Legumes (beans, peas, lentils)</label>
          <label><input type="checkbox" /> Herbs (ginger, turmeric)</label>
          <label><input type="checkbox" /> Specialty Crops (coffee, cacao, tea)</label>
          <label><input type="checkbox" /> Animals (fowl, pigs)</label>
        </div>
      </section>
    </aside>
`

const container = document.createElement('div');
container.innerHTML = html
document.body.appendChild(container);

