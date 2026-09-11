#!/usr/bin/env python3
"""
Thermo-Stabilizer 9000 // Python OpenCV Edition (Simple & Accurate)
The Inversely Coupled Thermal Equilibrium Anti-Fan

Uses a circular optical tachometer to measure blade rotations accurately.
Click on the fan center in the camera window to lock the tachometer ring!
"""

import cv2
import numpy as np
import time
import math
import subprocess
import shutil
import re
import atexit

class AntiFanCV:
    def __init__(self, camera_index=0):
        self.cap = cv2.VideoCapture(camera_index)
        self.is_camera_open = self.cap.isOpened()
        if not self.is_camera_open:
            print("[!] Warning: Could not open camera. Running in Demo / Sim Mode.")
            self.sim_mode = True
        else:
            print("[+] Camera initialized successfully.")
            self.sim_mode = False

        self.sim_speed = 0.6
        self.prev_gray = None

        # Hardware Laptop Fan (NBFC) Controller
        self.nbfc_available = shutil.which("nbfc") is not None
        self.laptop_sync_enabled = True
        self.last_sent_laptop_speed = None
        self.last_nbfc_set_time = 0
        self.last_temp_poll_time = 0
        self.cpu_temp = "--"
        self.laptop_model = "Acer Laptop"
        if self.nbfc_available:
            print("[+] NoteBook FanControl (NBFC) detected! Physical laptop fan sync ENABLED.")
            self.poll_laptop_status(force=True)
            atexit.register(self.restore_laptop_fan)
        else:
            print("[-] NoteBook FanControl (NBFC) not found. Running in hardware simulation.")

        # Circular tachometer target (cx, cy, radius in normalized coords)
        self.target_cx = 0.5
        self.target_cy = 0.45
        self.target_r = 0.28
        self.num_samples = 32

        # Temporal signal history for frequency calculation
        self.history_len = 60
        self.signal_history = []

        self.smoothed_speed = 0.0
        self.smoothed_rpm = 0.0

        # Virtual fan animation state
        self.virtual_angle = 0.0
        self.virtual_speed = 1.0
        self.last_time = time.time()

        self.window_name = "THERMO-STABILIZER 9000 // Inverse Fan"
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        cv2.setMouseCallback(self.window_name, self.on_mouse)

    def restore_laptop_fan(self):
        """Restores laptop fan to default BIOS automatic control."""
        if self.nbfc_available:
            try:
                subprocess.run(["nbfc", "set", "-a"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=2)
                print("\n[+] Restored laptop hardware fan to default BIOS auto control.")
            except Exception:
                pass

    def sync_laptop_fan(self, virt_speed):
        """Synchronizes real laptop hardware fan with virtual fan speed."""
        if not self.nbfc_available or not self.laptop_sync_enabled:
            return

        target_pct = int(round(max(0.0, min(1.0, virt_speed)) * 100))
        now = time.time()

        # Skip if no significant change or if called too frequently
        if self.last_sent_laptop_speed is not None and abs(self.last_sent_laptop_speed - target_pct) < 2:
            return
        if now - self.last_nbfc_set_time < 0.35:
            return

        self.last_sent_laptop_speed = target_pct
        self.last_nbfc_set_time = now
        try:
            subprocess.run(["nbfc", "set", "-s", str(target_pct)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=2)
        except Exception as e:
            print(f"[!] Fan sync error: {e}")

    def poll_laptop_status(self, force=False):
        """Periodically polls NBFC for live CPU temperature and config."""
        if not self.nbfc_available:
            return
        now = time.time()
        if not force and (now - self.last_temp_poll_time < 2.5):
            return
        self.last_temp_poll_time = now
        try:
            res = subprocess.check_output(["nbfc", "status"], text=True, timeout=2)
            temp_m = re.search(r"Temperature\s*:\s*([\d\.]+)", res)
            if temp_m:
                self.cpu_temp = f"{float(temp_m.group(1)):.1f}"
            cfg_m = re.search(r"Selected Config Name\s*:\s*(.+)", res)
            if cfg_m:
                self.laptop_model = cfg_m.group(1).strip()
        except Exception:
            pass

    def on_mouse(self, event, x, y, flags, param):
        """Click on the camera feed to center the tachometer ring."""
        if event == cv2.EVENT_LBUTTONDOWN:
            cam_w = 640
            if x < cam_w:
                self.target_cx = max(0.1, min(0.9, x / cam_w))
                self.target_cy = max(0.1, min(0.9, y / 480))
                print(f"[*] Locked tachometer ring to: ({self.target_cx:.2f}, {self.target_cy:.2f})")

    def draw_virtual_fan(self, panel, cx, cy, radius, speed, dt):
        """Draws animated spinning virtual fan on the pinned side."""
        max_rate = 35.0
        self.virtual_angle = (self.virtual_angle + speed * max_rate * dt) % (2 * math.pi)

        # Base and stand
        cv2.ellipse(panel, (cx, cy + radius + 40), (int(radius * 0.5), 16), 0, 0, 360, (50, 50, 60), -1)
        cv2.line(panel, (cx, cy), (cx, cy + radius + 40), (70, 70, 80), 8)

        # Outer cage
        cage_color = (220, 180, 50) if speed > 0.4 else (80, 80, 220)
        cv2.circle(panel, (cx, cy), radius, cage_color, 3)

        # Radial wire spokes
        for i in range(12):
            ang = i * (2 * math.pi / 12)
            px = int(cx + math.cos(ang) * radius)
            py = int(cy + math.sin(ang) * radius)
            cv2.line(panel, (cx, cy), (px, py), (60, 60, 70), 1)

        # Blades (3 blades)
        blade_len = int(radius * 0.82)
        blade_w = int(radius * 0.28)
        for i in range(3):
            blade_ang = self.virtual_angle + i * (2 * math.pi / 3)
            bx = cx + math.cos(blade_ang) * (blade_len * 0.5)
            by = cy + math.sin(blade_ang) * (blade_len * 0.5)
            ang_deg = math.degrees(blade_ang)

            blade_col = (240, 180, 50) if speed > 0.4 else (80, 80, 220)
            cv2.ellipse(panel, (int(bx), int(by)), (int(blade_len * 0.45), blade_w), ang_deg, 0, 360, blade_col, -1)

        # Hub
        cv2.circle(panel, (cx, cy), int(radius * 0.22), (30, 30, 40), -1)
        cv2.circle(panel, (cx, cy), int(radius * 0.22), cage_color, 2)
        txt = "STALL" if speed < 0.05 else "VIRT"
        cv2.putText(panel, txt, (cx - 18, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        # Wind streaks
        if speed > 0.1:
            for _ in range(int(speed * 8)):
                py = int(cy + (np.random.rand() - 0.5) * radius * 1.5)
                px = int(cx - np.random.rand() * radius * 1.2)
                cv2.line(panel, (px, py), (max(10, px - int(speed * 30 + 5)), py), (220, 220, 255), 1)

    def run(self):
        print("\n" + "=" * 60)
        print("  THERMO-STABILIZER 9000 (Simple & Accurate Edition)")
        print("  - Click on the fan hub in the camera window to lock ring.")
        print("  - [q] Quit  |  [s] Toggle Demo Mode  |  [+] / [-] Speed")
        print("=" * 60 + "\n")

        cam_w, cam_h = 640, 480
        panel_w = 320

        while True:
            t = time.time()
            dt = max(0.001, t - self.last_time)
            self.last_time = t

            if not self.sim_mode and self.cap.isOpened():
                ret, frame = self.cap.read()
                if not ret:
                    frame = np.zeros((cam_h, cam_w, 3), dtype=np.uint8)
                else:
                    frame = cv2.resize(frame, (cam_w, cam_h))
                    frame = cv2.flip(frame, 1)
            else:
                frame = np.zeros((cam_h, cam_w, 3), dtype=np.uint8)
                cv2.putText(frame, "DEMO MODE ACTIVE", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)
                cv2.putText(frame, f"Simulated Speed: {int(self.sim_speed*100)}% ([+] / [-])", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)

                # Draw simulated spinning fan
                sim_cx = int(self.target_cx * cam_w)
                sim_cy = int(self.target_cy * cam_h)
                sim_r = int(self.target_r * min(cam_w, cam_h))
                sim_ang = (t * self.sim_speed * 35.0) % (2 * math.pi)
                for b in range(3):
                    ang = sim_ang + b * (2 * math.pi / 3)
                    bx = int(sim_cx + math.cos(ang) * sim_r)
                    by = int(sim_cy + math.sin(ang) * sim_r)
                    cv2.line(frame, (sim_cx, sim_cy), (bx, by), (255, 200, 100), 5)
                cv2.circle(frame, (sim_cx, sim_cy), 15, (0, 160, 255), -1)

            # Measure motion along circular ring
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            ring_cx = int(self.target_cx * cam_w)
            ring_cy = int(self.target_cy * cam_h)
            ring_r = int(self.target_r * min(cam_w, cam_h))

            diff_val = 0.0
            if self.prev_gray is not None and self.prev_gray.shape == gray.shape:
                diff = cv2.absdiff(gray, self.prev_gray)
                samples = []
                for i in range(self.num_samples):
                    ang = i * (2 * math.pi / self.num_samples)
                    px = max(0, min(cam_w - 1, int(ring_cx + math.cos(ang) * ring_r)))
                    py = max(0, min(cam_h - 1, int(ring_cy + math.sin(ang) * ring_r)))
                    samples.append(float(diff[py, px]))
                diff_val = float(np.mean(samples))
            self.prev_gray = gray

            # Speed calculation
            if self.sim_mode:
                raw_speed = self.sim_speed
            else:
                raw_speed = min(1.0, max(0.0, diff_val - 1.5) / 16.0)
                if diff_val < 1.0:
                    raw_speed = 0.0

            # Double-exponential smoothing for stability
            self.smoothed_speed = 0.88 * self.smoothed_speed + 0.12 * raw_speed
            self.smoothed_rpm = self.smoothed_speed * 450.0

            # INVERSE FORMULA: Virtual = 1.0 - Real
            self.virtual_speed = max(0.0, min(1.0, 1.0 - self.smoothed_speed))
            virtual_rpm = int(self.virtual_speed * 3200)

            # Synchronize laptop hardware fan with virtual speed
            self.poll_laptop_status()
            self.sync_laptop_fan(self.virtual_speed)

            # Draw circular tachometer ring on frame
            ring_color = (0, 220, 255) if self.smoothed_speed > 0.05 else (180, 180, 180)
            cv2.circle(frame, (ring_cx, ring_cy), ring_r, ring_color, 2)
            cv2.drawMarker(frame, (ring_cx, ring_cy), (0, 255, 255), cv2.MARKER_CROSS, 16, 2)
            cv2.putText(frame, "CLICK FAN HUB TO LOCK", (ring_cx - 90, ring_cy - ring_r - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, ring_color, 1)

            # Status pill
            cv2.rectangle(frame, (10, cam_h - 55), (320, cam_h - 10), (20, 20, 25), -1)
            cv2.putText(frame, f"REAL FAN: {int(self.smoothed_rpm)} RPM ({int(self.smoothed_speed*100)}%)", 
                        (20, cam_h - 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (100, 180, 255), 2)

            # Create Pinned Side Panel
            panel = np.zeros((cam_h, panel_w, 3), dtype=np.uint8)
            panel[:] = (20, 18, 25)

            cv2.rectangle(panel, (0, 0), (panel_w, 40), (35, 30, 45), -1)
            cv2.putText(panel, "PINNED ANTI-FAN (INVERSE)", (15, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

            # Draw Virtual Fan
            self.draw_virtual_fan(panel, panel_w // 2, cam_h // 2 - 35, 88, self.virtual_speed, dt)

            # Readouts
            cv2.rectangle(panel, (15, cam_h - 150), (panel_w - 15, cam_h - 55), (30, 25, 35), -1)
            cv2.putText(panel, f"VIRTUAL: {virtual_rpm} RPM", (25, cam_h - 122), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (0, 220, 255), 2)
            cv2.putText(panel, f"THROTTLE: {int(self.virtual_speed * 100)}% (INVERSE)", (25, cam_h - 98), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 200), 1)

            if self.virtual_speed < 0.15:
                stat_col = (80, 80, 240)
                stat_msg = "HEAT PRESERVED: STALLED"
            else:
                stat_col = (255, 200, 0)
                stat_msg = "TURBO BLOWING (COLD ROOM)"
            cv2.putText(panel, stat_msg, (25, cam_h - 75), cv2.FONT_HERSHEY_SIMPLEX, 0.38, stat_col, 1)

            # Physical Laptop Hardware Fan status card
            hw_speed_str = f"{int(self.virtual_speed * 100)}%" if self.laptop_sync_enabled else "BIOS AUTO"
            cv2.rectangle(panel, (15, cam_h - 50), (panel_w - 15, cam_h - 8), (15, 35, 25), -1)
            cv2.rectangle(panel, (15, cam_h - 50), (panel_w - 15, cam_h - 8), (0, 180, 100), 1)
            cv2.putText(panel, f"LAPTOP HW: {hw_speed_str} | CPU: {self.cpu_temp}C", 
                        (25, cam_h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 255, 180), 1)
            cv2.putText(panel, "[h] Sync Toggle  |  [a] BIOS Auto", 
                        (25, cam_h - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (160, 220, 180), 1)

            composite = np.hstack([frame, panel])
            cv2.imshow(self.window_name, composite)

            key = cv2.waitKey(15) & 0xFF
            if key == ord('q') or key == 27:
                break
            elif key == ord('s'):
                self.sim_mode = not self.sim_mode
            elif key == ord('+') or key == ord('='):
                self.sim_speed = min(1.0, self.sim_speed + 0.1)
            elif key == ord('-') or key == ord('_'):
                self.sim_speed = max(0.0, self.sim_speed - 0.1)
            elif key == ord('h'):
                self.laptop_sync_enabled = not self.laptop_sync_enabled
                if not self.laptop_sync_enabled:
                    self.restore_laptop_fan()
                    print("[*] Laptop hardware sync PAUSED. Fan set to BIOS Auto.")
                else:
                    print("[*] Laptop hardware sync RESUMED.")
            elif key == ord('a'):
                self.restore_laptop_fan()
                print("[*] Manual BIOS Auto command sent.")

        if self.cap.isOpened():
            self.cap.release()
        self.restore_laptop_fan()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    app = AntiFanCV()
    app.run()
