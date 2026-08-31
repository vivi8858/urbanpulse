import React, {
  useEffect,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";

import EdgeAI from "./components/EdgeAI";

import "leaflet/dist/leaflet.css";
import "./App.css";

const baseIssues = [
  {
    id: "POT-102",
    type: "Large Pothole",
    location: "Connaught Place",
    position: [
      28.6315,
      77.2167,
    ],
    severity: "Medium",
    busId: "BUS-017",
    confidence: 76,
  },

  {
    id: "WAT-041",
    type: "Waterlogging",
    location: "Mandi House",
    position: [
      28.6258,
      77.2342,
    ],
    severity: "Critical",
    busId: "BUS-044",
    confidence: 97,
  },

  {
    id: "DIV-018",
    type: "Broken Divider",
    location: "India Gate",
    position: [
      28.6129,
      77.2295,
    ],
    severity: "High",
    busId: "BUS-006",
    confidence: 94,
  },

  {
    id: "ZEB-011",
    type:
      "Faded Zebra Crossing",
    location: "Karol Bagh",
    position: [
      28.6519,
      77.1909,
    ],
    severity: "Medium",
    busId: "BUS-044",
    confidence: 91,
  },
];

const busRoutes = {
  "BUS-017": [
    [28.64, 77.205],
    [28.636, 77.21],
    [28.633, 77.214],
    [28.6315, 77.2167],
    [28.6298, 77.2198],
    [28.6271, 77.224],
  ],

  "BUS-044": [
    [28.6462, 77.1985],
    [28.6404, 77.2058],
    [28.6356, 77.212],
    [28.6315, 77.2167],
    [28.628, 77.222],
  ],

  "BUS-006": [
    [28.6129, 77.2295],
    [28.617, 77.2305],
    [28.621, 77.232],
    [28.6258, 77.2342],
    [28.6295, 77.228],
    [28.6315, 77.2167],
  ],
};

const fleetMeta = {
  "BUS-017": {
    route:
      "Route 101 — Connaught Place",
    status: "Online",
    gps: "Active",
    camera: "Active",
    edgeAI: "Active",
    connection: "Online",
    lastUpdate: "4 sec ago",
  },

  "BUS-044": {
    route:
      "Route 205 — Karol Bagh",
    status: "Warning",
    gps: "Active",
    camera: "Warning",
    edgeAI: "Active",
    connection: "Online",
    lastUpdate: "11 sec ago",
  },

  "BUS-006": {
    route:
      "Route 307 — India Gate",
    status: "Online",
    gps: "Active",
    camera: "Active",
    edgeAI: "Active",
    connection: "Online",
    lastUpdate: "7 sec ago",
  },

  "BUS-104": {
    route:
      "Route 410 — Depot",
    status: "Offline",
    gps: "Offline",
    camera: "Offline",
    edgeAI: "Offline",
    connection: "Offline",
    lastUpdate: "18 min ago",
    fixedPosition: [
      28.621,
      77.195,
    ],
  },
};

const confidenceSteps = [
  76,
  91,
  98,
];

const deteriorationStages = [
  {
    day: "Day 1",
    size: "12 cm",
    growth: "Baseline",
    severity: "Medium",
    priority: 48,
  },

  {
    day: "Day 3",
    size: "18 cm",
    growth: "+50%",
    severity: "High",
    priority: 72,
  },

  {
    day: "Day 5",
    size: "27 cm",
    growth: "+125%",
    severity: "Critical",
    priority: 94,
  },
];

const workflowSteps = [
  "Verified",
  "Assigned",
  "Repair in Progress",
  "Resolved",
];

const alertSteps = [
  "NEW",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN PROGRESS",
  "RESOLVED",
];

function App() {
  const [
    activePage,
    setActivePage,
  ] =
    useState("Dashboard");

  const [
    simulationRunning,
    setSimulationRunning,
  ] =
    useState(false);

  const [
    busPositions,
    setBusPositions,
  ] = useState({
    "BUS-017": 0,
    "BUS-044": 0,
    "BUS-006": 0,
  });

  const [
    potholeConfidence,
    setPotholeConfidence,
  ] = useState(76);

  const [
    potholeBuses,
    setPotholeBuses,
  ] = useState(1);

  const [
    potholeStatus,
    setPotholeStatus,
  ] =
    useState("Detected");

  const [
    deteriorationIndex,
    setDeteriorationIndex,
  ] =
    useState(0);

  const [
    workflowIndex,
    setWorkflowIndex,
  ] =
    useState(0);

  const [
    assignedOfficer,
    setAssignedOfficer,
  ] = useState(
    "Not assigned"
  );

  const [
    edgeEvents,
    setEdgeEvents,
  ] = useState([]);

  const [
    alerts,
    setAlerts,
  ] = useState([
    {
      id: "ALT-001",
      type:
        "Large Pothole",
      severity: "High",
      location:
        "Connaught Place",
      latitude: 28.6315,
      longitude: 77.2167,
      busId: "BUS-017",
      timestamp:
        "31 Aug 2026, 10:42 AM",
      confidence: 94,
      status: "NEW",
      evidence: null,
      description:
        "Large road defect detected and verified by fleet sensing.",
    },

    {
      id: "ALT-002",
      type:
        "Waterlogging",
      severity:
        "Critical",
      location:
        "Mandi House",
      latitude: 28.6258,
      longitude: 77.2342,
      busId: "BUS-044",
      timestamp:
        "31 Aug 2026, 10:38 AM",
      confidence: 97,
      status:
        "ACKNOWLEDGED",
      evidence: null,
      description:
        "Standing water detected on active roadway.",
    },
  ]);

  const [
    activityLog,
    setActivityLog,
  ] = useState([
    {
      bus: "BUS-017",
      issue:
        "Pothole detected",
      confidence: "76%",
      time:
        "Initial detection",
    },
  ]);

  useEffect(() => {
    if (
      !simulationRunning
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        setBusPositions(
          (
            currentPositions
          ) => {
            const updated = {};

            Object.keys(
              currentPositions
            ).forEach(
              (busId) => {
                const length =
                  busRoutes[
                    busId
                  ].length;

                updated[
                  busId
                ] =
                  (currentPositions[
                    busId
                  ] +
                    1) %
                  length;
              }
            );

            return updated;
          }
        );
      }, 2000);

    return () =>
      clearInterval(
        interval
      );
  }, [
    simulationRunning,
  ]);

  useEffect(() => {
    if (
      !simulationRunning
    ) {
      return;
    }

    Object.keys(
      busRoutes
    ).forEach(
      (busId) => {
        const index =
          busPositions[
            busId
          ];

        const position =
          busRoutes[
            busId
          ][index];

        const isAtPothole =
          Math.abs(
            position[0] -
              28.6315
          ) <
            0.0001 &&
          Math.abs(
            position[1] -
              77.2167
          ) <
            0.0001;

        if (
          !isAtPothole
        ) {
          return;
        }

        if (
          busId ===
            "BUS-044" &&
          potholeBuses <
            2
        ) {
          registerDetection(
            busId,
            2
          );
        }

        if (
          busId ===
            "BUS-006" &&
          potholeBuses <
            3
        ) {
          registerDetection(
            busId,
            3
          );
        }
      }
    );
  }, [
    busPositions,
    simulationRunning,
    potholeBuses,
  ]);

  function registerDetection(
    busId,
    busCount
  ) {
    const confidence =
      confidenceSteps[
        busCount - 1
      ];

    setPotholeBuses(
      busCount
    );

    setPotholeConfidence(
      confidence
    );

    setPotholeStatus(
      busCount >= 3
        ? "Verified"
        : "Under Verification"
    );

    setActivityLog(
      (current) => [
        {
          bus: busId,

          issue:
            busCount >= 3
              ? "Pothole verified by fleet"
              : "Same pothole detected",

          confidence:
            `${confidence}%`,

          time:
            "Just now",
        },

        ...current,
      ]
    );
  }

  function handleEdgeEvent(
    event
  ) {
    setEdgeEvents(
      (current) => [
        event,
        ...current,
      ]
    );

    setAlerts(
      (current) => [
        {
          ...event,
          status: "NEW",
        },

        ...current,
      ]
    );

    setActivityLog(
      (current) => [
        {
          bus:
            event.busId,

          issue:
            `${event.type} alert generated`,

          confidence:
            `${event.confidence}%`,

          time:
            event.timestamp,
        },

        ...current,
      ]
    );
  }

  function updateAlertStatus(
    alertId
  ) {
    setAlerts(
      (current) =>
        current.map(
          (alert) => {
            if (
              alert.id !==
              alertId
            ) {
              return alert;
            }

            const currentIndex =
              alertSteps.indexOf(
                alert.status
              );

            if (
              currentIndex ===
              alertSteps.length -
                1
            ) {
              return alert;
            }

            const nextStatus =
              alertSteps[
                currentIndex +
                  1
              ];

            return {
              ...alert,
              status:
                nextStatus,
            };
          }
        )
    );
  }

  function advanceDeterioration() {
    setDeteriorationIndex(
      (current) =>
        Math.min(
          current + 1,
          deteriorationStages.length -
            1
        )
    );
  }

  function resetDeterioration() {
    setDeteriorationIndex(
      0
    );
  }

  function advanceWorkflow() {
    if (
      workflowIndex >=
      workflowSteps.length -
        1
    ) {
      return;
    }

    const next =
      workflowIndex + 1;

    setWorkflowIndex(
      next
    );

    if (
      workflowSteps[
        next
      ] === "Assigned"
    ) {
      setAssignedOfficer(
        "Maintenance Team A"
      );
    }
  }

  function resetWorkflow() {
    setWorkflowIndex(0);

    setAssignedOfficer(
      "Not assigned"
    );
  }

  const deterioration =
    deteriorationStages[
      deteriorationIndex
    ];

  const authorityStatus =
    workflowSteps[
      workflowIndex
    ];

  const dynamicIssues =
    baseIssues.map(
      (issue) => {
        if (
          issue.id !==
          "POT-102"
        ) {
          return issue;
        }

        return {
          ...issue,

          severity:
            deterioration.severity,

          confidence:
            potholeConfidence,
        };
      }
    );

  const verifiedCount =
    potholeStatus ===
    "Verified"
      ? 4
      : 3;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-box">
            UP
          </div>

          <div>
            <h2>
              UrbanPulse
            </h2>

            <span>
              City Sensing
            </span>
          </div>
        </div>

        <nav>
          {[
            "Dashboard",
            "Live Map",
            "Edge AI",
            "Alerts",
            "Urban Issues",
            "Fleet",
            "Priority Queue",
          ].map(
            (page) => (
              <button
                key={
                  page
                }
                className={`nav-item ${
                  activePage ===
                  page
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActivePage(
                    page
                  )
                }
              >
                {page}

                {page ===
                  "Alerts" &&
                  alerts.filter(
                    (alert) =>
                      alert.status !==
                      "RESOLVED"
                  ).length >
                    0 && (
                    <span className="nav-count">
                      {
                        alerts.filter(
                          (
                            alert
                          ) =>
                            alert.status !==
                            "RESOLVED"
                        ).length
                      }
                    </span>
                  )}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <strong>
            SIH26124
          </strong>

          <span>
            BEL Urban Intelligence
          </span>
        </div>
      </aside>

      <main className="main-content">
        <Header
          activePage={
            activePage
          }
          alerts={
            alerts
          }
        />

        {activePage ===
          "Dashboard" && (
          <DashboardPage
            simulationRunning={
              simulationRunning
            }
            setSimulationRunning={
              setSimulationRunning
            }
            busPositions={
              busPositions
            }
            dynamicIssues={
              dynamicIssues
            }
            potholeConfidence={
              potholeConfidence
            }
            potholeBuses={
              potholeBuses
            }
            potholeStatus={
              potholeStatus
            }
            activityLog={
              activityLog
            }
            deterioration={
              deterioration
            }
            deteriorationIndex={
              deteriorationIndex
            }
            advanceDeterioration={
              advanceDeterioration
            }
            resetDeterioration={
              resetDeterioration
            }
            workflowIndex={
              workflowIndex
            }
            authorityStatus={
              authorityStatus
            }
            assignedOfficer={
              assignedOfficer
            }
            advanceWorkflow={
              advanceWorkflow
            }
            resetWorkflow={
              resetWorkflow
            }
            verifiedCount={
              verifiedCount
            }
            alerts={
              alerts
            }
            setActivePage={
              setActivePage
            }
          />
        )}

        {activePage ===
          "Live Map" && (
          <LiveMapPage
            simulationRunning={
              simulationRunning
            }
            setSimulationRunning={
              setSimulationRunning
            }
            busPositions={
              busPositions
            }
            dynamicIssues={
              dynamicIssues
            }
            alerts={
              alerts
            }
          />
        )}

        {activePage ===
          "Edge AI" && (
          <EdgeAI
            onSendEvent={
              handleEdgeEvent
            }
          />
        )}

        {activePage ===
          "Alerts" && (
          <AlertsPage
            alerts={
              alerts
            }
            updateAlertStatus={
              updateAlertStatus
            }
          />
        )}

        {activePage ===
          "Urban Issues" && (
          <UrbanIssuesPage
            dynamicIssues={
              dynamicIssues
            }
            alerts={
              alerts
            }
            potholeBuses={
              potholeBuses
            }
            authorityStatus={
              authorityStatus
            }
          />
        )}

        {activePage ===
          "Fleet" && (
          <FleetPage
            simulationRunning={
              simulationRunning
            }
            busPositions={
              busPositions
            }
            alerts={
              alerts
            }
          />
        )}

        {activePage ===
          "Priority Queue" && (
          <PriorityQueuePage
            potholeConfidence={
              potholeConfidence
            }
            potholeBuses={
              potholeBuses
            }
            authorityStatus={
              authorityStatus
            }
            deterioration={
              deterioration
            }
          />
        )}
      </main>
    </div>
  );
}

function Header({
  activePage,
  alerts,
}) {
  const critical =
    alerts.filter(
      (alert) =>
        alert.severity ===
          "Critical" &&
        alert.status !==
          "RESOLVED"
    ).length;

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">
          CITY COMMAND CENTRE
        </p>

        <h1>
          {activePage}
        </h1>

        <p className="subtitle">
          Every bus observes. The fleet verifies. The city acts.
        </p>
      </div>

      <div className="header-status-area">
        {critical >
          0 && (
          <div className="critical-header-alert">
            {critical} critical alert
            {critical >
            1
              ? "s"
              : ""}
          </div>
        )}

        <div className="system-status">
          <span className="status-dot"></span>

          System Live
        </div>
      </div>
    </header>
  );
}

function DashboardPage({
  simulationRunning,
  setSimulationRunning,
  busPositions,
  dynamicIssues,
  potholeConfidence,
  potholeBuses,
  potholeStatus,
  activityLog,
  deterioration,
  deteriorationIndex,
  advanceDeterioration,
  resetDeterioration,
  workflowIndex,
  authorityStatus,
  assignedOfficer,
  advanceWorkflow,
  resetWorkflow,
  verifiedCount,
  alerts,
  setActivePage,
}) {
  const activeAlerts =
    alerts.filter(
      (alert) =>
        alert.status !==
        "RESOLVED"
    );

  return (
    <>
      <section className="stats-grid">
        <StatCard
          title="Active Buses"
          value={
            simulationRunning
              ? "3"
              : "0"
          }
          description="Currently sensing"
        />

        <StatCard
          title="Open Alerts"
          value={
            activeAlerts.length
          }
          description="Require attention"
        />

        <StatCard
          title="Verified Issues"
          value={
            verifiedCount
          }
          description="Multi-bus confirmed"
        />

        <StatCard
          title="Repair Priority"
          value={
            deterioration.priority
          }
          description="POT-102 risk score"
        />
      </section>

      {activeAlerts.length >
        0 && (
        <section className="dashboard-alert-strip">
          <div>
            <span className="alert-strip-label">
              LIVE ALERT
            </span>

            <strong>
              {
                activeAlerts[0]
                  .type
              }
            </strong>

            <p>
              {
                activeAlerts[0]
                  .location
              }{" "}
              ·{" "}
              {
                activeAlerts[0]
                  .busId
              }{" "}
              ·{" "}
              {
                activeAlerts[0]
                  .confidence
              }
              % confidence
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              setActivePage(
                "Alerts"
              )
            }
          >
            View Alerts
          </button>
        </section>
      )}

      <section className="dashboard-grid">
        <div className="panel map-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                LIVE INTELLIGENCE
              </p>

              <h2>
                Fleet + Incident Map
              </h2>

              <p
                className={`simulation-status ${
                  simulationRunning
                    ? "running"
                    : "offline"
                }`}
              >
                {simulationRunning
                  ? "Simulation Running"
                  : "Simulation Offline"}
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() =>
                setSimulationRunning(
                  !simulationRunning
                )
              }
            >
              {simulationRunning
                ? "Stop Simulation"
                : "Start Simulation"}
            </button>
          </div>

          <UrbanMap
            busPositions={
              busPositions
            }
            dynamicIssues={
              dynamicIssues
            }
            simulationRunning={
              simulationRunning
            }
            alerts={
              alerts
            }
          />
        </div>

        <div className="panel activity-panel">
          <p className="eyebrow">
            FLEET CONSENSUS
          </p>

          <h2>
            Live Activity
          </h2>

          <div className="consensus-card">
            <p className="consensus-label">
              POT-102 Fleet Confidence
            </p>

            <h3>
              {potholeConfidence}%
            </h3>

            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{
                  width:
                    `${potholeConfidence}%`,
                }}
              />
            </div>

            <p className="consensus-info">
              Seen by {potholeBuses} bus(es)
            </p>

            <span
              className={`consensus-status ${
                potholeStatus ===
                "Verified"
                  ? "verified"
                  : ""
              }`}
            >
              {potholeStatus}
            </span>
          </div>

          <div className="activity-list">
            {activityLog
              .slice(0, 5)
              .map(
                (
                  activity,
                  index
                ) => (
                  <ActivityItem
                    key={
                      index
                    }
                    {...activity}
                  />
                )
              )}
          </div>
        </div>
      </section>

      <section className="memory-grid">
        <div className="panel">
          <p className="eyebrow">
            URBAN DIGITAL MEMORY
          </p>

          <h2>
            POT-102 Deterioration
          </h2>

          <div className="memory-summary">
            <MemoryItem
              label="Stage"
              value={
                deterioration.day
              }
            />

            <MemoryItem
              label="Size"
              value={
                deterioration.size
              }
            />

            <MemoryItem
              label="Growth"
              value={
                deterioration.growth
              }
            />

            <MemoryItem
              label="Severity"
              value={
                deterioration.severity
              }
            />

            <MemoryItem
              label="Priority"
              value={`${deterioration.priority}/100`}
            />
          </div>

          <div className="memory-actions">
            <button
              className="primary-button"
              onClick={
                advanceDeterioration
              }
              disabled={
                deteriorationIndex ===
                deteriorationStages.length -
                  1
              }
            >
              Simulate Next Observation
            </button>

            <button
              className="secondary-button"
              onClick={
                resetDeterioration
              }
            >
              Reset
            </button>
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">
            RISK INTELLIGENCE
          </p>

          <h2>
            Repair Priority
          </h2>

          <div className="priority-score">
            {
              deterioration.priority
            }

            <span>
              /100
            </span>
          </div>

          <Factor
            label="Damage"
            value={
              deterioration.severity
            }
          />

          <Factor
            label="Traffic"
            value="High"
          />

          <Factor
            label="Repeat Sightings"
            value={`${potholeBuses} buses`}
          />

          <Factor
            label="School Zone"
            value="180 m"
          />
        </div>
      </section>

      <section className="panel authority-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              AUTHORITY WORKFLOW
            </p>

            <h2>
              POT-102 Maintenance
            </h2>
          </div>

          <span
            className={`authority-status ${getAuthorityClass(
              authorityStatus
            )}`}
          >
            {
              authorityStatus
            }
          </span>
        </div>

        <div className="authority-grid">
          <div className="authority-details">
            <AuthorityRow
              label="Issue"
              value="Large Pothole"
            />

            <AuthorityRow
              label="Location"
              value="Connaught Place"
            />

            <AuthorityRow
              label="Department"
              value="Road Maintenance"
            />

            <AuthorityRow
              label="Assigned Team"
              value={
                assignedOfficer
              }
            />
          </div>

          <div className="workflow">
            {workflowSteps.map(
              (
                step,
                index
              ) => (
                <div
                  key={
                    step
                  }
                  className={`workflow-step ${
                    index <=
                    workflowIndex
                      ? "complete"
                      : ""
                  }`}
                >
                  <div className="workflow-circle">
                    {
                      index +
                      1
                    }
                  </div>

                  <span>
                    {step}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="authority-actions">
          <button
            className="primary-button"
            onClick={
              advanceWorkflow
            }
            disabled={
              workflowIndex ===
              workflowSteps.length -
                1
            }
          >
            {workflowIndex ===
            0
              ? "Assign Maintenance Team"
              : workflowIndex ===
                1
              ? "Start Repair"
              : workflowIndex ===
                2
              ? "Mark Resolved"
              : "Resolved"}
          </button>

          <button
            className="secondary-button"
            onClick={
              resetWorkflow
            }
          >
            Reset Workflow
          </button>
        </div>
      </section>
    </>
  );
}

function AlertsPage({
  alerts,
  updateAlertStatus,
}) {
  const [
    filter,
    setFilter,
  ] =
    useState("All");

  const filtered =
    alerts.filter(
      (alert) => {
        if (
          filter ===
          "All"
        ) {
          return true;
        }

        return (
          alert.severity ===
          filter
        );
      }
    );

  return (
    <div>
      <div className="page-section-header">
        <div>
          <p className="eyebrow">
            AI ALERT ENGINE
          </p>

          <h2>
            Actionable Alerts
          </h2>

          <p className="subtitle">
            AI detections converted into authority-ready incidents.
          </p>
        </div>

        <div className="alert-filters">
          {[
            "All",
            "Critical",
            "High",
            "Medium",
            "Low",
          ].map(
            (value) => (
              <button
                key={
                  value
                }
                className={`filter-button ${
                  filter ===
                  value
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter(
                    value
                  )
                }
              >
                {value}
              </button>
            )
          )}
        </div>
      </div>

      <div className="alerts-grid">
        {filtered.map(
          (alert) => (
            <AlertCard
              key={
                alert.id
              }
              alert={
                alert
              }
              onAdvance={() =>
                updateAlertStatus(
                  alert.id
                )
              }
            />
          )
        )}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onAdvance,
}) {
  const index =
    alertSteps.indexOf(
      alert.status
    );

  return (
    <article className={`alert-card severity-${alert.severity.toLowerCase()}`}>
      <div className="alert-card-header">
        <div>
          <span className={`alert-severity severity-${alert.severity.toLowerCase()}`}>
            {
              alert.severity
            }
          </span>

          <h3>
            {alert.type}
          </h3>
        </div>

        <span className="alert-id">
          {alert.id}
        </span>
      </div>

      {alert.evidence && (
        <div className="alert-evidence">
          <img
            src={
              alert.evidence
            }
            alt="AI detection evidence"
          />

          <span>
            AI Detection Evidence
          </span>
        </div>
      )}

      <p className="alert-description">
        {
          alert.description
        }
      </p>

      <div className="alert-details">
        <AlertDetail
          label="Location"
          value={
            alert.location
          }
        />

        <AlertDetail
          label="GPS"
          value={`${alert.latitude.toFixed(
            4
          )}, ${alert.longitude.toFixed(
            4
          )}`}
        />

        <AlertDetail
          label="Detected by"
          value={
            alert.busId
          }
        />

        <AlertDetail
          label="Timestamp"
          value={
            alert.timestamp
          }
        />

        <AlertDetail
          label="AI Confidence"
          value={`${alert.confidence}%`}
        />
      </div>

      <div className="alert-status-flow">
        {alertSteps.map(
          (
            step,
            stepIndex
          ) => (
            <div
              key={
                step
              }
              className={`alert-flow-step ${
                stepIndex <=
                index
                  ? "active"
                  : ""
              }`}
            >
              <span></span>

              <small>
                {step}
              </small>
            </div>
          )
        )}
      </div>

      <div className="alert-card-footer">
        <strong>
          {alert.status}
        </strong>

        <button
          className="primary-button"
          onClick={
            onAdvance
          }
          disabled={
            alert.status ===
            "RESOLVED"
          }
        >
          {getNextAlertAction(
            alert.status
          )}
        </button>
      </div>
    </article>
  );
}

function LiveMapPage({
  simulationRunning,
  setSimulationRunning,
  busPositions,
  dynamicIssues,
  alerts,
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            FLEET + INCIDENT INTELLIGENCE
          </p>

          <h2>
            Live GIS Map
          </h2>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setSimulationRunning(
              !simulationRunning
            )
          }
        >
          {simulationRunning
            ? "Stop Simulation"
            : "Start Simulation"}
        </button>
      </div>

      <UrbanMap
        large
        busPositions={
          busPositions
        }
        dynamicIssues={
          dynamicIssues
        }
        simulationRunning={
          simulationRunning
        }
        alerts={
          alerts
        }
      />

      <div className="map-summary">
        <div>
          <span>
            Fleet
          </span>

          <strong>
            4 buses
          </strong>
        </div>

        <div>
          <span>
            Online
          </span>

          <strong>
            2
          </strong>
        </div>

        <div>
          <span>
            Warning
          </span>

          <strong>
            1
          </strong>
        </div>

        <div>
          <span>
            Offline
          </span>

          <strong>
            1
          </strong>
        </div>

        <div>
          <span>
            Open Alerts
          </span>

          <strong>
            {
              alerts.filter(
                (alert) =>
                  alert.status !==
                  "RESOLVED"
              ).length
            }
          </strong>
        </div>
      </div>
    </section>
  );
}

function FleetPage({
  simulationRunning,
  busPositions,
  alerts,
}) {
  return (
    <>
      <div className="page-section-header">
        <div>
          <p className="eyebrow">
            MOBILE SENSOR NETWORK
          </p>

          <h2>
            Fleet Monitoring
          </h2>

          <p className="subtitle">
            Operational health of every AI-enabled public transport sensing unit.
          </p>
        </div>
      </div>

      <div className="fleet-grid">
        {Object.entries(
          fleetMeta
        ).map(
          ([
            busId,
            meta,
          ]) => {
            const hasRoute =
              !!busRoutes[
                busId
              ];

            const position =
              hasRoute
                ? busRoutes[
                    busId
                  ][
                    busPositions[
                      busId
                    ]
                  ]
                : meta.fixedPosition;

            const busAlerts =
              alerts.filter(
                (alert) =>
                  alert.busId ===
                  busId
              );

            return (
              <div
                className="fleet-card"
                key={
                  busId
                }
              >
                <div className="fleet-card-top">
                  <div>
                    <strong>
                      {
                        busId
                      }
                    </strong>

                    <p>
                      {
                        meta.route
                      }
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      meta.status
                    }
                  />
                </div>

                <div className="fleet-health-grid">
                  <HealthItem
                    label="GPS"
                    value={
                      meta.gps
                    }
                  />

                  <HealthItem
                    label="Camera"
                    value={
                      meta.camera
                    }
                  />

                  <HealthItem
                    label="Edge AI"
                    value={
                      meta.edgeAI
                    }
                  />

                  <HealthItem
                    label="Connection"
                    value={
                      meta.connection
                    }
                  />
                </div>

                <div className="fleet-location">
                  <span>
                    Current GPS
                  </span>

                  <strong>
                    {position[0].toFixed(
                      4
                    )}
                    ,{" "}
                    {position[1].toFixed(
                      4
                    )}
                  </strong>
                </div>

                <div className="fleet-metrics">
                  <div>
                    <span>
                      Alerts
                    </span>

                    <strong>
                      {
                        busAlerts.length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      High/Critical
                    </span>

                    <strong>
                      {
                        busAlerts.filter(
                          (
                            alert
                          ) =>
                            [
                              "High",
                              "Critical",
                            ].includes(
                              alert.severity
                            )
                        ).length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Last Update
                    </span>

                    <strong>
                      {
                        meta.lastUpdate
                      }
                    </strong>
                  </div>
                </div>

                {busAlerts.length >
                  0 && (
                  <div className="fleet-latest-alert">
                    <span>
                      Latest Detection
                    </span>

                    <strong>
                      {
                        busAlerts[0]
                          .type
                      }
                    </strong>

                    <small>
                      {
                        busAlerts[0]
                          .location
                      }
                    </small>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </>
  );
}

function UrbanIssuesPage({
  dynamicIssues,
  alerts,
  potholeBuses,
  authorityStatus,
}) {
  return (
    <section className="panel">
      <p className="eyebrow">
        URBAN ISSUE REGISTER
      </p>

      <h2>
        Detected City Issues
      </h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>
                ID
              </th>

              <th>
                Issue
              </th>

              <th>
                Location
              </th>

              <th>
                Bus
              </th>

              <th>
                Severity
              </th>

              <th>
                Confidence
              </th>

              <th>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {alerts.map(
              (alert) => (
                <tr
                  key={
                    alert.id
                  }
                >
                  <td>
                    {
                      alert.id
                    }
                  </td>

                  <td>
                    {
                      alert.type
                    }
                  </td>

                  <td>
                    {
                      alert.location
                    }
                  </td>

                  <td>
                    {
                      alert.busId
                    }
                  </td>

                  <td>
                    {
                      alert.severity
                    }
                  </td>

                  <td>
                    {
                      alert.confidence
                    }
                    %
                  </td>

                  <td>
                    {
                      alert.status
                    }
                  </td>
                </tr>
              )
            )}

            {dynamicIssues.map(
              (issue) => (
                <tr
                  key={
                    issue.id
                  }
                >
                  <td>
                    {
                      issue.id
                    }
                  </td>

                  <td>
                    {
                      issue.type
                    }
                  </td>

                  <td>
                    {
                      issue.location
                    }
                  </td>

                  <td>
                    {
                      issue.busId
                    }
                  </td>

                  <td>
                    {
                      issue.severity
                    }
                  </td>

                  <td>
                    {
                      issue.confidence
                    }
                    %
                  </td>

                  <td>
                    {issue.id ===
                    "POT-102"
                      ? authorityStatus
                      : "Verified"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PriorityQueuePage({
  potholeConfidence,
  potholeBuses,
  authorityStatus,
  deterioration,
}) {
  return (
    <section className="panel">
      <p className="eyebrow">
        DECISION SUPPORT
      </p>

      <h2>
        Priority Work Queue
      </h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>
                Priority
              </th>

              <th>
                Issue
              </th>

              <th>
                Location
              </th>

              <th>
                Confidence
              </th>

              <th>
                Fleet Evidence
              </th>

              <th>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <PriorityBadge
                  type={
                    deterioration.severity.toLowerCase()
                  }
                >
                  {
                    deterioration.severity
                  }
                </PriorityBadge>
              </td>

              <td>
                Large Pothole
              </td>

              <td>
                Connaught Place
              </td>

              <td>
                {
                  potholeConfidence
                }
                %
              </td>

              <td>
                {
                  potholeBuses
                }{" "}
                buses
              </td>

              <td>
                {
                  authorityStatus
                }
              </td>
            </tr>

            <tr>
              <td>
                <PriorityBadge type="critical">
                  Critical
                </PriorityBadge>
              </td>

              <td>
                Waterlogging
              </td>

              <td>
                Mandi House
              </td>

              <td>
                97%
              </td>

              <td>
                6 buses
              </td>

              <td>
                Verified
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UrbanMap({
  busPositions,
  dynamicIssues,
  simulationRunning,
  alerts,
  large = false,
}) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={[
          28.6265,
          77.216,
        ]}
        zoom={13}
        scrollWheelZoom={
          true
        }
        className={`leaflet-map ${
          large
            ? "large-map"
            : ""
        }`}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {dynamicIssues.map(
          (issue) => (
            <CircleMarker
              key={
                issue.id
              }
              center={
                issue.position
              }
              radius={10}
              pathOptions={{
                color:
                  getSeverityColor(
                    issue.severity
                  ),

                fillColor:
                  getSeverityColor(
                    issue.severity
                  ),

                fillOpacity:
                  0.85,
              }}
            >
              <Popup>
                <strong>
                  {
                    issue.type
                  }
                </strong>

                <p>
                  ID:{" "}
                  {
                    issue.id
                  }
                </p>

                <p>
                  Location:{" "}
                  {
                    issue.location
                  }
                </p>

                <p>
                  Source:{" "}
                  {
                    issue.busId
                  }
                </p>

                <p>
                  Confidence:{" "}
                  {
                    issue.confidence
                  }
                  %
                </p>

                <p>
                  Severity:{" "}
                  {
                    issue.severity
                  }
                </p>
              </Popup>
            </CircleMarker>
          )
        )}

        {alerts.map(
          (alert) => (
            <CircleMarker
              key={
                alert.id
              }
              center={[
                alert.latitude,
                alert.longitude,
              ]}
              radius={8}
              pathOptions={{
                color:
                  getSeverityColor(
                    alert.severity
                  ),

                fillColor:
                  getSeverityColor(
                    alert.severity
                  ),

                fillOpacity:
                  1,
              }}
            >
              <Popup>
                <strong>
                  {
                    alert.type
                  }
                </strong>

                <p>
                  Alert:{" "}
                  {
                    alert.id
                  }
                </p>

                <p>
                  Source Bus:{" "}
                  {
                    alert.busId
                  }
                </p>

                <p>
                  {
                    alert.location
                  }
                </p>

                <p>
                  Confidence:{" "}
                  {
                    alert.confidence
                  }
                  %
                </p>

                <p>
                  Status:{" "}
                  {
                    alert.status
                  }
                </p>

                <p>
                  {
                    alert.timestamp
                  }
                </p>
              </Popup>
            </CircleMarker>
          )
        )}

        {Object.entries(
          fleetMeta
        ).map(
          ([
            busId,
            meta,
          ]) => {
            const route =
              busRoutes[
                busId
              ];

            const position =
              route
                ? route[
                    busPositions[
                      busId
                    ]
                  ]
                : meta.fixedPosition;

            return (
              <Marker
                key={
                  busId
                }
                position={
                  position
                }
              >
                <Popup>
                  <strong>
                    {
                      busId
                    }
                  </strong>

                  <p>
                    {
                      meta.route
                    }
                  </p>

                  <p>
                    Status:{" "}
                    {
                      meta.status
                    }
                  </p>

                  <p>
                    GPS:{" "}
                    {
                      meta.gps
                    }
                  </p>

                  <p>
                    Camera:{" "}
                    {
                      meta.camera
                    }
                  </p>

                  <p>
                    Edge AI:{" "}
                    {
                      meta.edgeAI
                    }
                  </p>

                  <p>
                    Connection:{" "}
                    {
                      meta.connection
                    }
                  </p>

                  <p>
                    Last update:{" "}
                    {
                      meta.lastUpdate
                    }
                  </p>

                  <p>
                    Current alerts:{" "}
                    {
                      alerts.filter(
                        (
                          alert
                        ) =>
                          alert.busId ===
                          busId &&
                          alert.status !==
                            "RESOLVED"
                      ).length
                    }
                  </p>
                </Popup>
              </Marker>
            );
          }
        )}
      </MapContainer>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}) {
  return (
    <div className="stat-card">
      <p>
        {title}
      </p>

      <h2>
        {value}
      </h2>

      <span>
        {description}
      </span>
    </div>
  );
}

function ActivityItem({
  bus,
  issue,
  confidence,
  time,
}) {
  return (
    <div className="activity">
      <div className="activity-icon">
        B
      </div>

      <div className="activity-info">
        <strong>
          {bus}
        </strong>

        <p>
          {issue}
        </p>

        <div className="activity-meta">
          <span>
            {
              confidence
            }
          </span>

          <span>
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

function AlertDetail({
  label,
  value,
}) {
  return (
    <div className="alert-detail-row">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function MemoryItem({
  label,
  value,
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Factor({
  label,
  value,
}) {
  return (
    <div className="factor-row">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function AuthorityRow({
  label,
  value,
}) {
  return (
    <div className="authority-row">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function PriorityBadge({
  type,
  children,
}) {
  return (
    <span className={`priority ${type}`}>
      {children}
    </span>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <span className={`bus-status bus-${status.toLowerCase()}`}>
      {status}
    </span>
  );
}

function HealthItem({
  label,
  value,
}) {
  const state =
    value ===
      "Active" ||
    value ===
      "Online"
      ? "healthy"
      : value ===
        "Warning"
      ? "warning"
      : "offline";

  return (
    <div className="health-item">
      <span>
        {label}
      </span>

      <strong className={`health-${state}`}>
        {value}
      </strong>
    </div>
  );
}

function getSeverityColor(
  severity
) {
  if (
    severity ===
    "Critical"
  ) {
    return "#ef4444";
  }

  if (
    severity === "High"
  ) {
    return "#f97316";
  }

  if (
    severity ===
    "Medium"
  ) {
    return "#eab308";
  }

  return "#22c55e";
}

function getAuthorityClass(
  status
) {
  if (
    status ===
    "Resolved"
  ) {
    return "resolved";
  }

  if (
    status ===
    "Repair in Progress"
  ) {
    return "progress";
  }

  if (
    status ===
    "Assigned"
  ) {
    return "assigned";
  }

  return "verified";
}

function getNextAlertAction(
  status
) {
  if (
    status === "NEW"
  ) {
    return "Acknowledge";
  }

  if (
    status ===
    "ACKNOWLEDGED"
  ) {
    return "Assign";
  }

  if (
    status ===
    "ASSIGNED"
  ) {
    return "Start Work";
  }

  if (
    status ===
    "IN PROGRESS"
  ) {
    return "Resolve";
  }

  return "Resolved";
}

export default App;