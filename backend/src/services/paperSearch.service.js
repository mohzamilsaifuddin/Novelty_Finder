const axios = require('axios');

/**
 * OpenAlex API service
 * Docs: https://docs.openalex.org/
 */
const searchOpenAlex = async (keywords, limit = 25, startYear, endYear) => {
  try {
    const query = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    const email = process.env.OPENALEX_EMAIL || 'researcher@university.edu';
    
    let filter = '';
    if (startYear || endYear) {
      filter = `publication_year:${startYear || ''}-${endYear || ''}`;
    }

    const response = await axios.get('https://api.openalex.org/works', {
      params: {
        search: query,
        per_page: limit,
        filter: filter || undefined,
        select: 'id,title,authorships,publication_year,primary_location,doi,abstract_inverted_index,cited_by_count,concepts,open_access',
        mailto: email,
      },
      timeout: 15000,
    });

    const results = response.data.results || [];

    return results.map(work => {
      // Reconstruct abstract from inverted index
      let abstract = '';
      if (work.abstract_inverted_index) {
        const wordPositions = [];
        Object.entries(work.abstract_inverted_index).forEach(([word, positions]) => {
          positions.forEach(pos => { wordPositions[pos] = word; });
        });
        abstract = wordPositions.filter(Boolean).join(' ');
      }

      const authors = (work.authorships || []).map(a => a.author?.display_name || 'Unknown');
      const journal = work.primary_location?.source?.display_name || '';
      const url = work.primary_location?.landing_page_url || work.open_access?.oa_url || '';
      const keywords = (work.concepts || []).slice(0, 5).map(c => c.display_name);

      return {
        title: work.title || '',
        authors,
        year: work.publication_year,
        journal,
        doi: work.doi?.replace('https://doi.org/', '') || null,
        abstract,
        citations: work.cited_by_count || 0,
        url,
        sourceApi: 'openalex',
        keywords,
      };
    });
  } catch (error) {
    console.error('OpenAlex API error:', error.message);
    return [];
  }
};

/**
 * Crossref API service
 * Docs: https://api.crossref.org/swagger-ui/index.html
 */
const searchCrossref = async (keywords, limit = 25, startYear, endYear) => {
  try {
    const query = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    
    let filter = [];
    if (startYear) filter.push(`from-pub-date:${startYear}`);
    if (endYear) filter.push(`until-pub-date:${endYear}`);

    const response = await axios.get('https://api.crossref.org/works', {
      params: {
        query,
        rows: limit,
        filter: filter.length > 0 ? filter.join(',') : undefined,
        select: 'title,author,published,container-title,DOI,abstract,is-referenced-by-count,URL,subject',
      },
      timeout: 15000,
    });

    const items = response.data.message?.items || [];

    return items.map(item => {
      const authors = (item.author || []).map(a =>
        [a.given, a.family].filter(Boolean).join(' ') || 'Unknown'
      );
      const year = item.published?.['date-parts']?.[0]?.[0] || null;
      const journal = item['container-title']?.[0] || '';
      const abstract = item.abstract
        ? item.abstract.replace(/<[^>]*>/g, '').trim()
        : '';
      const kw = item.subject || [];

      return {
        title: item.title?.[0] || '',
        authors,
        year,
        journal,
        doi: item.DOI || null,
        abstract,
        citations: item['is-referenced-by-count'] || 0,
        url: item.URL || '',
        sourceApi: 'crossref',
        keywords: kw.slice(0, 5),
      };
    });
  } catch (error) {
    console.error('Crossref API error:', error.message);
    return [];
  }
};

/**
 * Semantic Scholar API service
 * Docs: https://api.semanticscholar.org/api-docs/
 */
const searchSemanticScholar = async (keywords, limit = 25, startYear, endYear) => {
  try {
    const query = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    
    let yearParam = undefined;
    if (startYear && endYear) yearParam = `${startYear}-${endYear}`;
    else if (startYear) yearParam = `${startYear}-`;
    else if (endYear) yearParam = `-${endYear}`;

    const response = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', {
      params: {
        query,
        limit,
        year: yearParam,
        fields: 'title,authors,year,venue,externalIds,abstract,citationCount,url,fieldsOfStudy',
      },
      timeout: 15000,
    });

    const papers = response.data.data || [];

    return papers.map(paper => {
      const authors = (paper.authors || []).map(a => a.name || 'Unknown');
      const doi = paper.externalIds?.DOI || null;
      const kw = paper.fieldsOfStudy || [];

      return {
        title: paper.title || '',
        authors,
        year: paper.year,
        journal: paper.venue || '',
        doi,
        abstract: paper.abstract || '',
        citations: paper.citationCount || 0,
        url: paper.url || '',
        sourceApi: 'semanticscholar',
        keywords: kw.slice(0, 5),
      };
    });
  } catch (error) {
    console.error('Semantic Scholar API error:', error.message);
    return [];
  }
};

/**
 * Scopus API service (Requires process.env.SCOPUS_API_KEY)
 */
const searchScopus = async (keywords, limit = 25, startYear, endYear) => {
  const apiKey = process.env.SCOPUS_API_KEY;
  if (!apiKey) {
    console.warn('Scopus search skipped: SCOPUS_API_KEY not found in .env');
    return [];
  }
  try {
    const queryStr = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    let scopusQuery = `TITLE-ABS-KEY(${queryStr})`;
    if (startYear && endYear) scopusQuery += ` AND PUBYEAR > ${startYear - 1} AND PUBYEAR < ${endYear + 1}`;
    else if (startYear) scopusQuery += ` AND PUBYEAR > ${startYear - 1}`;
    else if (endYear) scopusQuery += ` AND PUBYEAR < ${endYear + 1}`;

    const response = await axios.get('https://api.elsevier.com/content/search/scopus', {
      headers: {
        'X-ELS-APIKey': apiKey,
        'Accept': 'application/json'
      },
      params: {
        query: scopusQuery,
        count: limit,
      },
      timeout: 15000,
    });

    const entries = response.data['search-results']?.entry || [];
    return entries.map(item => ({
      title: item['dc:title'] || '',
      authors: [item['dc:creator'] || 'Unknown'],
      year: item['prism:coverDate'] ? parseInt(item['prism:coverDate'].substring(0, 4)) : null,
      journal: item['prism:publicationName'] || '',
      doi: item['prism:doi'] || null,
      abstract: item['dc:description'] || '',
      citations: parseInt(item['citedby-count'] || '0'),
      url: item['prism:url'] || '',
      sourceApi: 'scopus',
      keywords: [],
    }));
  } catch (error) {
    console.error('Scopus API error:', error.message);
    return [];
  }
};

/**
 * Google Scholar Web Scraper using Cheerio
 * Note: Scholar blocks automated requests aggressively. This is a basic implementation.
 */
const cheerio = require('cheerio');
const searchGoogleScholar = async (keywords, limit = 25, startYear, endYear) => {
  try {
    const query = Array.isArray(keywords) ? keywords.join(' ') : keywords;
    const params = new URLSearchParams({ q: query, hl: 'en' });
    if (startYear) params.append('as_ylo', startYear);
    if (endYear) params.append('as_yhi', endYear);

    const response = await axios.get(`https://scholar.google.com/scholar?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.gs_ri').each((i, el) => {
      if (results.length >= limit) return false;
      
      const titleEl = $(el).find('.gs_rt a');
      const title = titleEl.text() || $(el).find('.gs_rt').text().replace(/\[.*?\]/g, '').trim();
      const url = titleEl.attr('href') || '';
      
      const meta = $(el).find('.gs_a').text();
      // meta usually looks like: "Author 1, Author 2 - Journal, Year - publisher.com"
      let authors = [], year = null, journal = '';
      if (meta) {
        const parts = meta.split('-');
        if (parts.length > 0) authors = parts[0].split(',').map(a => a.trim().replace(/&hellip;/, ''));
        if (parts.length > 1) {
          const journalYear = parts[1].trim();
          const yearMatch = journalYear.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) year = parseInt(yearMatch[0]);
          journal = journalYear.replace(/\b(19|20)\d{2}\b/, '').trim().replace(/,$/, '');
        }
      }

      const abstract = $(el).find('.gs_rs').text().trim();
      let citations = 0;
      const citeText = $(el).find('.gs_fl a:contains("Cited by")').text();
      if (citeText) citations = parseInt(citeText.replace(/\D/g, '')) || 0;

      results.push({
        title,
        authors,
        year,
        journal,
        doi: null,
        abstract,
        citations,
        url,
        sourceApi: 'scholar',
        keywords: [],
      });
    });

    return results;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn('Google Scholar rate limited (429 Too Many Requests).');
    } else {
      console.error('Google Scholar scrape error:', error.message);
    }
    return [];
  }
};

/**
 * Deduplicate papers by DOI and title similarity
 */
const deduplicatePapers = (papers) => {
  const seen = new Map(); // doi -> paper
  const seenTitles = [];
  const unique = [];

  for (const paper of papers) {
    // Skip if no title
    if (!paper.title || paper.title.trim() === '') continue;

    const normalizedTitle = paper.title.toLowerCase().trim();

    // Check DOI duplication
    if (paper.doi) {
      const normalizedDoi = paper.doi.toLowerCase().trim();
      if (seen.has(normalizedDoi)) {
        // Merge: keep highest citations
        const existing = seen.get(normalizedDoi);
        if ((paper.citations || 0) > (existing.citations || 0)) {
          existing.citations = paper.citations;
        }
        continue;
      }
      seen.set(normalizedDoi, paper);
    }

    // Check title similarity
    let isDuplicate = false;
    for (const existingTitle of seenTitles) {
      if (isSimilarTitle(normalizedTitle, existingTitle)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seenTitles.push(normalizedTitle);
      unique.push(paper);
    }
  }

  return unique;
};

/**
 * Simple title similarity check using common words ratio
 */
const isSimilarTitle = (title1, title2) => {
  const words1 = new Set(title1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(title2.split(/\s+/).filter(w => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return false;

  let common = 0;
  words1.forEach(w => { if (words2.has(w)) common++; });

  const similarity = (2 * common) / (words1.size + words2.size);
  return similarity > 0.7; // 70% threshold
};

module.exports = { searchOpenAlex, searchCrossref, searchSemanticScholar, searchScopus, searchGoogleScholar, deduplicatePapers };
