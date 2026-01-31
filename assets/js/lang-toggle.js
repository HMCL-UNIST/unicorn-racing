/**
 * Language toggle for post content (EN/KR)
 * - Stores preference in localStorage
 * - On post pages: redirects to alternate language version via lang-map
 * - On listing pages: hides posts that don't match selected language
 */

(function () {
  const STORAGE_KEY = 'lang';
  const DEFAULT_LANG = 'ko';
  let langMap = null;

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyLangToRoot(lang);
  }

  function applyLangToRoot(lang) {
    if (document && document.documentElement) {
      document.documentElement.setAttribute('data-lang-pref', lang);
    }
  }

  function updateButtonLabel() {
    const btn = document.querySelector('#lang-toggle .lang-label');
    if (btn) {
      // Show the switch target, not current state
      var current = getLang();
      btn.textContent = current === 'ko' ? 'EN' : 'KO';
    }
  }

  function getBaseUrl() {
    var baseUrl = document.querySelector('meta[name="baseurl"]');
    return baseUrl ? baseUrl.getAttribute('content') || '' : '';
  }

  function filterListingPosts() {
    const lang = getLang();
    const cards = document.querySelectorAll('[data-lang]');

    cards.forEach(function (card) {
      const postLang = card.getAttribute('data-lang') || 'ko';

      if (postLang === lang) {
        card.style.removeProperty('display');
      } else {
        card.style.setProperty('display', 'none', 'important');
      }
    });
  }

  function updateListingCounts() {
    const lang = getLang();

    document.querySelectorAll('[data-lang-count]').forEach(function (node) {
      if (node.querySelector('[data-lang]')) {
        return;
      }
      var countKo = node.getAttribute('data-count-ko');
      var countEn = node.getAttribute('data-count-en');
      if (countKo !== null || countEn !== null) {
        var nextCount = lang === 'en' ? countEn : countKo;
        if (nextCount !== null) {
          node.textContent = String(nextCount || 0);
        }
        return;
      }

      var container = node.closest('#page-category, #page-tag');
      if (!container) return;
      var visible = 0;
      container.querySelectorAll('[data-lang]').forEach(function (item) {
        if (item.style.display !== 'none') {
          visible += 1;
        }
      });
      node.textContent = String(visible);
    });

    document.querySelectorAll('[data-tag-count]').forEach(function (node) {
      if (node.querySelector('[data-lang]')) {
        return;
      }
      var countKo = node.getAttribute('data-count-ko');
      var countEn = node.getAttribute('data-count-en');
      if (countKo === null && countEn === null) return;
      node.textContent = String(lang === 'en' ? countEn || 0 : countKo || 0);
    });
  }

  function updateArchiveVisibility() {
    var archive = document.getElementById('archives');
    if (!archive) return;

    archive.querySelectorAll('time.year').forEach(function (yearNode) {
      var list = yearNode.nextElementSibling;
      if (!list || list.tagName.toLowerCase() !== 'ul') return;

      var visible = 0;
      list.querySelectorAll('[data-lang]').forEach(function (item) {
        if (item.style.display !== 'none') {
          visible += 1;
        }
      });

      if (visible === 0) {
        yearNode.style.display = 'none';
        list.style.display = 'none';
      } else {
        yearNode.style.display = '';
        list.style.display = '';
      }
    });
  }

  function updatePaginator() {
    var list = document.getElementById('post-list');
    if (!list) return;

    var currentPage = parseInt(list.getAttribute('data-current-page'), 10) || 1;
    var lang = getLang();
    var firstPageKo = parseInt(list.getAttribute('data-lang-first-page-ko'), 10);
    var firstPageEn = parseInt(list.getAttribute('data-lang-first-page-en'), 10);
    var firstPage = lang === 'en' ? firstPageEn : firstPageKo;

    var visibleCards = list.querySelectorAll('[data-lang]');
    var visibleCount = 0;
    visibleCards.forEach(function (card) {
      if (card.style.display !== 'none') {
        visibleCount += 1;
      }
    });

    if (visibleCount === 0 && firstPage && firstPage !== currentPage) {
      var target =
        firstPage > 1 ? getBaseUrl() + '/page' + firstPage + '/' : getBaseUrl() + '/';
      window.location.href = target;
      return;
    }
  }

  function handlePostPageToggle() {
    var altDiv = document.getElementById('lang-alt');
    if (!altDiv) return;

    var currentLang = altDiv.getAttribute('data-lang') || 'ko';
    var langRef = altDiv.getAttribute('data-lang-ref');
    if (!langRef || !langMap) return;

    var targetLang = currentLang === 'ko' ? 'en' : 'ko';
    var mapping = langMap[langRef];

    if (mapping && mapping[targetLang]) {
      setLang(targetLang);
      window.location.href = mapping[targetLang];
      return true;
    }
    return false;
  }

  function handleListingToggle() {
    var current = getLang();
    var next = current === 'ko' ? 'en' : 'ko';
    setLang(next);
    updateButtonLabel();
    filterListingPosts();
    updateListingCounts();
    updateArchiveVisibility();
    updatePaginator();
  }

  async function loadLangMap() {
    try {
      var base = getBaseUrl();
      var resp = await fetch(base + '/assets/js/data/lang-map.json');
      if (resp.ok) {
        langMap = await resp.json();
      }
    } catch (e) {
      // lang-map not available, toggle will just filter listings
    }
  }

  function init() {
    applyLangToRoot(getLang());
    updateButtonLabel();
    filterListingPosts();
    updateListingCounts();
    updateArchiveVisibility();
    updatePaginator();

    loadLangMap().then(function () {
      var toggle = document.getElementById('lang-toggle');
      if (toggle) {
        toggle.addEventListener('click', function () {
          var altDiv = document.getElementById('lang-alt');
          if (altDiv && altDiv.getAttribute('data-lang-ref')) {
            // On a post page with lang_ref
            if (!handlePostPageToggle()) {
              // No alternate version found, just toggle filter
              handleListingToggle();
            }
          } else {
            // On a listing page
            handleListingToggle();
          }
        });
      }
    });

    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY) {
        applyLangToRoot(getLang());
        updateButtonLabel();
        filterListingPosts();
        updateListingCounts();
        updateArchiveVisibility();
        updatePaginator();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
