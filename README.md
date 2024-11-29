# **Leap Green Preventive Maintenance App**

A **React Native** application designed for **preventive maintenance and checklist of windmills**, developed during an internship at Leap Green Industries. The app enables employees to efficiently track maintenance tasks, adhere to safety protocols, and document component changes.

This app was created by **PSG Institute of Technology and Applied Research Students** . Given by the company **LeapGreenEnergy** we take responsibility for the Project code
---

## **Table of Contents**
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Contributors](#contributors)

---

## **Overview**
The app simplifies the maintenance workflow by providing an intuitive interface for employees to:
- Access safety and general rules.
- Record maintenance tasks.
- Monitor progress with checklists.
- Store all data securely in **Firebase Firestore**.

The app is built with a focus on **scalability**, **usability**, and **performance**.

---

## **Features**
1. **Section Overview Screen:**
   - Displays sections like:
     - Safety Rules (Nacelle)
     - General Rules at Service Check (Nacelle)
   - Lists checklists for each section.

2. **Checklist Screen:**
   - Allows employees to:
     - Mark status.
     - Add remarks and updated remarks.
   - Syncs all data to **Firebase Firestore**.

3. **Checklist Management:**
   - Tracks progress for maintenance tasks.
   - Displays a tick mark when a section is completed.

4. **User-Friendly Interface:**
   - Built with **React Native Expo** for a seamless cross-platform experience.

---

## **Tech Stack**
- **Frontend:** React Native (Expo)
- **Backend:** Firebase Firestore
- **Programming Languages:** JavaScript
- **State Management:** React Hooks

---

## **Installation**

### **Prerequisites**
- Node.js (v14 or above)
- npm or yarn
- Expo CLI
- Firebase account with Firestore configured

### **Steps**
1. Clone the repository:
   ```bash
   git clone https://github.com/Arunganesh02/LeapGreenEnergy_PrevMain_PermitGen_Intern.git
   cd LeapGreenEnergy_PrevMain_PermitGen_Intern
2. Install dependencies:
npm install

3. Start the Expo development server:
npm start

4. run the app:
Use Expo Go (iOS/Android) to scan the QR code.

## Usage
1. Log in to the app (if authentication is required).
2. Navigate to the Section Overview Screen.
3. Select a section to view the checklist.
4. Update statuses and remarks as needed.
5. All changes are saved to Firebase Firestore automatically.

## Contributors

(in alphabetical order)

1. Arun Ganesh B
2. Kaviya
3. Pavithran G
4. Preethika
