const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// ဓာတ်ပုံခေတ္တသိမ်းရန် multer setup
const upload = multer({ storage: multer.memoryStorage() });

// GoogleGenAI ကို အသုံးပြုခြင်း (Environment ထဲက GEMINI_API_KEY ကို ကိုယ်တိုင်ယူပါမည်)
const ai = new GoogleGenAI();

app.post('/api/ocr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'ပုံ မပါဝင်ပါ' });
        }

        // ပုံကို Base64 ပြောင်းခြင်း
        const base64Image = req.file.buffer.toString("base64");

        const prompt = `ဤလက်ရေးဘောင်ချာပုံထဲမှ ထီဂဏန်းများနှင့် ငွေပမာဏများကို သေချာဖတ်ပါ။ 
        ဂဏန်း (number) နှင့် တန်ဖိုး (v1 သို့မဟုတ် v2) များကို JSON format ဖြင့်သာ အောက်ပါအတိုင်း အတိအကျ ပြန်ပေးပါ:
        [
          {"number": "123", "v1": 100, "v2": 50},
          {"number": "45", "v1": 200, "v2": null}
        ]
        အခြား စာသားများ လုံးဝမထည့်ဘဲ JSON array သက်သက်ကိုသာ ဖြေပါ။`;

        // gemini-2.5-flash သို့မဟုတ် gemini-3.8-flash ကို အသုံးပြုခြင်း
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: req.file.mimetype
                    }
                }
            ]
        });

        const responseText = response.text();
        
        // JSON ကို သန့်စင်ပြီး ထုတ်ယူခြင်း
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return res.status(500).json({ success: false, error: 'AI မှ JSON ပုံစံဖြင့် မထွက်လာပါ' });
        }

        const items = JSON.parse(jsonMatch[0]);
        res.json({ success: true, items: items });

    } catch (err) {
        console.error("OCR Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
