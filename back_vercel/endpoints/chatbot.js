require('dotenv').config();
const express = require('express');
const { Groq } = require('groq-sdk');

const app = express();
app.use(express.json()); // Para leer el body tipo JSON

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System Prompt consolidado y profesional
const LEGAL_SYSTEM_PROMPT = `Eres un Asesor Legal Virtual especializado en legislación chilena y procedimientos administrativos para el sector empresarial. Tu rol es estrictamente técnico y orientativo.

Directrices de Identidad y Tono:
1. Objetividad Absoluta: Eres un asesor, no un amigo. Tu tono es cercano y profesional, pero carente de emotividad.
2. Límite de Rol: No eres psicólogo. Si el usuario expresa frustración o problemas personales, ignora el componente emocional y responde únicamente a la duda legal o procedimental subyacente.
3. Honestidad Técnica: Si una consulta excede tu base de conocimientos o es de alta complejidad, debes declarar explícitamente: 'No poseo información técnica suficiente sobre este punto específico; se recomienda consultar con un abogado especializado para evitar riesgos legales'. Prohibido inventar o suponer.

Parámetros Operativos en Chile:
- Enfócate en: Constitución de sociedades (Resuelve tu Empresa / Diario Oficial), Derecho Laboral (Código del Trabajo), Tributación (SII), Propiedad Intelectual (INAPI) y trámites ante la CMF.
- Prohibiciones Estrictas: No redactes contratos, escrituras, demandas ni escritos judiciales. Tu función es explicar el procedimiento y la normativa, no ejecutar el documento.
- Si el usuario insiste en temas no legales, redirige la conversación: 'Mi capacidad se limita a la orientación legal y administrativa empresarial'.

Formato de Respuesta:
- Estructura tus respuestas con puntos clave si el trámite tiene varios pasos.
- Cita leyes o artículos solo si tienes certeza total (ej. 'Según el Artículo 160 del Código del Trabajo...').`;

/**
 * Endpoint POST /api/chat
 * @body {string} message - El mensaje actual del usuario
 * @body {array} history - (Opcional) Los últimos mensajes para mantener la memoria
 */
app.post('/', async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message) {
        return res.status(400).json({ error: "El campo 'message' es obligatorio." });
    }

    try {
        // Construcción del contexto: System Prompt + Historial + Mensaje Actual
        // Limitamos el historial a los últimos 6 mensajes para optimizar tokens
        const messagesForGroq = [
            { role: "system", content: LEGAL_SYSTEM_PROMPT },
            ...history.slice(-6), 
            { role: "user", content: message }
        ];

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant", // El modelo más económico y rápido
            messages: messagesForGroq,
            temperature: 0.2, // Baja creatividad para mayor precisión legal
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        const aiResponse = completion.choices[0].message.content;

        res.json({
            response: aiResponse,
            // Opcional: devolvemos el rol para que el front lo guarde fácil
            role: "assistant" 
        });

    } catch (error) {
        console.error("❌ Error en Groq:", error.message);
        res.status(500).json({ error: "Error al procesar la consulta legal." });
    }
});
