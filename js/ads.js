(function () {
  'use strict';

  var cfg = window.EA_ADS || {};
  var CONSENT_KEY = 'ea_cookie_consent';
  var pubId = cfg.PUBLISHER_ID || '';
  var enabled = cfg.ENABLED === true && pubId && !pubId.includes('XXXXXXXX');

  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  }

  function privacyHref() {
    var about = document.querySelector('.nav-links a[href*="about"]');
    if (about) {
      return about.getAttribute('href').replace(/about\/index\.html$/, 'privacy/index.html');
    }
    return '/privacy/';
  }

  function showConsent() {
    if (document.getElementById('cookie-consent') || hasConsent()) return;

    var el = document.createElement('div');
    el.id = 'cookie-consent';
    el.className = 'cookie-consent is-visible';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<div class="cookie-consent-inner">' +
      '<p>We use cookies for analytics and personalized ads via Google AdSense. ' +
      '<a href="' + privacyHref() + '">Privacy Policy</a></p>' +
      '<div class="cookie-consent-actions">' +
      '<button type="button" class="cookie-btn cookie-btn-decline" id="cookie-decline">Essential only</button>' +
      '<button type="button" class="cookie-btn cookie-btn-accept" id="cookie-accept">Accept</button>' +
      '</div></div>';

    document.body.appendChild(el);

    document.getElementById('cookie-accept').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      el.remove();
      initAds();
    });

    document.getElementById('cookie-decline').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'essential');
      el.remove();
    });
  }

  function loadAdScript(callback) {
    if (document.querySelector('script[src*="adsbygoogle"]')) {
      callback();
      return;
    }
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(pubId);
    s.crossOrigin = 'anonymous';
    s.onload = callback;
    document.head.appendChild(s);
  }

  function resolveSlotId(slotEl) {
    var key = slotEl.getAttribute('data-ad-key');
    if (key && cfg.SLOTS && cfg.SLOTS[key]) return cfg.SLOTS[key];
    return slotEl.getAttribute('data-ad-slot') || '';
  }

  function renderSlot(slotEl) {
    var slotId = resolveSlotId(slotEl);
    var format = slotEl.getAttribute('data-ad-format') || 'auto';
    var container = slotEl.querySelector('.ad-container');
    if (!container || !slotId) return;

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', pubId);
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', format);
    ins.setAttribute('data-full-width-responsive', 'true');
    container.innerHTML = '';
    container.appendChild(ins);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* ignore */ }
  }

  function initAds() {
    if (!enabled || !hasConsent()) return;

    var slots = document.querySelectorAll('.ad-slot[data-ad-key]');
    if (!slots.length) return;

    slots.forEach(function (slot) {
      slot.classList.remove('ad-slot--pending');
    });

    loadAdScript(function () {
      slots.forEach(renderSlot);
    });
  }

  function markPlaceholders() {
    if (enabled) return;
    document.querySelectorAll('.ad-slot').forEach(function (slot) {
      slot.classList.add('ad-slot--pending');
      var c = slot.querySelector('.ad-container');
      if (c && !c.textContent.trim()) {
        c.style.minHeight = '0';
        c.style.border = 'none';
        c.style.background = 'transparent';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    showConsent();
    markPlaceholders();
    if (hasConsent()) initAds();
  });
})();