const API_BASE = "https://nexa-ai-studio-api-k3u1.onrender.com";
let mode = "image";
const $ = (id) => document.getElementById(id);
const copy = {
 image: ["IMAGE GENERATOR","Create an image","TEXT TO IMAGE","Be descriptive: subject, style, lighting, camera and mood.","Generate image"],
 video: ["VIDEO GENERATOR","Create a video","TEXT TO VIDEO","Describe the scene, movement, camera motion, duration and visual style.","Generate video"],
 voice: ["VOICE GENERATOR","Create a voice","TEXT TO SPEECH","Write the exact words you want your AI voice to speak.","Generate voice"]
};
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
 mode = btn.dataset.mode;
 document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
 $("mode-kicker").textContent = copy[mode][0];
 $("mode-title").textContent = copy[mode][1];
 $("mode-pill").textContent = copy[mode][2];
 $("mode-hint").textContent = copy[mode][3];
 $("generate").innerHTML = copy[mode][4] + " <span>↗</span>";
 $("voice-options").hidden = mode !== "voice";
 $("notice").textContent = mode === "voice" ? "Voice preview uses your Android browser's installed speech voices." : "This feature needs a connected AI generation provider on the backend.";
}));
function showMessage(message, status="INFO") {
 $("output").innerHTML = `<div class="placeholder"><div class="spark">✦</div><b>${escapeHtml(message)}</b></div>`;
 $("result-status").textContent = status;
 $("download").hidden = true;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("generate").addEventListener("click", async () => {
 const prompt = $("prompt").value.trim();
 if (!prompt) { showMessage("Please write a prompt first."); return; }
 if (mode === "voice") {
   const synth = window.speechSynthesis;
   if (!synth) { showMessage("Speech synthesis is not supported in this browser."); return; }
   synth.cancel();
   const utterance = new SpeechSynthesisUtterance(prompt);
   utterance.lang = $("voice-lang").value;
   utterance.rate = 0.92;
   utterance.onstart = () => $("result-status").textContent = "SPEAKING";
   utterance.onend = () => $("result-status").textContent = "VOICE PREVIEWED";
   synth.speak(utterance);
   showMessage("Your phone is speaking the text. This is a voice preview, not an MP3 download.", "VOICE");
   return;
 }
 if (!API_BASE) { showMessage("Backend not connected yet. Deploy the backend and set API_BASE in app.js.", "SETUP NEEDED"); return; }
 const button = $("generate"); button.disabled = true; button.textContent = "Creating...";
 $("result-status").textContent = "WORKING";
 try {
   const response = await fetch(`${API_BASE}/api/generate`, {
     method:"POST", headers:{"Content-Type":"application/json"},
     body:JSON.stringify({mode, prompt})
   });
   const data = await response.json();
   if (!response.ok) throw new Error(data.detail || "Provider error");
   if (data.output_url) {
     const tag = mode === "video" ? "video" : "img";
     $("output").innerHTML = `<${tag} src="${escapeHtml(data.output_url)}" controls ${mode==="image"?"alt='Generated image'":""}></${tag}>`;
     $("download").href = data.output_url; $("download").hidden = false;
     $("download").textContent = "Download creation";
     $("result-status").textContent = "COMPLETE";
   } else {
     showMessage(data.message || "The provider returned no preview URL.", "CHECK RESULT");
   }
 } catch(e) { showMessage(e.message, "ERROR"); }
 finally { button.disabled = false; button.innerHTML = copy[mode][4] + " <span>↗</span>"; }
});
if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
