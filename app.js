const API_BASE = "https://nexa-ai-studio-api-k3u1.onrender.com";

let mode = "image";

const $ = (id) => document.getElementById(id);

const copy = {
  image: [
    "IMAGE GENERATOR",
    "Create an image",
    "TEXT TO IMAGE",
    "Be descriptive: subject, style, lighting, camera and mood.",
    "Generate image"
  ],

  video: [
    "VIDEO GENERATOR",
    "Create a video",
    "TEXT TO VIDEO",
    "Describe the scene, movement, camera motion, duration and visual style.",
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


/* =========================
   MODE / TAB SWITCHING
========================= */

document.querySelectorAll(".tab").forEach((btn) => {

  btn.addEventListener("click", () => {

    mode = btn.dataset.mode;

    document.querySelectorAll(".tab").forEach((b) => {
      b.classList.toggle("active", b === btn);
    });

    $("mode-kicker").textContent = copy[mode][0];
    $("mode-title").textContent = copy[mode][1];
    $("mode-pill").textContent = copy[mode][2];
    $("mode-hint").textContent = copy[mode][3];

    $("generate").innerHTML =
      copy[mode][4] + ' <span>↗</span>';

    $("voice-options").hidden = mode !== "voice";

    $("notice").textContent =
      mode === "voice"
        ? "Voice preview uses your Android browser's installed speech voices."
        : "AI generation is connected to the NEXA backend.";
  });

});


/* =========================
   MESSAGE / PLACEHOLDER
========================= */

function showMessage(message, status = "INFO") {

  $("output").innerHTML = `
    <div class="placeholder">
      <div class="spark">✦</div>
      <b>${escapeHtml(String(message))}</b>
    </div>
  `;

  $("result-status").textContent = status;

  $("download").hidden = true;
  $("download").removeAttribute("href");
}


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(s) {

  return String(s).replace(
    /[&<>"']/g,
    (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );

}


/* =========================
   DOWNLOAD BUTTON
========================= */

function setupDownload(url, filename) {

  $("download").href = url;
  $("download").download = filename;
  $("download").hidden = false;
  $("download").textContent = "Download creation";

}


/* =========================
   DISPLAY VIDEO
========================= */

function showVideo(videoUrl) {

  $("output").innerHTML = `
    <video
      src="${videoUrl}"
      controls
      playsinline
      preload="metadata"
      style="
        width:100%;
        max-width:900px;
        border-radius:16px;
        display:block;
        background:#000;
      ">
    </video>
  `;

  setupDownload(
    videoUrl,
    "nexa-ai-generated-video.mp4"
  );

  $("result-status").textContent = "COMPLETE";

}


/* =========================
   DISPLAY IMAGE
========================= */

function showImage(imageUrl) {

  $("output").innerHTML = `
    <img
      src="${escapeHtml(imageUrl)}"
      alt="Generated image"
      style="
        width:100%;
        max-width:900px;
        border-radius:16px;
        display:block;
      "
    >
  `;

  setupDownload(
    imageUrl,
    "nexa-ai-generated-image"
  );

  $("result-status").textContent = "COMPLETE";

}


/* =========================
   GENERATE BUTTON
========================= */

$("generate").addEventListener("click", async () => {

  const prompt = $("prompt").value.trim();

  /* Empty prompt */

  if (!prompt) {

    showMessage(
      "Please write a prompt first.",
      "INFO"
    );

    return;
  }


  /* =========================
     VOICE MODE
  ========================= */

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

    const utterance =
      new SpeechSynthesisUtterance(prompt);

    utterance.lang =
      $("voice-lang").value;

    utterance.rate = 0.92;

    utterance.onstart = () => {
      $("result-status").textContent = "SPEAKING";
    };

    utterance.onend = () => {
      $("result-status").textContent =
        "VOICE PREVIEWED";
    };

    synth.speak(utterance);

    showMessage(
      "Your phone is speaking the text. This is a voice preview, not an MP3 download.",
      "VOICE"
    );

    return;
  }


  /* =========================
     BACKEND CHECK
  ========================= */

  if (!API_BASE) {

    showMessage(
      "Backend not connected yet.",
      "SETUP NEEDED"
    );

    return;
  }


  /* =========================
     BUTTON LOADING
  ========================= */

  const button = $("generate");

  button.disabled = true;

  button.innerHTML =
    "Creating... <span>⏳</span>";

  $("result-status").textContent =
    "CONNECTING";


  try {

    /* =========================
       SEND REQUEST TO FASTAPI
    ========================= */

    $("result-status").textContent =
      "GENERATING";

    const response = await fetch(
      `${API_BASE}/api/generate`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          mode: mode,

          prompt: prompt,

          aspect_ratio:
            mode === "video"
              ? "16:9"
              : undefined,

          resolution:
            mode === "video"
              ? "720p"
              : undefined
        })
      }
    );


    /* =========================
       READ RESPONSE
    ========================= */

    let data;

    try {

      data = await response.json();

    } catch (jsonError) {

      throw new Error(
        "Backend returned an invalid response."
      );

    }


    /* =========================
       BACKEND ERROR
    ========================= */

    if (!response.ok) {

      throw new Error(
        data.detail ||
        data.message ||
        `Server error (${response.status})`
      );

    }


    /* =========================
       VIDEO RESPONSE
    ========================= */

    if (
      mode === "video" &&
      data.video
    ) {

      showVideo(data.video);

      return;
    }


    /* =========================
       OLD / URL VIDEO RESPONSE
    ========================= */

    if (
      mode === "video" &&
      data.output_url
    ) {

      showVideo(data.output_url);

      return;
    }


    /* =========================
       IMAGE RESPONSE
    ========================= */

    if (
      mode === "image" &&
      data.output_url
    ) {

      showImage(data.output_url);

      return;
    }


    /* =========================
       BASE64 IMAGE RESPONSE
    ========================= */

    if (
      mode === "image" &&
      data.image
    ) {

      showImage(data.image);

      return;
    }


    /* =========================
       NO RESULT
    ========================= */

    showMessage(
      data.message ||
      "The provider returned no media.",
      "CHECK RESULT"
    );


  } catch (error) {

    console.error(
      "NEXA AI generation error:",
      error
    );

    showMessage(
      error.message ||
      "Something went wrong while generating.",
      "ERROR"
    );


  } finally {

    button.disabled = false;

    button.innerHTML =
      copy[mode][4] +
      ' <span>↗</span>';

  }

});


/* =========================
   SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .catch(() => {});

    }
  );

}
