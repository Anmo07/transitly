const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    name: "Transitly Secure & Encrypted API Workflows",
    description: "Enterprise Postman Collection for Transitly: Intercity bus cargo logistics, distributed sagas, 2-step authentication, geofenced dispatch matching, custody PIN settlement, idempotent financial payouts, and real-time highway telematics.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  auth: {
    type: "bearer",
    bearer: [
      {
        key: "token",
        value: "{{jwt_token}}",
        type: "string"
      }
    ]
  },
  item: [
    // -------------------------------------------------------------
    // FOLDER 1: 01. Authentication & Session Security
    // -------------------------------------------------------------
    {
      name: "01. Authentication & Session Security",
      description: "NIST SP 800-63B compliant two-step authentication, rate limiting, anti-injection sanitization, and cryptographic JWT issuance.",
      item: [
        {
          name: "01. Request 6-Digit Verification OTP",
          description: "Dispatches a purpose-bound 6-digit OTP code to SMS, WhatsApp, or Email with exponential backoff.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Response contains valid OTP dispatch metadata", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.status).to.eql("success");',
                  '    pm.expect(json.data).to.have.property("identifier");',
                  '    pm.expect(json.data).to.have.property("expiresInSeconds");',
                  '});',
                  '',
                  '// In non-production, extract ephemeral testOtp for zero-touch test automation',
                  'const json = pm.response.json();',
                  'if (json.data && json.data.testOtp) {',
                  '    pm.environment.set("auth_otp", json.data.testOtp);',
                  '    console.log("[Auto-Extracted OTP]:", json.data.testOtp);',
                  '}'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            auth: { type: "noauth" },
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                fullName: "{{user_name}}",
                identifier: "{{user_phone}}",
                channel: "sms",
                purpose: "login"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/auth/otp/send",
              host: ["{{base_url}}"],
              path: ["api", "v1", "auth", "otp", "send"]
            }
          }
        },
        {
          name: "02. Verify OTP & Issue Encrypted Session Token",
          description: "Validates 6-digit verification code using constant-time hashing, invalidates OTP (single-use), and issues signed JWT bearer token.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Token returned and matches JWT format", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.status).to.eql("success");',
                  '    pm.expect(json.data).to.have.property("token");',
                  '    const parts = json.data.token.split(".");',
                  '    pm.expect(parts.length).to.eql(3);',
                  '});',
                  '',
                  '// Save JWT session token into encrypted environment variable',
                  'const json = pm.response.json();',
                  'if (json.data && json.data.token) {',
                  '    pm.environment.set("jwt_token", json.data.token);',
                  '    console.log("[Saved Encrypted JWT Token]: length", json.data.token.length);',
                  '}'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            auth: { type: "noauth" },
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                fullName: "{{user_name}}",
                identifier: "{{user_phone}}",
                otp: "{{auth_otp}}",
                purpose: "login"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/auth/otp/verify",
              host: ["{{base_url}}"],
              path: ["api", "v1", "auth", "otp", "verify"]
            }
          }
        },
        {
          name: "03. Register New User Identity",
          description: "Direct user signup endpoint registering customer or delivery partner credentials in PostgreSQL.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 or 201", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            auth: { type: "noauth" },
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                name: "{{user_name}}",
                email: "{{user_email}}",
                phone: "{{user_phone}}",
                role: "CUSTOMER"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/auth/signup",
              host: ["{{base_url}}"],
              path: ["api", "v1", "auth", "signup"]
            }
          }
        },
        {
          name: "04. Inspect Authenticated Profile (Protected)",
          description: "Protected route querying current verified session profile and historical shipment stats from PostgreSQL.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Profile returned with valid user structure", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.status).to.eql("success");',
                  '    pm.expect(json.data.user).to.have.property("email");',
                  '    pm.expect(json.data.stats).to.have.property("totalTrips");',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Cookie", value: "transitly_session={{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/profile",
              host: ["{{base_url}}"],
              path: ["api", "v1", "profile"]
            }
          }
        },
        {
          name: "05. Update Encrypted User Preferences",
          description: "Updates JSONB notification preferences, biometric authentication toggles, and locale settings.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                pushNotifications: true,
                emailUpdates: true,
                locationServices: true,
                biometrics: true,
                language: "English (IN)"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/settings",
              host: ["{{base_url}}"],
              path: ["api", "v1", "settings"]
            }
          }
        },
        {
          name: "06. List Saved Delivery Addresses",
          description: "Queries PostGIS-backed saved customer pickup and dropoff locations.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("Addresses array returned", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(Array.isArray(json.data)).to.be.true;',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/addresses",
              host: ["{{base_url}}"],
              path: ["api", "v1", "addresses"]
            }
          }
        },
        {
          name: "07. Add Saved Address with Coordinates",
          description: "Creates a new saved point with latitude and longitude stored as PostGIS geometry.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 201 Created", function () {',
                  '    pm.response.to.have.status(201);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                label: "Cyber Hub Branch",
                addressLine: "Tower B, Cyber City, DLF Phase 2, Gurgaon, Haryana",
                tag: "work",
                isDefault: false,
                latitude: 28.4905,
                longitude: 77.0902
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/addresses",
              host: ["{{base_url}}"],
              path: ["api", "v1", "addresses"]
            }
          }
        },
        {
          name: "08. List Vault Payment Methods",
          description: "Retrieves tokenized card records and UPI VPAs without exposing full PANs.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/payment-methods",
              host: ["{{base_url}}"],
              path: ["api", "v1", "payment-methods"]
            }
          }
        },
        {
          name: "09. Submit Encrypted Support Ticket",
          description: "Logs customer or rider issue ticket associated with active tracking ID.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 201 Created", function () {',
                  '    pm.response.to.have.status(201);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                category: "DELIVERY",
                trackingId: "{{tracking_id}}",
                description: "Automated test support ticket - verified handoff query."
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/support/tickets",
              host: ["{{base_url}}"],
              path: ["api", "v1", "support", "tickets"]
            }
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 2: 02. Intercity Parcel Logistics & Sagas
    // -------------------------------------------------------------
    {
      name: "02. Intercity Parcel Logistics & Sagas",
      description: "Distributed sagas coordinating bus cargo compartment reservations, multi-modal leg transitions, and barcode stowage verification.",
      item: [
        {
          name: "01. Execute Distributed Saga Booking",
          description: "Executes orchestrator booking saga across capacity reservation, last-mile quotes, and shipment generation.",
          event: [
            {
              listen: "prerequest",
              script: {
                type: "text/javascript",
                exec: [
                  'const uniqueRef = "TRK-" + Math.floor(10000 + Math.random() * 90000);',
                  'pm.variables.set("temp_tracking_id", uniqueRef);'
                ]
              }
            },
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 201 Created", function () {',
                  '    pm.response.to.have.status(201);',
                  '});',
                  '',
                  'const json = pm.response.json();',
                  'if (json.data && (json.data.trackingId || json.data.tracking_id)) {',
                  '    const id = json.data.trackingId || json.data.tracking_id;',
                  '    pm.environment.set("tracking_id", id);',
                  '    console.log("[Captured New Tracking ID]:", id);',
                  '}'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                senderName: "{{user_name}}",
                senderPhone: "{{user_phone}}",
                recipientName: "Dr. Kavita Singhania",
                recipientPhone: "+919876543219",
                pickupAddress: "ISBT Kashmere Gate, Delhi",
                dropoffAddress: "ISBT Sector 17, Chandigarh",
                weightKg: 4.5,
                volumeCm3: 15000,
                cargoSlotId: "SLOT-HR-CHD-01",
                fare: 450
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/bookings",
              host: ["{{base_url}}"],
              path: ["api", "v1", "bookings"]
            }
          }
        },
        {
          name: "02. List Active Shipments",
          description: "Queries all current active shipments for customer tracking view.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/shipments",
              host: ["{{base_url}}"],
              path: ["api", "v1", "shipments"],
              query: [
                { key: "limit", value: "10" }
              ]
            }
          }
        },
        {
          name: "03. Inspect Shipment & Audit Legs",
          description: "Queries single shipment by tracking ID including all multi-modal legs and timestamps.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 or 404", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 404]);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/shipments/{{tracking_id}}",
              host: ["{{base_url}}"],
              path: ["api", "v1", "shipments", "{{tracking_id}}"]
            }
          }
        },
        {
          name: "04. Query Trunk Capacity Slots",
          description: "Returns real-time available volume and weight quotas across Haryana Roadways corridors.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{base_url}}/api/v1/capacity/slots",
              host: ["{{base_url}}"],
              path: ["api", "v1", "capacity", "slots"],
              query: [
                { key: "routeId", value: "HR-DEL-CHD" }
              ]
            }
          }
        },
        {
          name: "05. Multi-Modal Last-Mile Feasibility",
          description: "Calculates spatial radius feasibility and estimated time to pickup/deliver.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                originLat: 28.6675,
                originLng: 77.2285,
                destinationLat: 28.4595,
                destinationLng: 77.0266,
                weightKg: 3.5
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/lastmile/feasibility",
              host: ["{{base_url}}"],
              path: ["api", "v1", "lastmile", "feasibility"]
            }
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 3: 03. Delivery Partner Cockpit & Geofenced Dispatch
    // -------------------------------------------------------------
    {
      name: "03. Delivery Partner Cockpit & Geofenced Dispatch",
      description: "Partner duty state machine, spatial dispatch matching queue, 30s TTL priority offers, and telemetry updates.",
      item: [
        {
          name: "01. Toggle Duty State Machine",
          description: "Switches delivery partner state between ONLINE and OFFLINE with auto-accept preference.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("Duty state confirmed ONLINE", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.data.isOnline).to.eql(true);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "PATCH",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                isOnline: true,
                autoAccept: false
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/riders/duty",
              host: ["{{base_url}}"],
              path: ["api", "v1", "riders", "duty"]
            }
          }
        },
        {
          name: "02. Rider Shift Cockpit & Dashboard",
          description: "Fetches live shift duration, completed deliveries count, battery health, and next active task.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("Dashboard contains performance stats", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.data).to.have.property("earnings");',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/riders/dashboard",
              host: ["{{base_url}}"],
              path: ["api", "v1", "riders", "dashboard"]
            }
          }
        },
        {
          name: "03. Spatial Dispatch Queue Pool",
          description: "Returns real-time parcel pool prioritized by proximity and payout, along with active 30s priority offer if present.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'const json = pm.response.json();',
                  'if (json.data && json.data.queue && json.data.queue.length > 0) {',
                  '    pm.environment.set("order_id", json.data.queue[0].id);',
                  '    console.log("[Discovered Queue Order ID]:", json.data.queue[0].id);',
                  '}'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/dispatch/queue",
              host: ["{{base_url}}"],
              path: ["api", "v1", "dispatch", "queue"],
              query: [
                { key: "filter", value: "all" }
              ]
            }
          }
        },
        {
          name: "04. Respond to 30s Priority Dispatch Offer",
          description: "Accepts or declines a time-limited priority order assignment.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 or 409 (if expired)", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 409]);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                decision: "ACCEPT"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/dispatch/orders/{{order_id}}/respond",
              host: ["{{base_url}}"],
              path: ["api", "v1", "dispatch", "orders", "{{order_id}}", "respond"]
            }
          }
        },
        {
          name: "05. Update Rider GPS Telemetry Location",
          description: "Broadcasts rider device latitude and longitude for live customer tracking and spatial matching.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                latitude: 28.4720,
                longitude: 77.0725,
                heading: 180,
                speed: 32.5
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/riders/location",
              host: ["{{base_url}}"],
              path: ["api", "v1", "riders", "location"]
            }
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 4: 04. Custody Transfer & 4-Digit PIN Handoff
    // -------------------------------------------------------------
    {
      name: "04. Custody Transfer & 4-Digit PIN Handoff",
      description: "Cryptographic proof of delivery, PostGIS geofence proximity verification, and atomic settlement.",
      item: [
        {
          name: "01. Query Active Delivery Task",
          description: "Queries active order in transit assigned to current authenticated rider.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/orders/active",
              host: ["{{base_url}}"],
              path: ["api", "v1", "orders", "active"]
            }
          }
        },
        {
          name: "02. Geofenced 4-Digit PIN Verification & Settlement",
          description: "Submits 4-digit PIN with rider GPS coordinates. Validates rider is within 150m geofence radius and settles payment atomically.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 or 400 (if simulated wrong PIN/distance)", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 400]);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                otp: "4921",
                latitude: 28.4720,
                longitude: 77.0725,
                supervisorBypass: false
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/orders/{{order_id}}/verify-otp",
              host: ["{{base_url}}"],
              path: ["api", "v1", "orders", "{{order_id}}", "verify-otp"]
            }
          }
        },
        {
          name: "03. Chain-of-Custody Handoff Log",
          description: "Records custody exchange between first-mile rider and bus driver at depot terminal.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                trackingId: "{{tracking_id}}",
                handoffType: "RIDER_TO_BUS",
                terminalId: "ISBT-KASHMERE-GATE",
                busRegistration: "{{carrier_plate}}",
                agentId: "AGENT-042"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/custody/handoff",
              host: ["{{base_url}}"],
              path: ["api", "v1", "custody", "handoff"]
            }
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 5: 05. Financial Ledger & Idempotent Payouts
    // -------------------------------------------------------------
    {
      name: "05. Financial Ledger & Idempotent Payouts",
      description: "Immutable double-entry ledger queries and instant cash-outs guarded by unique Idempotency-Key headers.",
      item: [
        {
          name: "01. Fetch Rider Real-Time Ledger & Balance",
          description: "Queries rider available balance, pending payouts, incentive bonuses, and weekly earnings trends.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("Returns ledger breakdown", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.data).to.have.property("availableBalance");',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" }
            ],
            url: {
              raw: "{{base_url}}/api/v1/riders/earnings",
              host: ["{{base_url}}"],
              path: ["api", "v1", "riders", "earnings"]
            }
          }
        },
        {
          name: "02. Instant Payout Request (Idempotency Guard)",
          description: "Triggers instant payout via UPI / IMPS. Dynamic pre-request script injects a cryptographically unique Idempotency-Key header to prevent duplicate transfers.",
          event: [
            {
              listen: "prerequest",
              script: {
                type: "text/javascript",
                exec: [
                  '// Generate cryptographically unique idempotency key',
                  'const uniqueKey = "pay_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);',
                  'pm.environment.set("idempotency_key", uniqueKey);',
                  'pm.request.headers.upsert({',
                  '    key: "Idempotency-Key",',
                  '    value: uniqueKey',
                  '});',
                  'console.log("[Generated Idempotency-Key]:", uniqueKey);'
                ]
              }
            },
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 or 400 (if zero balance)", function () {',
                  '    pm.expect(pm.response.code).to.be.oneOf([200, 400]);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" },
              { key: "Idempotency-Key", value: "{{idempotency_key}}" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                amount: 350,
                destination: "UPI",
                idempotencyKey: "{{idempotency_key}}"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/riders/payout",
              host: ["{{base_url}}"],
              path: ["api", "v1", "riders", "payout"]
            }
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 6: 06. Highway Telematics & PostGIS Routes
    // -------------------------------------------------------------
    {
      name: "06. Highway Telematics & PostGIS Routes",
      description: "High-frequency bus telematics ingestion (Redis Fast Path), PostGIS spatial proximity queries, and official Haryana Roadways routes.",
      item: [
        {
          name: "01. Ingest Highway Bus Telematics Ping",
          description: "Ingests sub-second vehicle GPS telemetry into memory cache with async batching to PostGIS.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 202 Accepted", function () {',
                  '    pm.response.to.have.status(202);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            auth: { type: "noauth" },
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                vehicleId: "{{carrier_plate}}",
                operatorId: 10,
                latitude: 29.3909,
                longitude: 76.9635,
                speedKmh: 68.5,
                heading: 345,
                altitude: 214,
                accuracyMeters: 4.2,
                timestamp: new Date().toISOString()
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/tracking/telemetry",
              host: ["{{base_url}}"],
              path: ["api", "v1", "tracking", "telemetry"]
            }
          }
        },
        {
          name: "02. PostGIS Spatial Nearby Vehicle Search",
          description: "Runs spatial radius query returning all active cargo-carrying buses within specified distance.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            auth: { type: "noauth" },
            header: [],
            url: {
              raw: "{{base_url}}/api/v1/tracking/nearby",
              host: ["{{base_url}}"],
              path: ["api", "v1", "tracking", "nearby"],
              query: [
                { key: "lat", value: "28.6675" },
                { key: "lon", value: "77.2285" },
                { key: "radius", value: "15000" }
              ]
            }
          }
        },
        {
          name: "03. Carrier Live Telematics by Plate Number",
          description: "Queries latest coordinates, speed, battery, and heading for designated intercity bus.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            auth: { type: "noauth" },
            header: [],
            url: {
              raw: "{{base_url}}/api/v1/tracking/bus/{{carrier_plate}}",
              host: ["{{base_url}}"],
              path: ["api", "v1", "tracking", "bus", "{{carrier_plate}}"]
            }
          }
        },
        {
          name: "04. Telemetry FastPath & PostGIS Health",
          description: "Monitors Redis Fast Path latency and PostGIS PostgreSQL health status.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("PostGIS engine reported healthy", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.status).to.eql("ok");',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            auth: { type: "noauth" },
            header: [],
            url: {
              raw: "{{base_url}}/api/v1/tracking/health",
              host: ["{{base_url}}"],
              path: ["api", "v1", "tracking", "health"]
            }
          }
        },
        {
          name: "05. Official Haryana Roadways Corridors & Stops",
          description: "Returns official route sequences, coordinates, and scheduled offset minutes across Delhi-Chandigarh, Narnaul, Sirsa, and Jaipur corridors.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("Returns Haryana Roadways route inventory", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.status).to.eql("success");',
                  '    pm.expect(Array.isArray(json.data)).to.be.true;',
                  '    pm.expect(json.data.length).to.be.greaterThan(0);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            auth: { type: "noauth" },
            header: [],
            url: {
              raw: "{{base_url}}/api/v1/routes/haryana-roadways",
              host: ["{{base_url}}"],
              path: ["api", "v1", "routes", "haryana-roadways"]
            }
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 7: 07. Meta WhatsApp Assistant & Secure Webhooks
    // -------------------------------------------------------------
    {
      name: "07. Meta WhatsApp Assistant & Secure Webhooks",
      description: "Meta Cloud API webhook handshake verification, inbound AI parcel query processing, and outbound template dispatches.",
      item: [
        {
          name: "01. Meta Webhook Subscription Challenge Handshake",
          description: "Authenticates Meta webhook setup with hub.verify_token and echoes back hub.challenge.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("Challenge string echoed accurately", function () {',
                  '    pm.expect(pm.response.text()).to.eql(pm.environment.get("hub_challenge"));',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "GET",
            auth: { type: "noauth" },
            header: [],
            url: {
              raw: "{{base_url}}/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token={{webhook_verify_token}}&hub.challenge={{hub_challenge}}",
              host: ["{{base_url}}"],
              path: ["api", "v1", "whatsapp", "webhook"],
              query: [
                { key: "hub.mode", value: "subscribe" },
                { key: "hub.verify_token", value: "{{webhook_verify_token}}" },
                { key: "hub.challenge", value: "{{hub_challenge}}" }
              ]
            }
          }
        },
        {
          name: "02. Inbound Conversational Assistant Webhook",
          description: "Simulates incoming user message asking for tracking updates on highway parcel.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'pm.test("Assistant replies with conversational tracking info", function () {',
                  '    const json = pm.response.json();',
                  '    pm.expect(json.status).to.eql("success");',
                  '    pm.expect(json.data).to.have.property("reply");',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            auth: { type: "noauth" },
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                from: "{{user_phone}}",
                messageText: "Where is my parcel {{tracking_id}}?"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/whatsapp/webhook",
              host: ["{{base_url}}"],
              path: ["api", "v1", "whatsapp", "webhook"]
            }
          }
        },
        {
          name: "03. Dispatch Outbound Template Notification",
          description: "Dispatches official WhatsApp notification to customer with pickup ETA or delivery PIN.",
          event: [
            {
              listen: "test",
              script: {
                type: "text/javascript",
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});'
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{jwt_token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              options: { raw: { language: "json" } },
              raw: JSON.stringify({
                to: "{{user_phone}}",
                templateType: "SHIPMENT_CONFIRMED",
                data: {
                  trackingId: "{{tracking_id}}",
                  recipientName: "Dr. Kavita Singhania",
                  route: "Delhi -> Chandigarh",
                  busNumber: "{{carrier_plate}}"
                }
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/v1/whatsapp/send",
              host: ["{{base_url}}"],
              path: ["api", "v1", "whatsapp", "send"]
            }
          }
        }
      ]
    }
  ]
};

// Environment definition
const environment = {
  name: "Transitly Secure & Encrypted Environment",
  values: [
    { key: "base_url", value: "http://localhost:4000", type: "default", enabled: true, description: "Transitly API service URL" },
    { key: "jwt_token", value: "", type: "secret", enabled: true, description: "Authenticated JWT bearer session token" },
    { key: "user_phone", value: "+917988342544", type: "default", enabled: true, description: "Customer E.164 phone number" },
    { key: "user_email", value: "anmolrajotiya@gmail.com", type: "default", enabled: true, description: "Customer email address" },
    { key: "user_name", value: "Anmol", type: "default", enabled: true, description: "Customer full name" },
    { key: "auth_otp", value: "", type: "secret", enabled: true, description: "Auto-captured 6-digit authentication OTP" },
    { key: "tracking_id", value: "TRK-88219", type: "default", enabled: true, description: "Active parcel tracking reference" },
    { key: "carrier_plate", value: "HR-68-A-1001", type: "default", enabled: true, description: "Haryana Roadways bus plate number" },
    { key: "order_id", value: "1", type: "default", enabled: true, description: "Active dispatch parcel order ID" },
    { key: "rider_id", value: "1", type: "default", enabled: true, description: "Delivery partner rider ID" },
    { key: "idempotency_key", value: "", type: "secret", enabled: true, description: "Dynamic unique financial idempotency key" },
    { key: "webhook_verify_token", value: "transitly_webhook_secret_token", type: "secret", enabled: true, description: "Meta WhatsApp webhook verify token" },
    { key: "hub_challenge", value: "transitly_sub_challenge_992", type: "default", enabled: true, description: "Meta webhook challenge verification token" }
  ]
};

// Ensure docs directory exists
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write artifacts
fs.writeFileSync(
  path.join(docsDir, 'transitly_postman_collection.json'),
  JSON.stringify(collection, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(docsDir, 'transitly_postman_environment.json'),
  JSON.stringify(environment, null, 2),
  'utf8'
);

console.log('✅ Generated Postman Collection and Environment in docs/:');
console.log(' - docs/transitly_postman_collection.json');
console.log(' - docs/transitly_postman_environment.json');
console.log(` - Total Folders: ${collection.item.length}`);
let totalReqs = 0;
collection.item.forEach(f => {
  totalReqs += f.item.length;
  console.log(`   * ${f.name} (${f.item.length} requests)`);
});
console.log(` - Total Requests: ${totalReqs}`);
