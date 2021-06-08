chrome.runtime.onMessage.addListener(function (request) {
  const lists = document.querySelectorAll('.js-list');
  lists.forEach((list) => {
    const listContent = list.querySelector('.js-list-content');
    const listHeader = list.querySelector('h2');

    const activeColumnsArray = request.activeColumns.split(",").map(column => column.trim().toUpperCase());
    const shouldShow = request.allColumns || activeColumnsArray.includes(listHeader.textContent.trim().toUpperCase());

    if(shouldShow) {
      listContent.removeAttribute('style');
      list.removeAttribute('style');
    } else {
      listContent.style.display = "none";
      list.style.backgroundColor = '#dddddd';
      list.style.borderRadius = '5px';
      list.style.width = '10px';
    }
  });
});