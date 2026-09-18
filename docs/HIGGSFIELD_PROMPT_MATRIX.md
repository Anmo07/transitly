# 3D Operational Prompt Synthesis Matrix (Universal Multi-Model)

> **Transitly AI Generation Specification**  
> *Production prompts, lighting profiles, physics parameters, and camera motion curves for generating 60 FPS loopable operational sequences with any modern video model or 3D tool.*

---

## 0. Multi-Model Compatibility (100% Model-Agnostic)

The Transitly WebGL2 rendering pipeline is completely decoupled from the generation source. You can use any of the following free or freemium tools to generate the source MP4/MOV clips:

| Tool / Model | Cost / Tier | Best Suited For | Website |
| :--- | :--- | :--- | :--- |
| **Kling AI** | **Free Daily Credits** (66 credits/day) | High-definition vehicle tracking, camera orbits, 1080p output | [klingai.com](https://klingai.com) |
| **Hailuo AI (Minimax)** | **Free Tier Available** | Realistic physical motion, twilight highway reflections | [hailuoai.video](https://hailuoai.video) |
| **Luma Dream Machine** | **Free Tier** (30 generations/mo) | Smooth camera keyframing, linear loops | [lumalabs.ai/dream-machine](https://lumalabs.ai/dream-machine) |
| **Runway Gen-3 Alpha** | Free Trial Credits | Stylized cinematic lighting and camera sliders | [runwayml.com](https://runwayml.com) |
| **Spline 3D** | **100% Free** | Interactive 3D object exports & turntable loops | [spline.design](https://spline.design) |
| **Blender** | **100% Free & Open Source** | Exact, mathematical 60 FPS camera orbits with zero AI artifacting | [blender.org](https://blender.org) |
| **Higgsfield AI** | Paid | Specialized commercial camera control | [higgsfield.ai](https://higgsfield.ai) |

---

## 1. Global Brand Aesthetic & Lighting Directives

All video generations must be grounded in Transitly’s established brand identity:

```
Key Color Palette:
• Key Light (Chassis & Accents):   #0050cb (Cobalt Blue)
• Dynamic Glow & Pulse:            #0066ff (Electric Azure)
• Telemetry & Custody Success:     #10b981 (Emerald Green)
• Caution & Bay Alert:             #f59e0b (Amber Gold)
• Base Studio / Void Backdrop:     #191b24 (Deep Carbon Black)
```

### Universal Negative Prompt (Apply to all sequences)
```
blurry, low resolution, 2D cartoon, anime, illustration, oversaturated, deformed vehicle geometry, warped tires, disjointed reflections, stuttering frames, flicker, non-looping boundary, watermarks, grainy, noisy shadows, daytime glare, distorted perspective, extra wheels, missing cargo bay doors, unrealistic physical friction.
```

---

## 2. Operational Sequence 1: `3D-BUS-HIGHWAY`

* **Operational Flow:** Intercity Scheduled Carrier Telemetry & Express Corridor Transit.
* **Target DOM Landmarks:** `#homeMapContainer` (`index.html`), `#liveTrackingMap` (`tracking.html`).
* **Frame Target:** 75 frames @ 60 FPS (1.25s seamless ping-pong loop).
* **Render Resolutions:** Desktop: `1920x1080` (16:9), Mobile: `1080x1920` (9:16).

### Higgsfield Prompt
```
Cinematic ultra-smooth 60fps 3D tracking shot of a modern electric long-haul coach bus cruising smoothly along a dark wet highway at twilight. The bus features sleek aerodynamic contours, tinted panoramic side glass, and a subtle glowing cobalt blue undercarriage ground-effect light (#0050cb). Camera is positioned low-angle three-quarters from the front-left, tracking parallel to the vehicle. Tires spin with realistic motion blur against reflective asphalt with subtle rain sheen. Atmospheric blue mist and aerodynamic air trails curl gently around the streamlined roofline. Perfectly seamless loop with synchronized road markings. Photorealistic Unreal Engine 5 render, raytraced ambient occlusion, 8k textures, 35mm anamorphic lens, f/2.8 aperture.
```

### Camera Trajectory Parameters
* **Focal Length:** 35mm anamorphic
* **Camera Orbit:** Fixed-distance parallel tracking with subtle dynamic pitch ($\pm 1.5^\circ$)
* **Motion Vector:** Linear forward constant velocity ($80\text{ km/h}$ simulated)
* **Lighting Key:** Low-angle twilight gradient with cool azure key and high-contrast asphalt bounce

---

## 3. Operational Sequence 2: `3D-CARGO-SEAL`

* **Operational Flow:** Cryptographic QR Bay Stowage & Pneumatic Door Seal.
* **Target DOM Landmarks:** `#bookingSuccessModal` (`index.html`), `#partnerHandoffCard` (`tracking.html`).
* **Frame Target:** 60 frames @ 60 FPS (1.0s loop).
* **Render Resolutions:** Desktop: `1920x1080` (16:9), Mobile: `1080x1080` (1:1 Square).

### Higgsfield Prompt
```
Macro 3D isometric cutaway view of an automated electric bus cargo hold. A heavy-duty brushed aluminum compartment bay door slides open with smooth pneumatic dampening. Inside the compartmentalized grid, a padded smart parcel box with glowing telemetry edges glides into a locking cradle. An emerald green laser emitter (#10b981) sweeps over the box surface, projecting a digital holographic HMAC-SHA256 authenticated QR seal that locks with a solid, satisfying visual snap. Fine vapor mist vents from the locking seal, and emerald status LEDs illuminate along the steel perimeter. Seamless 60fps mechanical loop, cinematic macro lens 85mm f/1.8, industrial precision engineering aesthetics, deep graphite and cobalt finishes.
```

### Camera Trajectory Parameters
* **Focal Length:** 85mm macro
* **Camera Orbit:** Stable $45^\circ$ isometric downward tilt with microscopic push-in toward the QR seal projection
* **Motion Vector:** Mechanical linear slide (bay door) + rotating holographic projection
* **Lighting Key:** Industrial rim lighting, volumetric laser glow, dark brushed carbon interior

---

## 4. Operational Sequence 3: `3D-RIDER-RADAR`

* **Operational Flow:** Delivery Partner Telematics, Dynamic Spatial Matching & First/Last Mile Dock.
* **Target DOM Landmarks:** `#riderMapTrips` (`rider-map-trips.html`), `#hotspotMap` (`rider-dashboard.html`).
* **Frame Target:** 60 frames @ 60 FPS (1.0s loop).
* **Render Resolutions:** Desktop: `1920x1080` (16:9), Mobile: `1080x1440` (3:4).

### Higgsfield Prompt
```
Stylized isometric 3D visualization of a matte-black electric delivery scooter parked on a dark minimalist geometric city grid. A glowing cobalt blue radar sonar ring (#0050cb) radiates smoothly from beneath the vehicle in expanding concentric circles across the ground plane. Glowing emerald waypoint markers (#10b981) pulse softly in the surrounding field. Modern high-tech instrument cluster glows on the handlebars. Realistic volumetric light rays, clean glassmorphic surface reflections on the road tiles, 60fps frictionless radar ping loop. Rendered with clean architectural lighting, 50mm tilt-shift perspective, 4k clarity, studio quality.
```

### Camera Trajectory Parameters
* **Focal Length:** 50mm isometric tilt-shift
* **Camera Orbit:** Subtle $15^\circ$ slow orbital pan around the scooter center of mass
* **Motion Vector:** Smooth harmonic expansion (concentric radar pulses)
* **Lighting Key:** Dark mode studio floor with neon grid lines, high-contrast vehicle silhouette

---

## 5. Operational Sequence 4: `3D-HANDOFF-PIN`

* **Operational Flow:** Doorstep Handoff 4-Digit PIN Settlement & Custody Release.
* **Target DOM Landmarks:** `#recipientDeliveryPin` (`tracking.html`), `#modalPinVerify`.
* **Frame Target:** 45 frames @ 60 FPS (0.75s punchy cycle).
* **Render Resolutions:** Desktop: `1080x1080` (1:1), Mobile: `1080x1080` (1:1).

### Higgsfield Prompt
```
Close-up 3D floating digital safe combination dial crafted from bead-blasted titanium with glowing cobalt blue numeric index lines. The dial rapidly clicks through digits and settles precisely on '4-8-2-0'. Upon the final digit alignment, four emerald mechanical tumblers slide outward, a pressurized magnetic seal unlocks with a visible shockwave ring, and a burst of delicate emerald particles (#10b981) floats gently in zero-gravity around the dial face. Ultra-crisp mechanical motion, high-speed camera feeling, macro lens 100mm f/2.8, shallow depth of field, pure alpha black background.
```

### Camera Trajectory Parameters
* **Focal Length:** 100mm true macro
* **Camera Orbit:** Locked axial view with subtle physical recoil on lock disengagement
* **Motion Vector:** Rotational step click $\rightarrow$ radial pneumatic release
* **Lighting Key:** Concentrated studio spotlight on dial bevel, internal emerald LED bounce

---

## 6. Batch FFmpeg Ingestion Command Reference

Once Higgsfield generates the raw master video files (`.mp4` / `.mov`), run the automated batch converter to produce the WebP frame sequences for WebGL2 texture blitting:

```bash
#!/usr/bin/env bash
# scripts/process-higgsfield-raw.sh

mkdir -p public/assets/3d/{3d-bus-highway,3d-cargo-seal,3d-rider-radar,3d-handoff-pin}

# Sequence 1: Bus Highway (1280x720 16:9, 75 frames)
ffmpeg -i raw_bus.mp4 -vf "fps=60,scale=1280:720" -vframes 75 -c:v libwebp -quality 85 public/assets/3d/3d-bus-highway/frame_%04d.webp

# Sequence 2: Cargo Bay Seal (1280x720 16:9, 60 frames)
ffmpeg -i raw_cargo.mp4 -vf "fps=60,scale=1280:720" -vframes 60 -c:v libwebp -quality 85 public/assets/3d/3d-cargo-seal/frame_%04d.webp

# Sequence 3: Rider Radar (1280x720 16:9, 60 frames)
ffmpeg -i raw_radar.mp4 -vf "fps=60,scale=1280:720" -vframes 60 -c:v libwebp -quality 85 public/assets/3d/3d-rider-radar/frame_%04d.webp

# Sequence 4: Doorstep Handoff PIN (720x720 1:1, 45 frames)
ffmpeg -i raw_pin.mp4 -vf "fps=60,scale=720:720" -vframes 45 -c:v libwebp -quality 85 public/assets/3d/3d-handoff-pin/frame_%04d.webp

echo "✔ All Higgsfield frame sequences converted and optimized for WebGL2 VRAM upload."
```
