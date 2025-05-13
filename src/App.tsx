import { useState } from "react";
import "./App.css";
// import { ZoomMtg } from "@zoom/meetingsdk";

// ZoomMtg.preLoadWasm();
// ZoomMtg.prepareWebSDK();

function App() {
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("0"); // "0" = participant, "1" = host
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setSubmitted(true);
    }
  };





  // const authEndpoint = 'http://localhost:8000/zoom/generate-signature/';
  // const sdkKey = "3D5COVRdRCipU9s7JgfS7A";
  // const meetingNumber = "82906376883";
  // const passWord = "np8vuW";
  // const role = 1;
  // const userName = "React";
  // const userEmail = "";
  // const registrantToken = "";
  // const zakToken = "";
  // const leaveUrl = "http://localhost:5173";

  // const getSignature = async () => {
  //   try {
  //     const req = await fetch(authEndpoint, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         meetingNumber: meetingNumber,
  //         role: role,
  //       }),
  //     });
  //     const res = await req.json()
  //     const signature = res.signature as string;
  //     console.log("signature:",signature)
  //     startMeeting(signature)
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };

  // function startMeeting(signature: string) {
  //   const container = document.getElementById("zmmtg-root")!;
  //   if (container) {
  //     container.style.display = "block";
  //   }

  //   ZoomMtg.init({
  //     leaveUrl: leaveUrl,
  //     patchJsMedia: true,
  //     leaveOnPageUnload: true,
  //     success: (success: unknown) => {
  //       console.log(success);
  //       // can this be async?
  //       ZoomMtg.join({
  //         signature: signature,
  //         sdkKey: sdkKey,
  //         meetingNumber: meetingNumber,
  //         passWord: passWord,
  //         userName: userName,
  //         userEmail: userEmail,
  //         tk: registrantToken,
  //         zak: zakToken,
  //         success: (success: unknown) => {
  //           console.log(success);
  //         },
  //         error: (error: unknown) => {
  //           console.log(error);
  //         },
  //       });
  //     },
  //     error: (error: unknown) => {
  //       console.log(error);
  //     },
  //   });
  // }

  return (
    <div style={{ padding: "2rem" }}>
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
                  border: "1px solid #ccc"
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
                  border: "1px solid #ccc"
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
              cursor: "pointer"
            }}
          >
            Join Meeting
          </button>
        </form>
      ) : (
        <div className="zoom-embed" style={{ textAlign: "center" }}>
          <iframe
            src={`http://localhost:5173/zoom-meeting.html?role=${role}&userName=${encodeURIComponent(
              userName
            )}`}
            width="800"
            height="580"
            style={{
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)"
            }}
            title="Zoom Meeting"
            allow="camera; microphone; fullscreen"
          />
        </div>
      )}
    </div>
  );
}

export default App;
