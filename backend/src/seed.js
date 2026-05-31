require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@noveltyfinder.com' },
    update: {},
    create: { name: 'Administrator', email: 'admin@noveltyfinder.com', password: adminPassword, role: 'admin' },
  });
  console.log('✅ Admin created:', admin.email);

  // Create demo student
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'mahasiswa@noveltyfinder.com' },
    update: {},
    create: { name: 'Budi Santoso', email: 'mahasiswa@noveltyfinder.com', password: studentPassword, role: 'student' },
  });
  console.log('✅ Student created:', student.email);

  // Create demo project
  const project = await prisma.searchProject.create({
    data: {
      userId: student.id,
      name: 'Penelitian Machine Learning pada Pertanian',
      keywords: JSON.stringify(['machine learning', 'precision agriculture', 'crop yield', 'deep learning']),
      description: 'Proyek riset terkait penerapan machine learning untuk pertanian presisi',
      status: 'active',
    },
  });
  console.log('✅ Demo project created');

  // Create sample papers
  const samplePapers = [
    { title: 'Deep Learning for Crop Yield Prediction Using Satellite Imagery', authors: JSON.stringify(['Zhang, W.', 'Liu, H.']), year: 2023, journal: 'Computers and Electronics in Agriculture', doi: '10.1016/j.compag.2023.001', abstract: 'This study proposes a deep learning framework for predicting crop yields using satellite imagery...', citations: 45, sourceApi: 'openalex', keywords: JSON.stringify(['deep learning', 'crop yield', 'satellite imagery']), url: 'https://example.com/1' },
    { title: 'Random Forest Based Soil Quality Assessment for Precision Agriculture', authors: JSON.stringify(['Rahman, A.', 'Karim, M.']), year: 2022, journal: 'Biosystems Engineering', doi: '10.1016/j.biosystemseng.2022.002', abstract: 'A random forest model is developed to assess soil quality parameters...', citations: 32, sourceApi: 'crossref', keywords: JSON.stringify(['random forest', 'soil quality', 'precision agriculture']), url: 'https://example.com/2' },
    { title: 'CNN-based Plant Disease Detection in Rice Fields', authors: JSON.stringify(['Nguyen, T.', 'Pham, L.']), year: 2023, journal: 'Smart Agricultural Technology', doi: '10.1016/j.atech.2023.003', abstract: 'Convolutional neural networks are applied to detect plant diseases in rice fields...', citations: 28, sourceApi: 'semanticscholar', keywords: JSON.stringify(['CNN', 'plant disease', 'rice']), url: 'https://example.com/3' },
    { title: 'IoT-Enabled Smart Irrigation System Using Machine Learning', authors: JSON.stringify(['Singh, R.', 'Sharma, P.']), year: 2022, journal: 'Agricultural Water Management', doi: '10.1016/j.agwat.2022.004', abstract: 'An IoT-enabled smart irrigation system using ML algorithms for water optimization...', citations: 67, sourceApi: 'openalex', keywords: JSON.stringify(['IoT', 'irrigation', 'machine learning']), url: 'https://example.com/4' },
    { title: 'Transfer Learning for Fruit Quality Grading in Orchards', authors: JSON.stringify(['Chen, J.', 'Wang, Y.']), year: 2021, journal: 'Postharvest Biology and Technology', doi: '10.1016/j.postharvbio.2021.005', abstract: 'Transfer learning techniques are applied for automated fruit quality grading...', citations: 89, sourceApi: 'crossref', keywords: JSON.stringify(['transfer learning', 'fruit quality', 'image classification']), url: 'https://example.com/5' },
  ];

  for (const paper of samplePapers) {
    const created = await prisma.paper.create({ data: { ...paper, projectId: project.id } });

    // Create analysis for some papers
    if (created.id <= project.id + 3) {
      await prisma.paperAnalysis.create({
        data: {
          paperId: created.id,
          method: ['Deep Learning', 'Random Forest', 'CNN'][created.id % 3],
          researchObject: ['Crop Yield', 'Soil Quality', 'Plant Disease'][created.id % 3],
          variables: JSON.stringify(['temperature', 'humidity', 'rainfall']),
          location: ['China', 'Bangladesh', 'Vietnam', 'India'][created.id % 4],
          technology: ['Python/TensorFlow', 'Scikit-learn', 'PyTorch'][created.id % 3],
          results: 'Model achieved 94% accuracy on test dataset.',
          limitations: 'Limited to specific crop types and regions.',
          opportunities: 'Can be extended to other crop types and include socioeconomic factors.',
        },
      });
    }
  }
  console.log('✅ Sample papers and analyses created');

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:    admin@noveltyfinder.com    / admin123');
  console.log('Student:  mahasiswa@noveltyfinder.com / student123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
