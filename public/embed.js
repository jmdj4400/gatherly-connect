/**
 * Gatherly Embeddable Widgets
 * Usage: <script src="https://gatherly.app/embed.js"></script>
 * 
 * Widget types:
 * - <gatherly-join event-id="uuid"></gatherly-join>
 * - <gatherly-countdown event-id="uuid"></gatherly-countdown>
 * - <gatherly-events org-handle="handle" limit="5"></gatherly-events>
 */

(function() {
  'use strict';

  const GATHERLY_BASE_URL = window.GATHERLY_BASE_URL || 'https://gatherly.app';
  const SUPABASE_URL = 'https://yuabwnhulzhnoyvnvqrw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YWJ3bmh1bHpobm95dm52cXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODA0ODQsImV4cCI6MjA4MDM1NjQ4NH0.9PgsvW3zJ6YBiMLzGVTe1XkiJNlXMvzxB-ZgAnIEUWI';

  // Rate limiting configuration
  const RATE_LIMIT = {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    requests: [],
  };

  // CORS allowlist - only allow from known origins
  const ALLOWED_ORIGINS = [
    'https://gatherly.app',
    'http://localhost:8080',
    'http://localhost:5173',
  ];

  // Check rate limit
  function checkRateLimit() {
    const now = Date.now();
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(t => now - t < RATE_LIMIT.windowMs);
    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
      return false;
    }
    RATE_LIMIT.requests.push(now);
    return true;
  }

  // Shared styles
  const sharedStyles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .gatherly-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --primary: #f97316;
      --primary-hover: #ea580c;
      --background: #ffffff;
      --foreground: #1a1a1a;
      --muted: #6b7280;
      --border: #e5e7eb;
      --radius: 12px;
    }
    .gatherly-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .gatherly-btn:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }
    .gatherly-btn svg {
      width: 20px;
      height: 20px;
    }
    .gatherly-btn.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }
    .gatherly-frozen-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(234, 88, 12, 0.1);
      color: var(--primary);
      font-size: 12px;
      font-weight: 500;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .gatherly-error {
      color: #ef4444;
      font-size: 12px;
      padding: 8px;
      text-align: center;
    }
  `;

  // Fetch event data from Supabase with rate limiting
  async function fetchEvent(eventId) {
    if (!checkRateLimit()) {
      console.warn('[Gatherly] Rate limit exceeded');
      return { error: 'rate_limit' };
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}&select=id,title,starts_at,freeze_hours_before`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      return data[0] || null;
    } catch (err) {
      console.error('[Gatherly] Fetch error:', err);
      return null;
    }
  }

  // Fetch events by org handle with rate limiting
  async function fetchOrgEvents(orgHandle, limit = 5) {
    if (!checkRateLimit()) {
      console.warn('[Gatherly] Rate limit exceeded');
      return [];
    }

    try {
      // First get org by handle
      const orgResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/orgs?org_handle=eq.${orgHandle}&select=id,name`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      const orgs = await orgResponse.json();
      if (!orgs[0]) return [];

      // Then get upcoming events
      const now = new Date().toISOString();
      const eventsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/events?host_org_id=eq.${orgs[0].id}&starts_at=gte.${now}&order=starts_at.asc&limit=${limit}&select=id,title,starts_at,venue_name,image_url,category,freeze_hours_before`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      return await eventsResponse.json();
    } catch (err) {
      console.error('[Gatherly] Fetch error:', err);
      return [];
    }
  }

  // Check if event is frozen
  function isEventFrozen(event) {
    if (!event || !event.starts_at) return false;
    const freezeHours = event.freeze_hours_before || 24;
    const startsAt = new Date(event.starts_at);
    const freezeTime = new Date(startsAt.getTime() - freezeHours * 60 * 60 * 1000);
    return new Date() >= freezeTime;
  }

  // Format date
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // Calculate countdown
  function getCountdown(dateStr) {
    const now = new Date();
    const target = new Date(dateStr);
    const diff = target - now;

    if (diff <= 0) return { expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  }

  // Users icon SVG
  const usersIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  const lockIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

  // ====== JOIN ALONE BUTTON WIDGET ======
  class GatherlyJoinWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
      const eventId = this.getAttribute('event-id');
      const buttonText = this.getAttribute('button-text') || 'Join Alone';
      const theme = this.getAttribute('theme') || 'light';

      if (!eventId) {
        this.shadowRoot.innerHTML = '<p class="gatherly-error">Missing event-id attribute</p>';
        return;
      }

      const event = await fetchEvent(eventId);
      if (event?.error === 'rate_limit') {
        this.shadowRoot.innerHTML = '<p class="gatherly-error">Too many requests. Please wait.</p>';
        return;
      }
      if (!event) {
        this.shadowRoot.innerHTML = '<p class="gatherly-error">Event not found</p>';
        return;
      }

      const frozen = isEventFrozen(event);
      const joinUrl = `${GATHERLY_BASE_URL}/event/${eventId}${frozen ? '' : '?autojoin=true'}`;

      this.shadowRoot.innerHTML = `
        <style>
          ${sharedStyles}
          ${theme === 'dark' ? `
            .gatherly-widget {
              --background: #1a1a1a;
              --foreground: #ffffff;
              --muted: #9ca3af;
              --border: #374151;
            }
          ` : ''}
        </style>
        <div class="gatherly-widget">
          ${frozen ? `
            <div class="gatherly-frozen-badge">${lockIcon} Groups Finalized</div>
          ` : ''}
          <a href="${joinUrl}" target="_blank" class="gatherly-btn ${frozen ? 'disabled' : ''}">
            ${usersIcon}
            ${frozen ? 'View Event' : buttonText}
          </a>
        </div>
      `;
    }
  }

  // ====== COUNTDOWN WIDGET ======
  class GatherlyCountdownWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.interval = null;
    }

    async connectedCallback() {
      const eventId = this.getAttribute('event-id');
      const theme = this.getAttribute('theme') || 'light';

      if (!eventId) {
        this.shadowRoot.innerHTML = '<p class="gatherly-error">Missing event-id attribute</p>';
        return;
      }

      const event = await fetchEvent(eventId);
      if (event?.error === 'rate_limit') {
        this.shadowRoot.innerHTML = '<p class="gatherly-error">Too many requests. Please wait.</p>';
        return;
      }
      if (!event) {
        this.shadowRoot.innerHTML = '<p class="gatherly-error">Event not found</p>';
        return;
      }

      this.event = event;
      this.theme = theme;
      this.render();
      this.interval = setInterval(() => this.render(), 1000);
    }

    disconnectedCallback() {
      if (this.interval) clearInterval(this.interval);
    }

    render() {
      const countdown = getCountdown(this.event.starts_at);
      const frozen = isEventFrozen(this.event);
      const joinUrl = `${GATHERLY_BASE_URL}/event/${this.event.id}${frozen ? '' : '?autojoin=true'}`;

      this.shadowRoot.innerHTML = `
        <style>
          ${sharedStyles}
          ${this.theme === 'dark' ? `
            .gatherly-widget {
              --background: #1a1a1a;
              --foreground: #ffffff;
              --muted: #9ca3af;
              --border: #374151;
            }
          ` : ''}
          .countdown-container {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 20px;
            text-align: center;
            min-width: 280px;
          }
          .event-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--foreground);
            margin-bottom: 16px;
          }
          .countdown-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          .countdown-item {
            background: rgba(249, 115, 22, 0.1);
            border-radius: 8px;
            padding: 12px 8px;
          }
          .countdown-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary);
          }
          .countdown-label {
            font-size: 11px;
            color: var(--muted);
            text-transform: uppercase;
          }
          .expired-text {
            color: var(--muted);
            font-size: 14px;
            margin-bottom: 12px;
          }
        </style>
        <div class="gatherly-widget">
          <div class="countdown-container">
            <div class="event-title">${this.event.title}</div>
            ${frozen ? `
              <div class="gatherly-frozen-badge" style="justify-content: center; margin: 0 auto 12px;">${lockIcon} Groups Finalized</div>
            ` : ''}
            ${countdown.expired ? `
              <p class="expired-text">Event has started!</p>
            ` : `
              <div class="countdown-grid">
                <div class="countdown-item">
                  <div class="countdown-value">${countdown.days}</div>
                  <div class="countdown-label">Days</div>
                </div>
                <div class="countdown-item">
                  <div class="countdown-value">${countdown.hours}</div>
                  <div class="countdown-label">Hours</div>
                </div>
                <div class="countdown-item">
                  <div class="countdown-value">${countdown.minutes}</div>
                  <div class="countdown-label">Min</div>
                </div>
                <div class="countdown-item">
                  <div class="countdown-value">${countdown.seconds}</div>
                  <div class="countdown-label">Sec</div>
                </div>
              </div>
            `}
            <a href="${joinUrl}" target="_blank" class="gatherly-btn ${frozen ? 'disabled' : ''}">
              ${usersIcon}
              ${frozen ? 'View Event' : 'Join Alone'}
            </a>
          </div>
        </div>
      `;
    }
  }

  // ====== RECURRING EVENTS STRIP WIDGET ======
  class GatherlyEventsWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
      const orgHandle = this.getAttribute('org-handle');
      const limit = parseInt(this.getAttribute('limit') || '5');
      const theme = this.getAttribute('theme') || 'light';

      if (!orgHandle) {
        this.shadowRoot.innerHTML = '<p class="gatherly-error">Missing org-handle attribute</p>';
        return;
      }

      const events = await fetchOrgEvents(orgHandle, limit);

      this.shadowRoot.innerHTML = `
        <style>
          ${sharedStyles}
          ${theme === 'dark' ? `
            .gatherly-widget {
              --background: #1a1a1a;
              --foreground: #ffffff;
              --muted: #9ca3af;
              --border: #374151;
            }
          ` : ''}
          .events-strip {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 4px;
            scrollbar-width: thin;
          }
          .events-strip::-webkit-scrollbar {
            height: 6px;
          }
          .events-strip::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
          }
          .event-card {
            flex: 0 0 220px;
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .event-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .event-card.frozen {
            opacity: 0.7;
          }
          .event-image {
            width: 100%;
            height: 100px;
            object-fit: cover;
            background: linear-gradient(135deg, var(--primary), #fed7aa);
          }
          .event-content {
            padding: 12px;
          }
          .event-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--foreground);
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .event-date {
            font-size: 12px;
            color: var(--muted);
          }
          .event-badge {
            display: inline-block;
            padding: 2px 8px;
            background: rgba(249, 115, 22, 0.1);
            color: var(--primary);
            font-size: 10px;
            font-weight: 500;
            border-radius: 4px;
            margin-top: 8px;
          }
          .event-badge.frozen {
            background: rgba(100, 100, 100, 0.1);
            color: var(--muted);
          }
          .empty-state {
            text-align: center;
            padding: 24px;
            color: var(--muted);
          }
        </style>
        <div class="gatherly-widget">
          ${events.length === 0 ? `
            <div class="empty-state">No upcoming events</div>
          ` : `
            <div class="events-strip">
              ${events.map(event => {
                const frozen = isEventFrozen(event);
                return `
                <a href="${GATHERLY_BASE_URL}/event/${event.id}${frozen ? '' : '?autojoin=true'}" target="_blank" class="event-card ${frozen ? 'frozen' : ''}">
                  ${event.image_url ? `
                    <img src="${event.image_url}" alt="${event.title}" class="event-image" />
                  ` : `
                    <div class="event-image"></div>
                  `}
                  <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${formatDate(event.starts_at)}</div>
                    ${frozen ? `<span class="event-badge frozen">${lockIcon} Groups Locked</span>` :
                      event.category ? `<span class="event-badge">${event.category}</span>` : ''}
                  </div>
                </a>
              `}).join('')}
            </div>
          `}
        </div>
      `;
    }
  }

  // Register custom elements
  if (!customElements.get('gatherly-join')) {
    customElements.define('gatherly-join', GatherlyJoinWidget);
  }
  if (!customElements.get('gatherly-countdown')) {
    customElements.define('gatherly-countdown', GatherlyCountdownWidget);
  }
  if (!customElements.get('gatherly-events')) {
    customElements.define('gatherly-events', GatherlyEventsWidget);
  }

  console.log('[Gatherly] Widgets loaded successfully');
})();