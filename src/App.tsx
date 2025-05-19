import { useEffect, useState } from "react";
import "./App.css";
// import Chatbox from "./Components/Chatbox";
import background_image from "./assets/background_image.jpg";
import DoctorCard from "./Components/DoctorCard";
import doctor_image from "./assets/doctor_image.jpg";
import LiveTranslation from "./Components/LiveTranslation";
// import { ZoomMtg } from "@zoom/meetingsdk";

// ZoomMtg.preLoadWasm();
// ZoomMtg.prepareWebSDK();

function App() {
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("0"); // "0" = participant, "1" = host
  const [submitted, setSubmitted] = useState(false);
  const [meetingStarted, setMeetingStarted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setSubmitted(true);
    }
  };


  // Listen to messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.meetingStarted) {
        setMeetingStarted(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);



  return (
    <div
      style={{
        padding: "2rem",
        backgroundImage: `linear-gradient(to right, rgba(75, 156, 211, 0.9), rgba(255, 126, 185, 0.8)), url(${background_image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        backgroundColor: "#f0f0f0",
        boxSizing: "border-box",
      }}
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
          <h2>Join Zoom Meeting</h2>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Name:
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </label>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Role:
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="0">Participant</option>
                <option value="1">Host</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              background: "#0e71eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Join Meeting
          </button>
        </form>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "flex-start",
            overflow: "hidden",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            flexWrap: "wrap",
          }}
        >
          {/* Left Section: Zoom Interface and DoctorCard */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Zoom Meeting */}
            <div style={{ flex: "none", minWidth: 0 }}>
              <iframe
                src={`http://localhost:5173/zoom-meeting.html?role=${role}&userName=${encodeURIComponent(userName)}`}
                width="100%"
                height="375"
                style={{
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  maxWidth: "100%",
                }}
                title="Zoom Meeting"
                allow="camera; microphone; fullscreen"
              />
            </div>

            {/* DoctorCard (Visible only when meeting has started) */}
            {meetingStarted && (
              <DoctorCard
                name="Dr. Sarah Vance"
                department="Cardiology"
                specialization="MBBS, MD - Cardiology"
                experience={12}
                fee={1500}
                imageUrl={doctor_image}
              />
            )}
          </div>

          {/* Chatbox Right */}
          {meetingStarted && (
            <div
              style={{
                flex: 2,
                maxHeight: "580px",
                overflowY: "auto",
                minWidth: 0,
                maxWidth: "100%",
                overflowX: "hidden",
              }}
            >
              <LiveTranslation/>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
