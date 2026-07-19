const SiteSettings = require('../models/SiteSettingsModel');

let _cache = null;
let _cacheAt = 0;
const CACHE_TTL = 30 * 1000;

async function getCachedSettings() {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;
  _cache = await SiteSettings.getSettings();
  _cacheAt = Date.now();
  return _cache;
}

function invalidateCache() {
  _cache = null;
  _cacheAt = 0;
}

async function maintenanceMiddleware(req, res, next) {
  const url = req.originalUrl.split('?')[0];

  // Always pass through: admin panel, admin login, API routes, static uploads
  if (
    url.startsWith('/admin') ||
    url === '/command' ||
    url.startsWith('/api') ||
    url.startsWith('/uploads')
  ) {
    return next();
  }

  try {
    const settings = await getCachedSettings();

    // Set banner locals for all public pages when banner is active
    if (settings.maintenanceBannerEnabled && settings.maintenanceBannerScheduledAt) {
      const scheduledAt = new Date(settings.maintenanceBannerScheduledAt);
      if (scheduledAt > new Date()) {
        res.locals.maintenanceBanner = {
          scheduledAt: scheduledAt.toISOString(),
        };
      }
    }

    // Block the site if maintenance mode is on
    if (settings.maintenanceModeEnabled) {
      return res.status(503).render('webview/maintenance', {
        layout: false,
        message: settings.maintenanceMessage ||
          "We're performing scheduled maintenance. We'll be back up shortly.",
      });
    }

    next();
  } catch (err) {
    console.error('[maintenanceMiddleware]', err.message);
    next(); // fail open — never break the site if DB is unreachable
  }
}

maintenanceMiddleware.invalidateCache = invalidateCache;
module.exports = maintenanceMiddleware;
