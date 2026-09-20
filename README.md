# MAZAOHUB

Mazao Price Point is a Tanzania crop-price dashboard with a Node/Express API.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## API

- `GET /api/prices`
- `GET /api/prices?region=Mbeya`
- `GET /api/regions`
- `GET /api/dashboard`
- `POST /api/prices`

## Mazao AI Assistant

The Botpress assistant is available here:

[Open Mazao AI Assistant](https://viber.botpress.cloud/w/wkspace_01M2Y0RXWRP172V1Z3960G31K6/agent/36f91d47-a0a2-4751-b23a-b8d435da1196)

A repository shortcut is also available at `botpress-chat.html`.

## Deploy

Deploy as a Node web service with:

- Build command: `npm install`
- Start command: `npm start`
- Environment: Node.js

The app listens on the provider's `PORT` environment variable.
