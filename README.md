<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# Thermo-Stabilizer 9000 // The Inverse Fan Paradox 🎯

## Basic Details
### Team Name: Thermo-Stabilizers

### Team Members
- Team Lead: Kailasnath T - Sahrdaya Collage Of Englineering and Technology
- Member 2: Gauri Santosh Nair - Sahrdaya Collage Of Englineering and Technology

### Project Description
Thermo-Stabilizer 9000 is an inversely coupled anti-cooling system that optically tracks real-world room fans via webcam and drives a desktop virtual fan—plus your laptop's physical cooling fan—at an inversely proportional speed to spitefully preserve cosmic room heat.

### The Problem (that doesn't exist)
Every summer, humans commit thermal treason by turning on electric fans, cooling rooms down and dissipating warmth from the universe. Entropy drops, rooms become unpleasantly chilly, and cosmic warmth is wasted. Nobody was brave enough to protect room heat from being destroyed by fans.

### The Solution (that nobody asked for)
According to the **First Law of Fan Spite**:
$$V_{\text{virtual}} = \max(0, 1.0 - V_{\text{real}})$$

- **When your Real Fan is on MAXIMUM (Hot Summer Day / 600+ RPM):**  
  The virtual fan halts or stumbles at a pathetic **0 RPM**, puffing comic smoke puffs, while your real physical laptop fan throttles down to an idle whisper to trap internal CPU heat inside your room.
- **When your Real Fan is OFF (Cold Room / 0 RPM):**  
  The virtual fan freaks out and spins at **3,200 RPM Turbo Overdrive**, howling with screaming procedural jet engine noise, while your laptop's real hardware fan screams at **100% full power** to dissipate nonexistent heat!
- **Desktop PiP Widget:**  
  Pop out the virtual fan into an OS-level floating Picture-in-Picture window that stays on top of your screen while you code or work!

---

## Technical Details
### Technologies/Components Used
For Software:
- **Languages:** JavaScript (ES6+), Python 3, GLSL / Canvas 2D
- **Frameworks:** React 19, Vite, Tailwind CSS v4
- **Libraries:** Web Audio API (procedural synthesis), Lucide React, OpenCV (`cv2`), NumPy, Canvas-Confetti
- **Tools:** NoteBook FanControl (`nbfc`), Linux Embedded Controller (`dev_port`), Git, Node.js

For Hardware:
- **Main components:** Laptop with Embedded Controller (EC) fan registers (tested on Acer Aspire Lite AL15-41), integrated/USB webcam, internal laptop cooling fan
- **Specifications:** AMD Ryzen APU / ACPI EC fan write register access via NBFC
- **Tools required:** Linux kernel (Fedora/Ubuntu/Debian) with `nbfc-linux` daemon, built-in webcam

---

### Implementation
For Software:

# Installation
```bash
# Clone the repository
git clone https://github.com/1kailas/useless_project_temp.git
cd useless_project_temp

# Install web application dependencies
npm install
```

# Run
```bash
# Option 1: Run the Web Application with Live Hardware Fan Coupling
npm run dev
# Open http://localhost:5173 in your browser

# Option 2: Run the Standalone Python OpenCV Desktop App
python3 anti_fan_cv.py
```

---

### Project Documentation
For Software:

# Screenshots (Add at least 3)
![Screenshot1](https://via.placeholder.com/800x450.png?text=Dashboard+Overview)
*Real-time neobrutalist dashboard displaying webcam optical tachometer, inverse screen fan, and physical laptop hardware EC link telemetry.*

![Screenshot2](https://via.placeholder.com/800x450.png?text=Turbo+Overdrive+100%25)
*Virtual fan and real laptop cooling fan spooling up to 100% Turbo Overdrive when room fan is stopped.*

![Screenshot3](https://via.placeholder.com/800x450.png?text=Floating+Desktop+Widget)
*Picture-in-Picture floating fan widget pinned on top of IDE and desktop applications while coding.*

# Diagrams
```
┌───────────────────────┐
│ Real Room Ceiling Fan │
└──────────┬────────────┘
           │ (Webcam Video Stream)
           ▼
┌────────────────────────────────────────┐
│ Optical Tachometer (Autocorrelation)   │
└──────────┬─────────────────────────────┘
           │ Real Fan Speed (0% - 100%)
           ▼
┌────────────────────────────────────────┐
│ Inverse Spite Engine: V = 100% - Real  │
└─────┬───────────────────────────┬──────┘
      │                           │
      ▼                           ▼
┌───────────────────────┐   ┌────────────────────────┐
│ Pinned Virtual Fan    │   │ Vite Hardware EC API   │
│ - 60fps Canvas        │   │ (/api/laptop-fan)      │
│ - Procedural Audio    │   └───────────┬────────────┘
│ - PiP Floating Widget │               │
└───────────────────────┘               ▼
                            ┌────────────────────────┐
                            │ NoteBook FanControl    │
                            │ (nbfc service daemon)  │
                            └───────────┬────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │ Physical Laptop Fan    │
                            │ (100% Full Hardware)   │
                            └────────────────────────┘
```
*End-to-end signal architecture from webcam optical tracking to physical embedded controller fan speed modulation.*

For Hardware:

# Schematic & Circuit
![Circuit](https://via.placeholder.com/800x450.png?text=Embedded+Controller+EC+Link)
*Laptop motherboard Embedded Controller (EC) fan PWM control bus via NBFC dev_port.*

![Schematic](https://via.placeholder.com/800x450.png?text=System+Block+Diagram)
*System block diagram connecting camera sensor input, software inverse calculation, and CPU fan PWM registers.*

# Build Photos
![Components](https://via.placeholder.com/800x450.png?text=Laptop+Hardware+%26+Fan)
*Physical Acer Aspire Lite AL15-41 laptop chassis and internal CPU blower fan.*

![Build](https://via.placeholder.com/800x450.png?text=Calibration+and+Testing)
*Webcam optical tracking calibration and acoustic noise testing of turbine audio.*

![Final](https://via.placeholder.com/800x450.png?text=Final+System+Running)
*Final running setup showing live webcam feed, spinning side fan, and laptop fan at 100% thrust.*

---

### Project Demo
# Video
[Add your demo video link here](https://github.com/1kailas/useless_project_temp)
*Demonstrates the optical tachometer tracking a room fan, inverse virtual fan animation, procedural jet turbine audio, and real physical laptop fan throttling.*

# Additional Demos
- **Picture-in-Picture Desktop Widget**: Pop the fan out into an OS-level floating window that remains on top of all your applications.
- **Python OpenCV Companion**: Standalone `anti_fan_cv.py` with keyboard controls (`s` for demo simulation, `h` for hardware sync, `a` for BIOS auto reset, `q` to quit).

---

## Team Contributions
- **Kailasnath T**: End-to-end architecture & implementation: Optical computer vision tachometer, React 19 neobrutalist UI, Web Audio procedural engine, and NBFC Linux hardware EC integration.
- **[Member 2]**: [Specific contributions]
- **[Member 3]**: [Specific contributions]

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
