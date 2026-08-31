import React, { useEffect, useState } from "react";

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
    position: [28.6315, 77.2167],
    severity: "Medium",
  },
  {
    id: "WAT-041",
    type: "Waterlogging",
    location: "Mandi House",
    position: [28.6258, 77.2342],
    severity: "Critical",
  },
  {
    id: "DIV-018",
    type: "Broken Divider",
    location: "India Gate",
    position: [28.6129, 77.2295],
    severity: "High",
  },
  {
    id: "ZEB-011",
    type: "Faded Zebra Crossing",
    location: "Karol Bagh",
    position: [28.6519, 77.1909],
    severity: "Medium",
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

const confidenceSteps = [76, 91, 98];

const deteriorationStages = [
  {
    day: "Day 1",
    size: "12 cm",
    growth: "Baseline",
    severity: "Medium",
    priority: 48,
    note: "Initial road defect recorded",
  },
  {
    day: "Day 3",
    size: "18 cm",
    growth: "+50%",
    severity: "High",
    priority: 72,
    note: "Defect expanding",
  },
  {
    day: "Day 5",
    size: "27 cm",
    growth: "+125%",
    severity: "Critical",
    priority: 94,
    note: "Rapid deterioration detected",
  },
];

const workflowSteps = [
  "Verified",
  "Assigned",
  "Repair in Progress",
  "Resolved",
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [simulationRunning, setSimulationRunning] = useState(false);

  const [busPositions, setBusPositions] = useState({
    "BUS-017": 0,
    "BUS-044": 0,
    "BUS-006": 0,
  });

  const [potholeConfidence, setPotholeConfidence] = useState(76);

  const [potholeBuses, setPotholeBuses] = useState(1);

  const [potholeStatus, setPotholeStatus] = useState("Detected");

  const [deteriorationIndex, setDeteriorationIndex] = useState(0);

  const [workflowIndex, setWorkflowIndex] = useState(0);

  const [assignedOfficer, setAssignedOfficer] =
    useState("Not assigned");

  /*
    NEW:
    Events received from the Edge AI page are stored here.
  */
  const [edgeEvents, setEdgeEvents] = useState([]);

  const [activityLog, setActivityLog] = useState([
    {
      bus: "BUS-017",
      issue: "Pothole detected",
      confidence: "76%",
      time: "Initial detection",
    },
  ]);

  /*
    BUS MOVEMENT SIMULATION
  */
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      setBusPositions((currentPositions) => {
        const updatedPositions = {};

        Object.keys(currentPositions).forEach((busId) => {
          const routeLength = busRoutes[busId].length;

          updatedPositions[busId] =
            (currentPositions[busId] + 1) % routeLength;
        });

        return updatedPositions;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationRunning]);

  /*
    FLEET CONSENSUS
  */
  useEffect(() => {
    if (!simulationRunning) return;

    Object.keys(busRoutes).forEach((busId) => {
      const index = busPositions[busId];

      const position = busRoutes[busId][index];

      const isAtPothole =
        Math.abs(position[0] - 28.6315) < 0.0001 &&
        Math.abs(position[1] - 77.2167) < 0.0001;

      if (!isAtPothole) return;

      if (busId === "BUS-044" && potholeBuses < 2) {
        registerDetection(busId, 2);
      }

      if (busId === "BUS-006" && potholeBuses < 3) {
        registerDetection(busId, 3);
      }
    });
  }, [busPositions, simulationRunning, potholeBuses]);

  function registerDetection(busId, busCount) {
    const newConfidence = confidenceSteps[busCount - 1];

    setPotholeBuses(busCount);

    setPotholeConfidence(newConfidence);

    const newStatus =
      busCount >= 3 ? "Verified" : "Under Verification";

    setPotholeStatus(newStatus);

    setActivityLog((current) => [
      {
        bus: busId,

        issue:
          busCount >= 3
            ? "Pothole verified by fleet"
            : "Same pothole detected",

        confidence: `${newConfidence}%`,

        time: "Just now",
      },

      ...current,
    ]);
  }

  /*
    NEW:
    Receive an event from EdgeAI.jsx
  */
  function handleEdgeEvent(event) {
    setEdgeEvents((current) => [
      event,
      ...current,
    ]);

    setActivityLog((current) => [
      {
        bus: event.busId,

        issue: `${event.type} sent from Edge AI`,

        confidence: `${event.confidence}%`,

        time: event.timestamp,
      },

      ...current,
    ]);
  }

  /*
    DETERIORATION
  */
  function advanceDeterioration() {
    setDeteriorationIndex((current) => {
      if (current >= deteriorationStages.length - 1) {
        return current;
      }

      return current + 1;
    });
  }

  function resetDeterioration() {
    setDeteriorationIndex(0);
  }

  /*
    AUTHORITY WORKFLOW
  */
  function advanceWorkflow() {
    if (workflowIndex >= workflowSteps.length - 1) {
      return;
    }

    const nextIndex = workflowIndex + 1;

    setWorkflowIndex(nextIndex);

    const nextStatus = workflowSteps[nextIndex];

    if (nextStatus === "Assigned") {
      setAssignedOfficer("Maintenance Team A");
    }

    setActivityLog((current) => [
      {
        bus: "AUTHORITY",

        issue: `POT-102 status changed to ${nextStatus}`,

        confidence: `${potholeConfidence}%`,

        time: "Just now",
      },

      ...current,
    ]);
  }

  function resetWorkflow() {
    setWorkflowIndex(0);

    setAssignedOfficer("Not assigned");
  }

  const deterioration =
    deteriorationStages[deteriorationIndex];

  const authorityStatus =
    workflowSteps[workflowIndex];

  const dynamicIssues = baseIssues.map((issue) => {
    if (issue.id !== "POT-102") return issue;

    return {
      ...issue,

      severity: deterioration.severity,
    };
  });

  const verifiedCount =
    potholeStatus === "Verified" ? 4 : 3;

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
            "Urban Issues",
            "Fleet",
            "Priority Queue",
          ].map((page) => (
            <button
              key={page}
              className={`nav-item ${
                activePage === page
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(page)
              }
            >
              {page}
            </button>
          ))}
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

        <Header activePage={activePage} />

        {activePage === "Dashboard" && (
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
            edgeEvents={
              edgeEvents
            }
          />
        )}

        {activePage === "Live Map" && (
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
            edgeEvents={
              edgeEvents
            }
          />
        )}

        {activePage === "Edge AI" && (
          <EdgeAI
            onSendEvent={
              handleEdgeEvent
            }
          />
        )}

        {activePage === "Urban Issues" && (
          <UrbanIssuesPage
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
            edgeEvents={
              edgeEvents
            }
          />
        )}

        {activePage === "Fleet" && (
          <FleetPage
            simulationRunning={
              simulationRunning
            }
            busPositions={
              busPositions
            }
          />
        )}

        {activePage === "Priority Queue" && (
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

/*
========================================
HEADER
========================================
*/

function Header({ activePage }) {
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

      <div className="system-status">
        <span className="status-dot"></span>

        System Live
      </div>
    </header>
  );
}

/*
========================================
DASHBOARD
========================================
*/

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
  edgeEvents,
}) {
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
          title="Issues Today"
          value={
            4 + edgeEvents.length
          }
          description="Detected across city"
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

      <section className="dashboard-grid">

        <div className="panel map-panel">

          <div className="panel-heading">

            <div>

              <p className="eyebrow">
                LIVE INTELLIGENCE
              </p>

              <h2>
                City Observation Map
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
            edgeEvents={
              edgeEvents
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
                  width: `${potholeConfidence}%`,
                }}
              />

            </div>

            <p className="consensus-info">
              Seen by {potholeBuses} bus(es)
            </p>

            <span
              className={`consensus-status ${
                potholeStatus === "Verified"
                  ? "verified"
                  : ""
              }`}
            >
              {potholeStatus}
            </span>

          </div>

          <div className="activity-list">

            {activityLog.map(
              (activity, index) => (
                <ActivityItem
                  key={`${activity.bus}-${index}`}
                  {...activity}
                />
              )
            )}

          </div>

        </div>

      </section>

      <section className="memory-grid">

        <div className="panel memory-panel">

          <p className="eyebrow">
            URBAN DIGITAL MEMORY
          </p>

          <h2>
            POT-102 Deterioration Tracking
          </h2>

          <div className="memory-summary">

            <MemoryItem
              label="Current Stage"
              value={
                deterioration.day
              }
            />

            <MemoryItem
              label="Estimated Size"
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
                deteriorationIndex === 2
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
              Reset Timeline
            </button>

          </div>

        </div>

        <div className="panel priority-engine">

          <p className="eyebrow">
            RISK INTELLIGENCE
          </p>

          <h2>
            Repair Priority Engine
          </h2>

          <div className="priority-score">

            {deterioration.priority}

            <span>
              /100
            </span>

          </div>

          <div className="priority-factors">

            <Factor
              label="Road Damage"
              value={
                deterioration.severity
              }
            />

            <Factor
              label="Traffic Volume"
              value="High"
            />

            <Factor
              label="Repeat Sightings"
              value={`${potholeBuses} buses`}
            />

            <Factor
              label="Nearby School"
              value="180 m"
            />

            <Factor
              label="Growth"
              value={
                deterioration.growth
              }
            />

          </div>

        </div>

      </section>

      <section className="panel authority-panel">

        <div className="panel-heading">

          <div>

            <p className="eyebrow">
              AUTHORITY WORKFLOW
            </p>

            <h2>
              POT-102 Maintenance Action
            </h2>

          </div>

          <span
            className={`authority-status ${getAuthorityClass(
              authorityStatus
            )}`}
          >
            {authorityStatus}
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
              value="Road Maintenance Department"
            />

            <AuthorityRow
              label="Assigned Team"
              value={
                assignedOfficer
              }
            />

            <AuthorityRow
              label="Priority"
              value={`${deterioration.priority}/100`}
            />

          </div>

          <div className="workflow">

            {workflowSteps.map(
              (step, index) => (
                <div
                  key={step}
                  className={`workflow-step ${
                    index <= workflowIndex
                      ? "complete"
                      : ""
                  }`}
                >

                  <div className="workflow-circle">
                    {index + 1}
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
              workflowIndex === 3
            }
          >
            {workflowIndex === 0
              ? "Assign Maintenance Team"
              : workflowIndex === 1
              ? "Start Repair"
              : workflowIndex === 2
              ? "Mark as Resolved"
              : "Issue Resolved"}
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

/*
========================================
LIVE MAP PAGE
========================================
*/

function LiveMapPage({
  simulationRunning,
  setSimulationRunning,
  busPositions,
  dynamicIssues,
  edgeEvents,
}) {
  return (
    <section className="panel">

      <div className="panel-heading">

        <div>

          <p className="eyebrow">
            CITY-WIDE OBSERVATION
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
        edgeEvents={
          edgeEvents
        }
      />

    </section>
  );
}

/*
========================================
URBAN ISSUES
========================================
*/

function UrbanIssuesPage({
  potholeConfidence,
  potholeBuses,
  authorityStatus,
  deterioration,
  edgeEvents,
}) {
  const rows = [
    {
      id: "POT-102",
      issue: "Large Pothole",
      location: "Connaught Place",
      severity:
        deterioration.severity,
      confidence:
        `${potholeConfidence}%`,
      evidence:
        `${potholeBuses} buses`,
      status:
        authorityStatus,
    },

    {
      id: "WAT-041",
      issue: "Waterlogging",
      location: "Mandi House",
      severity: "Critical",
      confidence: "97%",
      evidence: "6 buses",
      status: "Verified",
    },

    {
      id: "DIV-018",
      issue: "Broken Divider",
      location: "India Gate",
      severity: "High",
      confidence: "94%",
      evidence: "3 buses",
      status: "Verified",
    },

    {
      id: "ZEB-011",
      issue: "Faded Zebra Crossing",
      location: "Karol Bagh",
      severity: "Medium",
      confidence: "91%",
      evidence: "4 buses",
      status: "Verified",
    },
  ];

  /*
    Convert Edge AI events into table rows
  */
  const edgeRows = edgeEvents.map(
    (event) => ({
      id: event.id,

      issue:
        event.type,

      location:
        event.location,

      severity:
        event.trafficDensity === "High"
          ? "High"
          : event.trafficDensity === "Medium"
          ? "Medium"
          : "Low",

      confidence:
        `${event.confidence}%`,

      evidence:
        event.busId,

      status:
        event.status,
    })
  );

  const allRows = [
    ...edgeRows,
    ...rows,
  ];

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
              <th>ID</th>
              <th>Issue</th>
              <th>Location</th>
              <th>Severity</th>
              <th>Confidence</th>
              <th>Fleet / Source</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            {allRows.map(
              (row) => (
                <tr key={row.id}>

                  <td>
                    {row.id}
                  </td>

                  <td>
                    {row.issue}
                  </td>

                  <td>
                    {row.location}
                  </td>

                  <td>
                    {row.severity}
                  </td>

                  <td>
                    {row.confidence}
                  </td>

                  <td>
                    {row.evidence}
                  </td>

                  <td>
                    {row.status}
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

/*
========================================
FLEET PAGE
========================================
*/

function FleetPage({
  simulationRunning,
  busPositions,
}) {
  const buses =
    Object.keys(busRoutes);

  return (
    <section className="panel">

      <p className="eyebrow">
        PUBLIC TRANSPORT SENSOR FLEET
      </p>

      <h2>
        Fleet Monitoring
      </h2>

      <div className="fleet-grid">

        {buses.map((busId) => {

          const position =
            busRoutes[busId][
              busPositions[busId]
            ];

          return (
            <div
              className="fleet-card"
              key={busId}
            >

              <div className="fleet-card-top">

                <strong>
                  {busId}
                </strong>

                <span
                  className={
                    simulationRunning
                      ? "fleet-active"
                      : "fleet-offline"
                  }
                >
                  {simulationRunning
                    ? "Active"
                    : "Stopped"}
                </span>

              </div>

              <p>
                Central Delhi Route
              </p>

              <div className="fleet-data">

                <span>
                  Camera
                </span>

                <strong>
                  Active
                </strong>

              </div>

              <div className="fleet-data">

                <span>
                  Edge AI
                </span>

                <strong>
                  Online
                </strong>

              </div>

              <div className="fleet-data">

                <span>
                  GPS
                </span>

                <strong>
                  Connected
                </strong>

              </div>

              <div className="fleet-data">

                <span>
                  Latitude
                </span>

                <strong>
                  {position[0].toFixed(4)}
                </strong>

              </div>

              <div className="fleet-data">

                <span>
                  Longitude
                </span>

                <strong>
                  {position[1].toFixed(4)}
                </strong>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}

/*
========================================
PRIORITY QUEUE
========================================
*/

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
              <th>Priority</th>
              <th>Issue</th>
              <th>Location</th>
              <th>Confidence</th>
              <th>Fleet Evidence</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            <tr>

              <td>

                <PriorityBadge
                  type={
                    deterioration.severity ===
                    "Critical"
                      ? "critical"
                      : deterioration.severity ===
                        "High"
                      ? "high"
                      : "medium"
                  }
                >
                  {deterioration.severity}
                </PriorityBadge>

              </td>

              <td>
                Large Pothole
              </td>

              <td>
                Connaught Place
              </td>

              <td>
                {potholeConfidence}%
              </td>

              <td>
                {potholeBuses} buses
              </td>

              <td>
                {authorityStatus}
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

            <tr>

              <td>

                <PriorityBadge type="high">
                  High
                </PriorityBadge>

              </td>

              <td>
                Broken Divider
              </td>

              <td>
                India Gate
              </td>

              <td>
                94%
              </td>

              <td>
                3 buses
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

/*
========================================
MAP
========================================
*/

function UrbanMap({
  busPositions,
  dynamicIssues,
  simulationRunning,
  edgeEvents = [],
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
        scrollWheelZoom={true}
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
              key={issue.id}
              center={
                issue.position
              }
              radius={11}
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
                  {issue.id}
                </strong>

                <p>
                  {issue.type}
                </p>

                <p>
                  Location:{" "}
                  {issue.location}
                </p>

                <p>
                  Severity:{" "}
                  {issue.severity}
                </p>

              </Popup>

            </CircleMarker>
          )
        )}

        {/*
          NEW:
          Edge AI events appear on GIS map.
        */}

        {edgeEvents.map(
          (event) => (
            <CircleMarker
              key={event.id}
              center={[
                event.latitude,
                event.longitude,
              ]}
              radius={9}
              pathOptions={{
                color: "#22d3ee",
                fillColor: "#22d3ee",
                fillOpacity: 0.9,
              }}
            >

              <Popup>

                <strong>
                  {event.id}
                </strong>

                <p>
                  {event.type}
                </p>

                <p>
                  Bus: {event.busId}
                </p>

                <p>
                  Vehicles:{" "}
                  {event.vehicles}
                </p>

                <p>
                  Pedestrians:{" "}
                  {event.pedestrians}
                </p>

                <p>
                  Traffic:{" "}
                  {event.trafficDensity}
                </p>

                <p>
                  Confidence:{" "}
                  {event.confidence}%
                </p>

                <p>
                  Time:{" "}
                  {event.timestamp}
                </p>

              </Popup>

            </CircleMarker>
          )
        )}

        {Object.keys(
          busRoutes
        ).map((busId) => {

          const position =
            busRoutes[busId][
              busPositions[busId]
            ];

          return (
            <Marker
              key={busId}
              position={position}
            >

              <Popup>

                <strong>
                  {busId}
                </strong>

                <p>
                  Status:{" "}
                  {simulationRunning
                    ? "Active"
                    : "Stopped"}
                </p>

                <p>
                  Camera: Active
                </p>

                <p>
                  Edge AI: Online
                </p>

                <p>
                  GPS: Connected
                </p>

              </Popup>

            </Marker>
          );
        })}

      </MapContainer>

    </div>
  );
}

/*
========================================
SMALL COMPONENTS
========================================
*/

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
            {confidence}
          </span>

          <span>
            {time}
          </span>

        </div>

      </div>

    </div>
  );
}

function PriorityBadge({
  type,
  children,
}) {
  return (
    <span
      className={`priority ${type}`}
    >
      {children}
    </span>
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

/*
========================================
HELPERS
========================================
*/

function getSeverityColor(
  severity
) {
  if (
    severity === "Critical"
  ) {
    return "#ef4444";
  }

  if (
    severity === "High"
  ) {
    return "#f97316";
  }

  if (
    severity === "Low"
  ) {
    return "#22c55e";
  }

  return "#eab308";
}

function getAuthorityClass(
  status
) {
  if (
    status === "Resolved"
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
    status === "Assigned"
  ) {
    return "assigned";
  }

  return "verified";
}

export default App;