import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './UrbanMap.css'

const DELHI_CENTER = [28.6139, 77.209]

const SAMPLE_ISSUES = [
  {
    id: 'POT-102',
    type: 'Large Pothole',
    location: 'Connaught Place',
    coordinates: [28.6315, 77.2167],
    severity: 'Critical',
    confidence: 96,
    verifiedBy: 8,
    status: 'Assigned',
  },
  {
    id: 'WAT-041',
    type: 'Waterlogging',
    location: 'Mandi House',
    coordinates: [28.6258, 77.2342],
    severity: 'Critical',
    confidence: 97,
    verifiedBy: 6,
    status: 'Open',
  },
  {
    id: 'DIV-018',
    type: 'Broken Divider',
    location: 'India Gate',
    coordinates: [28.6129, 77.2295],
    severity: 'High',
    confidence: 94,
    verifiedBy: 3,
    status: 'Open',
  },
  {
    id: 'ZEB-011',
    type: 'Faded Zebra Crossing',
    location: 'Karol Bagh',
    coordinates: [28.6519, 77.1909],
    severity: 'Medium',
    confidence: 91,
    verifiedBy: 4,
    status: 'Scheduled',
  },
]

const SEVERITY_COLORS = {
  Critical: '#e85d5d',
  High: '#e8a838',
  Medium: '#5b9fd4',
}

function createSeverityIcon(severity) {
  const color = SEVERITY_COLORS[severity] || '#2ec4b6'

  return L.divIcon({
    className: 'urban-marker',
    html: `<span class="urban-marker__dot" style="background-color:${color}; border-color:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

function IssuePopup({ issue }) {
  return (
    <div className="issue-popup">
      <p className="issue-popup__id">{issue.id}</p>
      <p className="issue-popup__type">{issue.type}</p>
      <dl className="issue-popup__meta">
        <div>
          <dt>Location</dt>
          <dd>{issue.location}</dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>{issue.severity}</dd>
        </div>
        <div>
          <dt>AI Confidence</dt>
          <dd>{issue.confidence}%</dd>
        </div>
        <div>
          <dt>Verified by</dt>
          <dd>{issue.verifiedBy} buses</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{issue.status}</dd>
        </div>
      </dl>
    </div>
  )
}

function MapLegend() {
  return (
    <ul className="map-legend" aria-label="Issue severity legend">
      {Object.entries(SEVERITY_COLORS).map(([label, color]) => (
        <li key={label} className="map-legend__item">
          <span
            className="map-legend__swatch"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}

function UrbanMap() {
  return (
    <div className="urban-map">
      <div className="urban-map__canvas">
        <MapContainer
          center={DELHI_CENTER}
          zoom={13}
          scrollWheelZoom={true}
          className="urban-map__leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {SAMPLE_ISSUES.map((issue) => (
            <Marker
              key={issue.id}
              position={issue.coordinates}
              icon={createSeverityIcon(issue.severity)}
            >
              <Popup>
                <IssuePopup issue={issue} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <MapLegend />
    </div>
  )
}

export default UrbanMap
