// Pawsitive - GPS walk hub
// Personal GPS walks stay independent, while matched walks surface here as live sessions.

const WALK_TRACK_ACTIVE_STATUSES = ['accepted', 'heading', 'arrived', 'handoff', 'walking', 'returning', 'return_arrived'];

let _trackingMap = null;
let _trackingPolyline = null;
let _trackingTimer = null;
let _trackingMarker = null;
let _trackingStartMarker = null;
let _walkHistoryCache = [];
let _walkCalYear = new Date().getFullYear();
let _walkCalMonth = new Date().getMonth();
let _walkCalSelectedDate = null;
let _walkRouteMaps = {};

async function renderWalkTrackingPage() {
  const user = AuthService.getCurrentUser();
  if (!user) {
    renderWalkTrackingGuest();
    return;
  }

  renderPage(`
    <div style="padding:80px 20px;text-align:center;">
      <div class="spinner"></div>
      <p style="margin-top:14px;color:var(--color-text-muted);font-weight:700;">GPS 산책 허브를 준비하고 있어요...</p>
    </div>
  `);

  const profile = MatchingService.getMyProfile(user.id);
  const activeMatch = await fetchActiveMatchedWalk(user.id);
  const dogs = user.dogs || [];
  const selectedIdx = StorageService.get('walkingDogIdx', 0);
  const dog = dogs.length > 0 ? dogs[Math.min(selectedIdx, dogs.length - 1)] : null;
  const dogFilter = dog ? (dog.id || dog.name) : null;
  const isTracking = GPSTrackingService.isActive();
  let hubStats = null;
  try {
    hubStats = await GPSTrackingService.getWalkStats(user.id, dogFilter, { role: profile?.role });
  } catch (e) {}

  renderPage(`
  <style>
    .gps-page {
      max-width:1120px;
      margin:0 auto;
      padding:30px 18px 56px;
      color:#0B1220;
      --gps-ink:#0B1220;
      --gps-muted:#64748B;
      --gps-soft:#F6F8FB;
      --gps-line:#DDE6F0;
      --gps-blue:#2563EB;
      --gps-teal:#0F766E;
      --gps-orange:#F97316;
    }
    .gps-hero { position:relative; overflow:hidden; min-height:280px; display:flex; justify-content:space-between; align-items:flex-end; gap:22px; padding:38px 32px 34px; margin:0 0 18px; border:1px solid rgba(221,230,240,.95); border-radius:8px; background-image:linear-gradient(90deg, rgba(255,255,255,.97) 0%, rgba(255,255,255,.9) 44%, rgba(255,255,255,.48) 66%, rgba(255,255,255,.08) 100%), url('/images/generated/walk-gps-tracking-run.png'); background-size:cover, cover; background-position:center, 70% center; background-repeat:no-repeat; box-shadow:0 18px 44px rgba(15,23,42,.065); }
    .gps-hero > * { position:relative; z-index:1; }
    .gps-hero > div:first-child { max-width:700px; }
    .gps-hero__eyebrow { display:inline-flex; align-items:center; gap:7px; padding:6px 11px; border:1px solid rgba(37,99,235,.16); border-radius:999px; background:#F5FBFF; color:#175CD3; font-size:0.72rem; font-weight:900; margin-bottom:14px; box-shadow:0 8px 18px rgba(37,99,235,.06); }
    .gps-hero__title { font-size:2.08rem; line-height:1.18; font-weight:950; letter-spacing:0; color:var(--gps-ink); margin:0 0 10px; max-width:680px; }
    .gps-hero__sub { font-size:0.94rem; line-height:1.68; color:var(--gps-muted); margin:0; max-width:690px; }
    .gps-hero__aside { min-width:204px; padding:13px 14px; display:grid; grid-template-columns:36px minmax(0,1fr); align-items:center; gap:11px; border:1px solid #DDE6F0; border-radius:8px; background:rgba(255,255,255,.92); box-shadow:0 14px 34px rgba(15,23,42,.065); backdrop-filter:blur(10px); }
    .gps-hero__aside-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#F1F5F9; color:#2563EB; }
    .gps-hero__aside-label { display:flex; align-items:center; gap:7px; font-size:.67rem; color:#8290A3; font-weight:900; text-transform:uppercase; }
    .gps-hero__aside-value { margin-top:5px; color:var(--gps-ink); font-size:1.02rem; font-weight:950; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .gps-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:0 0 16px; }
    .gps-summary-card { position:relative; overflow:hidden; min-height:102px; background:#fff; border:1px solid var(--gps-line); border-radius:8px; padding:16px 15px 14px; box-shadow:0 12px 30px rgba(15,23,42,.055); }
    .gps-summary-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:#2563EB; }
    .gps-summary-card:nth-child(2)::before { background:#F97316; }
    .gps-summary-card:nth-child(3)::before { background:#0F766E; }
    .gps-summary-card:nth-child(4)::before { background:#111827; }
    .gps-summary-card__label { display:flex; align-items:center; gap:7px; color:#52637A; font-size:.72rem; font-weight:900; margin-bottom:10px; }
    .gps-summary-card__value { color:var(--gps-ink); font-size:1.38rem; line-height:1.08; font-weight:950; letter-spacing:0; }
    .gps-summary-card__hint { margin-top:7px; color:#8290A3; font-size:.7rem; font-weight:750; }
    .gps-workspace { display:grid; grid-template-columns:minmax(0,1.52fr) minmax(304px,.72fr); align-items:start; gap:16px; }
    .gps-main-col, .gps-side-col { min-width:0; }
    .gps-side-col { position:sticky; top:78px; }
    .gps-panel { background:#fff; border:1px solid var(--gps-line); border-radius:8px; margin-bottom:16px; overflow:hidden; box-shadow:0 18px 44px rgba(15,23,42,.065); }
    .gps-panel__body { padding:20px; }
    .gps-panel--tracker { border-color:#CAD8E7; box-shadow:0 24px 54px rgba(15,23,42,.085); }
    .gps-panel--tracker .gps-panel__body { padding:22px 22px 16px; }
    .gps-panel--match { border-left:3px solid var(--gps-blue); }
    .gps-insight { border-left:3px solid var(--gps-teal); }
    .gps-panel__head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px; }
    .gps-panel__head-main { min-width:0; }
    .gps-panel__head-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; flex-shrink:0; }
    .gps-panel__title { font-size:1.04rem; font-weight:950; color:var(--gps-ink); margin:0 0 5px; letter-spacing:0; }
    .gps-panel--tracker .gps-panel__title { font-size:1.16rem; }
    .gps-panel__desc { font-size:0.82rem; color:var(--gps-muted); line-height:1.62; margin:0; }
    .gps-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:0.72rem; font-weight:900; white-space:nowrap; }
    .gps-badge--live { background:#E8F8EF; color:#047857; }
    .gps-badge--idle { background:#F1F5F9; color:#52637A; }
    .gps-badge--match { background:#FFF7ED; color:#C2410C; }
    .gps-dot { width:7px; height:7px; border-radius:50%; background:currentColor; }
    .gps-dot--pulse { animation:gpsDotPulse 1.4s ease-in-out infinite; }
    @keyframes gpsDotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.45)} }
    .gps-match-grid { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid #EEF2F7; border-bottom:1px solid #EEF2F7; margin:16px -20px 18px; background:#F8FAFC; }
    .gps-match-cell { padding:13px 17px; border-right:1px solid #EEF2F7; min-width:0; }
    .gps-match-cell:last-child { border-right:0; }
    .gps-match-cell__key { font-size:0.68rem; color:#8290A3; font-weight:800; margin-bottom:5px; }
    .gps-match-cell__val { font-size:0.88rem; color:var(--gps-ink); font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .gps-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .gps-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:none; border-radius:8px; padding:12px 15px; font-size:0.84rem; font-weight:950; cursor:pointer; transition:transform .15s, box-shadow .15s, opacity .15s, background .15s; }
    .gps-btn:hover { transform:translateY(-1px); }
    .gps-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
    .gps-btn--primary { background:#0B1220; color:#fff; box-shadow:0 10px 24px rgba(15,23,42,.16); }
    .gps-btn--blue { background:var(--gps-blue); color:#fff; box-shadow:0 10px 24px rgba(37,99,235,.18); }
    .gps-btn--soft { background:#F8FAFC; color:#334155; border:1px solid #E2E8F0; }
    .gps-mini-action { height:34px; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:0 13px; border:none; border-radius:999px; font-size:.75rem; font-weight:950; cursor:pointer; white-space:nowrap; }
    .gps-mini-action:disabled { opacity:.45; cursor:not-allowed; }
    .gps-mini-action--primary { background:#0B1220; color:#fff; box-shadow:0 10px 22px rgba(15,23,42,.16); }
    .gps-mini-action--danger { background:#EF4444; color:#fff; box-shadow:0 10px 22px rgba(239,68,68,.18); }
    .gps-side-col .gps-actions { flex-direction:column; }
    .gps-side-col .gps-btn { width:100%; }
    .gps-dog-row { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 18px; }
    .gps-dog-chip { padding:8px 14px; border:1px solid #DDE6F0; border-radius:999px; background:#fff; color:#475569; font-size:0.8rem; font-weight:900; cursor:pointer; }
    .gps-dog-chip.active { background:#0B1220; border-color:#0B1220; color:#fff; }
    .gps-map-wrap { position:relative; margin:0 22px; border:1px solid #CBD5E1; border-radius:8px; overflow:hidden; background:#F8FAFC; box-shadow:inset 0 0 0 1px rgba(255,255,255,.7); }
    .gps-map { height:430px; width:100%; background:#F8FAFC; }
    .gps-map-overlay { position:absolute; inset:0; z-index:2; display:flex; align-items:center; justify-content:center; padding:20px; text-align:center; background:rgba(255,255,255,.82); color:#475569; font-size:0.86rem; font-weight:900; pointer-events:none; backdrop-filter:blur(4px); }
    .gps-map-legend { position:absolute; top:12px; right:12px; z-index:3; display:flex; gap:6px; align-items:center; flex-wrap:wrap; max-width:calc(100% - 74px); pointer-events:none; }
    .gps-map-legend__item { display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 9px; border-radius:999px; background:rgba(255,255,255,.92); border:1px solid rgba(203,213,225,.82); color:#334155; font-size:.68rem; font-weight:900; box-shadow:0 6px 14px rgba(15,23,42,.08); }
    .gps-map-legend__dot { width:9px; height:9px; border-radius:50%; background:#F59E0B; box-shadow:0 0 0 2px #fff; }
    .gps-map-legend__line { width:18px; height:3px; border-radius:999px; background:#F59E0B; }
    .gps-stats { display:grid; grid-template-columns:repeat(4,1fr); margin:16px 22px 0; border:1px solid #EEF2F7; border-radius:8px; overflow:hidden; background:#fff; }
    .gps-stat { padding:16px 12px; text-align:center; border-right:1px solid #EEF2F7; }
    .gps-stat:last-child { border-right:0; }
    .gps-stat__val { font-size:1.18rem; color:var(--gps-ink); font-weight:950; line-height:1.1; }
    .gps-stat__unit { font-size:0.66rem; color:#94A3B8; margin-left:2px; }
    .gps-stat__key { font-size:0.68rem; color:#94A3B8; margin-top:4px; font-weight:700; }
    .gps-control { margin:0 22px 22px; padding:16px 0 0; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:12px; text-align:left; border-top:1px solid #EEF2F7; }
    .gps-control > br { display:none; }
    .gps-status { display:inline-flex; width:max-content; align-items:center; gap:7px; padding:7px 12px; border-radius:999px; background:#F1F5F9; color:#52637A; font-size:0.75rem; font-weight:900; margin-bottom:6px; }
    .gps-status--active { background:#DCFCE7; color:#047857; }
    .gps-stop { min-width:126px; height:50px; border-radius:8px; background:#EF4444; color:#fff; border:none; font-size:.92rem; font-weight:950; cursor:pointer; box-shadow:0 12px 28px rgba(239,68,68,.22); }
    .gps-start { min-width:126px; height:50px; border-radius:8px; background:#0B1220; color:#fff; border:none; font-size:.92rem; font-weight:950; cursor:pointer; box-shadow:0 12px 28px rgba(15,23,42,.24); }
    .gps-hint { grid-column:1 / -1; margin-top:-4px; font-size:0.76rem; color:#94A3B8; }
    .gps-complete { grid-column:1 / -1; padding:18px; text-align:center; background:#F8FAFC; border:1px solid #EEF2F7; border-radius:8px; }
    .gps-insight__metric { display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:13px 0; border-top:1px solid #EEF2F7; }
    .gps-insight__metric:first-of-type { border-top:0; }
    .gps-insight__key { color:#64748B; font-size:.76rem; font-weight:800; }
    .gps-insight__val { color:#0F172A; font-size:.95rem; font-weight:900; }
    .gps-health-brief { margin:15px 0 4px; padding:14px; border:1px solid #DDECE8; border-radius:8px; background:#F7FCFA; }
    .gps-health-brief__top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
    .gps-health-brief__label { color:#0F766E; font-size:.72rem; font-weight:950; }
    .gps-health-brief__score { color:#0B1220; font-size:.9rem; font-weight:950; }
    .gps-health-bars { display:grid; gap:7px; }
    .gps-health-bar { height:7px; overflow:hidden; border-radius:999px; background:#E2E8F0; }
    .gps-health-bar span { display:block; height:100%; border-radius:999px; background:#0F766E; }
    .gps-health-bar:nth-child(2) span { background:#2563EB; }
    .gps-health-bar:nth-child(3) span { background:#F97316; }
    .walk-history-visual { height:clamp(210px, 26vw, 270px); margin:0 0 20px; border:1px solid #E2E8F0; border-radius:8px; background-color:#F8FAF7; background-image:linear-gradient(90deg, rgba(255,255,255,.34), rgba(255,255,255,.02)), url('/images/generated/walk-gps-tracking-run.png'); background-size:cover, cover; background-position:center, 70% center; background-repeat:no-repeat; box-shadow:inset 0 0 0 1px rgba(255,255,255,.58); }
    .walk-cal { margin-bottom:18px; }
    .walk-cal__header { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px; }
    .walk-cal__nav { display:flex; align-items:center; gap:8px; }
    .walk-cal__nav-btn { width:30px; height:30px; border-radius:8px; border:1px solid #E2E8F0; background:#fff; color:#475569; cursor:pointer; font-weight:800; }
    .walk-cal__month { min-width:104px; text-align:center; font-size:0.9rem; font-weight:900; color:var(--gps-ink); }
    .walk-cal__summary { font-size:0.76rem; color:#64748B; font-weight:700; }
    .walk-cal__days, .walk-cal__grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
    .walk-cal__day-label { text-align:center; font-size:0.66rem; color:#94A3B8; font-weight:800; padding:4px 0; }
    .walk-cal__cell { position:relative; aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:0.74rem; color:#64748B; cursor:pointer; }
    .walk-cal__cell:hover { background:#F1F5F9; }
    .walk-cal__cell--empty { cursor:default; }
    .walk-cal__cell--empty:hover { background:transparent; }
    .walk-cal__cell--today { border:1px solid #0B1220; color:#0B1220; font-weight:900; }
    .walk-cal__cell--active { background:#0B1220; color:#fff; font-weight:900; }
    .walk-cal__cell--selected { box-shadow:0 0 0 2px var(--gps-blue); }
    .walk-cal__count { position:absolute; top:2px; right:2px; width:13px; height:13px; border-radius:50%; background:var(--gps-orange); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.52rem; }
    .walk-history-title { margin:0 0 12px; font-size:0.82rem; color:#64748B; font-weight:900; }
    .walk-history-item { display:grid; grid-template-columns:1fr auto; gap:12px; padding:14px 0; border-top:1px solid #EEF2F7; }
    .walk-history-item:first-of-type { border-top:0; }
    .walk-history-item__date { font-size:0.86rem; color:var(--gps-ink); font-weight:900; }
    .walk-history-item__dog { margin-top:3px; font-size:0.76rem; color:#64748B; }
    .walk-history-item__stats { text-align:right; }
    .walk-history-item__dist { font-size:0.98rem; font-weight:900; color:var(--gps-ink); }
    .walk-history-item__meta { margin-top:3px; font-size:0.72rem; color:#94A3B8; }
    .walk-history-actions { display:flex; gap:6px; justify-content:flex-end; margin-top:6px; }
    .walk-history-actions button { border:none; background:none; font-size:0.72rem; font-weight:800; color:#64748B; cursor:pointer; padding:3px 4px; }
    .walk-history-actions button.danger { color:#EF4444; }
    .walk-route-mini { grid-column:1 / -1; height:168px; border:1px solid #DDE6F0; border-radius:8px; overflow:hidden; }
    .walk-source-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 7px; border-radius:999px; font-size:0.65rem; font-weight:900; margin-left:6px; vertical-align:middle; }
    .walk-source-badge--matched { background:#FFF7ED; color:#C2410C; }
    .walk-source-badge--personal { background:#EFF6FF; color:#2563EB; }
    @media (max-width:860px) {
      .gps-workspace { grid-template-columns:1fr; }
      .gps-side-col { position:static; }
      .gps-summary { grid-template-columns:repeat(2,1fr); }
    }
    @media (max-width:640px) {
      .gps-page { padding:18px 14px 40px; }
      .gps-hero { display:block; min-height:250px; padding:28px 20px; background-image:linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.9) 58%, rgba(255,255,255,.52) 100%), url('/images/generated/walk-gps-tracking-run.png'); background-position:center, 68% center; }
      .walk-history-visual { height:190px; background-size:cover, cover; background-position:center, center; }
      .gps-hero__aside { margin-top:14px; }
      .gps-hero__title { font-size:1.62rem; }
      .gps-hero__sub { font-size:0.86rem; }
      .gps-match-grid, .gps-stats { grid-template-columns:repeat(2,1fr); }
      .gps-match-cell:nth-child(2), .gps-stat:nth-child(2) { border-right:0; }
      .gps-panel__head { flex-direction:column; }
      .gps-panel__head-actions { width:100%; justify-content:space-between; }
      .gps-actions { flex-direction:column; }
      .gps-btn { width:100%; }
      .gps-map-wrap, .gps-stats, .gps-control { margin-left:14px; margin-right:14px; }
      .gps-map { height:340px; }
      .gps-map-legend { top:10px; right:10px; max-width:calc(100% - 62px); }
      .gps-map-legend__item { height:26px; padding:0 8px; font-size:.64rem; }
      .gps-control { grid-template-columns:1fr; text-align:center; }
      .gps-status { margin:0 auto 4px; }
      .gps-start, .gps-stop { width:100%; }
    }
  </style>

  <div class="gps-page">
    <section class="gps-hero">
      <div>
        <div class="gps-hero__eyebrow">${icon('navigation', 13, '#0369A1')} GPS 산책 트래킹</div>
        <h1 class="gps-hero__title">직접 산책도, 매칭 산책도<br>한 곳에서 관리해요</h1>
        <p class="gps-hero__sub">개인 산책은 바로 기록하고, 매칭 산책은 실시간 세션으로 연결됩니다. 완료된 매칭 산책은 건강 데이터에도 함께 쌓입니다.</p>
      </div>
      <div class="gps-hero__aside">
        <div class="gps-hero__aside-icon">${icon('paw-print', 17, '#2563EB')}</div>
        <div>
          <div class="gps-hero__aside-label">선택된 반려견</div>
          <div class="gps-hero__aside-value">${dog ? escapeWalkHtml(dog.name || '반려견') : '등록 대기'}</div>
        </div>
      </div>
    </section>

    ${renderGpsSummary(hubStats, dog, activeMatch, isTracking)}

    <div class="gps-workspace">
      <div class="gps-main-col">
        ${renderPersonalWalkPanel({ dogs, dog, selectedIdx, isTracking })}

        <section class="gps-panel gps-panel--history">
          <div class="gps-panel__body">
            <div class="gps-panel__head">
              <div>
                <h2 class="gps-panel__title">산책 기록</h2>
                <p class="gps-panel__desc">직접 산책과 도우미 매칭 산책을 함께 확인할 수 있어요.</p>
              </div>
            </div>
            <div class="walk-history-visual" aria-hidden="true"></div>
            <div id="walk-history-section">
              <div style="padding:22px;text-align:center;"><div class="spinner"></div></div>
            </div>
          </div>
        </section>
      </div>
      <div class="gps-side-col">
        ${renderMatchedWalkPanel(activeMatch)}
        ${renderGpsHealthPanel(hubStats)}
      </div>
    </div>
  </div>
  `);

  setTimeout(() => initTrackingMap(isTracking ? GPSTrackingService.getCurrentData() : null), 80);
  loadWalkHistory(user.id, dogFilter, profile?.role);
  if (isTracking) paintActiveTrackingState(GPSTrackingService.getCurrentData());
}

function renderWalkTrackingGuest() {
  renderPage(`
  <div class="gps-page" style="max-width:640px;margin:0 auto;">
    <div style="padding:52px 0 24px;text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:12px;">${icon('navigation', 38, '#0284c7')}</div>
      <h1 style="font-size:1.65rem;font-weight:900;margin-bottom:8px;">GPS 산책 트래킹</h1>
      <p style="font-size:0.9rem;color:var(--color-text-muted);line-height:1.6;">로그인하면 직접 산책 기록과 매칭 산책 기록을 한 곳에서 관리할 수 있어요.</p>
    </div>
    <div class="card" style="padding:22px;text-align:center;">
      <div style="height:260px;border-radius:8px;background-image:linear-gradient(90deg,rgba(255,255,255,.9),rgba(255,255,255,.18)),url('/images/generated/walk-gps-tracking-run.png');background-size:cover,cover;background-position:center,70% center;display:flex;align-items:center;justify-content:center;color:#334155;font-weight:900;margin-bottom:18px;border:1px solid #E2E8F0;">산책 경로 미리보기</div>
      <button class="btn btn-primary" style="width:100%;padding:14px;" onclick="showLoginModal('GPS 산책 트래킹을 시작하려면 로그인이 필요해요!\\n산책 경로, 거리, 시간, 칼로리를 기록할 수 있어요.')">로그인하고 시작하기</button>
    </div>
  </div>
  `);
}

function renderGpsSummary(stats, dog, activeMatch, isTracking) {
  const weekly = stats?.weekly || {};
  const total = stats?.total || {};
  const liveLabel = isTracking
    ? '직접 산책 기록 중'
    : activeMatch
      ? getMatchStatusLabel(activeMatch.session?.status || activeMatch.request?.status)
      : '산책 준비 완료';
  const dogLabel = dog ? (dog.name || '반려견') : '반려견 미등록';

  return `
  <section class="gps-summary" aria-label="산책 요약">
    <div class="gps-summary-card">
      <div class="gps-summary-card__label">${icon('activity', 13, '#2563EB')} 현재 상태</div>
      <div class="gps-summary-card__value">${escapeWalkHtml(liveLabel)}</div>
      <div class="gps-summary-card__hint">${escapeWalkHtml(dogLabel)} 기준으로 표시돼요.</div>
    </div>
    <div class="gps-summary-card">
      <div class="gps-summary-card__label">${icon('route', 13, '#F97316')} 이번 주 거리</div>
      <div class="gps-summary-card__value">${Number(weekly.totalDistance || 0).toFixed(1)}km</div>
      <div class="gps-summary-card__hint">${Number(weekly.count || 0)}회 산책 기록</div>
    </div>
    <div class="gps-summary-card">
      <div class="gps-summary-card__label">${icon('clock', 13, '#10B981')} 이번 주 시간</div>
      <div class="gps-summary-card__value">${formatCompactMinutes(weekly.totalDuration || 0)}</div>
      <div class="gps-summary-card__hint">직접 산책과 매칭 산책 합산</div>
    </div>
    <div class="gps-summary-card">
      <div class="gps-summary-card__label">${icon('calendar', 13, '#64748B')} 누적 기록</div>
      <div class="gps-summary-card__value">${Number(total.count || 0)}회</div>
      <div class="gps-summary-card__hint">${Number(total.totalDistance || 0).toFixed(1)}km 저장됨</div>
    </div>
  </section>`;
}

function renderGpsHealthPanel(stats) {
  const weekly = stats?.weekly || {};
  const monthly = stats?.monthly || {};
  const distanceProgress = clampWalkPercent((Number(weekly.totalDistance || 0) / 10) * 100);
  const timeProgress = clampWalkPercent((Number(weekly.totalDuration || 0) / 180) * 100);
  const calorieProgress = clampWalkPercent((Number(weekly.totalCalories || 0) / 700) * 100);
  const healthScore = Math.round((distanceProgress + timeProgress + calorieProgress) / 3);
  return `
  <section class="gps-panel gps-insight">
    <div class="gps-panel__body">
      <div class="gps-panel__head">
        <div class="gps-panel__head-main">
          <h2 class="gps-panel__title">건강 데이터 연결</h2>
          <p class="gps-panel__desc">저장된 산책 기록은 AI 건강 분석에서 활동량 흐름으로 이어집니다.</p>
        </div>
      </div>
      <div class="gps-health-brief">
        <div class="gps-health-brief__top">
          <span class="gps-health-brief__label">이번 주 활동 흐름</span>
          <span class="gps-health-brief__score">${healthScore}%</span>
        </div>
        <div class="gps-health-bars" aria-hidden="true">
          <div class="gps-health-bar"><span style="width:${distanceProgress}%;"></span></div>
          <div class="gps-health-bar"><span style="width:${timeProgress}%;"></span></div>
          <div class="gps-health-bar"><span style="width:${calorieProgress}%;"></span></div>
        </div>
      </div>
      <div class="gps-insight__metric">
        <span class="gps-insight__key">최근 7일 칼로리</span>
        <span class="gps-insight__val">${Math.round(weekly.totalCalories || 0)} kcal</span>
      </div>
      <div class="gps-insight__metric">
        <span class="gps-insight__key">최근 30일 평균 거리</span>
        <span class="gps-insight__val">${Number(monthly.avgDistance || 0).toFixed(1)} km</span>
      </div>
      <div class="gps-insight__metric">
        <span class="gps-insight__key">평균 산책 시간</span>
        <span class="gps-insight__val">${formatCompactMinutes(monthly.avgDuration || 0)}</span>
      </div>
      <div class="gps-actions" style="margin-top:14px;">
        <button class="gps-btn gps-btn--primary" onclick="Router.navigate('/health')">${icon('activity', 15)} 건강 분석 보기</button>
      </div>
    </div>
  </section>`;
}

function getMatchStatusLabel(status) {
  const labels = {
    accepted: '매칭 준비 중',
    heading: '픽업 이동 중',
    arrived: '인계 확인 중',
    handoff: '산책 시작 준비',
    walking: '매칭 산책 중',
    returning: '복귀 이동 중',
    return_arrived: '재인계 확인 중'
  };
  return labels[status] || '매칭 연결됨';
}

function formatCompactMinutes(minutes) {
  const total = Math.max(0, Math.round(Number(minutes || 0)));
  if (total >= 60) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m ? `${h}시간 ${m}분` : `${h}시간`;
  }
  return `${total}분`;
}

function clampWalkPercent(value) {
  const n = Number(value || 0);
  return Math.max(0, Math.min(100, Math.round(n)));
}

async function fetchActiveMatchedWalk(userId) {
  try {
    const [sessionData, requesterData, walkerData] = await Promise.all([
      fetch(`/api/walk-sessions?userId=${encodeURIComponent(userId)}&_=${Date.now()}`).then(r => r.json()),
      fetch(`/api/walk-requests?requesterId=${encodeURIComponent(userId)}&_=${Date.now()}`).then(r => r.json()).catch(() => ({ requests: [] })),
      fetch(`/api/walk-requests?walkerId=${encodeURIComponent(userId)}&_=${Date.now()}`).then(r => r.json()).catch(() => ({ requests: [] }))
    ]);
    const requests = [...(requesterData.requests || []), ...(walkerData.requests || [])];
    const requestById = new Map(requests.map(r => [r.id, r]));
    const activeRequestIds = new Set(requests.filter(r => WALK_TRACK_ACTIVE_STATUSES.includes(r.status)).map(r => r.id));
    const sessions = (sessionData.sessions || [])
      .filter(s => WALK_TRACK_ACTIVE_STATUSES.includes(s.status))
      .filter(s => activeRequestIds.has(s.requestId) || s.requesterId === userId || s.walkerId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.returnArrivedAt || b.returnStartedAt || b.walkStartedAt || b.arrivedAt || b.startedAt || 0) - new Date(a.updatedAt || a.returnArrivedAt || a.returnStartedAt || a.walkStartedAt || a.arrivedAt || a.startedAt || 0));
    if (!sessions.length) return null;
    const session = sessions[0];
    let request = requestById.get(session.requestId) || null;
    if (!request && session.requestId) {
      request = await fetch(`/api/walk-requests/${session.requestId}`).then(r => r.json()).then(d => d.request).catch(() => null);
    }
    return {
      session,
      request,
      role: session.walkerId === userId ? 'walker' : 'requester'
    };
  } catch (e) {
    return null;
  }
}

function renderMatchedWalkPanel(match) {
  if (!match) {
    return `
    <section class="gps-panel gps-panel--match">
      <div class="gps-panel__body">
      <div class="gps-panel__head">
        <div class="gps-panel__head-main">
          <h2 class="gps-panel__title">매칭 산책 연결</h2>
          <p class="gps-panel__desc">매칭 산책이 시작되면 이곳에 실시간 세션이 표시돼요.</p>
        </div>
        <div class="gps-panel__head-actions">
          <span class="gps-badge gps-badge--idle"><span class="gps-dot"></span>대기 중</span>
        </div>
        </div>
        <div class="gps-actions">
          <button class="gps-btn gps-btn--soft" onclick="Router.navigate('/matching')">${icon('handshake', 15)} 산책 매칭으로</button>
        </div>
      </div>
    </section>`;
  }

  const { session, request, role } = match;
  const status = session.status || request?.status || 'accepted';
  const labels = {
    accepted: ['매칭 완료', '도우미가 출발하면 픽업 지도가 연결됩니다.'],
    heading: ['픽업 이동 중', role === 'walker' ? '요청자 위치까지 파란 경로로 이동해요.' : '도우미가 픽업 장소로 이동하고 있어요.'],
    arrived: ['픽업 장소 도착', '반려견 전달 확인 단계입니다.'],
    handoff: ['산책 시작 준비', '전달 확인이 끝나면 산책 GPS가 시작됩니다.'],
    walking: ['산책 중', '주황색 경로가 실시간으로 기록되고 있어요.'],
    returning: ['복귀 중', '반려견과 함께 요청자에게 돌아오는 중입니다.'],
    return_arrived: ['복귀 도착', '재인계 확인 후 산책이 완료됩니다.']
  };
  const [title, desc] = labels[status] || labels.accepted;
  const partner = role === 'walker'
    ? (request?.requesterName || '요청자')
    : (request?.walkerName || '도우미');
  const dogName = session.dogName || request?.dogName || '반려견';
  const started = session.walkStartedAt || session.startedAt || request?.updatedAt || request?.createdAt;
  const buttonLabel = role === 'walker'
    ? (status === 'walking' ? 'GPS 산책 이어가기' : '매칭 산책 진행하기')
    : (status === 'walking' || status === 'returning' ? '실시간 산책 보기' : '매칭 상태 보기');

  return `
  <section class="gps-panel gps-panel--match">
    <div class="gps-panel__body">
      <div class="gps-panel__head">
        <div class="gps-panel__head-main">
          <h2 class="gps-panel__title">${title}</h2>
          <p class="gps-panel__desc">${desc}</p>
        </div>
        <div class="gps-panel__head-actions">
          <span class="gps-badge gps-badge--live"><span class="gps-dot gps-dot--pulse"></span>매칭 연결됨</span>
        </div>
      </div>
      <div class="gps-match-grid">
        <div class="gps-match-cell">
          <div class="gps-match-cell__key">반려견</div>
          <div class="gps-match-cell__val">${escapeWalkHtml(dogName)}</div>
        </div>
        <div class="gps-match-cell">
          <div class="gps-match-cell__key">${role === 'walker' ? '요청자' : '도우미'}</div>
          <div class="gps-match-cell__val">${escapeWalkHtml(partner)}</div>
        </div>
        <div class="gps-match-cell">
          <div class="gps-match-cell__key">시작</div>
          <div class="gps-match-cell__val">${started ? new Date(started).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' }) : '-'}</div>
        </div>
      </div>
      <div class="gps-actions">
        <button class="gps-btn gps-btn--blue" onclick="openMatchedWalkFromGps('${session.id}', '${session.requestId || ''}')">${icon('map', 15)} ${buttonLabel}</button>
        <button class="gps-btn gps-btn--soft" onclick="Router.navigate('/matching')">${icon('list', 15)} 매칭 페이지</button>
      </div>
    </div>
  </section>`;
}

function renderPersonalWalkPanel({ dogs, dog, selectedIdx, isTracking }) {
  const hasDog = !!dog;
  return `
  <section class="gps-panel gps-panel--tracker">
    <div class="gps-panel__body">
      <div class="gps-panel__head">
        <div class="gps-panel__head-main">
          <h2 class="gps-panel__title">직접 산책 기록</h2>
          <p class="gps-panel__desc">보호자가 직접 산책할 때는 여기서 바로 GPS 기록을 시작하세요.</p>
        </div>
        <div class="gps-panel__head-actions">
          <span class="gps-badge ${isTracking ? 'gps-badge--live' : 'gps-badge--idle'}"><span class="gps-dot ${isTracking ? 'gps-dot--pulse' : ''}"></span>${isTracking ? '기록 중' : '대기 중'}</span>
          <span id="tracking-quick-action">
            ${isTracking
              ? `<button class="gps-mini-action gps-mini-action--danger" onclick="handleStopTracking()">종료</button>`
              : `<button class="gps-mini-action gps-mini-action--primary" onclick="handleStartTracking()" ${hasDog ? '' : 'disabled'}>시작</button>`}
          </span>
        </div>
      </div>
      ${dogs.length > 1 ? `
      <div class="gps-dog-row">
        ${dogs.map((d, i) => `<button class="gps-dog-chip ${i === Math.min(selectedIdx, dogs.length - 1) ? 'active' : ''}" onclick="StorageService.set('walkingDogIdx',${i});renderWalkTrackingPage()">${escapeWalkHtml(d.name || '반려견')}</button>`).join('')}
      </div>` : hasDog ? `
      <div class="gps-dog-row"><span class="gps-dog-chip active">${escapeWalkHtml(dog.name || '반려견')}</span></div>` : `
      <div style="padding:14px;border:1px dashed #CBD5E1;border-radius:8px;margin-bottom:14px;text-align:center;">
        <div style="font-size:0.84rem;color:#64748B;font-weight:700;margin-bottom:10px;">반려견을 먼저 등록해주세요.</div>
        <button class="gps-btn gps-btn--soft" onclick="Router.navigate('/profile')">${icon('user', 14)} 프로필에서 등록</button>
      </div>`}
    </div>

    <div class="gps-map-wrap">
      <div id="tracking-map" class="gps-map"></div>
      <div id="walk-map-overlay" class="gps-map-overlay">${isTracking ? '현재 위치를 확인하고 있어요.' : '산책을 시작하면 경로가 기록됩니다.'}</div>
      <div class="gps-map-legend" aria-hidden="true">
        <span class="gps-map-legend__item"><span class="gps-map-legend__dot"></span>현재 위치</span>
        <span class="gps-map-legend__item"><span class="gps-map-legend__line"></span>산책 경로</span>
      </div>
    </div>

    <div id="tracking-data" class="gps-stats" style="${isTracking ? '' : 'display:none;'}">
      <div class="gps-stat"><div class="gps-stat__val"><span id="track-distance">0.00</span><span class="gps-stat__unit">km</span></div><div class="gps-stat__key">거리</div></div>
      <div class="gps-stat"><div class="gps-stat__val" id="track-duration">00:00</div><div class="gps-stat__key">시간</div></div>
      <div class="gps-stat"><div class="gps-stat__val"><span id="track-pace">0.0</span><span class="gps-stat__unit">km/h</span></div><div class="gps-stat__key">평균속도</div></div>
      <div class="gps-stat"><div class="gps-stat__val"><span id="track-calories">0</span><span class="gps-stat__unit">kcal</span></div><div class="gps-stat__key">칼로리</div></div>
    </div>

    <div id="tracking-alert"></div>
    <div class="gps-control" id="tracking-buttons">
      <div id="tracking-status" class="gps-status ${isTracking ? 'gps-status--active' : ''}"><span class="gps-dot ${isTracking ? 'gps-dot--pulse' : ''}"></span>${isTracking ? '산책 기록 중' : '기록 대기 중'}</div>
      ${isTracking
        ? `<br><button class="gps-stop" onclick="handleStopTracking()">종료</button>`
        : `<br><button class="gps-start" onclick="handleStartTracking()" ${hasDog ? '' : 'disabled'}>시작</button>`}
      <div class="gps-hint">${hasDog ? '현재 위치, 이동 경로, 거리와 시간이 저장됩니다.' : '반려견 등록 후 시작할 수 있어요.'}</div>
    </div>
  </section>`;
}

function openMatchedWalkFromGps(sessionId, requestId) {
  window._activeSessionId = sessionId;
  if (requestId) window._activeWalkRequestId = requestId;
  Router.navigate('/walk-session');
}

function initTrackingMap(currentData) {
  const mapEl = document.getElementById('tracking-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (_trackingMap) {
    try { _trackingMap.remove(); } catch(e) {}
    _trackingMap = null;
  }
  _trackingPolyline = null;
  _trackingMarker = null;
  _trackingStartMarker = null;

  _trackingMap = L.map(mapEl, { zoomControl: true, attributionControl: true }).setView([37.5665, 126.9780], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(_trackingMap);

  if (currentData?.coordinates?.length) {
    paintTrackingMap(currentData);
    updateTrackingDisplay(currentData);
    return;
  }

  navigator.geolocation?.getCurrentPosition(pos => {
    const latlng = [pos.coords.latitude, pos.coords.longitude];
    _trackingMap.setView(latlng, 16);
    setCurrentMarker(latlng);
    const overlay = document.getElementById('walk-map-overlay');
    if (overlay) overlay.style.display = 'none';
  }, () => {}, { timeout: 6000, maximumAge: 60000 });
}

function handleStartTracking() {
  const user = AuthService.getCurrentUser();
  const dogs = user ? (user.dogs || []) : [];
  const selectedIdx = StorageService.get('walkingDogIdx', 0);
  const dog = dogs.length > 0 ? dogs[Math.min(selectedIdx, dogs.length - 1)] : null;
  const alertEl = document.getElementById('tracking-alert');

  if (!dog) {
    if (alertEl) alertEl.innerHTML = '<div class="alert alert-error">반려견을 먼저 등록해주세요.</div>';
    return;
  }

  const result = GPSTrackingService.startTracking(data => {
    updateTrackingDisplay(data);
    paintTrackingMap(data);
  }, {
    userId: user.id,
    dogId: dog.id || dog.name,
    dogName: dog.name || '반려견'
  });

  if (!result.success) {
    if (alertEl) alertEl.innerHTML = `<div class="alert alert-error">${result.error}</div>`;
    return;
  }

  paintActiveTrackingState(GPSTrackingService.getCurrentData());
  const startedAt = Date.now();
  if (_trackingTimer) clearInterval(_trackingTimer);
  _trackingTimer = setInterval(() => {
    const data = GPSTrackingService.getCurrentData();
    if (data?.startTime) updateTrackingDisplay(data);
    else updateElapsedClock(startedAt);
  }, 1000);
}

function paintActiveTrackingState(data) {
  const stats = document.getElementById('tracking-data');
  if (stats) stats.style.display = '';
  const overlay = document.getElementById('walk-map-overlay');
  if (overlay) overlay.style.display = 'none';
  const quickAction = document.getElementById('tracking-quick-action');
  if (quickAction) {
    quickAction.innerHTML = '<button class="gps-mini-action gps-mini-action--danger" onclick="handleStopTracking()">종료</button>';
  }
  const buttons = document.getElementById('tracking-buttons');
  if (buttons) {
    buttons.innerHTML = `
      <div id="tracking-status" class="gps-status gps-status--active"><span class="gps-dot gps-dot--pulse"></span>산책 기록 중</div>
      <br><button class="gps-stop" onclick="handleStopTracking()">종료</button>
      <div class="gps-hint">GPS가 경로를 저장하고 있어요.</div>
    `;
  }
  updateTrackingDisplay(data);
}

function updateElapsedClock(startedAt) {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const el = document.getElementById('track-duration');
  if (el) el.textContent = formatElapsedSeconds(elapsed);
}

function updateTrackingDisplay(data) {
  if (!data) return;
  const distanceEl = document.getElementById('track-distance');
  const durationEl = document.getElementById('track-duration');
  const paceEl = document.getElementById('track-pace');
  const caloriesEl = document.getElementById('track-calories');
  if (distanceEl) distanceEl.textContent = Number(data.distance || 0).toFixed(2);
  const elapsed = data.startTime ? Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000) : (data.duration || 0) * 60;
  if (durationEl) durationEl.textContent = formatElapsedSeconds(elapsed);
  if (paceEl) paceEl.textContent = Number(data.avgPace || 0).toFixed(1);
  if (caloriesEl) caloriesEl.textContent = Math.round(data.calories || 0);
}

function paintTrackingMap(data) {
  if (!_trackingMap || !data?.coordinates?.length) return;
  const coords = data.coordinates.map(c => [c.lat, c.lng]).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!coords.length) return;

  const latest = coords[coords.length - 1];
  setCurrentMarker(latest);

  if (!_trackingStartMarker) {
    const startIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;background:#22C55E;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    _trackingStartMarker = L.marker(coords[0], { icon: startIcon }).bindPopup('출발').addTo(_trackingMap);
  }

  if (_trackingPolyline) _trackingPolyline.setLatLngs(coords);
  else _trackingPolyline = L.polyline(coords, { color:'#F59E0B', weight:5, opacity:.9 }).addTo(_trackingMap);

  _trackingMap.setView(latest, Math.max(_trackingMap.getZoom(), 16), { animate:true, duration:.35 });
}

function setCurrentMarker(latlng) {
  if (!_trackingMap) return;
  if (_trackingMarker) {
    _trackingMarker.setLatLng(latlng);
    return;
  }
  const myIcon = L.divIcon({
    className: '',
    html: '<div style="width:20px;height:20px;background:#F59E0B;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  _trackingMarker = L.marker(latlng, { icon: myIcon }).bindPopup('현재 위치').addTo(_trackingMap);
}

async function handleStopTracking() {
  if (_trackingTimer) { clearInterval(_trackingTimer); _trackingTimer = null; }

  const walkData = GPSTrackingService.stopTracking();
  if (!walkData) return;

  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];
  const selectedIdx = StorageService.get('walkingDogIdx', 0);
  const dog = dogs.length > 0 ? dogs[Math.min(selectedIdx, dogs.length - 1)] : null;

  await GPSTrackingService.saveWalkToServer(
    user.id,
    dog ? (dog.id || dog.name) : 'default',
    dog ? dog.name : '반려견',
    walkData
  );

  if (walkData.distance > 0.1 && typeof WalletService !== 'undefined') {
    const coins = Math.round(walkData.distance * 10);
    WalletService.earnCoins(user.id, coins, `산책 완료 (${walkData.distance.toFixed(2)}km)`);
  }

  const buttons = document.getElementById('tracking-buttons');
  const quickAction = document.getElementById('tracking-quick-action');
  if (quickAction) {
    quickAction.innerHTML = '<button class="gps-mini-action gps-mini-action--primary" onclick="renderWalkTrackingPage()">다시 산책</button>';
  }
  if (buttons) {
    buttons.innerHTML = `
      <div class="gps-complete">
        <div style="font-size:1rem;font-weight:900;margin-bottom:5px;">산책 완료</div>
        <div style="font-size:0.82rem;color:#64748B;margin-bottom:14px;">${walkData.distance.toFixed(2)}km · ${walkData.duration}분 · ${walkData.calories}kcal</div>
        <div class="gps-actions" style="justify-content:center;">
          <button class="gps-btn gps-btn--primary" onclick="Router.navigate('/health')">${icon('activity', 14)} 건강 분석 보기</button>
          <button class="gps-btn gps-btn--soft" onclick="renderWalkTrackingPage()">다시 산책하기</button>
        </div>
      </div>
    `;
  }

  const userProfile = MatchingService.getMyProfile(user.id);
  loadWalkHistory(user.id, dog ? (dog.id || dog.name) : null, userProfile?.role);
}

async function loadWalkHistory(userId, dogId, role) {
  const section = document.getElementById('walk-history-section');
  if (!section) return;

  const walks = await GPSTrackingService.getWalkHistory(userId, dogId, { role });
  _walkHistoryCache = walks || [];
  _walkCalYear = new Date().getFullYear();
  _walkCalMonth = new Date().getMonth();
  _walkCalSelectedDate = null;
  renderWalkCalendar();
}

function renderWalkCalendar() {
  const section = document.getElementById('walk-history-section');
  if (!section) return;
  destroyRouteMaps();

  const year = _walkCalYear;
  const month = _walkCalMonth;
  const now = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthWalks = _walkHistoryCache.filter(w => {
    const d = new Date(w.createdAt || w.endTime || w.startTime);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const walkDays = {};
  monthWalks.forEach(w => {
    const day = new Date(w.createdAt || w.endTime || w.startTime).getDate();
    walkDays[day] = (walkDays[day] || 0) + 1;
  });

  let calCells = '';
  for (let i = 0; i < firstDay; i++) calCells += '<div class="walk-cal__cell walk-cal__cell--empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    const hasWalk = !!walkDays[d];
    const isSelected = _walkCalSelectedDate === d;
    calCells += `<div class="walk-cal__cell${isToday ? ' walk-cal__cell--today' : ''}${hasWalk ? ' walk-cal__cell--active' : ''}${isSelected ? ' walk-cal__cell--selected' : ''}" onclick="selectWalkCalDate(${d})">${d}${walkDays[d] > 1 ? '<span class="walk-cal__count">' + walkDays[d] + '</span>' : ''}</div>`;
  }

  let listWalks = _walkCalSelectedDate
    ? monthWalks.filter(w => new Date(w.createdAt || w.endTime || w.startTime).getDate() === _walkCalSelectedDate)
    : monthWalks;
  listWalks = listWalks.slice().sort((a, b) => new Date(b.createdAt || b.endTime || b.startTime) - new Date(a.createdAt || a.endTime || a.startTime));

  const monthDist = monthWalks.reduce((s, w) => s + Number(w.distance || 0), 0);
  const monthTime = monthWalks.reduce((s, w) => s + Number(w.duration || 0), 0);
  const listHtml = listWalks.length
    ? listWalks.map(renderWalkHistoryItem).join('')
    : `<div style="text-align:center;padding:20px;color:#94A3B8;font-size:0.84rem;">${_walkCalSelectedDate ? `${month + 1}월 ${_walkCalSelectedDate}일 기록이 없어요.` : '이 달에 기록이 없어요.'}</div>`;

  section.innerHTML = `
    <div class="walk-cal">
      <div class="walk-cal__header">
        <div class="walk-cal__nav">
          <button class="walk-cal__nav-btn" onclick="changeWalkCalMonth(-1)">&lt;</button>
          <div class="walk-cal__month">${year}년 ${month + 1}월</div>
          <button class="walk-cal__nav-btn" onclick="changeWalkCalMonth(1)">&gt;</button>
        </div>
        <div class="walk-cal__summary">${monthWalks.length}회 · ${monthDist.toFixed(1)}km · ${monthTime}분</div>
      </div>
      <div class="walk-cal__days">
        ${['일','월','화','수','목','금','토'].map(d => `<div class="walk-cal__day-label">${d}</div>`).join('')}
      </div>
      <div class="walk-cal__grid">${calCells}</div>
    </div>
    ${_walkCalSelectedDate ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:.8rem;color:#64748B;font-weight:800;">${month + 1}월 ${_walkCalSelectedDate}일 기록</span><button class="gps-btn gps-btn--soft" style="padding:6px 10px;font-size:.72rem;" onclick="selectWalkCalDate(null)">전체 보기</button></div>` : ''}
    <h3 class="walk-history-title">${_walkCalSelectedDate ? '선택한 날짜' : '최근 기록'}</h3>
    ${listHtml}
  `;

  setTimeout(() => initHistoryRouteMaps(listWalks), 160);
}

function renderWalkHistoryItem(w) {
  const created = new Date(w.createdAt || w.endTime || w.startTime || Date.now());
  const coords = normalizeWalkCoordinates(w.coordinates);
  const hasRoute = coords.length > 1;
  const matched = w.source === 'matched' || w.type === 'matched';
  const title = w.title || w.dogName || '산책';
  return `
  <div class="walk-history-item" id="walk-item-${w.id}">
    <div>
      <div class="walk-history-item__date">${created.toLocaleDateString('ko-KR')} ${created.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}
        <span class="walk-source-badge ${matched ? 'walk-source-badge--matched' : 'walk-source-badge--personal'}">${matched ? '도우미 산책' : '직접 산책'}</span>
      </div>
      <div class="walk-history-item__dog" id="walk-name-${w.id}">${escapeWalkHtml(title)}${matched && w.walkerName ? ` · ${escapeWalkHtml(w.walkerName)}` : ''}</div>
    </div>
    <div class="walk-history-item__stats">
      <div class="walk-history-item__dist">${Number(w.distance || 0).toFixed(2)} km</div>
      <div class="walk-history-item__meta">${Math.round(w.duration || 0)}분 · ${Math.round(w.calories || 0)}kcal</div>
      ${matched ? '' : `<div class="walk-history-actions"><button onclick="editWalkName('${w.id}')">수정</button><button class="danger" onclick="deleteWalkRecord('${w.id}')">삭제</button></div>`}
    </div>
    ${hasRoute ? `<div id="walk-route-${w.id}" class="walk-route-mini"></div>` : ''}
  </div>`;
}

function initHistoryRouteMaps(walks) {
  if (typeof L === 'undefined') return;
  walks.forEach(w => {
    const container = document.getElementById('walk-route-' + w.id);
    const coords = normalizeWalkCoordinates(w.coordinates);
    if (!container || coords.length < 2 || _walkRouteMaps[w.id]) return;
    const map = L.map(container, { zoomControl:false, attributionControl:false }).fitBounds(coords, { padding:[18, 18], maxZoom:16 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.polyline(coords, { color:'#F59E0B', weight:4, opacity:.9 }).addTo(map);
    const startIcon = L.divIcon({ className:'', html:'<div style="width:10px;height:10px;background:#22C55E;border:2px solid #fff;border-radius:50%;"></div>', iconSize:[10,10], iconAnchor:[5,5] });
    const endIcon = L.divIcon({ className:'', html:'<div style="width:10px;height:10px;background:#EF4444;border:2px solid #fff;border-radius:50%;"></div>', iconSize:[10,10], iconAnchor:[5,5] });
    L.marker(coords[0], { icon:startIcon }).addTo(map);
    L.marker(coords[coords.length - 1], { icon:endIcon }).addTo(map);
    _walkRouteMaps[w.id] = map;
  });
}

function changeWalkCalMonth(delta) {
  _walkCalMonth += delta;
  if (_walkCalMonth > 11) { _walkCalMonth = 0; _walkCalYear++; }
  if (_walkCalMonth < 0) { _walkCalMonth = 11; _walkCalYear--; }
  _walkCalSelectedDate = null;
  renderWalkCalendar();
}

function selectWalkCalDate(day) {
  _walkCalSelectedDate = (_walkCalSelectedDate === day || day === null) ? null : day;
  renderWalkCalendar();
}

async function deleteWalkRecord(walkId) {
  const walk = _walkHistoryCache.find(w => w.id === walkId);
  if (walk?.source === 'matched') {
    showToast('매칭 산책 기록은 세션 기록에서 관리돼요.', 'info');
    return;
  }
  if (!confirm('이 산책 기록을 삭제할까요?')) return;
  try {
    await fetch('/api/walks/' + walkId, { method:'DELETE' });
    _walkHistoryCache = _walkHistoryCache.filter(w => w.id !== walkId);
    renderWalkCalendar();
  } catch(e) {
    alert('삭제에 실패했습니다.');
  }
}

function editWalkName(walkId) {
  const walk = _walkHistoryCache.find(w => w.id === walkId);
  if (walk?.source === 'matched') {
    showToast('매칭 산책 기록은 이름을 수정하지 않아요.', 'info');
    return;
  }
  const nameEl = document.getElementById('walk-name-' + walkId);
  if (!nameEl) return;
  const current = nameEl.textContent;
  nameEl.innerHTML = `<div style="display:flex;gap:4px;align-items:center;"><input type="text" id="walk-edit-${walkId}" value="${escapeWalkAttr(current)}" style="font-size:0.78rem;padding:4px 8px;border:1px solid #CBD5E1;border-radius:6px;width:130px;" onkeydown="if(event.key==='Enter')saveWalkName('${walkId}')"><button onclick="saveWalkName('${walkId}')" style="font-size:0.7rem;background:#111827;color:#fff;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;">저장</button></div>`;
  document.getElementById('walk-edit-' + walkId)?.focus();
}

async function saveWalkName(walkId) {
  const input = document.getElementById('walk-edit-' + walkId);
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) return;
  try {
    await fetch('/api/walks/' + walkId, {
      method:'PUT',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ title:newName })
    });
    const walk = _walkHistoryCache.find(w => w.id === walkId);
    if (walk) walk.title = newName;
    renderWalkCalendar();
  } catch(e) {
    alert('수정에 실패했습니다.');
  }
}

function normalizeWalkCoordinates(coords) {
  return (coords || [])
    .map(c => [Number(c.lat ?? c.latitude), Number(c.lng ?? c.longitude)])
    .filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));
}

function destroyRouteMaps() {
  Object.values(_walkRouteMaps).forEach(map => { try { map.remove(); } catch(e) {} });
  _walkRouteMaps = {};
}

function formatElapsedSeconds(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeWalkHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function escapeWalkAttr(value) {
  return escapeWalkHtml(value).replace(/`/g, '&#96;');
}
