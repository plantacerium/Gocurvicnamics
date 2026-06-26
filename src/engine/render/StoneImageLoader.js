/**
 * StoneImageLoader — Preloads and caches stone PNG images for piece rendering.
 * Maps PIECE_TYPE → Image object with fallback support.
 */

const STONE_MAP = {
  BASE:      'assets/stones/piece_1_base_1782403856623.png',
  DAMPENER:  'assets/stones/piece_2_dampener_1782403868335.png',
  AMPLIFIER: 'assets/stones/piece_3_amplifier_v2_1782404059346.png',
  SLINGSHOT: 'assets/stones/piece_4_slingshot_1782403893916.png',
  GRAVITON:  'assets/stones/piece_5_graviton_1782403906467.png',
  PHANTOM:   'assets/stones/piece_6_phantom_1782403917700.png',
};

const EXTRA_STONES = {
  BRAWLER:      'assets/stones/piece_7_brawler_1782404073633.png',
  GLASS_CANNON: 'assets/stones/piece_8_glass_cannon_1782404085338.png',
  JUGGERNAUT:   'assets/stones/piece_9_juggernaut_1782404097456.png',
  PEBBLE:       'assets/stones/piece_10_pebble_1782404106565.png',
  GHOST:        'assets/stones/piece_11_ghost_1782404118723.png',
  MIRAGE:       'assets/stones/piece_12_mirage_1782404130644.png',
  SPECTER:      'assets/stones/piece_13_specter_1782404143497.png',
  BLINK:        'assets/stones/piece_14_blink_1782404154343.png',
  SHADOW:       'assets/stones/piece_15_shadow_1782404165927.png',
  WISP:         'assets/stones/piece_16_wisp_1782404178419.png',
};

export class StoneImageLoader {
  constructor() {
    this.images = new Map();
    this.loaded = false;
    this._loadPromise = null;
  }

  async preload() {
    if (this._loadPromise) return this._loadPromise;

    this._loadPromise = this._loadAll();
    await this._loadPromise;
    this.loaded = true;
    return this;
  }

  async _loadAll() {
    const allMaps = { ...STONE_MAP, ...EXTRA_STONES };
    const entries = Object.entries(allMaps);

    const results = await Promise.allSettled(
      entries.map(([type, src]) => this._loadImage(type, src))
    );

    let loadedCount = 0;
    for (const r of results) {
      if (r.status === 'fulfilled') loadedCount++;
    }
    console.log(`[StoneImageLoader] Loaded ${loadedCount}/${entries.length} stone images`);
  }

  _loadImage(type, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(type, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`[StoneImageLoader] Failed to load: ${src}`);
        reject(new Error(`Failed: ${src}`));
      };
      img.src = src;
    });
  }

  getImage(pieceType) {
    return this.images.get(pieceType) || null;
  }

  hasImage(pieceType) {
    return this.images.has(pieceType);
  }

  getImagePath(pieceType) {
    return STONE_MAP[pieceType] || EXTRA_STONES[pieceType] || null;
  }
}

export const stoneLoader = new StoneImageLoader();
export { STONE_MAP, EXTRA_STONES };
