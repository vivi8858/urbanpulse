import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const ALLOWED_CLASSES = [
  "person",
  "car",
  "bus",
  "truck",
  "motorcycle",
  "bicycle",
];

function EdgeAI({ onSendEvent }) {
  const [model, setModel] = useState(null);

  const [modelStatus, setModelStatus] =
    useState("Loading AI model...");

  const [imageUrl, setImageUrl] = useState(null);

  const [predictions, setPredictions] =
    useState([]);

  const [processing, setProcessing] =
    useState(false);

  const [eventSent, setEventSent] =
    useState(false);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      try {
        setModelStatus(
          "Loading Edge AI model..."
        );

        const loadedModel =
          await cocoSsd.load();

        setModel(loadedModel);

        setModelStatus(
          "Edge AI Ready"
        );
      } catch (error) {
        console.error(error);

        setModelStatus(
          "AI model failed to load"
        );
      }
    }

    loadModel();
  }, []);

  function handleImageUpload(event) {
    const file =
      event.target.files[0];

    if (!file) return;

    const url =
      URL.createObjectURL(file);

    setImageUrl(url);

    setPredictions([]);

    setEventSent(false);
  }

  async function runDetection() {
    if (
      !model ||
      !imageRef.current
    ) {
      return;
    }

    setProcessing(true);

    setEventSent(false);

    try {
      const results =
        await model.detect(
          imageRef.current
        );

      const filtered =
        results.filter(
          (prediction) =>
            ALLOWED_CLASSES.includes(
              prediction.class
            ) &&
            prediction.score >=
              0.45
        );

      setPredictions(filtered);

      drawDetections(filtered);
    } catch (error) {
      console.error(error);
    }

    setProcessing(false);
  }

  function drawDetections(
    results
  ) {
    const image =
      imageRef.current;

    const canvas =
      canvasRef.current;

    if (
      !image ||
      !canvas
    ) {
      return;
    }

    const context =
      canvas.getContext("2d");

    canvas.width =
      image.clientWidth;

    canvas.height =
      image.clientHeight;

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const scaleX =
      image.clientWidth /
      image.naturalWidth;

    const scaleY =
      image.clientHeight /
      image.naturalHeight;

    results.forEach(
      (prediction) => {
        const [
          x,
          y,
          width,
          height,
        ] =
          prediction.bbox;

        const scaledX =
          x * scaleX;

        const scaledY =
          y * scaleY;

        const scaledWidth =
          width * scaleX;

        const scaledHeight =
          height * scaleY;

        context.strokeStyle =
          "#22d3ee";

        context.lineWidth = 2;

        context.strokeRect(
          scaledX,
          scaledY,
          scaledWidth,
          scaledHeight
        );

        const confidence =
          Math.round(
            prediction.score *
              100
          );

        const label =
          `${prediction.class} ${confidence}%`;

        context.font =
          "13px Arial";

        const textWidth =
          context.measureText(
            label
          ).width;

        context.fillStyle =
          "#07111f";

        context.fillRect(
          scaledX,
          Math.max(
            scaledY - 22,
            0
          ),
          textWidth + 10,
          22
        );

        context.fillStyle =
          "#22d3ee";

        context.fillText(
          label,
          scaledX + 5,
          Math.max(
            scaledY - 7,
            15
          )
        );
      }
    );
  }

  const counts =
    predictions.reduce(
      (total, item) => {
        if (
          !total[item.class]
        ) {
          total[
            item.class
          ] = 0;
        }

        total[
          item.class
        ] += 1;

        return total;
      },
      {}
    );

  const vehicleCount =
    predictions.filter(
      (item) =>
        [
          "car",
          "bus",
          "truck",
          "motorcycle",
          "bicycle",
        ].includes(
          item.class
        )
    ).length;

  const pedestrianCount =
    predictions.filter(
      (item) =>
        item.class ===
        "person"
    ).length;

  function getTrafficLevel() {
    if (
      vehicleCount >= 8
    ) {
      return "High";
    }

    if (
      vehicleCount >= 4
    ) {
      return "Medium";
    }

    return "Low";
  }

  function getAverageConfidence() {
    if (
      predictions.length ===
      0
    ) {
      return 0;
    }

    const total =
      predictions.reduce(
        (sum, item) =>
          sum + item.score,
        0
      );

    return Math.round(
      (total /
        predictions.length) *
        100
    );
  }

  function getSeverity() {
    const traffic =
      getTrafficLevel();

    if (
      traffic === "High"
    ) {
      return "High";
    }

    if (
      traffic === "Medium"
    ) {
      return "Medium";
    }

    return "Low";
  }

  function sendEvent() {
    if (
      predictions.length ===
      0
    ) {
      return;
    }

    const now =
      new Date();

    const id =
      `EDGE-${Date.now()}`;

    const event = {
      id,

      type:
        vehicleCount >= 8
          ? "Severe Congestion"
          : "Traffic Observation",

      severity:
        getSeverity(),

      location:
        "Connaught Place",

      latitude:
        28.6315,

      longitude:
        77.2167,

      busId:
        "BUS-017",

      timestamp:
        now.toLocaleString(),

      confidence:
        getAverageConfidence(),

      vehicles:
        vehicleCount,

      pedestrians:
        pedestrianCount,

      trafficDensity:
        getTrafficLevel(),

      evidence:
        imageUrl,

      status:
        "NEW",

      route:
        "Route 101 — Central Delhi",

      description:
        `${vehicleCount} vehicles and ${pedestrianCount} pedestrians detected by onboard Edge AI.`,
    };

    if (
      onSendEvent
    ) {
      onSendEvent(event);
    }

    setEventSent(true);
  }

  return (
    <div className="edge-ai-page">
      <div className="edge-ai-header">
        <div>
          <p className="eyebrow">
            ONBOARD / EDGE AI
          </p>

          <h2>
            BUS-017 Intelligence Module
          </h2>

          <p className="edge-ai-description">
            The bus processes its camera frame locally. Only useful detection metadata and selected evidence are sent to the UrbanPulse command centre.
          </p>
        </div>

        <div
          className={`edge-ai-status ${
            model
              ? "ready"
              : ""
          }`}
        >
          <span className="status-dot"></span>

          {modelStatus}
        </div>
      </div>

      <div className="edge-device-bar">
        <EdgeDeviceStatus
          label="Bus"
          value="BUS-017"
        />

        <EdgeDeviceStatus
          label="Camera"
          value="Active"
        />

        <EdgeDeviceStatus
          label="Edge AI"
          value={
            model
              ? "Ready"
              : "Loading"
          }
        />

        <EdgeDeviceStatus
          label="GPS"
          value="Connected"
        />

        <EdgeDeviceStatus
          label="Network"
          value="Online"
        />
      </div>

      <div className="edge-ai-grid">
        <div className="panel edge-upload-panel">
          <p className="eyebrow">
            CAMERA INPUT
          </p>

          <h3>
            Road Observation
          </h3>

          {!imageUrl && (
            <label className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageUpload
                }
              />

              <strong>
                Select Road Image
              </strong>

              <span>
                JPG, JPEG or PNG
              </span>
            </label>
          )}

          {imageUrl && (
            <>
              <div className="edge-image-wrapper">
                <img
                  ref={
                    imageRef
                  }
                  src={
                    imageUrl
                  }
                  alt="Road observation"
                  className="edge-image"
                />

                <canvas
                  ref={
                    canvasRef
                  }
                  className="detection-canvas"
                />
              </div>

              <div className="edge-buttons">
                <button
                  className="primary-button"
                  onClick={
                    runDetection
                  }
                  disabled={
                    !model ||
                    processing
                  }
                >
                  {processing
                    ? "Running AI..."
                    : "Run Edge AI"}
                </button>

                <label className="secondary-button file-change-button">
                  Change Image

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageUpload
                    }
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <div className="panel edge-results-panel">
          <p className="eyebrow">
            EDGE INFERENCE
          </p>

          <h3>
            Detection Results
          </h3>

          <div className="edge-stats">
            <EdgeStat
              label="Vehicles"
              value={
                vehicleCount
              }
            />

            <EdgeStat
              label="Pedestrians"
              value={
                pedestrianCount
              }
            />

            <EdgeStat
              label="Traffic"
              value={
                predictions.length
                  ? getTrafficLevel()
                  : "-"
              }
            />
          </div>

          {predictions.length ===
          0 ? (
            <div className="no-detections">
              <strong>
                No inference results yet
              </strong>

              <p>
                Upload a road image and run the Edge AI model.
              </p>
            </div>
          ) : (
            <>
              <div className="detection-list">
                {Object.entries(
                  counts
                ).map(
                  ([
                    type,
                    count,
                  ]) => (
                    <div
                      className="detection-row"
                      key={
                        type
                      }
                    >
                      <span>
                        {formatClassName(
                          type
                        )}
                      </span>

                      <strong>
                        {
                          count
                        }
                      </strong>
                    </div>
                  )
                )}
              </div>

              <div className="edge-event">
                <p className="eyebrow">
                  EVENT PAYLOAD
                </p>

                <pre>
{`{
  "busId": "BUS-017",
  "gps": "28.6315, 77.2167",
  "vehicles": ${vehicleCount},
  "pedestrians": ${pedestrianCount},
  "trafficDensity": "${getTrafficLevel()}",
  "confidence": "${getAverageConfidence()}%",
  "rawVideoUploaded": false
}`}
                </pre>
              </div>

              <button
                className="send-event-button"
                onClick={
                  sendEvent
                }
                disabled={
                  eventSent
                }
              >
                {eventSent
                  ? "Event Sent to Command Centre"
                  : "Send Event to Command Centre"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="panel edge-explanation">
        <p className="eyebrow">
          BUS → AI → PLATFORM
        </p>

        <div className="edge-flow">
          <FlowStep
            number="1"
            title="Bus Camera"
            text="Road image captured onboard."
          />

          <FlowArrow />

          <FlowStep
            number="2"
            title="Local Edge AI"
            text="TensorFlow.js processes the frame locally."
          />

          <FlowArrow />

          <FlowStep
            number="3"
            title="GPS + Timestamp"
            text="Location and evidence are attached."
          />

          <FlowArrow />

          <FlowStep
            number="4"
            title="Alert Engine"
            text="UrbanPulse receives actionable intelligence."
          />
        </div>
      </div>
    </div>
  );
}

function EdgeDeviceStatus({
  label,
  value,
}) {
  return (
    <div className="edge-device-status">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function EdgeStat({
  label,
  value,
}) {
  return (
    <div className="edge-stat">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function FlowStep({
  number,
  title,
  text,
}) {
  return (
    <div className="edge-flow-step">
      <div className="edge-step-number">
        {number}
      </div>

      <strong>
        {title}
      </strong>

      <span>
        {text}
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="edge-flow-arrow">
      →
    </div>
  );
}

function formatClassName(
  name
) {
  return name
    .split(" ")
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default EdgeAI;