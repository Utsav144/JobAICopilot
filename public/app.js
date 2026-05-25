const applicationsBody = document.querySelector('#applicationsBody');
const jobsList = document.querySelector('#jobsList');
const rejectedJobsBody = document.querySelector('#rejectedJobsBody');
const statusFilter = document.querySelector('#statusFilter');
const runDaily = document.querySelector('#runDaily');
const statusMessage = document.querySelector('#statusMessage');
const sourceSummary = document.querySelector('#sourceSummary');
const schedulerStatusText = document.querySelector('#schedulerStatusText');
const schedulerStateBadge = document.querySelector('#schedulerStateBadge');
const schedulerProgressBar = document.querySelector('#schedulerProgressBar');
const refreshScheduler = document.querySelector('#refreshScheduler');
const naukriStatus = document.querySelector('#naukriStatus');
const startNaukri = document.querySelector('#startNaukri');
const stopNaukri = document.querySelector('#stopNaukri');
const continueNaukri = document.querySelector('#continueNaukri');
const continueNoticePeriod = document.querySelector('#continueNoticePeriod');
const exportNaukriReport = document.querySelector('#exportNaukriReport');
const naukriFilterForm = document.querySelector('#naukriFilterForm');
const naukriAppliedRows = document.querySelector('#naukriAppliedRows');
const naukriOtherRows = document.querySelector('#naukriOtherRows');
const PAGE_SIZE = 10;
const pagination = {
  applications: 1,
  rejected: 1,
  jobs: 1,
  naukriApplied: 1,
  naukriOther: 1
};

// Navigation
document.querySelectorAll('.sidebar-menu a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = e.target.getAttribute('data-section');
    showSection(section);
  });
});

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`#${sectionId}`).classList.add('active');
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

  if (sectionId === 'ai-copilot') {
    initAIChat();
  }
}

// AI Chat variables
let chats = {};
let currentChat = null;

function initAIChat() {
  if (!currentChat) {
    newChat();
  }
}

function newChat() {
  const id = "chat_" + Date.now();
  chats[id] = [];
  currentChat = id;
  document.getElementById("chat").innerHTML = "";
  updateSidebar();
}

function updateSidebar(filter = "") {
  const history = document.getElementById("history");
  history.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const title = chats[id][0]?.content || "New Chat";

    if (filter && !title.toLowerCase().includes(filter.toLowerCase())) return;

    const div = document.createElement("div");
    div.className = "chat-item";
    div.innerText = title.substring(0, 25);
    div.onclick = () => switchChat(id);

    history.appendChild(div);
  });
}

function searchChats(keyword) {
  updateSidebar(keyword);
}

function switchChat(id) {
  currentChat = id;
  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML = "";

  chats[id].forEach(msg => {
    addMessage(msg.content, msg.role);
  });
}

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "ai");
  div.innerText = text;

  const chat = document.getElementById("chat");
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addUserEmoji() {
  const input = document.getElementById("input");
  input.value += " 😊";
  input.focus();
}

function addEmoji(text) {
  return text
    .replace(/happy|great|awesome/gi, "😊")
    .replace(/sad|sorry/gi, "😔")
    .replace(/love/gi, "❤️")
    .replace(/ok|yes/gi, "👍");
}

async function sendMessage() {
  const input = document.getElementById("input");
  const text = input.value.trim();

  if (!text || !currentChat) return;

  addMessage(text, "user");

  chats[currentChat].push({
    role: "user",
    content: text
  });

  input.value = "";

  const chat = document.getElementById("chat");

  const typingDiv = document.createElement("div");
  typingDiv.className = "msg ai typing";
  typingDiv.innerText = "AI is typing...";
  chat.appendChild(typingDiv);

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        sessionId: currentChat
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let fullText = "";

    typingDiv.remove();

    const aiDiv = document.createElement("div");
    aiDiv.className = "msg ai";
    chat.appendChild(aiDiv);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullText += chunk;
      aiDiv.innerText = addEmoji(fullText);

      chat.scrollTop = chat.scrollHeight;
    }

    chats[currentChat].push({
      role: "ai",
      content: fullText
    });
  } catch (err) {
    typingDiv.remove();
    addMessage("Error: " + err.message, "ai");
  }

  updateSidebar();
}

// Auto Run Agent
document.getElementById("autoRunAgent").addEventListener('click', () => {
  const message = "Hello, I am ready to assist with job applications. Please help me optimize my job search and application process.";
  document.getElementById("input").value = message;
  sendMessage();
});

// Enter key for input
document.getElementById("input").addEventListener("keydown", function(e) {
  if (e.key === "Enter") sendMessage();
});

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed with ' + response.status);
  }
  return response.json();
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = 'statusMessage isVisible' + (isError ? ' isError' : '');
}

function statusBadge(status) {
  return '<span class="badge badge-' + escapeHtml(status) + '">' + status.replaceAll('_', ' ') + '</span>';
}

function escapeHtml(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function schedulerBadgeText(status) {
  if (!status.enabled) return 'disabled';
  if (status.totalSubmitted >= status.goal) return 'completed';
  if (status.running) return 'running';
  return 'waiting';
}

function renderSchedulerStatus(status) {
  const badge = schedulerBadgeText(status);
  schedulerStatusText.textContent = status.message || 'Scheduler status loaded.';
  schedulerStateBadge.textContent = badge;
  schedulerStateBadge.className = 'badge badge-' + (badge === 'completed' ? 'submitted' : badge === 'running' ? 'queued' : 'needs_human');
  schedulerProgressBar.style.width = (status.progressPercent || 0) + '%';
  document.querySelector('#schedulerTotal').textContent = status.totalSubmitted || 0;
  document.querySelector('#schedulerGoal').textContent = status.goal || 0;
  document.querySelector('#schedulerRemaining').textContent = status.remaining || 0;
  document.querySelector('#schedulerRetry').textContent = (status.retryMinutes || 0) + 'm';
  document.querySelector('#schedulerNormal').textContent = 'Normal submitted: ' + (status.applicationSubmitted || 0);
  document.querySelector('#schedulerNaukri').textContent = 'Naukri applied: ' + (status.naukriApplied || 0);
  document.querySelector('#schedulerDate').textContent = 'Date: ' + (status.date || '--') + ' · ' + (status.timezone || '');
}

async function loadSchedulerStatus() {
  try {
    renderSchedulerStatus(await getJson('/api/scheduler/status'));
  } catch (error) {
    schedulerStatusText.textContent = 'Scheduler status unavailable · ' + error.message;
    schedulerStateBadge.textContent = 'error';
    schedulerStateBadge.className = 'badge badge-needs_human';
  }
}

function pageItems(items, key, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  pagination[key] = Math.min(Math.max(1, pagination[key] || 1), totalPages);
  const start = (pagination[key] - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    currentPage: pagination[key],
    totalItems: items.length
  };
}

function renderPager(elementId, key, totalPages, totalItems, pageSize = PAGE_SIZE) {
  const element = document.querySelector('#' + elementId);
  if (!element) return;
  if (totalItems <= pageSize) {
    element.innerHTML = totalItems ? '<span>' + totalItems + ' items</span>' : '';
    return;
  }
  element.innerHTML =
    '<button class="pagerBtn" data-page-key="' + key + '" data-page-dir="-1" type="button">Prev</button>' +
    '<span>Page ' + pagination[key] + ' of ' + totalPages + ' · ' + totalItems + ' items</span>' +
    '<button class="pagerBtn" data-page-key="' + key + '" data-page-dir="1" type="button">Next</button>';
}

function handlePagerClick(event) {
  const button = event.target.closest('.pagerBtn');
  if (!button) return;
  pagination[button.dataset.pageKey] += Number(button.dataset.pageDir);
  load().catch((error) => showStatus(error.message, true));
  loadNaukriStatus();
}

async function loadNaukriStatus() {
  try {
    const result = await getJson('/api/naukri/status');
    const summary = result.report?.summary || {};
    naukriStatus.textContent = (result.status || 'idle') + ' · ' + (result.message || '');
    document.querySelector('#naukriScanned').textContent = summary.totalScanned || 0;
    document.querySelector('#naukriApplied').textContent = summary.totalApplied || 0;
    document.querySelector('#naukriSkipped').textContent = summary.totalSkipped || 0;
    document.querySelector('#naukriManual').textContent = summary.totalManualRequired || 0;
    renderNaukriRows(result.report || {});
  } catch (error) {
    naukriStatus.textContent = 'Status unavailable · ' + error.message;
  }
}

function renderNaukriRows(report) {
  const applied = report.applied || [];
  const other = [...(report.manualRequired || []), ...(report.failed || []), ...(report.skipped || [])];
  const appliedPage = pageItems(applied, 'naukriApplied', 6);
  const otherPage = pageItems(other, 'naukriOther', 6);
  naukriAppliedRows.innerHTML = appliedPage.items.map(naukriRow).join('') || '<p>No applied jobs yet.</p>';
  naukriOtherRows.innerHTML = otherPage.items.map(naukriRow).join('') || '<p>No skipped/manual jobs yet.</p>';
  renderPager('naukriAppliedPager', 'naukriApplied', appliedPage.totalPages, appliedPage.totalItems, 6);
  renderPager('naukriOtherPager', 'naukriOther', otherPage.totalPages, otherPage.totalItems, 6);
}

function naukriRow(item) {
  return '<article class="miniRow">' +
    '<strong>' + escapeHtml(item.company || 'Unknown') + '</strong>' +
    '<a href="' + escapeHtml(item.job_url) + '" target="_blank" rel="noreferrer">' + escapeHtml(item.title || 'Untitled role') + '</a>' +
    '<small>' + escapeHtml(item.status || '') + ' · Score ' + escapeHtml(item.score || 0) + ' · ' + escapeHtml(item.reason || '') + '</small>' +
    '</article>';
}

function splitLines(value) {
  return String(value || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function naukriFiltersFromForm() {
  const data = new FormData(naukriFilterForm);
  return {
    titles: splitLines(data.get('titles')),
    locations: splitLines(data.get('locations')),
    experienceMin: Number(data.get('experienceMin') || 6),
    experienceMax: Number(data.get('experienceMax') || 9),
    salaryMinLpa: Number(data.get('salaryMinLpa') || 22),
    salaryMaxLpa: Number(data.get('salaryMaxLpa') || 24),
    skills: splitLines(data.get('skills')),
    threshold: 60,
    mncPreferred: true
  };
}

async function load() {
  const [jobs, applications] = await Promise.all([getJson('/api/jobs'), getJson('/api/applications')]);
  const filteredApplications = statusFilter.value ? applications.filter((app) => app.status === statusFilter.value) : applications;
  const applicationsPage = pageItems(filteredApplications, 'applications');
  document.querySelector('#jobsCount').textContent = jobs.length;
  document.querySelector('#qualifiedCount').textContent = jobs.filter((job) => job.status === 'qualified').length;
  document.querySelector('#queuedCount').textContent = applications.filter((app) => app.status === 'queued').length;
  document.querySelector('#submittedCount').textContent = applications.filter((app) => app.status === 'submitted').length;
  const sourceCounts = jobs.reduce((acc, job) => {
    acc[job.source_name || 'Unknown'] = (acc[job.source_name || 'Unknown'] || 0) + 1;
    return acc;
  }, {});
  sourceSummary.textContent = Object.entries(sourceCounts).map(([source, count]) => source + ' ' + count).join(' · ');

  applicationsBody.innerHTML = applicationsPage.items.map((app) => {
    const notes = app.notes ? '<div class="noteCell">' + escapeHtml(app.notes) + '</div>' : '';
    return '<tr>' +
      '<td data-label="Company">' + escapeHtml(app.company || 'Unknown') + '</td>' +
      '<td data-label="Role">' + escapeHtml(app.title) + '</td>' +
      '<td data-label="Location">' + escapeHtml(app.location || 'Not listed') + '</td>' +
      '<td data-label="Status">' + statusBadge(app.status) + notes + '</td>' +
      '<td data-label="Link"><a class="linkBtn" href="' + app.source_url + '" target="_blank" rel="noreferrer">Open</a></td>' +
      '<td data-label="Action"><button class="assistBtn" data-id="' + app.id + '" type="button">Assist</button></td>' +
      '</tr>';
  }).join('') || '<tr><td colspan="6">No applications yet.</td></tr>';
  renderPager('applicationsPager', 'applications', applicationsPage.totalPages, applicationsPage.totalItems);

  const rejectedJobs = jobs.filter((job) => job.status === 'rejected');
  const rejectedPage = pageItems(rejectedJobs, 'rejected');
  rejectedJobsBody.innerHTML = rejectedPage.items.map((job) => {
    return '<tr>' +
      '<td data-label="Company">' + escapeHtml(job.company || 'Unknown') + '</td>' +
      '<td data-label="Role">' + escapeHtml(job.title || 'Untitled role') + '</td>' +
      '<td data-label="Source">' + escapeHtml(job.source_name || 'Unknown') + '</td>' +
      '<td data-label="Reason" class="reasonCell">' + escapeHtml(job.rejection_reason || 'No reason recorded') + '</td>' +
      '<td data-label="Link"><a class="linkBtn" href="' + job.source_url + '" target="_blank" rel="noreferrer">Open</a></td>' +
      '<td data-label="Action"><button class="queueRejectedBtn secondaryBtn" data-id="' + job.id + '" type="button">Queue anyway</button></td>' +
      '</tr>';
  }).join('') || '<tr><td colspan="6">No rejected jobs.</td></tr>';
  renderPager('rejectedJobsPager', 'rejected', rejectedPage.totalPages, rejectedPage.totalItems);

  const jobsPage = pageItems(jobs, 'jobs');
  jobsList.innerHTML = jobsPage.items.map((job) => {
    const company = job.company ? escapeHtml(job.company) : 'Unknown company';
    return '<article class="jobItem">' +
      '<div class="jobTitleRow"><strong>' + company + '</strong>' + statusBadge(job.status) + '</div>' +
      '<a href="' + job.source_url + '" target="_blank" rel="noreferrer">' + escapeHtml(job.title || 'Untitled role') + '</a>' +
      '<div class="meta">' + escapeHtml(job.source_name || 'Unknown') + ' · ' + escapeHtml(job.location || 'Location not listed') +
      (job.rejection_reason ? '<span>' + escapeHtml(job.rejection_reason) + '</span>' : '') + '</div></article>';
  }).join('') || '<article class="jobItem"><strong>No jobs yet</strong><div class="meta">Run Daily Search to load demo jobs.</div></article>';
  renderPager('jobsPager', 'jobs', jobsPage.totalPages, jobsPage.totalItems);
}

document.addEventListener('click', handlePagerClick);
statusFilter.addEventListener('change', load);
rejectedJobsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('.queueRejectedBtn');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Queueing...';
  try {
    const result = await getJson('/api/jobs/' + button.dataset.id + '/queue', { method: 'POST' });
    showStatus('Rejected job queued manually: ' + result.status);
    await load();
  } catch (error) {
    showStatus('Queue failed: ' + error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = 'Queue anyway';
  }
});
applicationsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('.assistBtn');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Opening...';
  showStatus('Assist is opening the application page...');
  try {
    const result = await getJson('/api/applications/' + button.dataset.id + '/assist', { method: 'POST' });
    showStatus('Assist result: ' + result.status + '. ' + (result.reason || ''));
    await load();
  } catch (error) {
    showStatus('Assist failed: ' + error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = 'Assist';
  }
});
runDaily.addEventListener('click', async () => {
  runDaily.disabled = true;
  runDaily.textContent = 'Running...';
  showStatus('Daily search is running...');
  try {
    const result = await getJson('/api/workflows/daily', { method: 'POST' });
    showStatus('Daily run finished. Processed ' + (result.results?.length || 0) + ' items.');
    await load();
    await loadSchedulerStatus();
  } catch (error) {
    showStatus('Daily run failed: ' + error.message, true);
  } finally {
    runDaily.disabled = false;
    runDaily.textContent = 'Run Daily Search';
  }
});

refreshScheduler.addEventListener('click', async () => {
  refreshScheduler.disabled = true;
  refreshScheduler.textContent = 'Refreshing...';
  try {
    await loadSchedulerStatus();
  } finally {
    refreshScheduler.disabled = false;
    refreshScheduler.textContent = 'Refresh';
  }
});

load().catch((error) => {
  applicationsBody.innerHTML = '<tr><td colspan="6">' + escapeHtml(error.message) + '</td></tr>';
});
loadNaukriStatus();
loadSchedulerStatus();
setInterval(loadNaukriStatus, 5000);
setInterval(loadSchedulerStatus, 10000);

startNaukri.addEventListener('click', async () => {
  startNaukri.disabled = true;
  startNaukri.textContent = 'Starting...';
  try {
    const result = await getJson('/api/naukri/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        filters: naukriFiltersFromForm(),
        minScanned: 25,
        minSkipped: 30,
        minApplied: 10,
        maxApplied: 25,
        maxPages: 8
      })
    });
    showStatus(result.message);
    await loadNaukriStatus();
  } catch (error) {
    showStatus('Naukri automation failed to start: ' + error.message, true);
  } finally {
    startNaukri.disabled = false;
    startNaukri.textContent = 'Start Naukri';
  }
});

stopNaukri.addEventListener('click', async () => {
  stopNaukri.disabled = true;
  stopNaukri.textContent = 'Stopping...';
  try {
    const result = await getJson('/api/naukri/stop', { method: 'POST' });
    showStatus(result.message || 'Naukri automation stopped.');
    await loadNaukriStatus();
    await load();
  } catch (error) {
    showStatus('Naukri automation stop failed: ' + error.message, true);
  } finally {
    stopNaukri.disabled = false;
    stopNaukri.textContent = 'Stop Naukri';
  }
});

async function startNaukriWithCurrentFilters() {
  return getJson('/api/naukri/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      filters: naukriFiltersFromForm(),
      minScanned: 25,
      minSkipped: 30,
      minApplied: 10,
      maxApplied: 25,
      maxPages: 8
    })
  });
}

continueNaukri.addEventListener('click', async () => {
  continueNaukri.disabled = true;
  try {
    const result = await getJson('/api/naukri/continue-after-manual-action', { method: 'POST' });
    showStatus(result.message);
    await loadNaukriStatus();
  } catch (error) {
    showStatus('Continue failed: ' + error.message, true);
  } finally {
    continueNaukri.disabled = false;
  }
});

continueNoticePeriod.addEventListener('click', async () => {
  continueNoticePeriod.disabled = true;
  continueNoticePeriod.textContent = 'Continuing...';
  showStatus('Continuing after your 3 Months notice-period selection...');
  try {
    const result = await getJson('/api/naukri/continue-after-manual-action', { method: 'POST' });
    if (result.continued) {
      showStatus('Naukri automation resumed. It will click the safe submit/continue button if available.');
    } else {
      const started = await startNaukriWithCurrentFilters();
      showStatus('No waiting manual step found, so a fresh Naukri session started. ' + started.message);
    }
    await loadNaukriStatus();
  } catch (error) {
    showStatus('Notice-period continue failed: ' + error.message, true);
  } finally {
    continueNoticePeriod.disabled = false;
    continueNoticePeriod.textContent = 'I selected 3 Months, Continue Naukri';
  }
});

exportNaukriReport.addEventListener('click', async () => {
  try {
    const report = await getJson('/api/naukri/report');
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'naukri-session-report.json';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showStatus('Export failed: ' + error.message, true);
  }
});

// Initialize
showSection('dashboard');
load();
