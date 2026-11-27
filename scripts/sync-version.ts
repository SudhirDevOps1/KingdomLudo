import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface VersionBreakdown {
  raw: string;
  major: number;
  minor: number;
  patch: number;
  prereleaseType?: 'alpha' | 'beta' | 'rc' | string;
  prereleaseNumber?: number;
}

function parseSemver(versionStr: string): VersionBreakdown {
  const clean = versionStr.replace(/^v/, '').trim();
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z]+)(?:\.(\d+))?)?$/);
  if (!match) {
    throw new Error(`Invalid semver format: "${versionStr}". Expected format: X.Y.Z or X.Y.Z-channel.N`);
  }
  return {
    raw: clean,
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prereleaseType: match[4] ? (match[4].toLowerCase() as any) : undefined,
    prereleaseNumber: match[5] ? parseInt(match[5], 10) : match[4] ? 0 : undefined,
  };
}

function bumpVersion(current: VersionBreakdown, bumpType: string): string {
  const type = bumpType.toLowerCase();
  switch (type) {
    case 'major':
      return `${current.major + 1}.0.0`;
    case 'minor':
      return `${current.major}.${current.minor + 1}.0`;
    case 'patch':
      if (current.prereleaseType) {
        // If currently in prerelease (e.g. 0.1.0-alpha.0), bump to clean release or bump patch
        return `${current.major}.${current.minor}.${current.patch}`;
      }
      return `${current.major}.${current.minor}.${current.patch + 1}`;
    case 'alpha': {
      const nextNum = current.prereleaseType === 'alpha' ? (current.prereleaseNumber ?? 0) + 1 : 0;
      return `${current.major}.${current.minor}.${current.patch}-alpha.${nextNum}`;
    }
    case 'beta': {
      const nextNum = current.prereleaseType === 'beta' ? (current.prereleaseNumber ?? 0) + 1 : 0;
      return `${current.major}.${current.minor}.${current.patch}-beta.${nextNum}`;
    }
    case 'rc': {
      const nextNum = current.prereleaseType === 'rc' ? (current.prereleaseNumber ?? 0) + 1 : 0;
      return `${current.major}.${current.minor}.${current.patch}-rc.${nextNum}`;
    }
    default:
      throw new Error(`Unknown bump type "${bumpType}". Supported: major, minor, patch, alpha, beta, rc`);
  }
}

function getReleaseChannel(version: string): 'Alpha' | 'Beta' | 'Release Candidate' | 'Production' {
  const lower = version.toLowerCase();
  if (lower.includes('alpha')) return 'Alpha';
  if (lower.includes('beta')) return 'Beta';
  if (lower.includes('rc')) return 'Release Candidate';
  return 'Production';
}

function computeAndroidVersionCode(version: VersionBreakdown): number {
  return version.major * 10000 + version.minor * 100 + version.patch;
}

export function syncAllVersions(explicitVersion?: string) {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const oldVersion = pkg.version;

  const targetVersion = explicitVersion || oldVersion;
  const parsed = parseSemver(targetVersion);
  const cleanVersion = parsed.raw;
  const releaseTag = `v${cleanVersion}`;
  const releaseChannel = getReleaseChannel(cleanVersion);
  const androidVersionCode = computeAndroidVersionCode(parsed);
  const timestamp = new Date().toISOString();

  console.log(`\n👑 KingdomLudo Unified SSOT Version Synchronizer`);
  console.log(`──────────────────────────────────────────────────────────`);
  console.log(`  Current Version:       ${oldVersion}`);
  console.log(`  Target Version:        ${cleanVersion}`);
  console.log(`  Release Tag:           ${releaseTag}`);
  console.log(`  Release Channel:       ${releaseChannel}`);
  console.log(`  Android Version Code:  ${androidVersionCode}`);
  console.log(`──────────────────────────────────────────────────────────\n`);

  const updatedFiles: string[] = [];

  // 1. package.json
  if (pkg.version !== cleanVersion) {
    pkg.version = cleanVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    updatedFiles.push('package.json');
  }

  // 2. src/config/version.ts
  const versionTsPath = path.join(ROOT_DIR, 'src', 'config', 'version.ts');
  const versionTsContent = `/**
 * AUTO-GENERATED FILE — DO NOT EDIT MANUALLY.
 * Synchronized across the entire repository via: pnpm run version:sync
 */
export const APP_VERSION = '${cleanVersion}';
export const APP_RELEASE_CHANNEL = '${releaseChannel}';
export const APP_RELEASE_TAG = '${releaseTag}';
export const ANDROID_VERSION_CODE = ${androidVersionCode};
export const BUILD_TIMESTAMP = '${timestamp}';
`;
  fs.writeFileSync(versionTsPath, versionTsContent, 'utf-8');
  updatedFiles.push('src/config/version.ts');

  // 3. .release-please-manifest.json
  const manifestPath = path.join(ROOT_DIR, '.release-please-manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (manifest['.'] !== cleanVersion) {
      manifest['.'] = cleanVersion;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
      updatedFiles.push('.release-please-manifest.json');
    }
  }

  // 4. metadata.json
  const metadataPath = path.join(ROOT_DIR, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    if (metadata.description) {
      metadata.description = metadata.description.replace(
        /\(v[0-9a-zA-Z.-]+\)/,
        `(${releaseTag})`
      );
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf-8');
      updatedFiles.push('metadata.json');
    }
  }

  // 5. README.md & CHANGELOG.md & docs/*.md
  const markdownFiles: string[] = [];
  const readmePath = path.join(ROOT_DIR, 'README.md');
  if (fs.existsSync(readmePath)) markdownFiles.push(readmePath);

  const changelogPath = path.join(ROOT_DIR, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) markdownFiles.push(changelogPath);

  const docsDir = path.join(ROOT_DIR, 'docs');
  if (fs.existsSync(docsDir)) {
    const list = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
    for (const f of list) {
      markdownFiles.push(path.join(docsDir, f));
    }
  }

  // Regex to match previous version pattern: (v?)X.Y.Z(-channel.N)?
  const versionRegex = new RegExp(`v?${oldVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');

  for (const mdPath of markdownFiles) {
    const relPath = path.relative(ROOT_DIR, mdPath);
    let content = fs.readFileSync(mdPath, 'utf-8');

    if (content.includes(oldVersion)) {
      content = content.replace(versionRegex, (match) => {
        return match.startsWith('v') ? releaseTag : cleanVersion;
      });
      fs.writeFileSync(mdPath, content, 'utf-8');
      updatedFiles.push(relPath);
    }
  }

  // If CHANGELOG.md does not yet have a heading for the target version, add it at the top
  if (fs.existsSync(changelogPath) && cleanVersion !== oldVersion) {
    let changelogContent = fs.readFileSync(changelogPath, 'utf-8');
    const headerStr = `## [${cleanVersion}]`;
    if (!changelogContent.includes(headerStr)) {
      const today = new Date().toISOString().split('T')[0];
      const newEntry = `## [${cleanVersion}] - ${today}\n\n- Channel: **${releaseChannel}** (\`${cleanVersion}\`).\n\n`;
      changelogContent = changelogContent.replace(/(# Changelog\s*\n\n)/, `$1${newEntry}`);
      fs.writeFileSync(changelogPath, changelogContent, 'utf-8');
      if (!updatedFiles.includes('CHANGELOG.md')) {
        updatedFiles.push('CHANGELOG.md');
      }
    }
  }

  console.log(`✅ Successfully synchronized ${updatedFiles.length} file(s):`);
  for (const f of updatedFiles) {
    console.log(`   • ${f}`);
  }
  console.log(`\n🎉 Project version is now unified at: ${cleanVersion} (${releaseTag}) [${releaseChannel}]\n`);
}

// CLI execution handler
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

if (!command || command === 'sync') {
  syncAllVersions();
} else if (command === 'bump') {
  const bumpType = args[1] || 'patch';
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
  const current = parseSemver(pkg.version);
  const next = bumpVersion(current, bumpType);
  syncAllVersions(next);
} else if (command === 'set') {
  const target = args[1];
  if (!target) {
    console.error('Error: Please provide a target version. Example: pnpm run version:set 0.1.1');
    process.exit(1);
  }
  syncAllVersions(target);
} else if (command === 'verify') {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
  const expected = pkg.version as string;
  const versionTsPath = path.join(ROOT_DIR, 'src/config/version.ts');
  const versionTs = fs.existsSync(versionTsPath) ? fs.readFileSync(versionTsPath, 'utf-8') : '';
  if (!versionTs.includes(`APP_VERSION = '${expected}'`)) {
    console.error(`❌ Version drift detected! src/config/version.ts does not match package.json (${expected}). Run: pnpm run version:sync`);
    process.exit(1);
  }
  console.log(`✅ Version verified: ${expected} matches src/config/version.ts`);
} else {
  console.log(`Usage:`);
  console.log(`  pnpm run version:sync                # Sync current package.json version across all files`);
  console.log(`  pnpm run version:verify              # Verify derived version surfaces match SSOT`);
  console.log(`  pnpm run version:bump [type]         # Bump version (patch|minor|major|alpha|beta|rc) & sync`);
  console.log(`  pnpm run version:set <new-version>   # Set exact version & sync across all files`);
}
