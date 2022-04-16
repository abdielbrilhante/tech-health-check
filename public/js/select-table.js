function setSelectedState(checkbox) {
  const row = checkbox.parentElement.parentElement;
  if (checkbox.checked) {
    row.setAttribute("data-selected", "");
  } else {
    row.removeAttribute("data-selected");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const [selectAll] = document.querySelectorAll(".selection-manager button");
  const checkboxes = document.querySelectorAll('table input[type="checkbox"]');

  for (const checkbox of checkboxes) {
    checkbox.addEventListener("change", () => {
      setSelectedState(checkbox);
    });
  }

  selectAll.addEventListener("click", () => {
    for (const checkbox of checkboxes) {
      checkbox.checked = true;
      setSelectedState(checkbox);
    }
  });
});
