// Flag to track if map is ready
let mapReady = false;

// Initializing the map
let map;
let isFetchingBounds = false;
let lastReqId = 0;

// Cache for processed house data to avoid re-processing
const processedHouseCache = new Map();

function getBoundsParams() {
    const b = map.getBounds();
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();

    return {
        minLat: sw.lat.toFixed(6),
        maxLat: ne.lat.toFixed(6),
        minLng: sw.lng.toFixed(6),
        maxLng: ne.lng.toFixed(6)
    };
}

function initializeMap(lat, lon) {
    // Detecting if it's a mobile device
    const isMobile = window.innerWidth <= 768;

    map = L.map('map', {
        dragging: true,
        scrollWheelZoom: !isMobile,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: true,
        touchZoom: true,
        zoomControl: false,
        minZoom: isMobile ? 8 : 7,
        maxZoom: 12,
        // Better mobile performance
        preferCanvas: true,
        updateWhenIdle: isMobile,
        updateWhenZooming: !isMobile,
        keepBuffer: isMobile ? 1 : 2
    }).setView([lat, lon], isMobile ? 10 : 8);

    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 1,
        updateWhenIdle: false,
        updateWhenZooming: true,
        keepBuffer: 2,
        errorTileUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    }).addTo(map);

    // Waiting for tiles to load before drawing heat points
    tileLayer.on('load', () => {
        if (!mapReady) {
            mapReady = true;
            setTimeout(() => {
                resizeCanvas();
                map.invalidateSize();
                drawAllHeatPoints();
            }, 100);
        }
    });

    map.whenReady(() => {
        setTimeout(() => {
            mapReady = true;
            resizeCanvas();
            drawAllHeatPoints();
        }, 200);
    });

    // Optimized debouncing with different strategies
    const debouncedDraw = debounce(drawAllHeatPoints, 50); // Faster visual updates
    const debouncedBoundsFetch = debounce(() => fetchHousesForCurrentBounds(), 400); // Slightly slower API calls

    // Separate move/zoom handling for better UX
    map.on("move", debouncedDraw);
    map.on("zoom", debouncedDraw);

    // Only fetch new data when user stops moving/zooming
    map.on("moveend", debouncedBoundsFetch);
    map.on("zoomend", debouncedBoundsFetch);

    map.on("resize", () => {
        resizeCanvas();
        drawAllHeatPoints();
    });
}

// House data store
let houseData = [];
let totalPages = JSON.parse(localStorage.getItem("totalPages")) || null, currentPage = 1;
let maxHouseCardsToShow = 30;
let start = (currentPage * maxHouseCardsToShow) - maxHouseCardsToShow, end = currentPage * maxHouseCardsToShow;

// Parse Date into Date object (cached version)
const dateCache = new Map();
function parseDate(dateStr) {
    if (dateCache.has(dateStr)) {
        return dateCache.get(dateStr);
    }
    const [day, month, year] = dateStr.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    dateCache.set(dateStr, date);
    return date;
}

// Calculate % change and last price from price history (with caching)
function calculatePercentChange(pricesArray, houseId) {
    // Use house ID as cache key
    if (processedHouseCache.has(houseId)) {
        return processedHouseCache.get(houseId);
    }

    const parsed = pricesArray.map(p => {
        const [dateStr, priceStr] = p.split('|').map(x => x.trim());
        return { sortByDate: parseDate(dateStr), date: dateStr, price: parseInt(priceStr) };
    }).sort((a, b) => a.sortByDate - b.sortByDate);

    const first = parsed[0].price;
    const last = parsed[parsed.length - 1].price;

    const result = first === 0
        ? { percentChange: 0, last, sortedPrices: parsed }
        : { percentChange: ((last - first) / first) * 100, last, sortedPrices: parsed };

    // Cache the result
    processedHouseCache.set(houseId, result);
    return result;
}

// Process house data (extracted to avoid duplication)
function processHouseData(data, calculateCenter = false) {
    let lat = 0, lon = 0;

    const processed = data.map(house => {
        if (calculateCenter) {
            lat += house.lat;
            lon += house.lon;
        }

        // Use house ID for caching (assuming house has id/address as unique key)
        const houseId = house.id || house.address || `${house.lat}-${house.lon}`;
        const { percentChange, last, sortedPrices } = calculatePercentChange(house.prices, houseId);

        return { ...house, percentChange, currentPrice: last, sortedPrices };
    });

    if (calculateCenter) {
        lat /= data.length;
        lon /= data.length;
        return { processed, centerLat: lat, centerLon: lon };
    }

    return { processed };
}

// Load house data from localstorage or fetch
let mapInitialized = false, isFirstLoad = true;
function loadHouseData() {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cached && timestamp && now - parseInt(timestamp) <= MAX_CACHE_AGE) {
        try {
            const data = JSON.parse(cached);
            const { processed, centerLat, centerLon } = processHouseData(data, true);

            houseData = processed;

            if (!mapInitialized) {
                initializeMap(centerLat, centerLon);
                mapInitialized = true;
            } else {
                map.setView([centerLat, centerLon], map.getZoom());
                drawAllHeatPoints();
            }

            showHouses(start, end);
            addPagination();
            addFooter();
        }
        catch (error) {
            console.error("Error parsing cached data: ", error);
            fetchFreshData(currentPage);
        }
    } else {
        fetchFreshData(currentPage);
    }
}

// Fetch fresh house data
function fetchFreshData(page) {
    if (!isFirstLoad) return;
    const now = Date.now();

    fetch(`https://estate-insight-backend.onrender.com/api/houses?limit=200`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(fullObj => {
            totalPages = Math.ceil(parseInt(fullObj.count) / maxHouseCardsToShow);
            const data = fullObj.data;

            const { processed, centerLat, centerLon } = processHouseData(data, true);
            houseData = processed;

            if (!mapInitialized) {
                initializeMap(centerLat, centerLon);
                mapInitialized = true;
            } else {
                map.setView([centerLat, centerLon], map.getZoom());
                drawAllHeatPoints();
            }

            showHouses(start, end);
            addPagination();

            if (page === 1) {
                addFooter();
            }

            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                localStorage.setItem(CACHE_TIME_KEY, now.toString());
                localStorage.setItem("totalPages", totalPages.toString());
            }
            catch (e) {
                console.warn("Failed to cache data: ", e);
            }
        })
        .catch(err => {
            console.error('Error fetching house data:', err);
            if (!mapInitialized) {
                addFooter();
            }
        })
        .finally(() => isFirstLoad = false);
}

// Optimized bounds fetching
function fetchHousesForCurrentBounds() {
    // Prevent multiple concurrent requests
    if (isFetchingBounds) return;

    const reqId = ++lastReqId;
    const { minLat, maxLat, minLng, maxLng } = getBoundsParams();

    // Create cache key for bounds
    const boundsKey = `${minLat}-${maxLat}-${minLng}-${maxLng}`;

    const url = `https://estate-insight-backend.onrender.com/api/houses` +
        `?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`;

    isFetchingBounds = true;

    // Show loading indicator (optional)
    // showLoadingIndicator();

    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(fullObj => {
            // Ignore stale responses
            if (reqId !== lastReqId) return;

            totalPages = Math.ceil(parseInt(fullObj.count) / maxHouseCardsToShow);
            const data = fullObj.data;

            // Optimized: No need to calculate center for bounds updates
            const { processed } = processHouseData(data, false);
            houseData = processed;

            drawAllHeatPoints();

            start = 0;
            end = maxHouseCardsToShow;

            showHouses(start, end);
            addPagination();
        })
        .catch(err => {
            console.error("[Bounds Fetch] Error:", err);
            // Show error message to user (optional)
            // showErrorMessage("Failed to load houses for this area");
        })
        .finally(() => {
            if (reqId === lastReqId) {
                isFetchingBounds = false;
                // hideLoadingIndicator();
            }
        });
}