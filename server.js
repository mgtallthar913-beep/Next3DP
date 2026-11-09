const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

multerconst upload = ({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/parse-vouchers', upload.array('vouchers'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const imageParts = req.files.map(file => ({
            inlineData: {
                data: file.buffer.toString('base64'),
                mimeType: file.mimetype
            }
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                ...imageParts,
                "Extract all lottery numbers, names, and amounts from these vouchers into a clean JSON array format."
            ]
        });

        res.json({ result: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
