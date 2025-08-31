let userName = document.querySelector("#userName");
let password = document.querySelector("#password");
let loginButton = document.querySelector(".btn-login");

let UserNameFeedback = document.querySelector(".UserNameFeedback");
let passwordFeedback = document.querySelector(".passwordFeedback");

userName.addEventListener("blur", () => {
  if (userName.value.trim() == "") {
    UserNameFeedback.style.display = "block";
  }
});
password.addEventListener("blur", () => {
  if (userName.value.trim() == "") {
    passwordFeedback.style.display = "block";
  }
});
// hide feedback when start enter text in input
userName.addEventListener("input", () => {
  UserNameFeedback.style.display = "none";
});
password.addEventListener("input", () => {
  passwordFeedback.style.display = "none";
});
// fetch employee data
const getEmployeesData = async () => {
  try {
    const response = await fetch("../data.json");
    const { employees } = await response.json();
    return employees;
  } catch (error) {
    console.error("Error loading employees data:", error);
  }
};
// handle submit
loginButton.addEventListener("click", async (e) => {
  e.preventDefault();
  let valid = true;
  if (userName.value == "") {
    UserNameFeedback.style.display = "block";
    valid = false;
  }

  if (password.value == "") {
    passwordFeedback.style.display = "block";
    valid = false;
  }
  if (!valid) return;

  const employees = await getEmployeesData();
  let foundUser = employees.find(
    (emp) =>
      emp.username === userName.value.trim() &&
      emp.password === password.value.trim()
  );
  if (foundUser) {
    localStorage.setItem("employee", JSON.stringify(foundUser));
    swal({
      title: "Login Successfully!",
      icon: "success",
      buttons: false,
      timer: 2000,
      content: {
        element: "div",
        attributes: {
          innerHTML:
            "<h3 style='text-align:center; font-size:18px; margin:0;'></h3>",
        },
      },
    });
    setTimeout(() => {
      window.location.replace(`${foundUser.role.toLowerCase()}.html`);
      userName.value = null;
      password.value = null;
    }, 2000);
  } else {
    swal({
      title: "Invalid username or password!",
      icon: "error",
      buttons: false,
      timer: 2000,
      content: {
        element: "div",
        attributes: {
          innerHTML:
            "<h3 style='text-align:center; font-size:18px; margin:0;'></h3>",
        },
      },
    });
  }
});

// redirect user to his age when he try to redirct login without logout
const employee = JSON.parse(localStorage.getItem("employee"));
if (employee.role) {
  window.location.replace(`${employee.role.toLowerCase()}.html`);
} else {
  window.location.replace(`login.html`);
}
