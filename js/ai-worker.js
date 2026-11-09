/**
 * ai-worker.js - Modulo Worker per l'esecuzione offline di WebLLM (WebGPU)
 */
import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

let engine = null;
const MODEL_NAME = "SmolLM2-1.5B-Instruct-q4f16_1-MLC"; // Modello compatto e ultra-veloce per escursioni

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'INIT') {
    try {
      engine = await CreateMLCEngine(MODEL_NAME, {
        initProgressCallback: (progress) => {
          self.postMessage({ type: 'PROGRESS', payload: progress.text });
        }
      });
      self.postMessage({ type: 'READY' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', payload: err.message });
    }
  }

  if (type === 'GENERATE') {
    if (!engine) {
      self.postMessage({ type: 'RESPONSE', payload: "Errore: Motore AI non ancora inizializzato." });
      return;
    }

    try {
      const systemPrompt = "Sei l'assistente ed esploratore intelligente di SentieroVivo. Fornisci consigli brevi, pratici e colloquiali (massimo 3-4 frasi) per l'escursionista basandoti sui dati di contesto.";
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: payload.contextPrompt }
      ];

      const reply = await engine.chat.completions.create({
        messages,
        temperature: 0.6,
      });

      self.postMessage({ type: 'RESPONSE', payload: reply.choices[0].message.content });
    } catch (err) {
      self.postMessage({ type: 'RESPONSE', payload: "Impossibile generare la risposta in questo momento." });
    }
  }
};
