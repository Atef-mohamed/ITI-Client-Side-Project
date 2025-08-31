// auth.js

function checkAuth() {
  try {
    const employee = localStorage.getItem("employee");

    //if no employee object in localstorage >>>>>> redirect to login
    if (!employee) {
      window.location.replace("login.html");
    }
  } catch (err) {
    window.location.replace("login.html");
  }
}
checkAuth();

// back/forward
window.addEventListener("pageshow", checkAuth);

//if user return to tab
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkAuth();
});

//if windows foucs
window.addEventListener("focus", checkAuth);
