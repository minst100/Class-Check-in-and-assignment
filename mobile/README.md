# Class Check-in Mobile (React Native / Expo)

Implemented features:

1. **Offline cache for pending check-ins and leave requests** via AsyncStorage-backed queue.
2. **Foreground/background-style sync queue with conflict handling** through `syncQueue()` and stale client-version conflict retention.
3. **GPS permission flow and one-time location capture** using Expo Location before submission.
4. **QR scanner integration** with Expo Barcode Scanner for session token scan.
5. **Attendance summary + notifications** in dedicated tabs.
6. **Language switch (Thai/English)** and low-bandwidth UI choices (no large assets/charts).
7. **Privacy-safe device fingerprint signal generation** from coarse device metadata hashed locally.

## Run

```bash
cd mobile
npm install
npm run start
```
