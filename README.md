# helios2email

NestJS background worker that reuses the Helios interface and Gmail sending approach from the example project, but implements the daginfo email flow from the supplied PHP script.

## What it does

Every day at **22:00** it:

1. Logs into Helios.
2. Finds subscribers among **instructors** and **administrators** where `EMAIL_DAGINFO = true`.
3. Checks the Helios audit log for changes in `oper_dagrapporten` for today.
4. Builds the daginfo email body using the logic from the PHP example.
5. Sends the email via Gmail API / Google Workspace delegation.

## Project structure

- `src/helios`: Helios API/login/base services.
- `src/google`: Gmail sending service.
- `src/daginfo`: Scheduler, content builder, and workflow service.
- `templates`: optional place for reusable email assets/templates.

## Setup

1. Copy `.env.example` to `.env` and fill in the values.
2. Copy `helios.account.json.example` to `helios.account.json` and fill in the Helios credentials.
3. Place your Google service account JSON at the path configured in `GOOGLE_CREDENTIALS_PATH`.
4. Install dependencies:

```bash
npm install
```

## Run locally

```bash
npm run start:dev
```

## Build

```bash
npm run build
npm start
```

## Notes

- The scheduler uses `CRON_TIMEZONE`, defaulting to `Europe/Amsterdam`.
- Email sending can be disabled with `VERZENDEN_EMAIL=false`.
- `DAGINFO_ALWAYS_TO` can be used to always include an additional recipient, separated by commas for multiple addresses.
- For privacy, the worker sends **one email per recipient**.
