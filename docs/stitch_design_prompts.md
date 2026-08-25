# Transitly — Google Stitch UI Design Prompts & Specifications

Use these prompts directly in **[Google Stitch](https://stitch.withgoogle.com)** to generate high-fidelity UI components and screens for Transitly.

---

## Screen 1: Real-Time Parcel Tracking & Driver Telematics (Rapido / inDrive Mobile)

```text
Design a modern, dark-themed mobile tracking screen for an intercity public transport parcel delivery app inspired by Rapido and inDrive. 

Layout & Components:
1. Fullscreen dark interactive map background with a blue route polyline connecting major highway bus terminals, waypoint pins, and an animated moving bus icon surrounded by a green pulsing radar glow.
2. Top floating glassmorphic header pill displaying the app name "⚡ TRANSITLY", an active route selector dropdown ("HR-DEL-CHD: Delhi ➔ Chandigarh"), and a glowing green "LIVE FAST PATH" status indicator.
3. Bottom floating sheet with rounded top corners (radius 24px) in slate dark color (#0F172A) featuring:
   - Hero stats bar with 4 cards: "ESTIMATED ARRIVAL: 35 MINS", "CURRENT SPEED: 72.0 KM/H", "REMAINING DISTANCE: 38.4 KM", and "DELIVERY OTP: 492817" highlighted in glowing green monospace font.
   - Driver & vehicle profile showing bus captain avatar, 4.9-star rating, vehicle number "HR-55-AB-1234", and a tamper-proof QR seal security badge "SEAL-EXPR-9B21 ✔ INTACT".
   - Vertical route timeline stepper with past stops checked in green, the current stop "Karnal Central Stand - APPROACHING NOW" in bright yellow with a bus icon, and upcoming destination terminal with a checkered flag.
   - Bottom action bar with a vibrant green "WhatsApp Assistant" button and a dark "Call Control Room" button.

Style: Ultra-clean, premium dark mode, Outfit and JetBrains Mono typography, vibrant cyan, yellow, and green accents.
```

---

## Screen 2: Multi-Modal Booking & Dual-Leg Feasibility Matrix

```text
Create a dark-mode multimodal cargo booking interface for public transport parcel delivery.

Left Column:
- Form divided into 3 clear steps: 1. Sender Pickup Address (with map pin input and phone number), 2. Intercity Corridor dropdown (e.g. Delhi to Chandigarh) with weight selector slider (up to 30kg), 3. Recipient Delivery Address.
- "Check Feasibility" outline button and glowing gradient "Create Booking" CTA button.

Right Column:
- Feasibility Matrix Resolver card with dynamic badge: "FULL_DOOR_TO_DOOR FEASIBLE" in emerald green.
- Visual diagram of 3 connected legs: First-Mile Partner Pickup (Uber Direct) ➔ Express Intercity Bus Cargo ➔ Last-Mile Partner Dropoff.
- Multi-leg transparent fare breakdown table totaling ₹450.00.

Style: Deep slate background, glassmorphism cards with fine 1px borders, modern typography, vibrant status badges.
```

---

## Screen 3: Digital QR Seal & OTP Custody Station (Driver / Custodian App)

```text
Design a mobile custody verification and delivery proof screen for bus drivers and delivery agents in dark theme.

Sections:
1. Chain of Custody Handoff Card:
   - Live QR barcode scanner viewport with animated scanning line and green corner brackets.
   - Custodian role selector (Transferring from "Sender" to "Bus Captain").
   - Monospace seal code input field with "Generate Random Seal" button.
   - Primary button "🔒 Record Cryptographic Handoff" with instant verified feedback banner.

2. Recipient OTP Delivery Station:
   - Big high-contrast 6-digit OTP entry boxes (spacing 12px) glowing green.
   - Recipient name input field.
   - "Verify OTP & Issue Proof of Delivery" button that triggers a green verified badge with timestamp and digital signature hash.

Style: Slate dark card (#1E293B), emerald green success states, JetBrains Mono font for hashes and codes.
```

---

## Screen 4: WhatsApp Parcel Assistant Widget (Smartphone Mockup)

```text
Design an interactive WhatsApp Business Assistant smartphone mockup for a logistics tracking bot.

Header:
- Dark WhatsApp header (#1E293B) with robot avatar, "Transitly Assistant", verified business checkmark, and green "Online" indicator.

Chat Conversation:
- Outgoing user bubble (#005C4B): "What are the intercity bus routes available?"
- Incoming bot bubble (#202C33): "🚍 Official Intercity Express Bus Corridors: 1. HR-DEL-CHD (Delhi ➔ Chandigarh, 8 stops, 500kg cargo) 2. HR-DEL-NRN (Delhi ➔ Narnaul) 3. HR-DEL-SRS (Delhi ➔ Sirsa). Reply *Book Cargo [Route ID]* to reserve."
- Another query: "Where is my parcel TRK-DEL-JAI-9876?" with privacy-redacted status card showing current state, destination, and seal verification.

Bottom:
- Horizontal scrollable suggestion chips ("🚍 Bus Routes", "📍 Track Parcel", "⏱️ Check ETA", "🏢 Terminal Pickup").
- Dark pill message input field with circular green send button.
```

---

## Screen 5: Fleet Operator Operations Portal (Desktop Dashboard)

```text
Create an enterprise dark-mode desktop dashboard for a public transport cargo operations center.

Layout:
1. Top navigation with brand logo, live system status, and user avatar.
2. KPI metrics row with 4 summary cards: "Active Fleet Vehicles: 24", "Cargo Capacity Utilized: 78%", "On-Time Dispatch Rate: 98.6%", and "Today's Cargo Revenue: ₹142,500".
3. Left Panel (65% width): Large interactive map showing multiple intercity bus routes across Delhi, Haryana, and Chandigarh with live vehicle icons and speed tags.
4. Right Panel (35% width): Two stacked tables:
   - Master Route Transactions table with columns: Route ID, Origin, Destination, Active Version, and Status badge.
   - Double-entry financial ledger stream showing Tracking ID, Entry Type (SHIPMENT_REVENUE), Debit, Credit, and Amount in INR.

Style: High-tech dark UI, glassmorphism cards, glowing data points, clean typography.
```
