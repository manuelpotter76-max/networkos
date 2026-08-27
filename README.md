# NetworkOS V1 Prototype

A functional front-end prototype for the first NetworkOS networking loop.

## Included in this build

- Action-first Home dashboard
- My Network contact/relationship view
- Person relationship profile
- Events list
- Tampa event networking plan
- Explainable attendee recommendations
- Mobile-oriented Event Mode
- Quick relationship capture prototype
- Post-event recap
- Introductions / Connections
- Early Network Insights
- Ask NetworkOS demo search
- Responsive desktop/mobile UI

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Recommended first test

1. Open **Events**.
2. Open **Tampa Business After Hours**.
3. Review the recommended people.
4. Click **Enter Event Mode**.
5. Mark Jessica as met.
6. Click **Quick voice note**.
7. Load the sample note and save it.
8. Finish the event.
9. Review the post-event recap and introduction workflow.

## Important

This is V1 prototype data only. Google/Microsoft contacts, calendars, real voice transcription, attendee imports, authentication, PostgreSQL, and live AI recommendation/extraction services are intentionally not wired yet.

The next engineering phase is to replace the in-memory demo data in `lib/demo.ts` with the real NetworkOS API and database schema.
