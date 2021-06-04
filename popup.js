// Initialize button with user's preferred color
const selectViewButtons = document.querySelectorAll('.select-view-button')

// When the button is clicked, inject setPageBackgroundColor into current page
selectViewButtons.forEach((selectViewButton) => {
  selectViewButton.addEventListener("click", async (e) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id},
      function: setView,
    });
  });
});

function setView() {
  const lists = document.querySelectorAll('.js-list');
  lists.forEach((list) => {
    const listContent = list.querySelector('.js-list-content');
    const listHeader = list.querySelector('h2');

    if(listHeader.textContent === 'Incoming Feedback') {
      listContent.style.display = "none";
      list.style.backgroundColor = '#dddddd';
      list.style.borderRadius = '5px';
      list.style.width = '10px';
    }

  });
}