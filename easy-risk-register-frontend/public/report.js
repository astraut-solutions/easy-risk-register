(function () {
  function getParamFromHash(name) {
    try {
      var hash = window.location.hash || '';
      var params = new URLSearchParams(hash.replace(/^#/, ''));
      return params.get(name) || '';
    } catch (_e) {
      return '';
    }
  }

  function getParam(name) {
    try {
      var search = new URLSearchParams(window.location.search || '');
      return search.get(name) || '';
    } catch (_e) {
      return '';
    }
  }

  var reportId = getParam('rid') || getParamFromHash('id');
  var title = getParam('title') || getParamFromHash('title');

  var frame = document.getElementById('reportFrame');
  var error = document.getElementById('error');
  var printBtn = document.getElementById('printBtn');

  if (title) {
    try { document.title = title; } catch (_e) {}
  }

  var storageKey = reportId ? 'easy-risk-register:report:' + reportId : '';
  var payload = '';
  try {
    if (storageKey) {
      payload = window.localStorage.getItem(storageKey) || '';
      if (payload) {
        window.localStorage.removeItem(storageKey);
      }
    }
  } catch (_e) {
    payload = '';
  }

  function setPayload(nextPayload) {
    payload = nextPayload || '';
    if (!payload) return false;
    if (error) error.hidden = true;
    if (frame) frame.style.display = 'block';
    if (frame) frame.srcdoc = payload;
    if (printBtn) printBtn.disabled = false;
    return true;
  }

  function attemptPrint() {
    try {
      if (!frame || !frame.contentWindow) return;
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch (_e) {
      // ignore
    }
  }

  if (printBtn) {
    printBtn.addEventListener('click', function (event) {
      event.preventDefault();
      attemptPrint();
    });
  }

  if (frame) {
    frame.addEventListener('load', function () {
      setTimeout(attemptPrint, 250);
    });
  }

  if (setPayload(payload)) {
    return;
  }

  // Fallback: receive payload via postMessage from the opener (same-origin only).
  function onMessage(event) {
    try {
      if (!event || event.origin !== window.location.origin) return;
      var data = event.data ? event.data : null;
      if (!data || data.type !== 'report_payload') return;
      if (reportId && data.id !== reportId) return;
      if (!reportId && data.id) reportId = data.id;
      setPayload(data.html || '');
    } catch (_e) {
      // ignore
    }
  }

  window.addEventListener('message', onMessage);

  // Ask opener (if present) for the payload.
  try {
    if (window.opener && typeof window.opener.postMessage === 'function') {
      window.opener.postMessage(
        { type: 'report_ready', id: reportId || '' },
        window.location.origin
      );
    }
  } catch (_e) {}

  // If we reach here, we didn't have the payload immediately. Wait briefly for it.
  if (printBtn) printBtn.disabled = true;

  var channel;
  try {
    channel = typeof window.BroadcastChannel === 'function'
      ? new window.BroadcastChannel('easy-risk-register:report')
      : null;
  } catch (_e) {
    channel = null;
  }

  var timeout = setTimeout(function () {
    try { if (channel) channel.close(); } catch (_e) {}
    if (error) error.hidden = false;
    if (frame) frame.style.display = 'none';
    if (printBtn) printBtn.disabled = true;
  }, 5000);

  if (channel) {
    channel.onmessage = function (event) {
      var data = event && event.data ? event.data : null;
      if (!data || data.type !== 'report_payload') return;
      if (reportId && data.id !== reportId) return;
      clearTimeout(timeout);
      try { channel.close(); } catch (_e) {}
      setPayload(data.html || '');
    };
  }
})();
