# Xeno-CRM Channel Service

A standalone, self-contained microservice built with Node.js, Express, and TypeScript to simulate message dispatch (WhatsApp, SMS, Email, RCS) and trigger callback webhook events (delivered, failed, opened, clicked) with retry logic.

This service is a simulation tool for development and **never sends real messages**.

## What This Service Does
1. **Simulates Dispatch**: Receives request payload details via `/send` or `/bulk` endpoints.
2. **Immediate Responses**: Accepts requests, generates a UUID-based `externalId`, and replies immediately.
3. **Simulated Async Pipeline**: Uses timer chains to simulate messaging stages:
   * **Delivery check** (1-3 seconds): 90% success rate (`delivered` callback) vs 10% failure rate (`failed` callback).
   * **Open check** (5-15 seconds): 60% open rate (`opened` callback) if delivered.
   * **Click check** (10-20 seconds): 30% click rate (`clicked` callback) if opened.
4. **Webhook Callbacks**: Sends webhook event updates back to the CRM backend, complete with a retry mechanism (up to 3 attempts with progressive backoff delays: 1000ms, 2000ms, 4000ms).

> [!NOTE]
> **Scale Considerations**: In a production environment, in-memory `setTimeout` triggers are replaced by a robust job queue runner such as **BullMQ** backed by a **Redis** instance to survive application crashes and handle high delivery volumes.

---

## Environment Variables
Create a `.env` file in the root of this microservice (refer to `.env.example`):
* `PORT` (default: `3002`): The port on which this service runs.
* `SECRET`: Shared authorization secret validated in `X-Service-Secret` headers.

---

## How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (Nodemon + ts-node)
```bash
npm run dev
```

### 3. Build & Start Production Server
```bash
npm run build
npm start
```

---

## API Endpoints Reference

### 1. Health Check
* **Method**: `GET`
* **Route**: `/health`
* **Auth**: None
* **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-06-11T11:00:00.000Z",
    "service": "xenocrm-channel-service"
  }
  ```

### 2. Send Message
* **Method**: `POST`
* **Route**: `/send`
* **Auth**: Requires `X-Service-Secret` header
* **Payload**:
  ```json
  {
    "communicationId": "00000001-0000-0000-0000-000000000001",
    "recipientPhone": "+919900000001",
    "channel": "whatsapp",
    "message": "Hello Geetha, try our new filter coffee!",
    "callbackUrl": "http://localhost:3001/api/callbacks/delivery"
  }
  ```
* **Response**:
  ```json
  {
    "status": "accepted",
    "externalId": "23fa34b0-a50d-4009-b68e-e722c6c06a38"
  }
  ```

### 3. Bulk Send Message
* **Method**: `POST`
* **Route**: `/bulk`
* **Auth**: Requires `X-Service-Secret` header
* **Payload**:
  ```json
  {
    "sends": [
      {
        "communicationId": "00000001-0000-0000-0000-000000000001",
        "recipientPhone": "+919900000001",
        "channel": "whatsapp",
        "message": "Hello Geetha, try our new filter coffee!",
        "callbackUrl": "http://localhost:3001/api/callbacks/delivery"
      }
    ]
  }
  ```
* **Response**:
  ```json
  {
    "accepted": 1,
    "results": [
      {
        "communicationId": "00000001-0000-0000-0000-000000000001",
        "externalId": "dbf2f183-b78f-4ad1-9efb-fa399bc9c7e0"
      }
    ]
  }
  ```
