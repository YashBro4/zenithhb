# Project Architecture Rules

- Keep Arc Mode isolated as a dashboard view and persist its validated, versioned state in localStorage so guest use works without changing the shared account-data schema.