# Project Architecture Rules

- Keep Arc Mode isolated as a dashboard view and persist its validated, versioned state in localStorage so guest use works without changing the shared account-data schema.
- Keep timetable alert preferences local and use the existing push scheduler for background delivery, with service-worker notifications as the foreground fallback, so guest use needs no shared account-data changes.