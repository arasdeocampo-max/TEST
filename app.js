(() => {
  const { KEYS, initPIMSData } = window.PIMS_DATA;
  initPIMSData();

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const get = (k, fallback = []) => JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback));
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const DOSAGE_GROUPS = {
    solid: ['Tablet', 'Capsule'],
    liquid: ['Syrup', 'Suspension', 'Drops'],
    topical: ['Gel', 'Cream', 'Ointment'],
    injectable: ['Vial', 'Ampoule']
  };

  function daysUntil(dateStr) {
    return Math.floor((new Date(dateStr) - new Date(todayStr())) / 86400000);
  }

  function getBatchStatus(expiryDate, warningDays) {
    const d = daysUntil(expiryDate);
    if (d < 0) return { key: 'expired', label: 'Expired', badge: '<span class="badge danger">Expired</span>', daysLeft: d };
    if (d <= warningDays) return { key: 'near', label: 'Near Expiry', badge: '<span class="badge warn">Near Expiry</span>', daysLeft: d };
    return { key: 'ok', label: 'OK', badge: '<span class="badge ok">OK</span>', daysLeft: d };
  }

  function state() {
    return {
      users: get(KEYS.users), medicines: get(KEYS.medicines), batches: get(KEYS.batches),
      transactions: get(KEYS.transactions), settings: get(KEYS.settings, {}),
      session: get(KEYS.session, null), audit: get(KEYS.audit)
    };
  }

  function saveAudit(action, details) {
    const s = state();
    s.audit.unshift({ timestamp: new Date().toISOString(), user: s.session?.username || 'system', role: s.session?.role || '-', action, details });
    set(KEYS.audit, s.audit);
  }

  function showToast(message, type = 'info') {
    const container = $('#toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  function requireAuth() {
    const s = state();
    if (!s.session) {
      $('#loginView').classList.remove('hidden');
      $('#appView').classList.add('hidden');
      return false;
    }
    $('#loginView').classList.add('hidden');
    $('#appView').classList.remove('hidden');
    $('#welcomeText').textContent = `Logged in as ${s.session.username} (${s.session.role})`;
    $$('.admin-only, .admin-only-content').forEach(el => el.classList.toggle('hidden', s.session.role !== 'admin'));
    if (s.session.role !== 'admin' && ['users', 'settings'].includes(currentPage)) goToPage('dashboard');
    return true;
  }

  const medicineMap = () => Object.fromEntries(state().medicines.map(m => [m.id, m]));
  const totalForMedicine = (medicineId) => state().batches.filter(b => b.medicineId === medicineId).reduce((a, b) => a + b.qtyBaseUnits, 0);
  const validBatchesForDispense = (medicineId) => state().batches.filter(b => b.medicineId === medicineId && b.qtyBaseUnits > 0 && daysUntil(b.expiryDate) >= 0).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const allBatchesFEFO = (medicineId) => state().batches.filter(b => b.medicineId === medicineId).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const fmtDate = (d) => new Date(d).toLocaleDateString();

  function refreshAll() {
    renderNavOptions();
    renderDashboard();
    renderMedicineFormChoices();
    renderMedicines();
    renderBatches();
    renderAlerts();
    renderReports();
    renderAudit();
    renderUsers();
    renderSettings();
  }

  function renderNavOptions() {
    const meds = state().medicines.filter(m => !m.archived);
    ['#stockInForm select[name="medicineId"]', '#dispenseForm select[name="medicineId"]', '#adjustForm select[name="medicineId"]', '#batchMedicineFilter'].forEach(sel => {
      const select = $(sel);
      if (!select) return;
      const current = select.value;
      select.innerHTML = '<option value="">Select Medicine</option>' + meds.map(m => `<option value="${m.id}">${m.code} - ${m.genericName} (${m.baseUnit})</option>`).join('');
      if (meds.some(m => m.id === current)) select.value = current;
    });

    const catFilter = $('#medicineCategoryFilter');
    if (catFilter) {
      const cats = state().settings.categories || [];
      const cur = catFilter.value;
      catFilter.innerHTML = '<option value="all">All Categories</option>' + cats.map(c => `<option>${c}</option>`).join('');
      catFilter.value = cur || 'all';
    }
  }

  function renderDashboard() {
    const s = state();
    const activeMeds = s.medicines.filter(m => !m.archived);
    $('#metricTotalItems').textContent = activeMeds.length;
    $('#metricLowStock').textContent = activeMeds.filter(m => totalForMedicine(m.id) < (m.reorderLevelBoxes * m.packSize)).length;
    $('#metricNearExpiry').textContent = s.batches.filter(b => daysUntil(b.expiryDate) >= 0 && daysUntil(b.expiryDate) <= s.settings.warningDays && b.qtyBaseUnits > 0).length;
    $('#metricExpired').textContent = s.batches.filter(b => daysUntil(b.expiryDate) < 0 && b.qtyBaseUnits > 0).length;

    const medById = medicineMap();
    $('#recentTxTable tbody').innerHTML = s.transactions.slice(0, 8).map(t => `<tr><td>${fmtDate(t.timestamp)}</td><td>${t.type}</td><td>${medById[t.medicineId]?.genericName || '-'}</td><td>${t.qtyBaseUnits}</td><td>${t.user}</td></tr>`).join('') || '<tr><td colspan="5">No transactions yet.</td></tr>';
  }

  function renderMedicines() {
    const s = state();
    const q = ($('#medicineSearch').value || '').toLowerCase();
    const cat = $('#medicineCategoryFilter').value || 'all';
    const rx = $('#medicineRxFilter').value || 'all';
    const ar = $('#medicineArchiveFilter').value || 'active';
    const dosage = $('.chip.active')?.dataset.form || 'all';

    const rows = s.medicines.filter(m => {
      if (ar === 'active' && m.archived) return false;
      if (ar === 'archived' && !m.archived) return false;
      if (cat !== 'all' && m.category !== cat) return false;
      if (rx === 'rx' && !m.rxRequired) return false;
      if (rx === 'otc' && m.rxRequired) return false;
      if (dosage !== 'all' && m.dosageForm !== dosage) return false;
      const text = `${m.code} ${m.genericName} ${m.brandName} ${m.packagingText} ${m.concentrationText}`.toLowerCase();
      return text.includes(q);
    });

    $('#medicineTable tbody').innerHTML = rows.map(m => `<tr data-id="${m.id}">
      <td>${m.code}</td><td>${m.genericName}</td><td>${m.brandName}</td><td>${m.dosageForm}</td>
      <td>${m.strengthValue || ''} ${m.strengthUnit || ''}</td><td>${m.baseUnit}</td><td>${totalForMedicine(m.id)}</td>
      <td>${m.rxRequired ? 'Rx' : 'OTC'}</td><td>${m.archived ? 'Archived' : 'Active'}</td>
      <td><button class="btn" data-act="edit">Edit</button> <button class="btn" data-act="archive">${m.archived ? 'Unarchive' : 'Archive'}</button></td>
    </tr>`).join('') || '<tr><td colspan="10">No records.</td></tr>';
  }

  const batchViewState = { page: 1 };

  function renderBatches() {
    const s = state();
    const meds = medicineMap();
    const warningDays = s.settings.warningDays;
    const medFilter = $('#batchMedicineFilter').value;
    const search = ($('#batchSearch').value || '').toLowerCase();
    const statusFilter = $('#batchStatusFilter').value || 'all';
    const sortBy = $('#batchSort').value || 'fefo';
    const grouped = $('#batchGroupToggle').checked;
    const pageSize = Number($('#batchPageSize').value || 10);

    let rows = s.batches
      .filter(b => !medFilter || b.medicineId === medFilter)
      .map(b => {
        const med = meds[b.medicineId];
        const status = getBatchStatus(b.expiryDate, warningDays);
        return {
          ...b,
          medicineName: med ? `${med.code} - ${med.genericName}` : '-',
          form: med?.dosageForm || '-',
          baseUnit: med?.baseUnit || 'unit',
          packSize: med?.packSize || 0,
          status
        };
      })
      .filter(r => (statusFilter === 'all' || r.status.key === statusFilter) && (!search || `${r.medicineName} ${r.batchNo}`.toLowerCase().includes(search)));

    const summary = {
      total: rows.length,
      expired: rows.filter(r => r.status.key === 'expired').length,
      near: rows.filter(r => r.status.key === 'near').length,
      ok: rows.filter(r => r.status.key === 'ok').length
    };
    $('#batchMetricTotal').textContent = summary.total;
    $('#batchMetricExpired').textContent = summary.expired;
    $('#batchMetricNear').textContent = summary.near;
    $('#batchMetricOk').textContent = summary.ok;

    const fefoCard = $('#batchFefoCard');
    const fefoText = $('#batchFefoText');
    if (medFilter) {
      const medRows = rows
        .filter(r => r.medicineId === medFilter)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const best = medRows.find(r => r.status.key !== 'expired' && r.qtyBaseUnits > 0) || medRows[0];
      if (best) {
        fefoText.textContent = `${best.batchNo} — expires ${best.expiryDate} — qty ${best.qtyBaseUnits} ${best.baseUnit}`;
        fefoCard.classList.remove('hidden');
      } else {
        fefoCard.classList.add('hidden');
      }
    } else {
      fefoCard.classList.add('hidden');
    }

    const sorter = {
      fefo: (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
      qty: (a, b) => b.qtyBaseUnits - a.qtyBaseUnits,
      medicine: (a, b) => a.medicineName.localeCompare(b.medicineName)
    }[sortBy] || ((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    rows.sort(sorter);

    const results = $('#batchResults');
    const pagination = $('#batchPagination');

    if (grouped) {
      const groupsMap = new Map();
      rows.forEach(r => {
        if (!groupsMap.has(r.medicineId)) groupsMap.set(r.medicineId, { medicineId: r.medicineId, medicineName: r.medicineName, form: r.form, baseUnit: r.baseUnit, packSize: r.packSize, batches: [] });
        groupsMap.get(r.medicineId).batches.push(r);
      });
      let groups = [...groupsMap.values()].map(g => {
        g.batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        g.totalQty = g.batches.reduce((n, x) => n + x.qtyBaseUnits, 0);
        g.worst = g.batches.some(x => x.status.key === 'expired') ? 'expired' : g.batches.some(x => x.status.key === 'near') ? 'near' : 'ok';
        return g;
      });
      if (sortBy === 'medicine') groups.sort((a, b) => a.medicineName.localeCompare(b.medicineName));
      if (sortBy === 'qty') groups.sort((a, b) => b.totalQty - a.totalQty);
      if (sortBy === 'fefo') groups.sort((a, b) => new Date(a.batches[0]?.expiryDate || '2999-12-31') - new Date(b.batches[0]?.expiryDate || '2999-12-31'));

      const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
      if (batchViewState.page > totalPages) batchViewState.page = totalPages;
      const start = (batchViewState.page - 1) * pageSize;
      const pageGroups = groups.slice(start, start + pageSize);

      results.innerHTML = pageGroups.map((g, i) => {
        const worstBadge = g.worst === 'expired' ? '<span class="badge danger">Expired</span>' : g.worst === 'near' ? '<span class="badge warn">Near</span>' : '<span class="badge ok">OK</span>';
        return `<details class="batch-group" ${i === 0 ? 'open' : ''}>
          <summary>
            <div><strong>${g.medicineName}</strong><div class="batch-meta">${g.form}</div></div>
            <div>${g.totalQty} ${g.baseUnit}</div>
            <div>${g.batches.length} batches</div>
            <div>${worstBadge}</div>
          </summary>
          <div class="batch-inner table-wrap">
            <table>
              <thead><tr><th>Batch No</th><th>Expiry</th><th>Days Left</th><th>Qty (base)</th><th>Status</th></tr></thead>
              <tbody>
                ${g.batches.map(b => `<tr><td>${b.batchNo}</td><td>${b.expiryDate}</td><td>${b.status.daysLeft}</td><td>${b.qtyBaseUnits}</td><td>${b.status.badge}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </details>`;
      }).join('') || '<div class="card"><p class="hint">No batches found.</p></div>';

      renderBatchPagination(totalPages);
    } else {
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (batchViewState.page > totalPages) batchViewState.page = totalPages;
      const start = (batchViewState.page - 1) * pageSize;
      const pageRows = rows.slice(start, start + pageSize);

      results.innerHTML = `<div class="table-wrap"><table id="batchFlatTable"><thead><tr><th>Medicine</th><th>Form</th><th>Batch</th><th>Expiry</th><th>Days Left</th><th>Qty (base)</th><th>Status</th></tr></thead><tbody>${pageRows.map(r => `<tr><td>${r.medicineName}</td><td>${r.form}</td><td>${r.batchNo}</td><td>${r.expiryDate}</td><td>${r.status.daysLeft}</td><td>${r.qtyBaseUnits}</td><td>${r.status.badge}</td></tr>`).join('') || '<tr><td colspan="7">No batches found.</td></tr>'}</tbody></table></div>`;
      renderBatchPagination(totalPages);
    }

    function renderBatchPagination(totalPages) {
      const page = batchViewState.page;
      let html = `<button class="page-btn" data-page-nav="prev" ${page <= 1 ? 'disabled' : ''}>Prev</button>`;
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
          html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (Math.abs(i - page) === 2) {
          html += '<span class="hint">...</span>';
        }
      }
      html += `<button class="page-btn" data-page-nav="next" ${page >= totalPages ? 'disabled' : ''}>Next</button>`;
      pagination.innerHTML = html;
    }
  }

  function computeAlerts() {
    const s = state();
    const medicines = s.medicines.filter(m => !m.archived);
    const map = medicineMap();

    const lowStock = medicines
      .filter(m => totalForMedicine(m.id) < (m.reorderLevelBoxes * m.packSize))
      .map(m => {
        const remainingBase = totalForMedicine(m.id);
        const reorderBase = m.reorderLevelBoxes * m.packSize;
        const affectedBatches = s.batches
          .filter(b => b.medicineId === m.id && b.qtyBaseUnits > 0)
          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        return {
          medicineId: m.id,
          medicineName: `${m.code} - ${m.genericName}`,
          form: m.dosageForm,
          baseUnit: m.baseUnit,
          remainingBase,
          reorderBase,
          pctRemaining: reorderBase ? (remainingBase / reorderBase) * 100 : 0,
          affectedBatches
        };
      })
      .sort((a, b) => a.pctRemaining - b.pctRemaining);

    const nearMap = new Map();
    const expMap = new Map();

    s.batches.forEach(b => {
      if (b.qtyBaseUnits <= 0) return;
      const med = map[b.medicineId];
      if (!med || med.archived) return;
      const daysLeft = daysUntil(b.expiryDate);
      const rowBase = {
        medicineId: med.id,
        medicineName: `${med.code} - ${med.genericName}`,
        form: med.dosageForm,
        baseUnit: med.baseUnit,
        remainingBase: totalForMedicine(med.id),
        reorderBase: med.reorderLevelBoxes * med.packSize,
        pctRemaining: (totalForMedicine(med.id) / (med.reorderLevelBoxes * med.packSize || 1)) * 100
      };

      if (daysLeft >= 0 && daysLeft <= s.settings.warningDays) {
        if (!nearMap.has(med.id)) nearMap.set(med.id, { ...rowBase, minDaysLeft: daysLeft, affectedBatches: [] });
        const cur = nearMap.get(med.id);
        cur.minDaysLeft = Math.min(cur.minDaysLeft, daysLeft);
        cur.affectedBatches.push(b);
      }

      if (daysLeft < 0) {
        if (!expMap.has(med.id)) expMap.set(med.id, { ...rowBase, maxExpiredDays: daysLeft, affectedBatches: [] });
        const cur = expMap.get(med.id);
        cur.maxExpiredDays = Math.max(cur.maxExpiredDays, daysLeft);
        cur.affectedBatches.push(b);
      }
    });

    const nearExpiry = [...nearMap.values()]
      .map(x => ({ ...x, affectedBatches: x.affectedBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)) }))
      .sort((a, b) => a.minDaysLeft - b.minDaysLeft);

    const expired = [...expMap.values()]
      .map(x => ({ ...x, affectedBatches: x.affectedBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)) }))
      .sort((a, b) => b.maxExpiredDays - a.maxExpiredDays);

    return { lowStock, nearExpiry, expired };
  }

  let activeAlertsTab = 'lowStock';

  function renderAlerts() {
    const computed = computeAlerts();
    $('#alertMetricLow').textContent = computed.lowStock.length;
    $('#alertMetricNear').textContent = computed.nearExpiry.length;
    $('#alertMetricExpired').textContent = computed.expired.length;

    const search = ($('#alertsSearch')?.value || '').toLowerCase();
    const formFilter = $('#alertsFormFilter')?.value || 'all';
    const criticalOnly = $('#alertsCriticalOnly')?.checked;

    let rows = computed[activeAlertsTab] || [];
    rows = rows.filter(r => {
      if (formFilter !== 'all' && r.form !== formFilter) return false;
      if (search && !r.medicineName.toLowerCase().includes(search)) return false;
      if (criticalOnly) {
        const isCriticalNear = typeof r.minDaysLeft === 'number' && r.minDaysLeft <= 30;
        const isCriticalStock = r.pctRemaining <= 50;
        if (!isCriticalNear && !isCriticalStock) return false;
      }
      return true;
    });

    const tbody = $('#alertsTable tbody');
    tbody.innerHTML = rows.map(r => {
      const approxBoxes = r.reorderBase ? (r.remainingBase / (r.reorderBase / (state().medicines.find(m => m.id === r.medicineId)?.reorderLevelBoxes || 1))) : 0;
      const status = activeAlertsTab === 'lowStock'
        ? '<span class="badge warn">Low</span>'
        : activeAlertsTab === 'nearExpiry'
          ? '<span class="badge warn">Near</span>'
          : '<span class="badge danger">Expired</span>';
      return `<tr>
        <td>${r.medicineName}</td>
        <td>${r.form}</td>
        <td>${r.remainingBase} ${r.baseUnit}<br><small>~${approxBoxes.toFixed(1)} boxes</small></td>
        <td>${r.reorderBase} ${r.baseUnit}</td>
        <td>${r.affectedBatches.length}</td>
        <td class="status-cell">${status}</td>
        <td><button class="btn" data-alert-med="${r.medicineId}" data-alert-tab="${activeAlertsTab}">View batches</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="7">No alerts found for current filters.</td></tr>';
  }

  function renderAlertBatches(medicineId, tab) {
    const computed = computeAlerts();
    const item = (computed[tab] || []).find(x => x.medicineId === medicineId);
    if (!item) return;
    $('#alertsBatchModalTitle').textContent = `Affected Batches - ${item.medicineName}`;
    const rows = [...item.affectedBatches].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    $('#alertsBatchTable tbody').innerHTML = rows.map(b => {
      const d = daysUntil(b.expiryDate);
      const badge = d < 0 ? '<span class="badge danger">Expired</span>' : d <= state().settings.warningDays ? '<span class="badge warn">Near</span>' : '<span class="badge ok">OK</span>';
      return `<tr><td>${b.batchNo}</td><td>${b.expiryDate}</td><td>${d}</td><td>${b.qtyBaseUnits}</td><td>${badge}</td></tr>`;
    }).join('') || '<tr><td colspan="5">No affected batches.</td></tr>';
    $('#alertsBatchModal').showModal();
  }

  function renderReports() {
    const meds = state().medicines.filter(m => !m.archived);
    $('#stockStatusTable tbody').innerHTML = meds.map(m => {
      const total = totalForMedicine(m.id);
      const reorder = m.reorderLevelBoxes * m.packSize;
      return `<tr><td>${m.code}</td><td>${m.genericName}</td><td>${total} ${m.baseUnit}</td><td>${reorder}</td><td>${total < reorder ? 'Low Stock' : 'OK'}</td></tr>`;
    }).join('');

    const buckets = { expired: 0, '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    state().batches.forEach(b => {
      if (b.qtyBaseUnits <= 0) return;
      const d = daysUntil(b.expiryDate);
      if (d < 0) buckets.expired += 1; else if (d <= 30) buckets['0-30'] += 1; else if (d <= 60) buckets['31-60'] += 1; else if (d <= 90) buckets['61-90'] += 1; else buckets['90+'] += 1;
    });
    $('#expiryTimeline').innerHTML = Object.entries(buckets).map(([k, v]) => `<p><strong>${k}</strong>: ${v} batches</p>`).join('');
    applyMovementFilter();
  }

  function applyMovementFilter() {
    const map = medicineMap();
    const start = $('#movementStart').value;
    const end = $('#movementEnd').value;
    const type = $('#movementType').value;
    const rows = state().transactions.filter(t => {
      const d = t.timestamp.slice(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      if (type !== 'all' && t.type !== type) return false;
      return true;
    });
    $('#movementTable tbody').innerHTML = rows.map(t => `<tr><td>${fmtDate(t.timestamp)}</td><td>${t.type}</td><td>${map[t.medicineId]?.genericName || '-'}</td><td>${t.batchNo || '-'}</td><td>${t.qtyBaseUnits}</td><td>${t.user}</td></tr>`).join('') || '<tr><td colspan="6">No rows.</td></tr>';
  }

  function renderAudit() {
    $('#auditTable tbody').innerHTML = state().audit.map(a => `<tr><td>${fmtDate(a.timestamp)}</td><td>${a.user}</td><td>${a.role}</td><td>${a.action}</td><td>${a.details}</td></tr>`).join('') || '<tr><td colspan="5">No logs.</td></tr>';
  }

  function renderUsers() {
    $('#userTable tbody').innerHTML = state().users.map(u => `<tr><td>${u.username}</td><td>${u.role}</td></tr>`).join('');
  }

  function renderSettings() {
    const s = state().settings;
    $('#settingsForm').warningDays.value = s.warningDays;
    $('#settingsForm').requireRxVerification.checked = !!s.requireRxVerification;
    $('#settingsForm').categories.value = (s.categories || []).join(', ');
  }

  function renderMedicineFormChoices() {
    const f = $('#medicineForm');
    const settings = state().settings;
    f.dosageForm.innerHTML = (settings.dosageForms || []).map(x => `<option>${x}</option>`).join('');
    f.route.innerHTML = (settings.routes || []).map(x => `<option>${x}</option>`).join('');
  }

  function applyDosageVisibility(form) {
    const dosage = form.dosageForm.value;
    $$('.dosage-block', form).forEach(el => el.classList.add('hidden'));
    if (DOSAGE_GROUPS.solid.includes(dosage)) $('#dosageSolid', form).classList.remove('hidden');
    if (DOSAGE_GROUPS.liquid.includes(dosage)) $('#dosageLiquid', form).classList.remove('hidden');
    if (DOSAGE_GROUPS.topical.includes(dosage)) $('#dosageTopical', form).classList.remove('hidden');
    if (DOSAGE_GROUPS.injectable.includes(dosage)) {
      $('#dosageInjectable', form).classList.remove('hidden');
      form.route.value = 'Injection';
    }
  }

  function showFormError(form, msg) { $('[data-error]', form).textContent = msg || ''; }

  function validateMedicine(payload) {
    if (!payload.code || !payload.genericName || payload.packSize <= 0) return 'Code, generic name, and pack size are required.';

    if (DOSAGE_GROUPS.solid.includes(payload.dosageForm)) {
      if (!['tablet', 'capsule'].includes(payload.baseUnit)) return 'Tablets/Capsules must use base unit tablet/capsule.';
      if (!['mg', 'g', 'mcg'].includes(payload.strengthUnit)) return 'Tablet/Capsule strength unit must be mg/g/mcg.';
      if (payload.volumeValue !== null) return 'Tablet/Capsule volume must be empty.';
    }

    if (DOSAGE_GROUPS.liquid.includes(payload.dosageForm)) {
      if (payload.baseUnit !== 'mL') return 'Syrup/Suspension/Drops base unit must be mL.';
      if (!payload.volumeValue || !payload.volumeUnit) return 'Liquid forms require volume value and unit.';
    }

    if (DOSAGE_GROUPS.topical.includes(payload.dosageForm)) {
      if (payload.baseUnit !== 'g') return 'Gel/Cream/Ointment base unit must be g.';
      if (!['%', 'mg/g', 'g'].includes(payload.strengthUnit)) return 'Topical strength unit must be %, mg/g, or g.';
      if (!payload.packagingText) return 'Topical forms require packaging text.';
    }

    if (DOSAGE_GROUPS.injectable.includes(payload.dosageForm)) {
      if (payload.route !== 'Injection') return 'Vial/Ampoule route must be Injection.';
      if (payload.baseUnit !== 'mL') return 'Vial/Ampoule base unit must be mL in this demo.';
      if (!payload.volumeValue || payload.volumeUnit !== 'mL') return 'Injectables require volume in mL.';
      if (!['mg/mL', 'IU/mL'].includes(payload.strengthUnit)) return 'Injectable strength unit must be mg/mL or IU/mL.';
    }

    return null;
  }

  function exportCsv(filename, rows) {
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  let currentPage = 'dashboard';
  const goToPage = (page) => {
    if (state().session?.role !== 'admin' && ['users', 'settings'].includes(page)) return;
    currentPage = page;
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page-${page}`).classList.add('active');
    $$('.nav-link').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    $('#pageTitle').textContent = page[0].toUpperCase() + page.slice(1);
  };

  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = $('#username').value.trim();
    const p = $('#password').value;
    const user = state().users.find(x => x.username === u && x.password === p);
    if (!user) { $('#loginError').textContent = 'Invalid credentials.'; showToast('Login failed.', 'error'); return; }
    set(KEYS.session, { id: user.id, username: user.username, role: user.role });
    saveAudit('login', `User ${user.username} logged in`);
    $('#loginError').textContent = '';
    requireAuth(); refreshAll(); goToPage('dashboard');
    showToast(`Welcome, ${user.username}`, 'success');
  });

  $('#logoutBtn').addEventListener('click', () => {
    saveAudit('logout', `User ${state().session?.username || ''} logged out`);
    set(KEYS.session, null);
    requireAuth();
    showToast('Logged out.', 'info');
  });

  $('#sidebarNav').addEventListener('click', e => { if (e.target.matches('.nav-link')) goToPage(e.target.dataset.page); });
  ['#medicineSearch', '#medicineCategoryFilter', '#medicineRxFilter', '#medicineArchiveFilter'].forEach(s => {
    $(s).addEventListener('input', renderMedicines);
    $(s).addEventListener('change', renderMedicines);
  });
  $('#batchMedicineFilter').addEventListener('change', () => { batchViewState.page = 1; renderBatches(); });
  ['#batchSearch', '#batchStatusFilter', '#batchSort', '#batchGroupToggle', '#batchPageSize'].forEach(sel => {
    $(sel).addEventListener('input', () => { batchViewState.page = 1; renderBatches(); });
    $(sel).addEventListener('change', () => { batchViewState.page = 1; renderBatches(); });
  });
  $('#batchPagination').addEventListener('click', (e) => {
    const btn = e.target.closest('button.page-btn');
    if (!btn) return;
    const nav = btn.dataset.pageNav;
    if (nav === 'prev') batchViewState.page = Math.max(1, batchViewState.page - 1);
    else if (nav === 'next') batchViewState.page += 1;
    else if (btn.dataset.page) batchViewState.page = Number(btn.dataset.page);
    renderBatches();
  });


  $('#alertsTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.segment');
    if (!tab) return;
    activeAlertsTab = tab.dataset.tab;
    $$('#alertsTabs .segment').forEach(btn => {
      const active = btn.dataset.tab === activeAlertsTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    renderAlerts();
  });

  ['#alertsSearch', '#alertsFormFilter', '#alertsCriticalOnly'].forEach(sel => {
    $(sel).addEventListener('input', renderAlerts);
    $(sel).addEventListener('change', renderAlerts);
  });

  $('#alertsTable tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-alert-med]');
    if (!btn) return;
    renderAlertBatches(btn.dataset.alertMed, btn.dataset.alertTab);
  });

  $('#closeAlertsBatchModal').addEventListener('click', () => $('#alertsBatchModal').close());

  $('#dosageChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderMedicines();
  });

  $('#addMedicineBtn').addEventListener('click', () => {
    const f = $('#medicineForm');
    f.reset(); f.id.value = ''; showFormError(f, '');
    f.baseUnit.value = 'tablet';
    applyDosageVisibility(f);
    $('#medicineModalTitle').textContent = 'Add Medicine';
    $('#medicineModal').showModal();
  });

  $('#medicineForm [name="dosageForm"]').addEventListener('change', (e) => {
    const f = $('#medicineForm');
    const v = e.target.value;
    if (v === 'Tablet') f.baseUnit.value = 'tablet';
    else if (v === 'Capsule') f.baseUnit.value = 'capsule';
    else if (DOSAGE_GROUPS.liquid.includes(v) || DOSAGE_GROUPS.injectable.includes(v)) f.baseUnit.value = 'mL';
    else if (DOSAGE_GROUPS.topical.includes(v)) f.baseUnit.value = 'g';
    applyDosageVisibility(f);
  });

  $('#medicineTable tbody').addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = e.target.closest('tr')?.dataset.id;
    const meds = state().medicines;
    const med = meds.find(m => m.id === id);
    if (!med) return;

    if (btn.dataset.act === 'edit') {
      const f = $('#medicineForm');
      Object.keys(med).forEach(k => {
        if (!f[k]) return;
        if (f[k].type === 'checkbox') f[k].checked = !!med[k];
        else f[k].value = med[k] ?? '';
      });
      applyDosageVisibility(f);
      showFormError(f, '');
      $('#medicineModalTitle').textContent = 'Edit Medicine';
      $('#medicineModal').showModal();
    } else {
      med.archived = !med.archived;
      set(KEYS.medicines, meds);
      saveAudit('medicine archive', `${med.code} => ${med.archived ? 'archived' : 'unarchived'}`);
      refreshAll();
      showToast(`Medicine ${med.archived ? 'archived' : 'unarchived'}.`, 'info');
    }
  });

  $('#medicineForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const dosage = f.dosageForm.value;
    const payload = {
      id: f.id.value || uid('m'),
      code: f.code.value.trim(),
      genericName: f.genericName.value.trim(),
      brandName: f.brandName.value.trim(),
      dosageForm: dosage,
      route: f.route.value,
      strengthValue: Number(f.strengthValue.value) || null,
      strengthUnit: f.strengthUnit.value,
      volumeValue: f.volumeValue.value ? Number(f.volumeValue.value) : null,
      volumeUnit: f.volumeUnit.value || null,
      concentrationText: f.concentrationText.value.trim(),
      packagingText: f.packagingText.value.trim(),
      form: dosage,
      strength: `${f.strengthValue.value || ''} ${f.strengthUnit.value || ''}`.trim(),
      category: f.category.value.trim(),
      rxRequired: f.rxRequired.checked,
      shelfLocation: f.shelfLocation.value.trim(),
      orderingUnit: 'Box',
      dispensingUnit: f.baseUnit.value,
      baseUnit: f.baseUnit.value,
      packSize: Number(f.packSize.value),
      reorderLevelBoxes: Number(f.reorderLevelBoxes.value),
      archived: false
    };

    const err = validateMedicine(payload);
    if (err) return showFormError(f, err);

    const meds = state().medicines;
    const i = meds.findIndex(m => m.id === payload.id);
    if (i >= 0) meds[i] = { ...meds[i], ...payload };
    else meds.push(payload);
    set(KEYS.medicines, meds);
    saveAudit(i >= 0 ? 'medicine update' : 'medicine create', `${payload.code} saved`);

    const settings = state().settings;
    if (!settings.categories.includes(payload.category)) {
      settings.categories.push(payload.category);
      set(KEYS.settings, settings);
    }

    $('#medicineModal').close();
    refreshAll();
    showToast('Medicine saved.', 'success');
  });

  $('#stockInForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target; showFormError(f, '');
    const med = state().medicines.find(m => m.id === f.medicineId.value);
    if (!med) return showFormError(f, 'Choose a medicine.');
    const qty = Number(f.qty.value); if (qty <= 0) return showFormError(f, 'Quantity must be greater than zero.');
    const qtyBase = f.unit.value === 'box' ? qty * med.packSize : qty;

    const batches = state().batches;
    const batchNo = f.batchNo.value.trim();
    const existing = batches.find(b => b.medicineId === med.id && b.batchNo === batchNo);
    if (existing) { existing.expiryDate = f.expiryDate.value; existing.qtyBaseUnits += qtyBase; }
    else batches.push({ id: uid('b'), medicineId: med.id, batchNo, expiryDate: f.expiryDate.value, qtyBaseUnits: qtyBase });

    set(KEYS.batches, batches);
    const tx = state().transactions;
    tx.unshift({ id: uid('t'), timestamp: new Date().toISOString(), type: 'stock-in', medicineId: med.id, batchNo, qtyBaseUnits: qtyBase, user: state().session.username });
    set(KEYS.transactions, tx);
    saveAudit('stock-in', `${med.code}, batch ${batchNo}, +${qtyBase} ${med.baseUnit}`);
    f.reset(); refreshAll();
    showToast('Stock-in recorded.', 'success');
  });

  function updateDispenseSuggestion() {
    const med = state().medicines.find(m => m.id === $('#dispenseForm [name="medicineId"]').value);
    if (!med) return $('#dispenseSuggestion').textContent = 'Suggested FEFO batch: -';
    const options = validBatchesForDispense(med.id);
    $('#dispenseSuggestion').textContent = options.length ? `Suggested FEFO batch: ${options[0].batchNo} (expires ${options[0].expiryDate})` : 'Suggested FEFO batch: none available';
  }

  $('#dispenseForm [name="medicineId"]').addEventListener('change', updateDispenseSuggestion);

  $('#dispenseForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target; showFormError(f, '');
    const med = state().medicines.find(m => m.id === f.medicineId.value);
    if (!med) return showFormError(f, 'Choose a medicine.');
    const qty = Number(f.qty.value); if (qty <= 0) return showFormError(f, 'Quantity must be greater than zero.');
    if (med.rxRequired && state().settings.requireRxVerification && !f.rxVerified.checked) return showFormError(f, 'Prescription verification is required for Rx medicines.');

    const qtyBase = f.unit.value === 'box' ? qty * med.packSize : qty;
    const batches = state().batches;
    const chosen = validBatchesForDispense(med.id)[0];
    if (!chosen) return showFormError(f, 'No valid non-expired stock available.');

    const chosenRef = batches.find(b => b.id === chosen.id);
    if (daysUntil(chosenRef.expiryDate) < 0) return showFormError(f, 'Cannot dispense from expired batch.');
    if (chosenRef.qtyBaseUnits < qtyBase) return showFormError(f, `Insufficient quantity in FEFO batch (${med.baseUnit}).`);

    chosenRef.qtyBaseUnits -= qtyBase;
    set(KEYS.batches, batches);

    const tx = state().transactions;
    tx.unshift({ id: uid('t'), timestamp: new Date().toISOString(), type: 'dispense', medicineId: med.id, batchNo: chosenRef.batchNo, qtyBaseUnits: qtyBase, user: state().session.username });
    set(KEYS.transactions, tx);
    saveAudit('dispense', `${med.code}, batch ${chosenRef.batchNo}, -${qtyBase} ${med.baseUnit}`);
    f.reset(); updateDispenseSuggestion(); refreshAll();
    showToast('Dispense recorded.', 'success');
  });

  $('#adjustForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target; showFormError(f, '');
    const med = state().medicines.find(m => m.id === f.medicineId.value);
    if (!med) return showFormError(f, 'Choose a medicine.');
    const qty = Number(f.qty.value); if (qty <= 0) return showFormError(f, 'Quantity must be > 0.');
    const sign = f.direction.value === 'add' ? 1 : -1;
    const batches = state().batches;
    const target = allBatchesFEFO(med.id)[0];
    if (!target) return showFormError(f, 'No batch available for adjustment.');
    const ref = batches.find(b => b.id === target.id);
    if (sign < 0 && ref.qtyBaseUnits < qty) return showFormError(f, 'Cannot subtract more than available quantity.');

    ref.qtyBaseUnits += sign * qty;
    set(KEYS.batches, batches);
    const tx = state().transactions;
    tx.unshift({ id: uid('t'), timestamp: new Date().toISOString(), type: 'adjustment', medicineId: med.id, batchNo: ref.batchNo, qtyBaseUnits: sign * qty, reason: f.reason.value, user: state().session.username });
    set(KEYS.transactions, tx);
    saveAudit('adjustment', `${med.code}, ${f.reason.value}, ${sign > 0 ? '+' : '-'}${qty}`);
    f.reset(); refreshAll();
    showToast('Adjustment saved.', 'success');
  });

  $('#applyMovementFilter').addEventListener('click', (e) => { e.preventDefault(); applyMovementFilter(); });
  $('#exportStockStatus').addEventListener('click', () => {
    const rows = [['Code', 'Medicine', 'Total Base Units', 'Reorder Point', 'Status']];
    $('#stockStatusTable tbody').querySelectorAll('tr').forEach(tr => rows.push([...tr.children].map(td => td.textContent.trim())));
    exportCsv('stock_status_report.csv', rows);
    showToast('Stock status exported.', 'info');
  });

  $('#exportMovement').addEventListener('click', () => {
    applyMovementFilter();
    const rows = [['Date', 'Type', 'Medicine', 'Batch', 'Qty', 'User']];
    $('#movementTable tbody').querySelectorAll('tr').forEach(tr => rows.push([...tr.children].map(td => td.textContent.trim())));
    exportCsv('stock_movement_report.csv', rows);
    showToast('Stock movement exported.', 'info');
  });

  $('#settingsForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target; showFormError(f, '');
    if (state().session.role !== 'admin') return showFormError(f, 'Unauthorized.');
    const warningDays = Number(f.warningDays.value);
    if (warningDays <= 0) return showFormError(f, 'warningDays must be greater than 0.');
    const settings = state().settings;
    settings.warningDays = warningDays;
    settings.requireRxVerification = f.requireRxVerification.checked;
    settings.categories = f.categories.value.split(',').map(c => c.trim()).filter(Boolean);
    set(KEYS.settings, settings);
    saveAudit('settings update', `warningDays=${settings.warningDays}, requireRx=${settings.requireRxVerification}`);
    refreshAll();
    showToast('Settings updated.', 'success');
  });

  $('#medicineModal').addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#medicineModal').close(); });

  requireAuth();
  if (state().session) {
    refreshAll();
    goToPage('dashboard');
    updateDispenseSuggestion();
  }
})();
