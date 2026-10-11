# ✈️ Viaggio Assistant

**Your Smart Visa & Passport Management Companion**

Viaggio Assistant is a web application designed to simplify visa and passport management. It helps users securely store their document details, track expiry dates, and monitor their visa application journey. With an integrated Telegram bot, users can conveniently access important information and receive timely reminders.

## ✨ Features

* **📄 Passport Management:** Save passport numbers and expiry dates.
* **🛂 Visa Management:** Store visa numbers and monitor visa expiry dates.
* **🔔 Expiry Reminders:** Get timely reminders about upcoming visa and passport expirations.
* **🌍 Visa Journey Tracking:** Track visa application progress and status.
* **🤖 Telegram Bot Integration:** Interact with `@VisaAI_Bot` through Telegram to access saved information and reminders.

## 🛠️ Tech Stack

* **Frontend:** Web technologies (HTML, CSS, JavaScript, or React, depending on the implementation)
* **Backend & Database:** Supabase
* **Notifications & Interaction:** Telegram Bot API
* **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

* Node.js and npm
* A Supabase account
* A Telegram bot created using BotFather

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```

2. Navigate to the project directory:

   ```bash
   cd viaggio-assistant
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure your environment variables using a `.env` file. Add the required Supabase credentials and other configuration values expected by your application.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL displayed in your terminal.

## 🤖 Telegram Bot

Search for `@VisaAI_Bot` on Telegram and use the `/start` command to begin interacting with the bot.

Available commands may include:

* `/start` — Start the assistant.
* `/visa` — View saved visa details.
* `/passport` — View saved passport details.
* `/journey` — Check visa journey information.

## 🔐 Security

* Keep API keys, bot tokens, and database credentials private.
* Use appropriate Supabase Row Level Security (RLS) policies to protect user data.
* Never expose service-role keys or other privileged credentials in frontend code.
* Collect and store passport and visa information only with appropriate user consent and safeguards.

## 🎯 Project Goal

To make visa and passport management simpler through document tracking, expiry reminders, and convenient Telegram integration.

---

**Viaggio Assistant — Manage your documents. Track your journey. Travel with confidence.**
