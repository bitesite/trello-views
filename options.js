function buildTableRow(nameValue, activeColumnsValue) {
  const viewsTableBody = document.getElementById('views-table-body');

  const tableRow = document.createElement("tr");
  const nameCell = document.createElement("td");
  const nameInput = document.createElement("input");
  nameInput.setAttribute("type", "text");
  nameInput.value = nameValue;
  
  const activeColumnsCell = document.createElement("td");
  const activeColumnsInput = document.createElement("textarea");
  activeColumnsInput.value = activeColumnsValue;

  const actionsCell = document.createElement('td');
  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove';
  removeButton.classList.add('btn');
  removeButton.classList.add('btn-danger');
  removeButton.addEventListener('click', () => {
    tableRow.remove();
  });
  
  nameCell.appendChild(nameInput);
  activeColumnsCell.appendChild(activeColumnsInput);
  actionsCell.appendChild(removeButton);

  tableRow.appendChild(nameCell);
  tableRow.appendChild(activeColumnsCell);
  tableRow.appendChild(actionsCell);

  viewsTableBody.appendChild(tableRow);
};

function loadViews() {
  chrome.storage.local.get("views", (result) => {
    result.views.forEach((view) => {
      buildTableRow(view.name, view.activeColumns);
    });
  });
}

const addNewViewButton = document.getElementById('add-new-view');
const saveButton = document.getElementById('save');

addNewViewButton.addEventListener('click', () => {
  buildTableRow('', '');
});

saveButton.addEventListener('click', () => {
  const viewsTableBody = document.getElementById('views-table-body');
  const tableRows = viewsTableBody.querySelectorAll('tr');

  const views = [];

  tableRows.forEach((tableRow) => {
    const nameInput = tableRow.querySelector('input');
    const allColumnsTextArea = tableRow.querySelector('textarea');
    
    const name = nameInput.value;
    const activeColumns = allColumnsTextArea.value;

    views.push({ name, activeColumns });
  });
  chrome.storage.local.set({ views }, () => {
    alert("All changes saved.");
  });
});

loadViews();