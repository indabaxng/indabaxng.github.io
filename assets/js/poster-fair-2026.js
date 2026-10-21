/* IndabaX Nigeria Poster Fair 2026: countdown, programme tabs and X timeline fallback. */
(function () {
    'use strict';

    /* Countdown */
    var countdown = document.querySelector('.pf-countdown');
    if (countdown) {
        var start = new Date(countdown.getAttribute('data-start')).getTime();
        var end = new Date(countdown.getAttribute('data-end')).getTime();
        var label = countdown.querySelector('.pf-countdown__text');
        var units = {};
        ['days', 'hours', 'mins', 'secs'].forEach(function (unit) {
            units[unit] = countdown.querySelector('[data-unit="' + unit + '"]');
        });
        var pad = function (value) { return value < 10 ? '0' + value : String(value); };
        var timer;

        var tick = function () {
            var now = Date.now();
            var target;
            countdown.classList.remove('is-live', 'is-over');

            if (now < start) {
                label.textContent = 'The fair opens in';
                target = start;
            } else if (now < end) {
                countdown.classList.add('is-live');
                label.textContent = 'Live now · closes in';
                target = end;
            } else {
                countdown.classList.add('is-over');
                label.textContent = 'Thank you for joining us';
                Object.keys(units).forEach(function (unit) {
                    units[unit].textContent = '00';
                });
                clearInterval(timer);
                return;
            }

            var difference = Math.max(0, Math.floor((target - now) / 1000));
            units.days.textContent = pad(Math.floor(difference / 86400));
            units.hours.textContent = pad(Math.floor((difference % 86400) / 3600));
            units.mins.textContent = pad(Math.floor((difference % 3600) / 60));
            units.secs.textContent = pad(difference % 60);
        };

        tick();
        timer = setInterval(tick, 1000);
    }

    /* Accessible programme tabs */
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.pf-tab'));
    if (tabs.length) {
        var selectTab = function (selectedTab, moveFocus) {
            tabs.forEach(function (tab) {
                var isSelected = tab === selectedTab;
                tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                tab.setAttribute('tabindex', isSelected ? '0' : '-1');
                var panel = document.getElementById(tab.getAttribute('aria-controls'));
                if (panel) panel.hidden = !isSelected;
            });
            if (moveFocus) selectedTab.focus();
        };

        tabs.forEach(function (tab, index) {
            tab.addEventListener('click', function () { selectTab(tab, false); });
            tab.addEventListener('keydown', function (event) {
                var nextTab = null;
                if (event.key === 'ArrowRight') nextTab = tabs[(index + 1) % tabs.length];
                if (event.key === 'ArrowLeft') nextTab = tabs[(index - 1 + tabs.length) % tabs.length];
                if (event.key === 'Home') nextTab = tabs[0];
                if (event.key === 'End') nextTab = tabs[tabs.length - 1];
                if (nextTab) {
                    event.preventDefault();
                    selectTab(nextTab, true);
                }
            });
        });

        var today = new Date();
        var dateKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        tabs.forEach(function (tab) {
            if (tab.getAttribute('data-date') === dateKey) selectTab(tab, false);
        });
    }

    /* X timeline: provide a visible fallback if the embed cannot render. */
    var feed = document.querySelector('.pf-feed');
    if (feed) {
        var feedBody = feed.querySelector('.pf-feed__body');
        if (feedBody) {
            var showFallback = function () {
                if (!feed.classList.contains('is-loaded')) feed.classList.add('is-fallback');
            };
            var markLoaded = function () {
                feed.classList.remove('is-fallback');
                feed.classList.add('is-loaded');
            };

            if ('MutationObserver' in window) {
                new MutationObserver(function () {
                    var frame = feedBody.querySelector('iframe[id^="twitter-widget"]');
                    if (frame && frame.offsetHeight > 120) markLoaded();
                }).observe(feedBody, { childList: true, subtree: true, attributes: true });
            }

            var fallbackTimer = setTimeout(showFallback, 8000);
            var script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            script.onerror = function () {
                clearTimeout(fallbackTimer);
                showFallback();
            };
            script.onload = function () {
                if (window.twttr && window.twttr.events) {
                    window.twttr.events.bind('rendered', function (event) {
                        if (event && event.target && event.target.offsetHeight > 120) markLoaded();
                    });
                }
            };
            document.body.appendChild(script);
        }
    }
})();
