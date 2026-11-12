const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// ဓာတ်ပုံခေတ္တသိမ်းရန် multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Gemini AI API Key (Render Environment Variables ထဲမှာ ထည့်ထားရပါမယ်)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/ocr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'ပုံ မပါဝင်ပါ' });
        }

        // Gemini 1.5 Flash မော်ဒယ်ကို သုံးခြင်း (SDK အဟောင်းနှင့် အကိုက်ညီဆုံးဖြစ်သည်)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // ပုံကို Base64 ပြောင်းခြင်း
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const prompt = `ဤလက်ရေးဘောင်ချာပုံထဲမှ ထီဂဏန်းများနှင့် ငွေပမာဏများကို သေချာဖတ်ပါ။ 
        ဂဏန်း (number) နှင့် တန်ဖိုး (v1 သို့မဟုတ် v2) များကို JSON format ဖြင့်သာ အောက်ပါအတိုင်း အတိအကျ ပြန်ပေးပါ:
        [
          {"number": "123", "v1": 100, "v2": 50},
          {"number": "45", "v1": 200, "v2": null}
        ]
        အခြား စာသားများ လုံးဝမထည့်ဘဲ JSON array သက်သက်ကိုသာ ဖြေပါ။`;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
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
