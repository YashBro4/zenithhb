# ZenFlow Tracker

Role: Expert Full-stack Developer and UI/UX Designer.

Project: A high-end, aesthetic Habit & Productivity Tracker.

1. Authentication & User Management

 * Integrate Supabase Auth to allow users to sign in via Gmail (Google OAuth) and a Guest Mode (using local storage or anonymous sign-in).

 * Create a user profile to store individual habit data and statistics.

2. Core Features & Structure

 * Dual-Section Dashboard: Create a toggle or split-view for two distinct sections:

   * Monthly Habit Tracker: Persistent tasks that repeat every day for the entire month. Users can add unlimited habits here. Use a grid or heat-map style view for the month.

   * Daily To-Do List: Unique tasks specific only to the current day.

 * Selection Logic: Allow users to focus on "Habits Only," "To-Dos Only," or "Combined View."

 * Completion Mechanics: Use interactive checkboxes for every item. When a task/habit is checked, trigger a subtle "haptic" animation.

3. Analytics & Statistics

 * Create a dedicated Stats Tab featuring:

   * Monthly Progress: A circular or bar chart showing the percentage of habits completed.

   * Yearly Overview: A "GitHub-style" contribution heat map showing consistency over the year.

   * Use Recharts or Chart.js for clean, interactive visualizations.

4. Motivation Engine

 * Implement a logic where, upon reaching 80% or higher completion of the daily habits, a modal or "Toast" notification appears with an aesthetic, high-quality motivational quote.

5. Design Aesthetic

 * Style: Modern, minimalist, and "Zen" aesthetic.

 * Colors: Soft neutrals (creams, slate grays, or sage greens) with high-quality typography (Inter or Playfair Display).

 * UI Components: Use Shadcn/UI and Tailwind CSS. Ensure the interface feels spacious with plenty of padding and rounded corners (glassmorphism).

6. Tech Stack

 * React, Vite, Tailwind CSS, Lucide Icons, and Supabase for the backend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zenithhb.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/025b5b7f-d701-4ccb-9cdb-34f3372b7273).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
