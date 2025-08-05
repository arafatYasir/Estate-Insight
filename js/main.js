// Event listener to show mobile menu options
let menuBtn = document.querySelector(".menu-btn");
let navOptions2 = document.querySelector(".nav-options2");
let crossBtn = document.querySelector(".cross");

menuBtn.addEventListener("click", () => {
    navOptions2.style.transform = "translateX(0%)";
})

crossBtn.addEventListener("click", () => {
    navOptions2.style.transform = "translateX(-100%)";
})