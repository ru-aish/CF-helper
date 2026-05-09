import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

interface TutorialInfo {
  hasTutorial: boolean;
  tutorialLinks: { text: string; title: string; url: string; fullUrl: string }[];
}

export interface ContentItem {
  title: string;
  text: string;
  codes: string[];
}

export interface ExtractedProblem {
  problemId: string;
  title: string;
  contestTitle: string;
  statement: string;
  timeLimit: string;
  memoryLimit: string;
  sampleInputs: string[];
  sampleOutputs: string[];
  tags: string[];
  url: string;
  tutorialInfo: TutorialInfo;
  hints: ContentItem[];
  solutions: ContentItem[];
  tutorials: ContentItem[];
  editorials: ContentItem[];
}

export class CodeforcesExtractor {
  async fetchHtml(url: string): Promise<string | null> {
    try {
      console.log(`🔍 Fetching from: ${url}`);
      const response = await gotScraping({ url });
      if (response.statusCode !== 200) {
        console.error(`❌ Failed to fetch URL. Status code: ${response.statusCode}`);
        return null;
      }
      return response.body as string;
    } catch (error) {
      console.error(`❌ Error fetching URL ${url}:`, error);
      return null;
    }
  }

  extractProblemInfo(html: string, url: string): ExtractedProblem | null {
    const $ = cheerio.load(html);

    // Extract contest title
    let contestTitle = '';
    const contestHeader = $('th').filter((_, el) => $(el).text().includes('Codeforces Round')).first();
    if (contestHeader.length) {
      contestTitle = contestHeader.text().trim();
    } else {
      const contestLink = $('a').filter((_, el) => ($(el).attr('href') || '').includes('/contest/')).first();
      if (contestLink.length) {
        contestTitle = contestLink.text().trim();
      }
    }

    const problemDiv = $('.problem-statement').first();
    if (!problemDiv.length) {
      console.error('❌ Could not find problem statement');
      return null;
    }

    // Extract title
    const problemTitle = problemDiv.find('.title').first().text().trim() || 'Unknown';

    // Extract problem ID from URL
    const urlParts = url.split('/');
    let problemId = '';
    if (urlParts.includes('contest') && urlParts.includes('problem')) {
      const pIdx = urlParts.indexOf('problem');
      if (pIdx > 0) {
        problemId = urlParts[pIdx - 1] + urlParts[pIdx + 1];
      }
    } else if (urlParts.includes('problemset') && urlParts.includes('problem')) {
      const pIdx = urlParts.indexOf('problem');
      if (urlParts.length > pIdx + 2) {
        problemId = urlParts[pIdx + 1] + urlParts[pIdx + 2];
      }
    }

    // Constraints
    const timeLimit = problemDiv.find('.time-limit').first().text().replace('time limit per test', '').trim();
    const memoryLimit = problemDiv.find('.memory-limit').first().text().replace('memory limit per test', '').trim();

    // Statement
    let problemStatement = '';
    const header = problemDiv.find('.header').first();
    if (header.length) {
      let current = header.next();
      const statementParts: string[] = [];
      while (current.length && !current.hasClass('sample-tests')) {
        if (current.prop('tagName')?.toLowerCase() === 'div') {
          const text = current.text().trim();
          if (text) statementParts.push(text);
        }
        current = current.next();
      }
      problemStatement = statementParts.join('\n\n');
    }

    // Samples
    const sampleInputs: string[] = [];
    const sampleOutputs: string[] = [];
    const sampleTestsDiv = problemDiv.find('.sample-tests').first();
    if (sampleTestsDiv.length) {
      sampleTestsDiv.find('.input pre').each((_, el) => {
        // preserve some html spacing? The python code just uses get_text.
        // Let's use text() with some basic html entity unescaping provided by cheerio.
        let text = '';
        $(el).contents().each((_, child) => {
          if (child.type === 'tag' && child.name === 'br') {
            text += '\n';
          } else if (child.type === 'text') {
            text += $(child).text();
          } else if (child.type === 'tag' && child.name === 'div') {
             text += $(child).text() + '\n';
          }
        });
        sampleInputs.push(text.trim());
      });
      sampleTestsDiv.find('.output pre').each((_, el) => {
         let text = '';
         $(el).contents().each((_, child) => {
            if (child.type === 'text') {
               text += $(child).text();
            } else if (child.type === 'tag' && child.name === 'br') {
               text += '\n';
            }
         });
         sampleOutputs.push(text.trim());
      });
    }

    // Notes
    const notes = problemDiv.find('.note').first().text().trim();

    // Tags
    const tags: string[] = [];
    $('.tag-box').each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });

    // Tutorial links
    const tutorialInfo = this.extractTutorialLinks($ as cheerio.CheerioAPI);

    return {
      problemId,
      title: problemTitle,
      contestTitle,
      statement: problemStatement,
      timeLimit,
      memoryLimit,
      sampleInputs,
      sampleOutputs,
      tags,
      url,
      tutorialInfo,
      hints: [],
      solutions: [],
      tutorials: [],
      editorials: []
    };
  }

  extractTutorialLinks($: cheerio.CheerioAPI): TutorialInfo {
    const tutorialInfo: TutorialInfo = {
      hasTutorial: false,
      tutorialLinks: [],
    };

    $('a[href]').each((_, el) => {
      const link = $(el);
      const href = link.attr('href') || '';
      const titleAttr = link.attr('title') || '';
      const text = link.text().trim();

      const keywords = ['tutorial', 'editorial'];
      const textLower = text.toLowerCase();
      const titleLower = titleAttr.toLowerCase();

      if (keywords.some(k => textLower.includes(k) || titleLower.includes(k))) {
        tutorialInfo.hasTutorial = true;
        tutorialInfo.tutorialLinks.push({
          text,
          title: titleAttr,
          url: href,
          fullUrl: href.startsWith('/') ? `https://codeforces.com${href}` : href
        });
      }
    });

    return tutorialInfo;
  }

  async extractEditorialContent(url: string, targetProblemId: string): Promise<Partial<ExtractedProblem> | null> {
    const html = await this.fetchHtml(url);
    if (!html) return null;

    const $ = cheerio.load(html);
    const contentDiv = $('.ttypography').first();
    if (!contentDiv.length) return null;

    const targetData: Partial<ExtractedProblem> = {
      hints: [],
      solutions: [],
      tutorials: [],
      editorials: []
    };

    let foundTarget = false;

    // Find all problem links
    const problemLinks = contentDiv.find('a').filter((_, el) => {
      const href = $(el).attr('href') || '';
      return /\/contest\/\d+\/problem\/[A-Z]\d*/.test(href) || href.includes('/problem/');
    });

    contentDiv.find('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();

      if (/\/contest\/\d+\/problem\/[A-Z]\d*/.test(href) || href.includes('/problem/')) {
        const match = text.match(/(\d+[A-Z]\d*|[A-Z]\d?)\s*[—-]\s*(.*)/);
        let pid = '';
        if (match) {
          pid = match[1].trim();
        }

        if (/^[A-Z]\d?$/.test(pid)) {
          const cMatch = href.match(/\/contest\/(\d+)\/problem\//);
          if (cMatch) {
            pid = cMatch[1] + pid;
          }
        }

        if (!pid) return; // continue

        if (pid === targetProblemId || pid === targetProblemId.substring(targetProblemId.length - 1)) {
           // We found the problem section
           foundTarget = true;
           let current = $(el).parent().next();

           while (current.length) {
              // Stop if we hit another problem link
              if (current.find('a').filter((_i, aEl) => {
                 const aHref = $(aEl).attr('href') || '';
                 return aHref.includes('/problem/');
              }).length > 0) {
                 break;
              }

              if (current.prop('tagName')?.toLowerCase() === 'div' && current.hasClass('spoiler')) {
                 const spoilerTitle = current.find('.spoiler-title').first().text().trim().toLowerCase();
                 const spoilerContent = current.find('.spoiler-content').first();

                 if (spoilerContent.length) {
                    const textContent = spoilerContent.text().trim();
                    const codes: string[] = [];

                    spoilerContent.find('pre, code').each((_j, codeEl) => {
                       const tagName = $(codeEl).prop('tagName')?.toLowerCase();
                       if (tagName === 'pre' || (tagName === 'code' && $(codeEl).parent().prop('tagName')?.toLowerCase() === 'pre')) {
                          let codeText = $(codeEl).text();
                          codeText = codeText.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                          const cleanCode = codeText.trim();
                          if (cleanCode && !codes.includes(cleanCode)) {
                             codes.push(cleanCode);
                          }
                       }
                    });

                    const contentItem: ContentItem = {
                       title: spoilerTitle,
                       text: textContent,
                       codes
                    };

                    if (spoilerTitle.includes('hint')) {
                       targetData.hints!.push(contentItem);
                    } else if (spoilerTitle.includes('solution') || spoilerTitle.includes('code')) {
                       targetData.solutions!.push(contentItem);
                    } else if (spoilerTitle.includes('tutorial')) {
                       targetData.tutorials!.push(contentItem);
                    } else if (spoilerTitle.includes('editorial')) {
                       targetData.editorials!.push(contentItem);
                    } else {
                       targetData.solutions!.push(contentItem);
                    }
                 }
              }
              current = current.next();
           }
        }
      }
    });

    return targetData;
  }

  async processUrl(url: string): Promise<ExtractedProblem | null> {
    const html = await this.fetchHtml(url);
    if (!html) return null;

    const problemData = this.extractProblemInfo(html, url);
    if (!problemData) return null;

    if (problemData.tutorialInfo.hasTutorial && problemData.tutorialInfo.tutorialLinks.length > 0) {
      const editorialUrl = problemData.tutorialInfo.tutorialLinks[0].fullUrl;
      const editorialData = await this.extractEditorialContent(editorialUrl, problemData.problemId);

      if (editorialData) {
        problemData.hints.push(...(editorialData.hints || []));
        problemData.solutions.push(...(editorialData.solutions || []));
        problemData.tutorials.push(...(editorialData.tutorials || []));
        problemData.editorials.push(...(editorialData.editorials || []));
      }
    }

    return problemData;
  }
}
