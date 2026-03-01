# Upgrade to SQL backend

## Overview

This is a plan to perform an upgrade that will allow for grocery lists to be stored on a central server instead of locally on the phone.

This will enable better synchronization of list items and simultaneous list completion.

## Components

A free SQL server will need to be identified and deployed within Azure.

The client-side stack will remain the same.

## Design Details

### SQL

The SQL server will need to save lists by List ID.

Each item will be related to the List ID. Each item will contain a unique item ID, order/position, desired quantity, and status (completed, pending).

Deleting an item from the client-side list will remove the row from the DB.

Completing an item on the client will mark it completed in the DB.

Renaming an item on the client will rename the item in the DB, but the item ID will remain the same.

Marking the item as "pending" on the client will mark it as pending in the DB.

Changing the item's position on the client will update the order number in the DB.

### Client

The client will need to be updated in a few ways:

- For server-side lists:
  - Periodically check the server and update the local items to reflect any server-side changes.
  - Send new items to the server.
  - Send name, quantity, or position changes to the server.
- Still allow local-only lists.
- The contents of server-side lists should not be saved locally. Only the list ID and an indicator that it is a server-side list should be stored.
- Provide an indicator whether the list is server-side or locally stored.
- Allow the user to choose whether a new list is local or server-side.
- Allow a locally stored list to be uploaded to the server. When the list is successfully uploaded, the local copy must be removed.
- The share link for a list must indicate that it is SQL/server-stored. Importing such lists must be handled differently.

### Authentication

No authentication will be required; only the link is needed.
