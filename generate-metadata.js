const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, 'articles');
const outputFile = path.join(articlesDir, 'articles-metadata.json');

function extractFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const frontMatter = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (key === 'tags') {
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
            } else {
                value = value.split(',').map(s => s.trim());
            }
        }
        frontMatter[key] = value;
    }
    return frontMatter;
}

function generateMetadata() {
    const result = [];

    function walk(dir, category = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Skip the special _categories folder
                if (entry.name === '_categories') continue;
                const newCategory = category || entry.name;
                walk(fullPath, newCategory);
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                const slug = entry.name.replace(/\.md$/, '');
                const relativePath = path.relative(articlesDir, fullPath).replace(/\\/g, '/');
                const content = fs.readFileSync(fullPath, 'utf8');
                const frontMatter = extractFrontMatter(content);
                const title = frontMatter.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const tags = frontMatter.tags || [];
                const finalCategory = frontMatter.category || category || 'Uncategorized';
                result.push({ slug, title, category: finalCategory, tags, path: relativePath });
            }
        }
    }

    walk(articlesDir);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`Generated ${outputFile} with ${result.length} articles.`);
}

generateMetadata();
