document.addEventListener("DOMContentLoaded", () => {
  const askInput = document.querySelector("#ask-input");
  const askBtn = document.querySelector("#ask-btn");
  const askOutput = document.querySelector("#ask-output");

  const pulseInput = document.querySelector("#pulse-input");
  const pulseBtn = document.querySelector("#pulse-btn");
  const pulseOutput = document.querySelector("#pulse-output");

  if (askBtn && askInput && askOutput) {
    askBtn.addEventListener("click", async () => {
      const question = askInput.value.trim();
      if (!question) return;
      askOutput.innerText = "Thinking...";
      try {
        const response = await fetch("/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question })
        });
        const data = await response.json();
        askOutput.innerText = data.reply || "No response from CrimznBot.";
      } catch (err) {
        askOutput.innerText = "Error talking to CrimznBot.";
      }
    });
  }

  if (pulseBtn && pulseInput && pulseOutput) {
    pulseBtn.addEventListener("click", async () => {
      const topic = encodeURIComponent(pulseInput.value.trim() || "crypto");
      pulseOutput.innerHTML = "Scanning sentiment...";
      try {
        const response = await fetch(`/pulseit?topic=${topic}`);
        const html = await response.text();
        pulseOutput.innerHTML = html;
      } catch (err) {
        pulseOutput.innerHTML = "<p style='color:red;'>Error loading sentiment.</p>";
      }
    });
  }
});
