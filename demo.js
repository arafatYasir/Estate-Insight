let filterDropdowns = document.querySelectorAll(".custom-dropdown");
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
        input.style.background = `
            linear-gradient(to right,
            var(--accent-yellow) 0%,
            var(--accent-yellow) ${value}%,
            var(--background-light) ${value}%,
            var(--background-light) 100%)
        `;
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