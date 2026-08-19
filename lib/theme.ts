const theme = () => {
  const html = document.querySelector("html");
  const currentMode = localStorage.getItem("theme");
  if (currentMode === "dark") {
    html.classList.add("dark");
  } else if (currentMode === "light") {
    html.classList.remove("dark");
  }

  const themeController = document.querySelector(".theme-controller");
  if (!themeController) return;
  themeController.addEventListener("click", function () {
    html.classList.toggle("dark");
    const isDark = html.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
};

export default theme;
