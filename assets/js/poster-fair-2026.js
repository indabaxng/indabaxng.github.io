/* IndabaX Nigeria Poster Fair 2026: navigation, countdown, programme tabs, X feed and reveal-on-scroll. */
(function () {
    'use strict';

    var $ = function (selector, root) { return (root || document).querySelector(selector); };
    var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var today = (function () {
        try {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date());
        } catch (error) {
            var now = new Date();
            return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        }
    })();

    /* Navigation: solid bar after scrolling, mobile menu toggle */
    var nav = $('.pf-nav');
    var navToggle = $('.pf-nav__toggle');
    if (nav) {
        var onScroll = function () { nav.classList.toggle('is-scrolled', window.pageYOffset > 40); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
    if (nav && navToggle) {
        var setMenu = function (open) {
            nav.classList.toggle('is-open', open);
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        navToggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
        $$('.pf-nav__links a').forEach(function (link) { link.addEventListener('click', function () { setMenu(false); }); });
        document.addEventListener('keydown', function (event) { if (event.key === 'Escape') setMenu(false); });
    }

    /* Countdown */
    var countdown = $('.pf-countdown');
    if (countdown) {
        var start = new Date(countdown.getAttribute('data-start')).getTime();
        var end = new Date(countdown.getAttribute('data-end')).getTime();
        var countdownText = $('.pf-countdown__text', countdown);
        var units = {};
        ['days', 'hours', 'mins', 'secs'].forEach(function (unit) {
            units[unit] = $('[data-unit="' + unit + '"]', countdown);
        });
        var pad = function (number) { return number < 10 ? '0' + number : String(number); };
        var timer;
        var tick = function () {
            var now = Date.now();
            var target;
            countdown.classList.remove('is-live', 'is-over');
            if (now < start) {
                countdownText.textContent = 'The fair opens in';
                target = start;
            } else if (now < end) {
                countdown.classList.add('is-live');
                countdownText.textContent = 'Live now · closes in';
                target = end;
            } else {
                countdown.classList.add('is-over');
                countdownText.textContent = 'Thank you for joining us';
                Object.keys(units).forEach(function (unit) { if (units[unit]) units[unit].textContent = '00'; });
                clearInterval(timer);
                return;
            }
            var difference = Math.max(0, Math.floor((target - now) / 1000));
            if (units.days) units.days.textContent = pad(Math.floor(difference / 86400));
            if (units.hours) units.hours.textContent = pad(Math.floor((difference % 86400) / 3600));
            if (units.mins) units.mins.textContent = pad(Math.floor((difference % 3600) / 60));
            if (units.secs) units.secs.textContent = pad(difference % 60);
        };
        if (Number.isFinite(start) && Number.isFinite(end) && countdownText) {
            tick();
            timer = setInterval(tick, 1000);
        }
    }

    /* Programme tabs */
    var tabs = $$('.pf-tab');
    if (tabs.length) {
        var selectTab = function (selectedTab, focus) {
            tabs.forEach(function (tab) {
                var active = tab === selectedTab;
                tab.setAttribute('aria-selected', active ? 'true' : 'false');
                tab.setAttribute('tabindex', active ? '0' : '-1');
                var panel = document.getElementById(tab.getAttribute('aria-controls'));
                if (panel) panel.hidden = !active;
            });
            if (focus) selectedTab.focus();
        };
        tabs.forEach(function (tab, index) {
            tab.addEventListener('click', function () { selectTab(tab, false); });
            tab.addEventListener('keydown', function (event) {
                var next = null;
                if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
                if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
                if (event.key === 'Home') next = tabs[0];
                if (event.key === 'End') next = tabs[tabs.length - 1];
                if (next) { event.preventDefault(); selectTab(next, true); }
            });
            if (tab.getAttribute('data-date') === today) {
                selectTab(tab, false);
                tab.classList.add('is-today');
            }
        });
    }

    /* X timeline. It only renders for visitors signed in to X, so everyone else gets the featured posts. */
    var feed = $('.pf-feed');
    if (feed) {
        var feedBody = $('.pf-feed__body', feed);
        var featured = $('[data-featured-posts]', feed);
        var renderFeatured = function () {
            if (!featured || !feed.classList.contains('is-fallback') || !window.twttr || !window.twttr.widgets) return;
            var pending = $$('.pf-tweet', featured);
            if (!pending.length) return;
            pending.forEach(function (post) { post.classList.remove('pf-tweet'); post.classList.add('twitter-tweet'); });
            window.twttr.widgets.load(featured);
        };
        var showFallback = function () {
            if (feed.classList.contains('is-loaded')) return;
            feed.classList.add('is-fallback');
            renderFeatured();
        };
        var markLoaded = function () { clearTimeout(fallbackTimer); feed.classList.remove('is-fallback'); feed.classList.add('is-loaded'); };
        if (feedBody && 'MutationObserver' in window) {
            new MutationObserver(function () {
                var frame = $('iframe[id^="twitter-widget"]', feedBody);
                if (frame && frame.offsetHeight > 120) markLoaded();
            }).observe(feedBody, { childList: true, subtree: true, attributes: true });
        }
        var fallbackTimer = setTimeout(showFallback, 5000);
        var widgetScript = document.createElement('script');
        widgetScript.src = 'https://platform.twitter.com/widgets.js';
        widgetScript.async = true;
        widgetScript.charset = 'utf-8';
        widgetScript.onerror = function () { clearTimeout(fallbackTimer); showFallback(); };
        widgetScript.onload = function () {
            if (window.twttr && window.twttr.ready) {
                window.twttr.ready(function (twttr) {
                    twttr.events.bind('rendered', function (event) {
                        if (event && event.target && feedBody && feedBody.contains(event.target) && event.target.offsetHeight > 120) markLoaded();
                    });
                    renderFeatured();
                });
            }
        };
        document.body.appendChild(widgetScript);
    }

    /* Copy hashtag */
    $$('[data-copy]').forEach(function (button) {
        button.addEventListener('click', function () {
            var text = button.getAttribute('data-copy');
            var label = $('[data-copy-label]', button);
            var done = function () {
                if (!label) return;
                var original = label.textContent;
                label.textContent = 'Copied!';
                setTimeout(function () { label.textContent = original; }, 1800);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
        });
    });

    /* Reveal sections as they scroll into view */
    var revealables = $$('[data-reveal]');
    if (revealables.length && !reduceMotion && 'IntersectionObserver' in window) {
        document.documentElement.classList.add('pf-js-reveal');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        revealables.forEach(function (element) { observer.observe(element); });
    }

    /* Back to top */
    var backToTop = $('.pf-top');
    if (backToTop) {
        window.addEventListener('scroll', function () { backToTop.classList.toggle('is-visible', window.pageYOffset > 600); }, { passive: true });
        backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
    }
})();
