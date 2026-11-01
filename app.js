const API_BASE = "https://nexa-ai-studio-api-k3u1.onrender.com";

let mode = "image";

const $ = (id) => document.getElementById(id);

const copy = {
  image: [
    "IMAGE GENERATOR",
    "Create an image",
    "TEXT TO IMAGE",
    "Image generation is not connected yet.",
    "Generate image"
  ],

  video: [
    "VIDEO GENERATOR",
    "Create a video",
    "TEXT TO VIDEO",
    "Describe the scene, movement, camera motion and visual style.",
    "Generate video"
  ],

  voice: [
    "VOICE GENERATOR",
    "Create a voice",
    "TEXT TO SPEECH",
    "Write the exact words you want your AI voice to speak.",
    "Generate voice"
  ]
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function showMessage(message, status = "INFO") {
  $("output").innerHTML = `
    <div class="placeholder">
      <div class="spark">✦</div>
      <b>${escapeHtml(message)}</b>
    </div>
  `;

  $("result-status").textContent = status;
  $("download").hidden = true;
}

function showVideo(videoUrl) {
  $("output").innerHTML = `
    <video
      src="${videoUrl}"
      controls
      playsinline
      style="width:100%; max-width:100%; border-radius:16px; display:block;"
    ></video>
  `;

  $("download").href = videoUrl;
  $("download").download = "nexa-ai-video.mp4";
  $("download").textContent = "Download video";
  $("download").hidden = false;

  $("result-status").textContent = "COMPLETE";
}

function updateModeUI() {
  $("mode-kicker").textContent = copy[mode][0];
  $("mode-title").textContent = copy[mode][1];
  $("mode-pill").textContent = copy[mode][2];
  $("mode-hint").textContent = copy[mode][3];

  $("generate").innerHTML =
    copy[mode][4] + ' <span>↗</span>';

  if ($("voice-options")) {
    $("voice-options").hidden = mode !== "voice";
  }

  if ($("notice")) {
    if (mode === "video") {
      $("notice").textContent =
        "Connected to NEXA AI STUDIO video generation backend.";
    } else if (mode === "voice") {
      $("notice").textContent =
        "Voice preview uses your device's browser speech system.";
    } else {
      $("notice").textContent =
        "Image generation is not connected yet. Video generation is ready.";
    }
  }

  showMessage(
    mode === "video"
      ? "Write a prompt and generate your AI video."
      : mode === "voice"
      ? "Write text and generate a voice preview."
      : "Video generation is currently available."
  );
}


// TAB SWITCHING
document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;

    document
      .querySelectorAll(".tab")
      .forEach((tab) => {
        tab.classList.toggle("active", tab === button);
      });

    updateModeUI();
  });
});


// GENERATE BUTTON
$("generate").addEventListener("click", async () => {

  const prompt = $("prompt").value.trim();

  if (!prompt) {
    showMessage("Please write a prompt first.", "ERROR");
    return;
  }


  // VOICE
  if (mode === "voice") {

    const synth = window.speechSynthesis;

    if (!synth) {
      showMessage(
        "Speech synthesis is not supported in this browser.",
        "ERROR"
      );
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(prompt);

    if ($("voice-lang")) {
      utterance.lang = $("voice-lang").value;
    }

    utterance.rate = 0.92;

    utterance.onstart = () => {
      $("result-status").textContent = "SPEAKING";
    };

    utterance.onend = () => {
      $("result-status").textContent = "VOICE PREVIEWED";
    };

    synth.speak(utterance);

    showMessage(
      "Your device is speaking the text.",
      "VOICE"
    );

    return;
  }


  // IMAGE
  if (mode === "image") {
    showMessage(
      "Image generation is not connected yet. Please use the Video tab.",
      "NOT AVAILABLE"
    );
    return;
  }


  // VIDEO
  const button = $("generate");

  button.disabled = true;
  button.textContent = "Creating video...";

  $("result-status").textContent = "WORKING";

  showMessage(
    "NEXA AI is creating your video. Please wait...",
    "GENERATING"
  );


  try {

    const response = await fetch(
      `${API_BASE}/api/generate`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          prompt: prompt,
          mode: "video",
          aspect_ratio: "16:9",
          resolution: "720p"
        })
      }
    );


    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Backend returned an invalid response."
      );
    }


    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        `Server error: ${response.status}`
      );
    }


    // BACKEND RETURNS:
    // data.video = data:video/mp4;base64,...

    if (data.video) {

      showVideo(data.video);

    } else if (data.output_url) {

      showVideo(data.output_url);

    } else {

      throw new Error(
        data.message ||
        "Video was not returned by the AI provider."
      );
    }


  } catch (error) {

    console.error("NEXA AI ERROR:", error);

    showMessage(
      error.message ||
      "Video generation failed.",
      "ERROR"
    );

  } finally {

    button.disabled = false;

    button.innerHTML =
      copy[mode][4] + ' <span>↗</span>';
  }

});


// SERVICE WORKER
if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")
      .catch((error) => {
        console.log(
          "Service worker registration failed:",
          error
        );
      });

  });

}


// INITIAL UI
updateModeUI();
