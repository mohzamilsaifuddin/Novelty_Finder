const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');

const getProjectWithPapers = async (projectId, userId) => {
  const project = await prisma.searchProject.findFirst({
    where: { id: parseInt(projectId), userId },
    include: {
      papers: {
        include: { analysis: true },
        orderBy: { year: 'desc' },
      },
    },
  });
  return project;
};

const exportExcel = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const project = await getProjectWithPapers(projectId, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Novelty Finder';
    workbook.created = new Date();

    // ── Sheet 1: Papers ──
    const paperSheet = workbook.addWorksheet('Papers');
    paperSheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Authors', key: 'authors', width: 30 },
      { header: 'Year', key: 'year', width: 8 },
      { header: 'Journal', key: 'journal', width: 30 },
      { header: 'DOI', key: 'doi', width: 25 },
      { header: 'Citations', key: 'citations', width: 12 },
      { header: 'Source API', key: 'source', width: 18 },
      { header: 'URL', key: 'url', width: 40 },
    ];

    // Style header
    paperSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    paperSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

    project.papers.forEach((p, i) => {
      let authors = [];
      try { authors = JSON.parse(p.authors || '[]'); } catch {}
      paperSheet.addRow({
        no: i + 1,
        title: p.title,
        authors: authors.join(', '),
        year: p.year,
        journal: p.journal,
        doi: p.doi,
        citations: p.citations,
        source: p.sourceApi,
        url: p.url,
      });
    });

    // ── Sheet 2: Literature Matrix ──
    const matrixSheet = workbook.addWorksheet('Literature Matrix');
    matrixSheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Author(s)', key: 'authors', width: 25 },
      { header: 'Year', key: 'year', width: 8 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Method', key: 'method', width: 20 },
      { header: 'Object', key: 'object', width: 20 },
      { header: 'Variables', key: 'variables', width: 25 },
      { header: 'Location', key: 'location', width: 15 },
      { header: 'Technology', key: 'technology', width: 20 },
      { header: 'Results', key: 'results', width: 35 },
      { header: 'Limitations', key: 'limitations', width: 30 },
      { header: 'Novelty Opportunity', key: 'opportunities', width: 35 },
    ];

    matrixSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    matrixSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

    project.papers.forEach((p, i) => {
      let authors = [], variables = [];
      try { authors = JSON.parse(p.authors || '[]'); } catch {}
      try { variables = JSON.parse(p.analysis?.variables || '[]'); } catch {}

      matrixSheet.addRow({
        no: i + 1,
        authors: authors.slice(0, 2).join(', ') + (authors.length > 2 ? ' et al.' : ''),
        year: p.year,
        title: p.title,
        method: p.analysis?.method || '-',
        object: p.analysis?.researchObject || '-',
        variables: variables.join(', ') || '-',
        location: p.analysis?.location || '-',
        technology: p.analysis?.technology || '-',
        results: p.analysis?.results || '-',
        limitations: p.analysis?.limitations || '-',
        opportunities: p.analysis?.opportunities || '-',
      });
    });

    // Alternating row colors
    matrixSheet.eachRow((row, rowNum) => {
      if (rowNum > 1 && rowNum % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
      }
    });

    // ── Sheet 3: Abstracts ──
    const abstractSheet = workbook.addWorksheet('Abstracts');
    abstractSheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Abstract', key: 'abstract', width: 80 },
    ];
    abstractSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    abstractSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    project.papers.forEach((p, i) => {
      abstractSheet.addRow({ no: i + 1, title: p.title, abstract: p.abstract || '-' });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="novelty-finder-${project.name.replace(/\s+/g, '_')}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};

const exportPdf = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const project = await getProjectWithPapers(projectId, req.user.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Build HTML for PDF
    const rows = project.papers.map((p, i) => {
      let authors = [];
      try { authors = JSON.parse(p.authors || '[]'); } catch {}
      return `
        <tr style="background:${i % 2 === 0 ? '#f8faff' : '#ffffff'}">
          <td>${i + 1}</td>
          <td>${authors.slice(0, 2).join(', ')}${authors.length > 2 ? ' et al.' : ''}</td>
          <td>${p.year || '-'}</td>
          <td style="font-size:11px">${p.title}</td>
          <td>${p.analysis?.method || '-'}</td>
          <td>${p.analysis?.researchObject || '-'}</td>
          <td>${p.analysis?.location || '-'}</td>
          <td style="font-size:11px">${p.analysis?.results || '-'}</td>
          <td style="font-size:11px">${p.analysis?.opportunities || '-'}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 20px; }
          h1 { color: #1e40af; font-size: 20px; margin-bottom: 4px; }
          p.meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #1e40af; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
          td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <h1>📚 Novelty Finder — Literature Matrix</h1>
        <p class="meta">Project: <strong>${project.name}</strong> | Total Papers: ${project.papers.length} | Generated: ${new Date().toLocaleDateString('id-ID')}</p>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Author(s)</th><th>Year</th><th>Title</th>
              <th>Method</th><th>Object</th><th>Location</th>
              <th>Results</th><th>Novelty Opportunity</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Generated by Novelty Finder • ${new Date().toISOString()}</div>
      </body>
      </html>
    `;

    // Use puppeteer to generate PDF
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
    } catch {
      // Fallback: return HTML as file
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="literature-matrix.html"`);
      return res.send(html);
    }

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '15px', bottom: '15px', left: '10px', right: '10px' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="novelty-finder-${project.name.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
};

module.exports = { exportExcel, exportPdf };
