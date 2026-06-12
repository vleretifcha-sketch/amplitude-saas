export type VimeoFields = {
  videoId: string;
  hash: string | null;
};

/** Extrait l'ID et le hash depuis un ID brut ou une URL Vimeo collée. */
export function parseVimeoFields(rawId: string, rawHash?: string | null): VimeoFields {
  let videoId = rawId.trim();
  let hash = rawHash?.trim() || null;

  if (/vimeo\.com/i.test(videoId) || /^\d+$/.test(videoId) === false) {
    const parsed = parseVimeoUrl(videoId);
    if (parsed) {
      videoId = parsed.videoId;
      hash = hash || parsed.hash;
    }
  }

  videoId = videoId.replace(/\?.*$/, '').replace(/\/$/, '');

  return { videoId, hash: hash || null };
}

function parseVimeoUrl(input: string): VimeoFields | null {
  try {
    const url = input.startsWith('http') ? input : `https://${input}`;
    const parsed = new URL(url);

    if (parsed.hostname.includes('player.vimeo.com')) {
      const match = parsed.pathname.match(/\/video\/(\d+)/);
      if (!match) return null;
      return {
        videoId: match[1],
        hash: parsed.searchParams.get('h'),
      };
    }

    const parts = parsed.pathname.split('/').filter(Boolean);
    const numeric = parts.find((part) => /^\d+$/.test(part));
    if (!numeric) return null;

    let extractedHash = parsed.searchParams.get('h');
    if (!extractedHash) {
      const idIndex = parts.indexOf(numeric);
      const next = parts[idIndex + 1];
      if (next && !/^\d+$/.test(next)) {
        extractedHash = next;
      }
    }

    return { videoId: numeric, hash: extractedHash };
  } catch {
    return null;
  }
}

export function buildVimeoWatchUrl(videoId: string, hash?: string | null): string {
  const { videoId: id, hash: h } = parseVimeoFields(videoId, hash);
  if (h) return `https://vimeo.com/${id}/${h}`;
  return `https://vimeo.com/${id}`;
}
