// Initializing the map
const map = L.map('map', {
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: true,
    touchZoom: true,
}).setView([23.7806, 90.4074], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '',
}).addTo(map);

// Canvas setup
const canvas = document.getElementById('heatmap-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to match window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// House data store
let houseData = [];

// Utility: Parse "24/07/2012" into Date object
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
}

// Calculate % change and last price from price history
function calculatePercentChange(pricesArray) {
    const parsed = pricesArray.map(p => {
        const [dateStr, priceStr] = p.split('|').map(x => x.trim());
        return { date: parseDate(dateStr), price: parseInt(priceStr) };
    });

    parsed.sort((a, b) => a.date - b.date);

    const first = parsed[0].price;
    const last = parsed[parsed.length - 1].price;

    if (first === 0) return { percentChange: 0, last };
    return { percentChange: ((last - first) / first) * 100, last };
}

// Fetch house data
fetch('house_data_dhaka.json')
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        houseData = data.map(house => {
            const { percentChange, last } = calculatePercentChange(house.prices);
            return { ...house, percentChange, currentPrice: last };
        });
        drawAllHeatPoints();
    })
    .catch(err => console.error('Error fetching house data:', err));

// Draw heat points
function drawAllHeatPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const threshold = 60;

    houseData.forEach(currentHouse => {
        const currentPoint = map.latLngToContainerPoint([currentHouse.lat, currentHouse.lon]);

        // Count nearby points
        let nearbyCount = 0;
        houseData.forEach(otherHouse => {
            if (otherHouse === currentHouse) return;
            const otherPoint = map.latLngToContainerPoint([otherHouse.lat, otherHouse.lon]);
            const dx = currentPoint.x - otherPoint.x;
            const dy = currentPoint.y - otherPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < threshold) nearbyCount++;
        });

        const change = currentHouse.percentChange;
        const absChange = Math.min(Math.abs(change), 100);

        const intensity = absChange + nearbyCount * 5;
        const clampedIntensity = Math.min(intensity, 150);

        const radius = 5;
        const color = getInterpolatedColor(change);

        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Color scale
function getInterpolatedColor(change) {
    if (change <= -80) return { r: 160, g: 0, b: 0 };
    if (change <= -20) return { r: 233, g: 62, b: 58 };
    if (change < 0) return { r: 255, g: 165, b: 0 };
    if (change <= 20) return { r: 255, g: 215, b: 0 };
    if (change <= 60) return { r: 144, g: 238, b: 144 };
    if (change <= 100) return { r: 27, g: 138, b: 90 };
    return { r: 0, g: 255, b: 0 };
}

// Redraw map on view changes
map.on('move', drawAllHeatPoints);
map.on('zoom', drawAllHeatPoints);
window.addEventListener('resize', drawAllHeatPoints);

// Tooltip on hover
const mapContainer = document.getElementById("map");
const tooltip = document.getElementById('tooltip');

mapContainer.addEventListener('mousemove', (e) => {
    const mapRect = map.getContainer().getBoundingClientRect();
    const mouseX = e.clientX - mapRect.left;
    const mouseY = e.clientY - mapRect.top;

    const hoverHouse = houseData.find(house => {
        const point = map.latLngToContainerPoint([house.lat, house.lon]);
        const dx = point.x - mouseX;
        const dy = point.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    });

    if (hoverHouse) {
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY + 15}px`;
        tooltip.style.display = 'block';
        tooltip.innerHTML = `
            <strong>Price Change:</strong> ${hoverHouse.percentChange.toFixed(2)}% ${hoverHouse.percentChange > 0 ? "📈" : "📉"}<br>
            <strong>Latest Price:</strong> $${hoverHouse.currentPrice} <br>
            <strong>Lat:</strong> ${hoverHouse.lat} <br>
            <strong>Lon:</strong> ${hoverHouse.lon}
        `;
    } else {
        tooltip.style.display = 'none';
    }
});
