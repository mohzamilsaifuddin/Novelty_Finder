const axios = require('axios');

const apiKey = process.env.NVIDIA_API_KEY;

const autoExtractMatrix = async (abstract) => {
  if (!apiKey) {
    throw new Error('NVIDIA API key is not configured.');
  }
  if (!abstract || abstract.trim() === '') {
    throw new Error('Abstract is empty, cannot perform extraction.');
  }

  const prompt = `
Anda adalah seorang asisten peneliti akademik yang ahli dalam melakukan telaah literatur (literature review).
Tugas Anda adalah membaca abstrak jurnal berikut dan mengekstrak informasi spesifik darinya ke dalam format JSON.

Penting: Output Anda HARUS berupa JSON murni tanpa markdown blocks (\`\`\`json ... \`\`\`) atau teks penjelasan apa pun.

Abstrak:
"${abstract}"

Ekstrak elemen berikut ke dalam struktur JSON ini:
{
  "metode": "Metode penelitian, algoritma, atau pendekatan yang digunakan (misal: CNN, K-Means, Eksperimen Kuantitatif). Jika tidak disebutkan secara eksplisit, simpulkan dari teks atau tulis 'Tidak disebutkan'.",
  "objek": "Objek penelitian atau dataset yang digunakan (misal: Citra daun tomat, data sentimen Twitter, siswa SMA). Jika tidak disebutkan, tulis 'Tidak disebutkan'.",
  "variabel": "Variabel independen/dependen atau parameter utama yang diamati (misal: Akurasi, Kecepatan, Hasil Panen). Jika tidak disebutkan, tulis 'Tidak disebutkan'.",
  "lokasi": "Lokasi spesifik penelitian jika ada (misal: Jawa Barat, Rumah Sakit X, Area Perkotaan). Seringkali tidak disebutkan di abstrak, jika demikian tulis 'Tidak disebutkan'.",
  "hasil": "Ringkasan hasil utama atau kesimpulan dari penelitian (misal: Akurasi mencapai 95%, Model A lebih baik dari Model B). Harus ringkas maksimal 2 kalimat.",
  "keterbatasan": "Keterbatasan atau kelemahan dari penelitian ini (misal: Dataset kecil, waktu evaluasi singkat, tidak real-time). Jika tidak disebutkan eksplisit, coba deduksi dari hasil atau tulis 'Tidak disebutkan'.",
  "peluang": "Peluang novelty atau penelitian masa depan yang disarankan atau bisa dieksplorasi berdasarkan abstrak ini (misal: Kombinasi dengan algoritma X, perluasan objek). Jika tidak disebutkan, tulis 'Tidak disebutkan'."
}

Jika teks bukan abstrak ilmiah yang valid, cobalah yang terbaik atau isi dengan 'Tidak disebutkan'.
Kembalikan HANYA format JSON murni.
`;

  try {
    const response = await axios.post(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 4096, // Reduced from 65536 to avoid potential payload limits
        reasoning_budget: 2048,
        chat_template_kwargs: { enable_thinking: true },
        stream: false,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 20000,
      }
    );

    let responseText = response.data.choices[0]?.message?.content || '';
    
    // Clean up potential markdown formatting
    if (responseText.includes('\`\`\`json')) {
      responseText = responseText.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (responseText.includes('\`\`\`')) {
      responseText = responseText.split('\`\`\`')[1].split('\`\`\`')[0].trim();
    } else {
      responseText = responseText.trim();
    }

    const json = JSON.parse(responseText);
    
    return {
      method: json.metode || 'Tidak disebutkan',
      object: json.objek || 'Tidak disebutkan',
      variable: json.variabel || 'Tidak disebutkan',
      location: json.lokasi || 'Tidak disebutkan',
      result: json.hasil || 'Tidak disebutkan',
      limitations: json.keterbatasan || 'Tidak disebutkan',
      opportunities: json.peluang || 'Tidak disebutkan'
    };
  } catch (error) {
    console.error('NVIDIA API Error:', error);
    throw new Error('Gagal mengekstrak data dari AI. Silakan coba lagi.');
  }
};

const generateNoveltyConclusion = async (papers, ruleBasedResult) => {
  if (!apiKey) return ruleBasedResult.summary;

  const abstractList = papers.filter(p => p.abstract).map(p => p.abstract).slice(0, 10).join('\n---\n');
  const prompt = `
Anda adalah seorang profesor ahli penelitian. Saya memiliki data matriks literatur dari ${papers.length} jurnal ilmiah mengenai topik ini.
Berikut adalah analisis frekuensi sederhananya:
- Skor Peluang Novelty: ${ruleBasedResult.noveltyScore}%
- Topik yang dominan: ${ruleBasedResult.dimensions.topic.common.join(', ')}
- Topik yang jarang: ${ruleBasedResult.dimensions.topic.rare.join(', ')}
- Metode yang dominan: ${ruleBasedResult.dimensions.method.common.join(', ')}

Berdasarkan data di atas (dan abstrak berikut jika perlu), buatkan KESIMPULAN NOVELTY (maksimal 2 paragraf).
Kesimpulan ini harus langsung menunjuk pada "Celah Penelitian (Research Gap)" yang paling potensial untuk diteliti selanjutnya.
Gunakan Bahasa Indonesia yang profesional dan akademis. JANGAN berikan teks pengantar, langsung berikan kesimpulannya.

Abstrak:
${abstractList}
  `;

  try {
    const response = await axios.post(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 1024,
        reasoning_budget: 512,
        chat_template_kwargs: { enable_thinking: false },
        stream: false,
      },
      {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    return response.data.choices[0]?.message?.content?.trim() || ruleBasedResult.summary;
  } catch (error) {
    console.error('NVIDIA API Error (Novelty):', error.message);
    return ruleBasedResult.summary;
  }
};

module.exports = {
  autoExtractMatrix,
  generateNoveltyConclusion
};
