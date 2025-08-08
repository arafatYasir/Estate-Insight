// Event listener to show mobile menu options
let menuBtn = document.querySelector(".menu-btn");
let searchIconBtn = document.querySelector(".search-icon-btn");
let crossBtn = document.querySelector(".cross");
let backBtn = document.querySelector(".back-btn");
let logo = document.querySelector(".logo");
let navOptions2 = document.querySelector(".nav-options2");
let searchBox = document.querySelector(".search-box");
let mobileSpecialNav = document.querySelector(".mobile-special-nav");
let filterDropdowns = document.querySelectorAll(".custom-dropdown");

// Event listener to close dropdowns on the click of outside the box
window.addEventListener("click", (e) => {
    filterDropdowns.forEach(dropdown => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    })
})

// Responsive Navbar
menuBtn.addEventListener("click", () => {
    navOptions2.style.transform = "translateX(0%)";
})

crossBtn.addEventListener("click", () => {
    navOptions2.style.transform = "translateX(-100%)";
})

searchIconBtn.addEventListener("click", () => {
    searchBox.style.display = "flex";
    searchBox.style.gap = "10px"
    searchBox.style.justifyContent = "start";
    mobileSpecialNav.style.display = "none";
})

backBtn.addEventListener("click", () => {
    searchBox.style.display = "none";
    mobileSpecialNav.style.display = "flex";
})


// Custom Filter Dropdowns
filterDropdowns.forEach(dropdown => {
    const selected = dropdown.querySelector(".custom-dropdown-selected");
    const options = dropdown.querySelector(".custom-dropdown-options");

    selected.addEventListener("click", () => {
        // Closing other dropdowns

        document.querySelectorAll(".custom-dropdown").forEach(d => {
            if (d !== dropdown) d.classList.remove("active");
        });
        dropdown.classList.toggle("active");
    })

    options.querySelectorAll("li").forEach(option => {
        option.addEventListener("click", () => {
            selected.innerHTML = option.innerHTML;
            dropdown.classList.remove("active");
            dropdown.setAttribute("data-selected", option.dataset.value);
        })
    })
})


// Mobile Filter Dropdowns
const mobileFilterBtn = document.querySelector(".mobile-filter-btn");
const filterModal = document.querySelector(".filter-modal");
const filterOverlay = document.querySelector(".filter-modal-overlay");
const dragBarContainer = document.querySelector('.drag-bar-container');

let startY, currentY, isDragging = false;

mobileFilterBtn.addEventListener("click", () => {
    filterOverlay.style.display = "block";
    setTimeout(() => {
        filterModal.classList.add("show");
        mobileFilterBtn.style.display = "none";
    }, 10);
});

// Drag Down to Close
dragBarContainer.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
});

dragBarContainer.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0) {
        filterModal.style.transform = `translateY(${deltaY}px)`;
    }
});

dragBarContainer.addEventListener("touchend", () => {
    isDragging = false;

    // If user didn’t move finger enough, do nothing
    if (typeof currentY !== "number") {
        filterModal.style.transform = "";
        return;
    }

    const deltaY = currentY - startY;

    if (deltaY > 120) {
        closeFilterModal();
    } else {
        filterModal.style.transform = "";
    }

    // Reset for next interaction
    currentY = undefined;
});


// Close when clicking outside the drawer
filterOverlay.addEventListener("click", (e) => {
    if (e.target === filterOverlay) {
        closeFilterModal();
    }
});

// Close function for modal
function closeFilterModal() {
    filterModal.classList.remove("show");
    filterModal.style.transform = "";
    filterOverlay.style.display = "none";
    mobileFilterBtn.style.display = "block";
}

// Switching from map to list for mobile and tablet
const realMap = document.querySelector("#map");
const houseContainer = document.querySelector(".house-container");
const switchToListBtn = document.querySelector(".switch-to-list");
const switchToMapBtn = document.querySelector(".switch-to-map");
const tooltip = document.getElementById('tooltip');

switchToListBtn.addEventListener("click", () => {
    realMap.style.display = "none";
    houseContainer.style.display = "block";
    switchToListBtn.style.display = "none";
    switchToMapBtn.style.display = "inline";
    mobileFilterBtn.style.display = "inline";
    tooltip.style.display = "none";
})

switchToMapBtn.addEventListener("click", () => {
    realMap.style.display = "block";
    houseContainer.style.display = "none";
    switchToListBtn.style.display = "inline";
    switchToMapBtn.style.display = "none";
    mobileFilterBtn.style.display = "none";
});

// ----Beds & Baths Custom Slider Range----
document.addEventListener("DOMContentLoaded", () => {
    function updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected) {
        const beds = bedsSlider.value;
        const baths = bathsSlider.value;

        bedsValue.innerHTML = beds;
        bathsValue.innerHTML = baths;

        if (beds == 0 && baths == 0) {
            selected.innerHTML = "Any";
        }
        else {
            selected.innerHTML = `${beds} Bed${beds > 1 ? "s" : ""}, ${baths} Bath${baths > 1 ? "s" : ""}`;
        }
    }

    function updateRangeFill(input) {
        const value = (input.value - input.min) / (input.max - input.min) * 100;
        input.style.background = `linear-gradient(to right,
      var(--accent-yellow) 0%,
      var(--accent-yellow) ${value}%,
      var(--background-light) ${value}%,
      var(--background-light) 100%)`;
    }

    const dropdown = document.querySelectorAll('.custom-dropdown[data-name="bedsBaths"]');

    dropdown.forEach(d => {
        const selected = d.querySelector(".custom-dropdown-selected");
        const bedsSlider = d.querySelector("#bedsRange");
        const bathsSlider = d.querySelector("#bathsRange");
        const bedsValue = d.querySelector("#bedsValue");
        const bathsValue = d.querySelector("#bathsValue");

        bedsSlider.addEventListener("input", () => updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected));
        bathsSlider.addEventListener("input", () => updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected));

        // Initial Call
        updateBedsBathsSlider(bedsSlider, bathsSlider, bedsValue, bathsValue, selected);

        // Apply it to both sliders
        [bedsSlider, bathsSlider].forEach(slider => {
            updateRangeFill(slider);
            slider.addEventListener('input', () => updateRangeFill(slider));
        });
    })
})


// ----Price Dropdown Custom Slider----
document.addEventListener("DOMContentLoaded", () => {
    function updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown) {
        let minVal = parseInt(minInput.value);
        let maxVal = parseInt(maxInput.value);

        if (minVal > maxVal) {
            // Prevent crossing over
            [minInput.value, maxInput.value] = [maxVal, minVal];
            [minVal, maxVal] = [maxVal, minVal];
        }

        // Calculate percentage positions
        const minPercent = ((minVal - min) / (max - min)) * 100;
        const maxPercent = ((maxVal - min) / (max - min)) * 100;

        // Update fill bar
        fill.style.left = `${minPercent}%`;
        fill.style.width = `${maxPercent - minPercent}%`

        // Update value display
        minValueEl.innerHTML = `$${Number(minVal).toLocaleString()}`;
        maxValueEl.innerHTML = `$${Number(maxVal).toLocaleString()}`;
        selectedPriceDropdown.innerHTML = `$${parseInt(minVal).toLocaleString()} - $${parseInt(maxVal).toLocaleString()}`;
    }

    const dropdown = document.querySelectorAll('.custom-dropdown[data-name="price"]');


    dropdown.forEach(d => {
        const minInput = d.querySelector("#minPrice");
        const maxInput = d.querySelector("#maxPrice");
        const selectedPriceDropdown = d.querySelector(".custom-dropdown-selected");

        selectedPriceDropdown.innerHTML = `$${parseInt(minInput.value).toLocaleString()} - $${parseInt(maxInput.value).toLocaleString()}`;

        // Inject range-fill into the DOM dynamically
        const rangeWrapper = d.querySelector(".price-range-slider-wrapper");
        let fill = document.createElement("div");
        fill.classList.add("range-fill");
        rangeWrapper.appendChild(fill);


        const minValueEl = d.querySelector("#minPriceValue");
        const maxValueEl = d.querySelector("#maxPriceValue");

        const min = parseInt(minInput.min);
        const max = parseInt(maxInput.max);

        minInput.addEventListener("input", () => updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown));
        maxInput.addEventListener("input", () => updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown));

        // Initial update on load
        updateRange(min, max, minInput, maxInput, fill, minValueEl, maxValueEl, selectedPriceDropdown);
    })
});
