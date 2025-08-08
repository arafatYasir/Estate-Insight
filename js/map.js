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

// Setting Cache Details for Local Storage
const CACHE_KEY = "houseData";
const CACHE_TIME_KEY = "houseDataTimestamp";
const MAX_CACHE_AGE = 1000 * 60 * 60 * 6; // 6 hours

// Initializing the map
let map;
function initializeMap(lat, lon) {
    map = L.map('map', {
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: true,
        touchZoom: true,
        zoomControl: false
    }).setView([lat, lon], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    map.on('move', drawAllHeatPoints);
    map.on('zoom', drawAllHeatPoints);


    // Tooltip on hover
    const mapContainer = document.getElementById("map");
    const tooltip = document.getElementById('tooltip');

    // Event listener to track hover on house point
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
            const toolTipWidth = 200;
            const toolTipHeight = 95;

            let leftPos = e.clientX + 15;
            let topPos = e.clientY + 15;

            if (leftPos + toolTipWidth > window.innerWidth) {
                leftPos = e.clientX - toolTipWidth - 15;
            }
            if (topPos + toolTipHeight > window.innerHeight) {
                topPos = e.clientY - toolTipHeight - 15;
            }

            if(leftPos < 0) {
                leftPos = toolTipWidth / 2;
            }
            if(topPos < 0) {
                topPos = toolTipHeight / 2;
            }

            tooltip.style.left = `${leftPos}px`;
            tooltip.style.top = `${topPos}px`;
            tooltip.style.display = 'block';
            tooltip.innerHTML = `
            <strong>Price Change:</strong> ${hoverHouse.percentChange.toFixed(2)}% ${hoverHouse.percentChange > 0 ? "📈" : "📉"}<br>
            <strong>Latest Price:</strong> $${hoverHouse.currentPrice}
        `;
        } else {
            tooltip.style.display = 'none';
        }
    });
}

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
    return { percentChange: ((last - first) / first) * 100, last, };
}

// Fetch house data
function loadHouseData() {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cached && timestamp && now - parseInt(timestamp) < MAX_CACHE_AGE) {
        const data = JSON.parse(cached);

        let lat = 0, lon = 0;
        houseData = data.map(house => {
            lat += house.lat;
            lon += house.lon;

            const { percentChange, last } = calculatePercentChange(house.prices);

            return { ...house, percentChange, currentPrice: last };
        })

        lat /= houseData.length;
        lon /= houseData.length;

        initializeMap(lat, lon);
        drawAllHeatPoints();
        showHouses();
    }
    else {
        // Calling fetch
        fetch('../dummy_ecuador_houses.json')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                let lat = 0, lon = 0;
                houseData = data.map(house => {
                    lat += house.lat;
                    lon += house.lon;
                    const { percentChange, last } = calculatePercentChange(house.prices);
                    return { ...house, percentChange, currentPrice: last };
                });

                lat /= houseData.length;
                lon /= houseData.length;

                initializeMap(lat, lon);
                drawAllHeatPoints();
                showHouses();

                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                localStorage.setItem(CACHE_TIME_KEY, now.toString());
            })
            .catch(err => console.error('Error fetching house data:', err));
    }

}

// Calling the loader function
loadHouseData();


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
        const listingType = currentHouse.listingType;
        console.log(listingType);
        const absChange = Math.min(Math.abs(change), 100);

        const intensity = absChange + nearbyCount * 5;
        const clampedIntensity = Math.min(intensity, 150);

        const radius = 5;
        const color = getInterpolatedColor(change, listingType);

        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Redraw map on view changes
window.addEventListener('resize', drawAllHeatPoints);

// Color scale
function getInterpolatedColor(change, listingType) {
    if(listingType === "Sold") {
        return {r: 40, g: 40, b: 40};
    }
    if (change <= -80) return { r: 160, g: 0, b: 0 };
    if (change <= -20) return { r: 233, g: 62, b: 58 };
    if (change < 0) return { r: 255, g: 165, b: 0 };
    if (change <= 20) return { r: 255, g: 215, b: 0 };
    if (change <= 60) return { r: 144, g: 238, b: 144 };
    if (change <= 100) return { r: 27, g: 138, b: 90 };
    return { r: 0, g: 255, b: 0 };
}


// House Showing Function
function showHouses() {
    const houseListings = document.querySelector(".house-listings");

    houseData.slice(0, 20).forEach((house, idx) => {
        const priceChangeText = house.percentChange > 0 ? `<span class='increase'>⬆ ${house.percentChange.toFixed(2)}%</span>` : `<span class='decrease'>⬇ ${house.percentChange.toFixed(2)}%</span>`
        houseListings.innerHTML += `
            <div class="house-card" data-index="${idx}">
                <img class="house-img" src="./images/house_image.webp" alt="House Image" />
                <div class="house-content">
                    <h2 class="price">$${house.currentPrice.toLocaleString()}</h2>
    
                    <div class="info">
                        <p><span>${house.beds}</span> Bed${house.beds > 1 ? "s" : ""}</p> | 
                        <p><span>${house.baths}</span> Bath${house.baths > 1 ? "s" : ""}</p> | 
                        <p><span>${house.sizeSqft}</span> sqft</p> |
                        <p><span>${house.listingType}</span></p>
                    </div>
    
                    <p class="address">${house.address}</p>
    
                    <p class="price-change">
                    ${priceChangeText}
                    </p>
                </div>
            </div>
        `;
    })
}


function openHouseDetails(house) {
    const mainContent = document.querySelector(".main-content");
    const houseDetails = document.querySelector("#house-details-view");

    mainContent.style.display = "none";
    houseDetails.style.display = "block";
    houseDetails.style.marginTop = "200px";

    const details = document.querySelector("#house-details-content");

    details.innerHTML = `
        <h2>${house.address}</h2>
        <p>Price: $${house.currentPrice.toLocaleString()}</p>
        <p>${house.beds} Beds | ${house.baths} Baths | ${house.sizeSqft} sqft</p>
        <img src="./images/house_image.webp" alt="House Image" />
        <p>${house.description || "No description provided."}</p>
  `;
}


// Setting Event Listener to show House Details Page
document.querySelectorAll(".house-card").forEach(card => {
    card.addEventListener("click", () => {
        const index = parseInt(card.getAttribute("data-index"));
        const house = houseData[index];

        openHouseDetails(house);
    });
});