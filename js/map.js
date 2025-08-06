let needsRedraw = false;
let redrawScheduled = false;

function scheduleRedraw() {
    needsRedraw = true;
    if (!redrawScheduled) {
        redrawScheduled = true;
        requestAnimationFrame(() => {
            if (needsRedraw) {
                redrawScheduled = false;
                needsRedraw = false;
                drawAllHeatPoints();
            }
        });
    }
}

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
}).setView([23.7806, 90.4074], 12); // Dhaka center

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '',
}).addTo(map);

// Canvas setup
const canvas = document.getElementById('heatmap-canvas');
const ctx = canvas.getContext('2d');

// Canvas resizing function & event listener
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// Getting all the house data
let houseData = [];

// Utility function to parse date string like "24/07/2012" → Date object
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
}

// Calculate percentage change from price history
function calculatePercentChange(pricesArray) {
    const parsed = pricesArray.map(p => {
        const [dateStr, priceStr] = p.split('|').map(x => x.trim());
        return {
            date: parseDate(dateStr),
            price: parseInt(priceStr)
        };
    });

    parsed.sort((a, b) => a.date - b.date); // sort by date ascending

    const first = parsed[0].price;
    const last = parsed[parsed.length - 1].price;

    if (first === 0) return 0; // avoid division by 0

    return { percentChange: ((last - first) / first) * 100, last };
}

// Fetch house data from JSON file
fetch('house_data_dhaka.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Calculate percentChange for each house entry
        houseData = data.map(house => {
            const { percentChange, last } = calculatePercentChange(house.prices);
            return { ...house, percentChange, currentPrice: last };
        });

        scheduleRedraw();
    })
    .catch(error => {
        console.error('Error fetching house data:', error);
    });



function drawAllHeatPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // You can reset blending since no gradient blending is needed
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    const threshold = 60; // pixels — proximity for neighbors

    houseData.forEach(currentHouse => {
        const currentPoint = map.latLngToContainerPoint([currentHouse.lat, currentHouse.lon]);

        // Count nearby points to adjust size/intensity
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

        // Combine price change and nearby density for radius
        const intensity = absChange + nearbyCount * 5;
        const clampedIntensity = Math.min(intensity, 150);

        // Radius grows with intensity
        const radius = 5;

        // Get solid color based on price change
        const color = getInterpolatedColor(change);

        // Draw solid circle
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}


function getInterpolatedColor(change) {
    if (change <= -80) {
        return { r: 160, g: 0, b: 0 }; // dark red
    } else if (change <= -20) {
        return { r: 233, g: 62, b: 58 }; // red
    } else if (change < 0) {
        return { r: 255, g: 165, b: 0 }; // orange
    } else if (change >= 0 && change <= 20) {
        return { r: 255, g: 215, b: 0 }; // yellow
    } else if (change > 20 && change <= 60) {
        return { r: 144, g: 238, b: 144 }; // light green
    } else if (change > 60 && change <= 100) {
        return { r: 27, g: 138, b: 90 }; // solid green
    } else {
        return { r: 0, g: 255, b: 0 }; // neon green for extreme growth
    }
}

// Redraw whenever the map view changes
map.on('move', scheduleRedraw);
map.on('zoom', scheduleRedraw);
window.addEventListener('resize', scheduleRedraw);


const mapContainer = document.getElementById("map");

mapContainer.addEventListener('mousemove', (e) => {
    const mapRect = map.getContainer().getBoundingClientRect();

    // Get mouse position relative to the map container
    const mouseX = e.clientX - mapRect.left;
    const mouseY = e.clientY - mapRect.top;

    // Convert mouse screen coords into Leaflet's internal container point
    const hoverHouse = houseData.find(house => {
        const point = map.latLngToContainerPoint([house.lat, house.lon]);
        const dx = point.x - mouseX;
        const dy = point.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < 15; // distance threshold
    });

    const tooltip = document.getElementById('tooltip');

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