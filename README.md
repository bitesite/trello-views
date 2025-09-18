# Trello Views

A chrome extension to present tailored views of your Trello boards.

# Installation

1. Download the latest `trello-views-extension.zip` from the GitHub release assets. If the newest tag is missing, grab the ZIP artifact from the latest `Package Extension` run on the Actions tab instead.
2. Extract the archive to a local folder.
3. In Chrome, open `chrome://extensions`, enable Developer Mode, click `Load unpacked`, and select the extracted folder.

# Usage

1. Open the extension's options page (link in the popup or from `chrome://extensions`).
2. Add one or more views with a name and comma-separated Trello column titles, then click `Save`.
3. Visit a Trello board and open the extension popup to pick a view or `All Columns`.
4. The extension remembers the last view per board and shows an `ON` badge when any lists are hidden.

# Deploying

Create a GitHub release (tag + publish) and the `Package Extension` workflow will attach a ready-to-upload `trello-views-extension.zip` asset. Download that archive and upload it to the Chrome Developer Console.
