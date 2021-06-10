const allColumnsButton = document.getElementById('all-columns-button');

allColumnsButton.addEventListener("click", async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const data = {
    allColumns: true,
    activeColumns: '',
  };

  chrome.tabs.sendMessage(tab.id, data);
});

function buildButton(view) {
  const viewSelection = document.getElementById('view-selection');

  const selectViewButton = document.createElement('button');
  selectViewButton.textContent = view.name;
  selectViewButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const data = {
      allColumns: false,
      activeColumns: view.activeColumns,
    };

    chrome.tabs.sendMessage(tab.id, data);
  });

  viewSelection.appendChild(selectViewButton);
}

function loadViews() {
  chrome.storage.local.get("views", (result) => {
    result.views.forEach((view) => {
      buildButton(view);
    });
  });
}

loadViews();